import { _ } from "meteor/underscore";
import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";
import { check } from "meteor/check";
import { Reaction } from "/server/api";
import { Orders, Products } from "/lib/collections";
import { Transit } from "/imports/plugins/custom/transit-times/server/api";
import AdvancedFulfillment from "../../lib/api";
import RentalProducts from "/imports/plugins/custom/reaction-rental-products/server/api";
import { InventoryVariants } from "/imports/plugins/custom/reaction-rental-products/lib/collections";

const updateShippingAddress = new ValidatedMethod({
  name: "updateShippingAddress",
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
        "advancedFulfillment.localDelivery": update.localDelivery,
        "advancedFulfillment.transitTime": update.transitTime,
        "advancedFulfillment.shipmentDate": update.shipmentDate,
        "advancedFulfillment.returnDate": update.returnDate,
        "advancedFulfillment.arriveBy": update.arrivalDate,
        "advancedFulfillment.shipReturnBy": update.returnBy,
        "shipping.0.address": update.address
      },
      $addToSet: {
        history: {
          event: "orderShippingAddressUpdated",
          userId: Meteor.userId(),
          updatedAt: new Date()
        }
      }
    });
  }
});

Meteor.methods({
  // TODO: This should check availability and not allow updates if availability does not exist.
  // TODO: This should also update the availability calendar
  // Currently just switches dates in AF
  "advancedFulfillment/updateRentalDates": function (orderId, startDate, endDate, userObj) {
    check(orderId, String);
    check(startDate, Date);
    check(endDate, Date);
    check(userObj, Object);

    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }

    const order = ReactionCore.Collections.Orders.findOne(orderId);
    const localDelivery = order.advancedFulfillment.localDelivery;
    let user = userNameDeterminer(userObj);

    let rentalLength = moment(endDate).diff(moment(startDate), "days");
    let arrivalDate = startDate;
    let returnBy = endDate;
    let shipmentDate = TransitTimes.calculateShippingDayByOrder(_.defaults({startTime: startDate}, order));
    let returnDate = TransitTimes.calculateReturnDayByOrder(_.defaults({endTime: endDate}, order));
    let shippingDays = TransitTimes.calculateTotalShippingDaysByOrder(_.defaults({startTime: startDate}, order));

    let rushOrder = rushRequired(arrivalDate, shippingDays, localDelivery);
    if (rushOrder && !localDelivery) {
      shipmentDate = TransitTimes.date.nextBusinessDay(moment().startOf("day")); // Ship Next Business Day
    }

    if (localDelivery) {
      shipmentDate = arrivalDate; // Local delivery should be delivered the day it"s due.
    }

    // TODO: Call some function in RentalProducts to update rental dates as stored in calendar

    let orderNotes = anyOrderNotes(order.orderNotes);
    orderNotes = orderNotes + "<p> Rental Dates updated to: "
    + moment(startDate).format("MM/D/YY") + "-"
    + moment(endDate).format("MM/D/YY")
    + noteFormattedUser(user) + "</p>";

    ReactionCore.Collections.Orders.update({_id: orderId}, {
      $set: {
        "startTime": startDate,
        "endTime": endDate,
        "rentalDays": rentalLength,
        "infoMissing": false,
        "advancedFulfillment.shipmentDate": shipmentDate,
        "advancedFulfillment.returnDate": returnDate,
        "advancedFulfillment.workflow": {status: "orderCreated"},
        "advancedFulfillment.arriveBy": arrivalDate,
        "advancedFulfillment.shipReturnBy": returnBy,
        "advancedFulfillment.impossibleShipDate": false,
        "orderNotes": orderNotes
      },
      $addToSet: {
        history: {
          event: "updatedRentalDates",
          userId: userObj._id,
          updatedAt: new Date()
        }
      }
    });
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
      address: address
    };

    // New and old address are both local deliveries
    if (existingLocalDelivery && update.localDelivery) {
      console.log("Both localDelivery");
      updateShippingAddress.call({orderId, update});
      return true;
    }

    // New and old address have identical transit times
    if (update.transitTime === existingTransitTime) {
      console.log("equal transitTime");
      updateShippingAddress.call({orderId, update});
      return true;
    }

    // New address is local or has shorter transit time than existing address
    if (update.localDelivery || update.transitTime < existingTransitTime) {
      console.log("lesser transitTime");
      // Determine which inventory variants we are using
      const inventoryToTruncate = InventoryVariants.find({"unavailableDetails.orderId": orderId}, {fields: {_id: 1}}).fetch().map(iv => iv._id);
      Meteor.call("rentalProducts/removeOrderReservations", orderId);

      updateShippingAddress.call({orderId, update});
      update.reservation = RentalProducts.server.buildUnavailableInventoryArrays(orderId, newTransit);

      inventoryToTruncate.forEach(function (inventoryVariantId) {
        Meteor.call("rentalProducts/reserveInventory", inventoryVariantId, update.reservation, orderId);
      });
      return true;
    }

    // New address has greater transit time than existing address.
    // We need to check to make sure that there exist inventory that
    // can accomodate the longer reservation period before booking.
    console.log("greater transitTime");

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

    // Check to make sure we have enough of each item.
    for (const vId in availablityByVariantId) {
      if (quantityByVariantId[vId] !== availablityByVariantId[vId].length) {
        return false;
      }
      availablityByVariantId[vId].forEach(function (inventoryVariantId) {
        inventoryToReserve.push(inventoryVariantId);
      });
    }
    // We have to remove the existing reservations before changing the shipping address.
    Meteor.call("rentalProducts/removeOrderReservations", orderId);

    updateShippingAddress.call({orderId, update});
    update.reservation = RentalProducts.server.buildUnavailableInventoryArrays(orderId, newTransit);
    inventoryToReserve.forEach(function (inventoryVariantId) {
      Meteor.call("rentalProducts/reserveInventory", inventoryVariantId, update.reservation, orderId);
    });

    return true;
  },

  // "advancedFulfillment/updateShippingAddress": function (orderId, address) {
  //   check(orderId, String);
  //   check(address, Object);
  //   if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
  //     throw new Meteor.Error(403, "Access Denied");
  //   }
  //   const user = Meteor.user();
  //   const userName = user.username || user.emails[0].address;
  //   const order = ReactionCore.Collections.Orders.findOne(orderId);
  //   const prevAddress = order.shipping[0].address;
  //   const localDelivery = TransitTimes.isLocalDelivery(address.postal);
  //   const transitTime = TransitTimes.calculateTransitTime(address);
  //   const transitTimeToPrevAddress = TransitTimes.calculateTransitTime(prevAddress);
  //
  //   let returnDate = order.advancedFulfillment.returnDate;
  //   let shipmentDate = order.advancedFulfillment.shipmentDate;
  //   let arrivalDate = order.advancedFulfillment.arrivalDate;
  //   let returnBy = order.advancedFulfillment.returnBy;
  //
  //   if (transitTime !== transitTimeToPrevAddress) {
  //     order.shipping[0].address = address;
  //     const startDate = order.startTime;
  //     const endDate = order.endTime;
  //     const totalShippingDays = TransitTimes.calculateTotalShippingDaysByOrder(order);
  //
  //     shipmentDate = TransitTimes.calculateShippingDayByOrder(order);
  //     arrivalDate = startDate;
  //     returnBy = endDate;
  //     returnDate = TransitTimes.calculateReturnDayByOrder(order);
  //
  //     if (localDelivery) {
  //       shipmentDate = arrivalDate; // Remove transit day from local deliveries
  //     }
  //
  //     let rushOrder = rushRequired(arrivalDate, totalShippingDays, localDelivery);
  //     if (rushOrder && !localDelivery) {
  //       shipmentDate = TransitTimes.nextBusinessDay(moment().startOf("day"));
  //     }
  //   }
  //
  //   let orderNotes = anyOrderNotes(order.orderNotes);
  //   // TODO: turn order notes into an array of strings
  //   // Build updated orderNotes
  //   orderNotes = orderNotes + "<br /><p> Shipping Address updated from: <br />"
  //   + prevAddress.fullName + "<br />"
  //   + prevAddress.address1 + "<br />";
  //
  //   orderNotes = prevAddress.address2 ? orderNotes + prevAddress.address2 + "<br />" : orderNotes;
  //
  //   orderNotes = orderNotes + prevAddress.city + " "
  //   + prevAddress.region + ", " + prevAddress.postal
  //   + noteFormattedUser(userName) + "</p>";
  //
  //   try {
  //     ReactionCore.Collections.Orders.update({_id: orderId}, {
  //       $set: {
  //         "advancedFulfillment.localDelivery": localDelivery,
  //         // This line adds a day to transit time because we estimate from first ski day during import.
  //         "advancedFulfillment.transitTime": transitTime,
  //         "advancedFulfillment.shipmentDate": shipmentDate,
  //         "advancedFulfillment.returnDate": returnDate,
  //         "advancedFulfillment.arriveBy": arrivalDate,
  //         "advancedFulfillment.shipReturnBy": returnBy,
  //         "shipping.0.address": address,
  //         "orderNotes": orderNotes
  //       },
  //       $addToSet: {
  //         history: {
  //           event: "orderShippingAddressUpdated",
  //           userId: Meteor.userId(),
  //           updatedAt: new Date()
  //         }
  //       }
  //     });
  //     ReactionCore.Log.info("Successfully updated shipping address for order: " + order.shopifyOrderNumber);
  //   } catch (e) {
  //     ReactionCore.Log.error("Error updating shipping address for order: " + order.shopifyOrderNumber, e);
  //   }
  // },

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
