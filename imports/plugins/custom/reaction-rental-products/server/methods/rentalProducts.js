import { _ } from "meteor/underscore";
import moment from "moment";
import "moment-timezone";
import "twix";

import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";
import { check } from "meteor/check";

import { Reaction } from "/server/api";
import { Products } from "/lib/collections";

import { GetOutfitted } from "/imports/plugins/custom/getoutfitted-core/lib/api";
import  RentalProducts from "../api";
import { InventoryVariants } from "../../lib/collections";


function adjustLocalToDenverTime(time) {
  let here = moment(time);
  let denver = here.clone().tz("America/Denver");
  denver.add(here.utcOffset() - denver.utcOffset(), "minutes");
  return denver.toDate();
}

/**
 *  RentalProduct Methods
 */

/**
 * checkAvailability
 * @description Basic binary search to see if requested dates are available for a given inventory item
 * @param {[Date]} reservedDates - Array of dates that have been reserved for a particular item
 * @param {[Date]} requestedDates - Array of dates that have been requested for reservation
 * @return {Boolean} - availability of item
 */

Meteor.methods({
  /*
   * Push an event to a specific variant
   * only need to supply updated information
   * returns array of available (inventory) variant ids
   */
  "rentalProducts/checkInventoryAvailability": function (variantId, reservationRequest, quantity = 1, searchLeastBookedFirst = false) {
    check(variantId, String);
    check(reservationRequest, {
      startTime: Date,
      endTime: Date
    });
    check(quantity, Number);
    check(searchLeastBookedFirst, Match.Maybe(Boolean));

    const inventoryVariants = InventoryVariants.find({
      productId: variantId,
      unavailableDates: {
        $not: {
          $elemMatch: {
            $gte: reservationRequest.startTime,
            $lte: reservationRequest.endTime
          }
        }
      },
      active: true
    }, {
      fields: {
        productId: 1
      },
      limit: quantity
    }).fetch();

    // Return an array of available ids;
    return inventoryVariants.map(inventory => inventory._id);
  },

  "rentalProducts/checkMultiInventoryAvailability": function (quantityByVariantId, reservationRequest, searchLeastBookedFirst = false) {
    check(quantityByVariantId, Match.Any);
    check(reservationRequest, {
      startTime: Date,
      endTime: Date
    });
    check(searchLeastBookedFirst, Match.Maybe(Boolean));

    const variantIds = Object.keys(quantityByVariantId);

    // Returns an object where the variantId is the key, and an array of available
    // InventoryVariants is the value.
    return variantIds.reduce(function (availabilityByVariantId, variantId) {
      const inventoryAvailable = InventoryVariants.find({
        productId: variantId,
        unavailableDates: {
          $not: {
            $elemMatch: {
              $gte: reservationRequest.startTime,
              $lte: reservationRequest.endTime
            }
          }
        },
        active: true
      }, {
        fields: {
          productId: 1
        },
        limit: parseInt(quantityByVariantId[variantId], 10),
        sort: {
          numberOfDatesBooked: -1
        }
      }).fetch();

      availabilityByVariantId[variantId] = inventoryAvailable.map(inventory => inventory._id);
      return availabilityByVariantId;
    }, {});
  },

  /**
   * bulkCheckInventoryAvailability
   * Checks each variantId supplied in array
   * Returns object with variantIds as keys and number of available inventory as values
   */

  "rentalProducts/bulkCheckInventoryAvailability": function (variantIds, reservationRequest) {
    check(variantIds, [String]);
    check(reservationRequest, {
      startTime: Date,
      endTime: Date
    });

    const inventoryAvailability = variantIds.reduce(function (obj, variantId) {
      const availableCount = InventoryVariants.find({
        productId: variantId,
        unavailableDates: {
          $not: {
            $elemMatch: {
              $gte: reservationRequest.startTime,
              $lte: reservationRequest.endTime
            }
          }
        },
        active: true
      }).count();

      obj[variantId] = availableCount;
      return obj;
    }, {});

    return inventoryAvailability;
  },


  /*
   * TODO: Move inventory event creation to AdvancedFulfillment
   * 	Push an event to a specific inventoryVariant
   *  params:
   *   inventoryVariantId - the id of the variant to which we are adding a product event
   *   eventDoc - An object containing the information for the event
   */
  "rentalProducts/createInventoryEvent": function (inventoryVariantId, eventDoc) {
    check(inventoryVariantId, String);

    check(eventDoc, {
      title: String,
      location: Match.Optional({
        address1: Match.Optional(String),
        address2: Match.Optional(String),
        city: Match.Optional(String),
        region: Match.Optional(String),
        postal: Match.Optional(String),
        country: Match.Optional(String),
        coords: Match.Optional({
          x: Number,
          y: Number
        }),
        metafields: Match.Optional(Object)
      }),
      description: Match.Optional(String)
    });

    if (!Reaction.hasPermission("createProductEvent")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    this.unblock();

    _.defaults(eventDoc, {
      _id: Random.id(),
      createdAt: new Date()
    });

    // InventoryVariants = InventoryVariants;

    const inventoryVariant = InventoryVariants.findOne({
      _id: inventoryVariantId
    });

    if (inventoryVariant) {
      return InventoryVariants.update(
        {_id: inventoryVariantId },
        { $push: { events: eventDoc } }, { validate: false });
    }

    throw new Meteor.Error(400, "Variant " + inventoryVariantId + " not found");
  },

//
//  DEPRECATED METHODS
//
//
//
//
//
//
  /**
   * rentalProducts/setProductTypeToRental
   * @param   {String} productId - Product Id to update
   * @returns {undefined} - on the client
   */

  "rentalProducts/setProductType": function (productId, productType) {
    check(productId, String);
    check(productType, String);
    // user needs create product permission to change type.
    if (!Reaction.hasPermission("createProduct")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    const product = Products.findOne(productId);
    // if product type is rental, setup variants.
    if (productType === "rental") {
      let variants = Products.find({
        ancestors: { $in: [productId] },
        type: "variant"
      }).fetch();

      _.each(variants, function (variant) {
        let childVariants = Products.find({
          ancestors: { $in: [variant._id] },
          type: "variant"
        }).fetch();
        // Set type to rental variant;
        variant.type = "rentalVariant";

        // XXX: This is sketchy and needs to change to a schema validation, but the validation is complicated
        if (!variant.price || variant.price === 0) {
          variant.price = 0.01;
        }
        _.defaults(variant, {pricePerDay: variant.price});
        if (variant.pricePerDay === 0) {
          variant.pricePerDay = variant.price;
        }

        // If this variant is a parent, no inventory children. Only inventory children childmost variants
        if (childVariants.length === 0) {
          let existingInventoryVariantQty = InventoryVariants.find({productId: variant._id}).count();
          let count = variant.inventoryQuantity - existingInventoryVariantQty;
          if (count > 0) {
            _(variant.inventoryQuantity - existingInventoryVariantQty).times(function (n) {
              let inventoryVariant = {};
              inventoryVariant.productId = variant._id;
              inventoryVariant.barcode = variant.sku + "-" + (n + existingInventoryVariantQty); // GetOutfitted.helpers.paddedNumber(n + count);
              inventoryVariant.sku = variant.sku;
              inventoryVariant.color = variant.color;
              inventoryVariant.size = variant.size;

              InventoryVariants.insert(inventoryVariant);
            });
          }
        }
        Products.update({_id: variant._id}, {$set: variant});
        Products.findOne({_id: variant._id});
      });
      return Products.update({_id: productId}, {$set: {type: "rental"}});
    }
    let variants = Products.find({
      ancestors: { $in: [productId] }
    }).fetch();
    _.each(variants, function (variant) {
      Products.update({_id: variant._id}, {$set: {type: "variant"}});
    });
    return Products.update({_id: productId}, {$set: {type: "simple"}});
  }
});
