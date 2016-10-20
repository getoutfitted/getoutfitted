import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { _ } from "meteor/underscore";
import { Logger, MethodHooks } from "/server/api";
import { Cart, Products } from "/lib/collections";

MethodHooks.beforeMethods({
  "orders/inventoryAdjust": function (options) {
    check(options.arguments, [Match.Any]);
    const orderId = options.arguments[0];
    if (!orderId) {
      Logger.warn("Rental Product inventory not adjusted - orderId not found");
      return true;
    }

    Meteor.call("rentalProducts/inventoryAdjust", orderId);

    return options;
    // Returned false before, but there is no longer an `adjust inventory method in core`
    // so this is probably never called any more.
  }
});

MethodHooks.afterMethods({
  "cart/addToCart": function (options) {
    check(options.arguments[0], String);
    check(options.arguments[1], String);
    const variantId = options.arguments[1];
    const cart = Cart.findOne({ userId: Meteor.userId() });
    if (!cart) {
      Logger.warn(`Aborting cart/addToCart after hook. Cart not found for user ${Meteor.userId()}.`);
      return options;
    }
    if (cart.items && cart.items.length > 0) {
      _.map(cart.items, function (item) {
        if (item.variants._id === variantId
          && (item.variants.functionalType === "rentalVariant"
            || item.variants.functionalType === "bundleVariant")
          && cart.rentalDays) {
            // TODO: update qty to verified rental qty available
          // Set price to calculated rental price;
          const priceBucket = _.find(item.variants.rentalPriceBuckets, (bucket) => {
            return bucket.duration === cart.rentalDays;
          });
          if (priceBucket) {
            item.variants.price = priceBucket.price;
          } else {
            Logger.error(`Error updating price for item ${item._id} to cart beacuse no priceBucket could be found.`);
            // TODO: Remove from cart, log error, warn client.
          }
        }
        return item;
      });
    } else {
      Logger.info(`Skipped updating cart items for cartId ${cart._id} because cart is empty`);
      cart.items = [];
    }

    Cart.update({
      _id: cart._id
    }, {
      $set: {
        items: cart.items
      }
    });
    return options; // Continue with other hooks;
    // was returning true before. After chatting with @paulgrever we decided it was proabably better to return
    // the options object
  }
});

Products.after.insert(function (userId, doc) {
  if (doc.functionalType === "rentalVariant") {
    return Meteor.call("rentalProducts/registerInventory", doc);
  }
  return false;
});
