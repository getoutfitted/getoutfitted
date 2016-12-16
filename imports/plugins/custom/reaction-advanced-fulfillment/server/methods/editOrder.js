import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";
import { check } from "meteor/check";
import { Reaction } from "/server/api";
import { Orders, Products } from "/lib/collections";
import { GetOutfitted } from "/imports/plugins/custom/getoutfitted-core/lib/api";
import { Transit } from "/imports/plugins/custom/transit-times/server/api";
import AdvancedFulfillment from "../../lib/api";
import RentalProducts from "/imports/plugins/custom/reaction-rental-products/server/api";
import { InventoryVariants } from "/imports/plugins/custom/reaction-rental-products/lib/collections";

// update reservation is a validated method that should only be called
// from methods within this file. It should only be called after checking to ensure
// availability of all inventory impacted by the change in reservation.
// Called by `updateRentalDates` and `updateShippingAddress` currently
const updateReservation = new ValidatedMethod({
  name: "updateReservation",
  validate(args) {
    check(args, {
      orderId: String,
      update: Object
    });
  },
  run({ orderId, update }) {
    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }
    return Orders.update({_id: orderId}, {
      $set: {
        "startTime": update.startTime,
        "endTime": update.endTime,
        "advancedFulfillment.localDelivery": update.localDelivery,
        "advancedFulfillment.transitTime": update.transitTime,
        "advancedFulfillment.shipmentDate": update.shipmentDate,
        "advancedFulfillment.returnDate": update.returnDate,
        "advancedFulfillment.arriveBy": update.arriveBy,
        "advancedFulfillment.shipReturnBy": update.returnBy,
        "shipping.0.address": update.address
      },
      $addToSet: {
        history: {
          event: "orderReservationInformationUpdated",
          userId: Meteor.userId(),
          updatedAt: new Date()
        }
      }
    });
  }
});

Meteor.methods({
  "advancedFulfillment/updateRentalDates": function (orderId, startDate, endDate) {
    check(orderId, String);
    check(startDate, Date);
    check(endDate, Date);

    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }

    const order = Orders.findOne(orderId);
    // const localDelivery = order.advancedFulfillment.localDelivery;
    const newTransit = new Transit({
      startTime: GetOutfitted.adjustLocalToDenverTime(startDate),
      endTime: GetOutfitted.adjustLocalToDenverTime(endDate),
      orderNumber: order.orderNumber,
      shipping: order.shipping
    });

    // Build update object
    const update = {
      startTime: startDate,
      endTime: endDate,
      localDelivery: newTransit.isLocalDelivery(),
      transitTime: newTransit.calculateTransitTime(),
      arriveBy: newTransit.getArriveBy(),
      returnBy: newTransit.getShipReturnBy(),
      shipmentDate: newTransit.calculateShippingDay(),
      returnDate: newTransit.calculateReturnDay(),
      address: order.address
    };

    // Determine what quantity of each item we need to change the reservation of.
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
      quantityByVariantId, { startTime: update.shipmentDate, endTime: update.returnDate });

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

    // If anything isn't avaiable, return those IDs to the client and fail to update.
    if (inventoryNotAvailable.length > 0) {
      return {
        successful: false,
        inventoryNotAvailable: inventoryNotAvailable
      };
    }

    // We have to remove the existing reservations before changing the reservation.
    // If we don't we may fail to remove all dates associated with this order.
    Meteor.call("rentalProducts/removeOrderReservations", orderId);

    updateReservation.call({orderId, update});
    update.reservation = RentalProducts.server.buildUnavailableInventoryArrays(orderId, newTransit);
    inventoryToReserve.forEach(function (inventoryVariantId) {
      Meteor.call("rentalProducts/reserveInventory", inventoryVariantId, update.reservation, orderId);
    });

    return {successful: true};
  },

  "advancedFulfillment/updateShippingAddress": function (orderId, address) {
    check(orderId, String);
    check(address, Object);

    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }

    const order = Orders.findOne({_id: orderId});
    const newAddressTransitObject = {
      orderNumber: order.orderNumber,
      startTime: order.startTime,
      endTime: order.endTime,
      shipping: [{address: address}]
    };

    const existingTransit = new Transit(order);
    const existingLocalDelivery = existingTransit.isLocalDelivery();
    const existingTransitTime = existingTransit.calculateTransitTime();

    const newTransit = new Transit(newAddressTransitObject);

    // Build update object
    const update = {
      localDelivery: newTransit.isLocalDelivery(),
      transitTime: newTransit.calculateTransitTime(),
      arriveBy: newTransit.getArriveBy(),
      returnBy: newTransit.getShipReturnBy(),
      shipmentDate: newTransit.calculateShippingDay(),
      returnDate: newTransit.calculateReturnDay(),
      address: address,
      startTime: order.startTime,
      endTime: order.endTime
    };

    // New and old address are both local deliveries
    if (existingLocalDelivery && update.localDelivery) {
      updateReservation.call({orderId, update});
      return {successful: true};
    }

    // New and old address have identical transit times
    if (update.transitTime === existingTransitTime) {
      updateReservation.call({orderId, update});
      return {successful: true};
    }

    // New address is local or has shorter transit time than existing address
    if (update.localDelivery || update.transitTime < existingTransitTime) {
      // Determine which inventory variants we are using
      const inventoryToTruncate = InventoryVariants.find({"unavailableDetails.orderId": orderId}, {fields: {_id: 1}}).fetch().map(iv => iv._id);
      Meteor.call("rentalProducts/removeOrderReservations", orderId);

      updateReservation.call({orderId, update});
      update.reservation = RentalProducts.server.buildUnavailableInventoryArrays(orderId, newTransit);

      inventoryToTruncate.forEach(function (inventoryVariantId) {
        Meteor.call("rentalProducts/reserveInventory", inventoryVariantId, update.reservation, orderId);
      });
      return {successful: true};
    }

    // else
    // New address has greater transit time than existing address.
    // We need to check to make sure that there exist inventory that
    // can accomodate the longer reservation period before booking.

    const quantityByVariantId = order.items.reduce(function (qtyByVariantId, item) {
      if (item.variants.functionalType !== "bundleVariant") {
        if (qtyByVariantId[item.variants._id]) {
          qtyByVariantId[item.variants._id]++;
        } else {
          qtyByVariantId[item.variants._id] = 1;
        }
      }
      return qtyByVariantId;
    }, {});

    availablityByVariantId = Meteor.call("rentalProducts/checkMultiInventoryAvailability",
      quantityByVariantId, { startTime: update.shipmentDate, endTime: update.returnDate });

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

    // If anything isn't avaiable, return those IDs to the client and fail to update.
    if (inventoryNotAvailable.length > 0) {
      return {
        successful: false,
        inventoryNotAvailable: inventoryNotAvailable
      };
    }

    // We have to remove the existing reservations before changing the reservation.
    // If we don't we may fail to remove all dates associated with this order.
    Meteor.call("rentalProducts/removeOrderReservations", orderId);

    updateReservation.call({orderId, update});
    update.reservation = RentalProducts.server.buildUnavailableInventoryArrays(orderId, newTransit);
    inventoryToReserve.forEach(function (inventoryVariantId) {
      Meteor.call("rentalProducts/reserveInventory", inventoryVariantId, update.reservation, orderId);
    });

    return {successful: true};
  },

  "advancedFulfillment/updateContactInformation": function (orderId, phone, email) {
    check(orderId, String);
    check(phone, String);
    check(email, String);
    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }
    const order = ReactionCore.Collections.Orders.findOne(orderId);
    try {
      ReactionCore.Collections.Orders.update({_id: orderId}, {
        $set: {
          "email": email,
          "shipping.0.address.phone": phone
        },
        $addToSet: {
          history: {
            event: "orderContactInfoUpdated",
            userId: Meteor.userId(),
            updatedAt: new Date()
          }
        }
      });
      ReactionCore.Log.info("Successfully updated contact information for order: " + order.shopifyOrderNumber);
    } catch (e) {
      ReactionCore.Log.error("Error updating contact information for order: " + order.shopifyOrderNumber, e);
    }
  },

  "advancedFulfillment/itemExchange": function (options) {
    check(options, Object);
    // workaround for know issue with check https://github.com/meteor/meteor/issues/6959
    check(options.orderId, String);
    check(options.existingItemCartId, String);
    check(options.existingItemVariantId, String);
    check(options.productId, String);
    check(options.variantId, String);

    check(options.bundleId, Match.Maybe(String));
    check(options.bundleIndex, Match.OneOf(String, Number, undefined, null));

    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }

    const addOptions = {
      orderId: options.orderId,
      productId: options.productId,
      variantId: options.variantId,
      bundleId: options.bundleId,
      bundleIndex: options.bundleIndex,
      isExchange: true
    };
    const removeOptions = {
      orderId: options.orderId,
      cartItemId: options.existingItemCartId,
      variantId: options.existingItemVariantId,
      isExchange: true
    };

    Meteor.call("advancedFulfillment/addItem", addOptions);
    Meteor.call("advancedFulfillment/removeItem", removeOptions);

    // Create note
    const existingProduct = Products.findOne({_id: options.existingItemVariantId});
    const newProduct = Products.findOne({_id: options.variantId});
    const note = `${existingProduct.sku} was exchanged for ${newProduct.sku}.`;
    Meteor.call("advancedFulfillment/addOrderNote", options.orderId, note, "Product Exchanged");
  },

  "advancedFulfillment/addItem": function (options) {
    check(options, Object);
    // workaround for know issue with check https://github.com/meteor/meteor/issues/6959
    check(options.orderId, String);
    check(options.productId, String);
    check(options.variantId, String);
    check(options.bundleId, Match.Maybe(String));
    check(options.bundleIndex, Match.OneOf(String, Number, undefined, null));
    check(options.isExchange, Match.Maybe(Boolean));

    // destructure
    const {
      orderId,
      productId,
      variantId,
      bundleId,
      bundleIndex,
      isExchange
    } = options;

    // Check for permission
    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }

    if (bundleId && !bundleIndex) {
      throw new Meteor.Error(422, "bundleIndex must be included to add an item to a bundle");
    }

    const order = Orders.findOne({_id: orderId});
    const product = Products.findOne({_id: productId});
    const variant = Products.findOne({_id: variantId});
    const id = Random.id();
    const shopId = Reaction.getShopId();
    const isBundle = !!bundleId;

    const newItem = {
      _id: id,
      shopId: shopId,
      productId: product._id,
      quantity: 1,
      title: product.title,
      type: product.type,
      workflow: product.workflow,
      variants: variant
    };
    const newAfItem = {
      _id: id,
      productId: product._id,
      shopId: shopId,
      quantity: 1,
      variantId: variant._id,
      price: variant.price,
      sku: variant.sku,
      location: variant.location,
      itemDescription: product.gender + " - " + product.vendor + " - " + product.title,
      workflow: {
        status: "In Stock",
        workflow: ["added"]
      }
    };

    if (isBundle) {
      Object.assign(newItem, {
        bundleProductId: bundleId,
        bundleIndex: bundleIndex,
        customerViewType: "bundleComponent"
      });
    }

    // Shipment times should be identical to rest of order
    const shipment = {
      firstDayToReserve: order.advancedFulfillment.shipmentDate,
      lastDayToReserve: order.advancedFulfillment.returnDate
    };

    const inventoryVariantIds = Meteor.call("rentalProducts/checkInventoryAvailability",
                                      newItem.variants._id,
                                      {endTime: shipment.lastDayToReserve, startTime: shipment.firstDayToReserve},
                                      newItem.quantity, false);

    if (inventoryVariantIds.length === newItem.quantity) {
      inventoryVariantIds.forEach(function (inventoryVariantId) {
        const reservation = RentalProducts.server.buildUnavailableInventoryArrays(orderId);
        Meteor.call("rentalProducts/reserveInventory", inventoryVariantId, reservation, orderId);
      });

      Orders.update({
        _id: orderId
      }, {
        $addToSet: {
          "items": newItem,
          "advancedFulfillment.items": newAfItem,
          "history": {
            event: "itemAdded",
            userId: Meteor.userId(),
            updatedAt: new Date()
          }
        },
        updatedAt: new Date()
      });

      if (!isExchange) {
        const bundle = Products.findOne({_id: bundleId});
        let productAddedTo = "order";
        if (bundle) {
          productAddedTo = `${bundle.title} ${bundleIndex}`;
        }
        // Add note to order
        const note = `${newAfItem.sku} was added to ${productAddedTo}.`;
        Meteor.call("advancedFulfillment/addOrderNote", orderId, note, "Product Added");
      }
    } else {
      throw new Meteor.Error(`inventory not available for variantId ${variantId}`);
    }
  },

  "advancedFulfillment/removeItem": function (options) {
      // workaround for know issue with check https://github.com/meteor/meteor/issues/6959
    check(options, Object);
    check(options.orderId, String);
    check(options.cartItemId, String);
    check(options.variantId, String);
    check(options.isExchange, Match.Maybe(Boolean));

    // destructure
    const {
      orderId,
      cartItemId,
      variantId,
      isExchange
    } = options;

    // Check for permission
    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }

    Orders.update({
      _id: orderId
    }, {
      $pull: {
        "items": {
          _id: cartItemId
        },
        "advancedFulfillment.items": {
          _id: cartItemId
        }
      }
    });

    Meteor.call("rentalProducts/removeReservation", orderId, variantId);

    // Add note to order
    if (!isExchange) {
      const product = Products.findOne({_id: variantId});
      const note = `${product.sku} was removed from order.`;
      Meteor.call("advancedFulfillment/addOrderNote", orderId, note, "Product Removed");
    }
  },

  "advancedFulfillment/cancelOrder": function (orderId) {
    check(orderId, String);

    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }

    const history = {
      event: "orderCancelled",
      userId: Meteor.userId(),
      updatedAt: new Date()
    };

    ReactionCore.Collections.Orders.update({
      _id: orderId
    }, {
      $addToSet: {
        history: history
      },
      $set: {
        "advancedFulfillment.workflow.status": "orderCancelled",
        "advancedFulfillment.impossibleShipDate": false
      }
    });

    Meteor.call("advancedFulfillment/addOrderNote", orderId, "Order Cancelled", "Order Cancelled");

    Meteor.call("rentalProducts/removeOrderReservations", orderId);
  }
});
