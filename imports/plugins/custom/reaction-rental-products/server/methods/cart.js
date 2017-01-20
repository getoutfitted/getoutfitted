import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { Cart } from "/lib/collections";
import { Reaction, Logger } from "/server/api";
import { _ } from "meteor/underscore";
import moment from "moment";
import "moment-timezone";
import "twix";

import { GetOutfitted } from "/imports/plugins/custom/getoutfitted-core/server/api";
import { Transit } from "/imports/plugins/custom/transit-times/server/api";

function updateCartReservation(cartId, update) {
  return Cart.update({
    _id: cartId
  }, {
    $set: {
      startTime: update.startTime,
      endTime: update.endTime,
      rentalMonths: update.months,
      rentalWeeks: update.weeks,
      rentalDays: update.days,
      rentalHours: update.hours,
      rentalMinutes: update.minutes,
      items: update.items,
      resort: update.resort
    }
  });
}

Meteor.methods({
  /**
   * rentalProducts/setReservation sets or updates the startTime and endTime for a users cart.
   * which determines the cart price for any rental items.
   * @param   {String} cartId    - id of cart we are updating
   * @param   {Date}   startTime - Datetime of start of rental
   * @param   {Date}   endTime   - Datetime of end of rental
   */
  "rentalProducts/setReservation": function (cartId, reservation) {
    check(cartId, String);
    check(reservation, Object);
    check(reservation.startTime, Date);
    check(reservation.endTime, Date);
    check(reservation.resort, Match.Maybe(String));

    const cart = Cart.findOne(cartId);
    // Make sure that cart is owned by current user.
    if (cart.userId !== Meteor.userId() && !Reaction.hasPermission("editUserCart")) {
      throw new Meteor.Error("User Id and Cart userId don\'t match");
    }

    // Setup Update Object.
    const {startTime, endTime, resort} = reservation;
    const rental = moment(startTime).twix(endTime);
    const update = {startTime, endTime, resort};
    update.cartId = cart._id;
    update.months = rental.count("months");
    update.weeks = rental.count("weeks");
    update.days = rental.count("days");
    update.hours = rental.count("hours");
    update.minutes = rental.count("minutes");

    if (!update.resort) {
      update.resort = cart.resort;
    }

    // If no items in cart, update immediately
    if (!cart.items || cart.items.length === 0) {
      update.items = [];
      updateCartReservation(cart._id, update);
      return { successful: true };
    }

    // If we change dates or change length of reservation
    // we need to do the following
    // 1. Check availability of all items currently in the cart
    // 2. IF anything unavailable - return unsuccessful and notify what is unavailable
    // 3. If all available, update prices for all items in cart and change dates.
    //
    // TODO: Should be done on client as part of callback / promise.
    // X. Offer to remove unavailable items and change dates anyway or cancel date change.
    const shipping = [{
      address: {
        postal: update.resort
      }
    }];

    const transit = new Transit({
      startTime: GetOutfitted.adjustLocalToDenverTime(startTime),
      endTime: GetOutfitted.adjustLocalToDenverTime(endTime),
      orderNumber: null,
      shipping: shipping
    });

    const delivery = {
      shipmentDate: transit.calculateShippingDay(),
      returnDate: transit.calculateReturnDay(),
      localDelivery: transit.isLocalDelivery(),
      restockDay: transit.calculateRestockDay()
    };

    // 1A) Aggregate qty of all variants in the cart
    const quantityByVariantId = cart.items.reduce(function (qtyByVariantId, item) {
      if (item.variants.functionalType === "bundleVariant") {
        // Increment qty of `rentalVariant`s associated with current `bundleVariant`
        item.variants.selectedBundleOptions.forEach(function (variant) {
          if (qtyByVariantId[variant.variantId]) {
            qtyByVariantId[variant.variantId]++;
          } else {
            qtyByVariantId[variant.variantId] = 1;
          }
        });
      } else if (item.variants.functionalType === "rentalVariant") {
        // Increment qty of current `rentalVariant`
        if (qtyByVariantId[item.variants._id]) {
          qtyByVariantId[item.variants._id]++;
        } else {
          qtyByVariantId[item.variants._id] = 1;
        }
      }
      return qtyByVariantId;
    }, {});

    // 1B) Check availability of all variants in cart
    const availabilityByVariantId = Meteor.call("rentalProducts/checkMultiInventoryAvailability",
      quantityByVariantId, {startTime: delivery.shipmentDate, endTime: delivery.restockDay });

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

    // 2) If something isn't available, notify client and fail.
    if (inventoryNotAvailable.length > 0) {
      // Return unsuccessful and list of unavailable inventory
      return {
        successful: false,
        inventoryNotAvailable: inventoryNotAvailable
      };
    }

    // 3) If everything is available - update price of existing items
    const updatedCartItems = cart.items.reduce(function (updatedItems, item) {
      if (item.variants.functionalType === "rentalVariant" || item.variants.functionalType === "bundleVariant") {
        const priceBucket = item.variants.rentalPriceBuckets.find(bucket => bucket.duration === rental.count("days"));
        if (priceBucket) {
          item.variants.price = priceBucket.price;
          updatedItems.push(item);
        } else {
          Logger.error(`Price bucket not found for ${item.variants._id} for ${rental.count("days")} rental days. Removing item from cart.`);
          // TODO: Warn client that item was removed from cart.
        }
      } else {
        // item is not rental product - leave it alone;
        updatedItems.push(item);
      }
      return updatedItems;
    }, []);

    update.items = updatedCartItems;
    updateCartReservation(cart._id, update);
    return { successful: true };
  },

  /**
   * rentalProducts/setRentalPeriod sets or updates the startTime and endTime for a users cart.
   * which determines the cart price for any rental items.
   * @param   {String} cartId    - id of cart we are updating
   * @param   {Date}   startTime - Datetime of start of rental
   * @param   {Date}   endTime   - Datetime of end of rental
   */
  "rentalProducts/setRentalPeriod": function (cartId, startTime, endTime) {
    check(cartId, String);
    check(startTime, Date);
    check(endTime, Date);
    const cart = Cart.findOne(cartId);
    // Make sure that cart is owned by current user.
    if (cart.userId !== Meteor.userId() && !Reaction.hasPermission("editUserCart")) {
      throw new Meteor.Error("User Id and Cart userId don\'t match");
    }
    const rental = moment(startTime).twix(endTime);

    // If cart has items in it - update the price for those items
    if (cart.items && cart.items.length > 0) {
      cart.items = cart.items.reduce(function (newCart, item) {
         // TODO: future if item.type === rental
        if ((item.variants.functionalType === "rentalVariant"
          || item.variants.functionalType === "bundleVariant")
          && cart.rentalDays) {
          // TODO: update qty to verified rental qty available
          // Set price to calculated rental price;
          // if qty not available available, remove from cart
          if (true) { // TODO: Check to ensure that qty is available for new dates before pushing back into cart
            const priceBucket = _.find(item.variants.rentalPriceBuckets, (bucket) => {
              return bucket.duration === rental.count("days");
            });
            if (priceBucket) {
              // assign correct price and push to cart.
              item.variants.price = priceBucket.price;
              newCart.push(item);
            } else {
              // remove from cart (don't push)
              Logger.error(`Price bucket not found: ${item.variants._id} for ${cart.rentalDays} rental days`);
              // TODO: Warn client that item was removed from cart.
            }
          } else {
            Logger.warn(`Item ${item._id} in cart not available for selected dates.`);
            // TODO: Warn client that item is unavailable.
          }
        } else {
          // item is not a rental - push it back to the cart
          newCart.push(item);
        }
        return newCart;
      }, []);
    } else {
      // cart.items either doesn't exist or length is 0.
      // Assign empty array so that we don't break anything when updating Cart collection
      cart.items = [];
    }

    Cart.update({
      _id: cartId
    }, {
      $set: {
        startTime: startTime,
        endTime: endTime,
        rentalMonths: rental.count("months"),
        rentalWeeks: rental.count("weeks"),
        rentalDays: rental.count("days"),
        rentalHours: rental.count("hours"),
        rentalMinutes: rental.count("minutes"),
        items: cart.items
      }
    });
  },

  // Deprecate this function? Or figure out what it's for.
  // XXX: Not certain this is used any more.
  "rentalProducts/setRentalLength": function (cartId, rentalLength, units) {
    check(cartId, String);
    check(rentalLength, Number);
    check(units, Match.OneOf("months", "weeks", "days", "hours", "minutes"));
    const cart = Cart.findOne(cartId);
    if (cart.userId !== Meteor.userId()) {
      return false;
    }

    let opts = {};
    const fieldToSet = "rental" + units[0].toUpperCase() + units.substr(1); // Make sure that units is correct
    opts[fieldToSet] = rentalLength;

    Cart.update({
      _id: cartId
    }, {
      $set: updateObj
    });
  }
});
