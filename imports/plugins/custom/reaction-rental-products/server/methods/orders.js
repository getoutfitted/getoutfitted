import { _ } from "meteor/underscore";
import moment from "moment";
import "moment-timezone";
import "twix";

import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { Reaction, Logger } from "/server/api";
import { Orders } from "/lib/collections";

import { InventoryVariants } from "../../lib/collections";
import { Transit } from "/imports/plugins/custom/transit-times/server/api";
import RentalProducts from "../api";

function adjustLocalToDenverTime(time) {
  let here = moment(time);
  let denver = here.clone().tz("America/Denver");
  denver.add(here.utcOffset() - denver.utcOffset(), "minutes");
  return denver.toDate();
}


Meteor.methods({
  /*
   * adjust inventory when an order is placed
   */
  "rentalProducts/inventoryAdjust": function (orderId) {
    check(orderId, String);
    Logger.info(`adjusting rental inventory for order: ${orderId}`);

    const order = Orders.findOne(orderId);
    if (!order) { return false; } // If we can't find an order, exit.
    // TODO: Add store buffer days into dates to reserve;
    const transit = new Transit(order);
    const turnaroundTime = RentalProducts.getTurnaroundTime();
    const reservation = RentalProducts.server.buildUnavailableInventoryArrays(orderId, transit, turnaroundTime);
    const reservationStart = transit.getShipmentDate();
    const reservationEnd = moment(transit.getReturnDate()).add(turnaroundTime, "days").toDate();

    // Determine what quantity of each item we need to make a reservation for
    const quantityByVariantId = order.items.reduce(function (qtyByVariantId, item) {
      if (item.variants.functionalType === "rentalVariant") {
        if (qtyByVariantId[item.variants._id]) {
          qtyByVariantId[item.variants._id]++;
        } else {
          qtyByVariantId[item.variants._id] = 1;
        }
      }
      return qtyByVariantId;
    }, {});

    availablityByVariantId = Meteor.call("rentalProducts/checkMultiInventoryAvailability",
      quantityByVariantId, { startTime: reservationStart, endTime: reservationEnd });

    const inventoryToReserve = [];
    const inventoryNotAvailable = [];
    // Check to make sure we have enough of each item.
    for (const vId in availablityByVariantId) {
      if (quantityByVariantId[vId] !== availablityByVariantId[vId].length) {
        inventoryNotAvailable.push(vId);
      }
      availablityByVariantId[vId].forEach(function (inventoryVariantId) {
        inventoryToReserve.push(inventoryVariantId);
      });
    }

    // If anything isn't available, log a warning.
    // TODO: Build conflict resolution process for inventory conflicts.
    if (inventoryNotAvailable.length > 0) {
      Logger.warn(`The following inventory was not available to book for Order: ${orderId}`, inventoryNotAvailable);
    }

    inventoryToReserve.forEach(function (inventoryVariantId) {
      Meteor.call("rentalProducts/reserveInventory", inventoryVariantId, reservation, orderId);
    });
  },


  "rentalProducts/reserveInventory": function (inventoryVariantId, reservation, orderId) {
    check(inventoryVariantId, String);
    check(reservation, Object);
    check(orderId, String);

    const order = Orders.findOne({_id: orderId}, {fields: {userId: 1}});
    if (!Reaction.hasPermission(RentalProducts.server.permissions) && order.userId !== Meteor.userId()) {
      Logger.warn("Permission denied");
      throw new Meteor.Error(403, "Access Denied");
    }

    // Not using $in because we need to determine the correct position
    // to insert the new dates separately for each inventoryVariant
    const inventoryVariant = InventoryVariants.findOne({
      _id: inventoryVariantId
    }, {fields: {unavailableDates: 1}});

    const reservedDates = inventoryVariant.unavailableDates;

    // We take the time to insert unavailable dates in ascending date order
    // find the position that we should insert the reserved dates
    const positionToInsert = _.sortedIndex(reservedDates, reservation.datesToReserve[0]);

    // insert datesToReserve into the correct variants at the correct position
    return InventoryVariants.update({_id: inventoryVariantId}, {
      $inc: {
        numberOfDatesBooked: reservation.datesToReserve.length
      },
      $push: {
        unavailableDates: {
          $each: reservation.datesToReserve,
          $position: positionToInsert
        },
        unavailableDetails: {
          $each: reservation.detailsToReserve,
          $position: positionToInsert
        }
      }
    });
  },
  "rentalProducts/removeReservation": function (orderId, variantId, turnaroundTime = 1) {
    check(orderId, String);
    check(variantId, String);
    check(turnaroundTime, Match.Maybe(Number));

    if (!Reaction.hasPermission(RentalProducts.server.permissions)) { // could give user permissions with  && order.userId !== Meteor.userId()
      throw new Meteor.Error(403, "Access Denied");
    }

    const order = Orders.findOne({_id: orderId});
    const start = order.advancedFulfillment.shipmentDate;
    const end = moment(order.advancedFulfillment.returnDate).add(turnaroundTime, "days").toDate();
    const datesBooked = moment(start).diff(moment(end), "days") - 1; // inclusive

    // TODO: set first and last based on actual booked dates?
    InventoryVariants.update({
      "productId": variantId,
      "unavailableDetails.orderId": orderId
    }, {
      $pull: {
        unavailableDates: {
          $gte: start,
          $lte: end
        },
        unavailableDetails: {
          orderId: orderId
        }
      },
      $inc: {
        numberOfDatesBooked: datesBooked
      }
    });
  },

  "rentalProducts/bulkRemoveReservation": function (orderId, variantIds, turnaroundTime = 1) {
    check(orderId, String);
    check(variantIds, [String]);
    check(turnaroundTime, Match.Maybe(Number));

    if (!Reaction.hasPermission(RentalProducts.server.permissions)) { // could give user permissions with  && order.userId !== Meteor.userId()
      throw new Meteor.Error(403, "Access Denied");
    }

    const order = Orders.findOne({_id: orderId});
    const start = order.advancedFulfillment.shipmentDate;
    const end = moment(order.advancedFulfillment.returnDate).add(turnaroundTime, "days").toDate();
    const datesBooked = moment(start).diff(moment(end), "days") - 1; // inclusive

    // TODO: set first and last based on actual booked dates?
    InventoryVariants.update({
      "productId": {
        $in: variantIds
      },
      "unavailableDetails.orderId": orderId
    }, {
      $pull: {
        unavailableDates: {
          $gte: start,
          $lte: end
        },
        unavailableDetails: {
          orderId: orderId
        }
      },
      $inc: {
        numberOfDatesBooked: datesBooked
      }
    }, {
      multi: true
    });
  },

  "rentalProducts/removeOrderReservations": function (orderId, turnaroundTime = 1) {
    check(orderId, String);
    check(turnaroundTime, Match.Maybe(Number));

    if (!Reaction.hasPermission(RentalProducts.server.permissions)) { // could give user permissions with  && order.userId !== Meteor.userId()
      throw new Meteor.Error(403, "Access Denied");
    }

    const order = Orders.findOne({_id: orderId});
    const start = order.advancedFulfillment.shipmentDate;
    const end = moment(order.advancedFulfillment.returnDate).add(turnaroundTime, "days").toDate();
    const datesBooked = moment(start).diff(moment(end), "days") - 1; // inclusive

    // TODO: set first and last based on actual booked dates?
    InventoryVariants.update({
      "unavailableDetails.orderId": orderId
    }, {
      $pull: {
        unavailableDates: {
          $gte: start,
          $lte: end
        },
        unavailableDetails: {
          orderId: orderId
        }
      },
      $inc: {
        numberOfDatesBooked: datesBooked
      }
    }, {
      multi: true
    });
  },

  "rentalProducts/inventoryUnbook": function (orderId) {
    check(orderId, String);
    const impactedInventory = InventoryVariants.find({"unavailableDetails.orderId": orderId}).fetch();
    _.each(impactedInventory, function (inventory) {
      let removalDetails = _.where(inventory.unavailableDetails, {orderId: orderId});
      // grab these for the arrays
      let firstDate = removalDetails[0].date;
      let lastDate = removalDetails[removalDetails.length - 1].date;
      // this will return an array of objects without the ones that have an orderId
      let updatedUnavailableDetails = _.difference(inventory.unavailableDetails, removalDetails);
      // turn the unavailable dates to Numbers array, then get index of first and last date
      let firstIndex = inventory.unavailableDates.map(Number).indexOf(+firstDate);
      let lastIndex = inventory.unavailableDates.map(Number).indexOf(+lastDate);
      let spliceAmount = lastIndex - firstIndex + 1; // to be inclusvie;
      inventory.unavailableDates.splice(firstIndex, spliceAmount);
      InventoryVariants.update({
        _id: inventory._id
      }, {
        $set: {
          unavailableDetails: updatedUnavailableDetails,
          unavailableDates: inventory.unavailableDates,
          numberOfDatesBooked: inventory.unavailableDates.length
        }
      });
      Logger.warn(`Canceled Order #${orderId} removed inventory dates for Inventory item ${inventory._id}`);
    });
  }
});
