import { Meteor } from "meteor/meteor";
import { Cart } from "/lib/collections";
import { Logger, MethodHooks } from "/server/api";
// this needed to keep correct loading order. Methods should be loaded before hooks
import "../cart";

// // Meteor.after to call after
MethodHooks.after("cart/submitPayment", function (options) {
  // if cart/submit had an error we won't copy cart to Order
  // and we'll throw an error.
  // Logger.debug("MethodHooks after cart/submitPayment", options);
  // Default return value is the return value of previous call in method chain
  // or an empty object if there's no result yet.
  const result = options.result || {};
  if (typeof options.error === "undefined") {
    const cart = Cart.findOne({
      userId: Meteor.userId()
    });

    // update workflow
    Meteor.call("workflow/pushCartWorkflow", "goCartWorkflow", "goPaymentSubmitted");

    // create order
    if (cart) {
      if (!cart.billing) {
        Logger.info(`MethodHooks after cart/submitPayment. No billing address after payment! userId: ${Meteor.userId()}, shopId: ${result.shopId}`);
      }

      if (cart.items && cart.billing && cart.billing[0].paymentMethod) {
        const orderId = Meteor.call("cart/copyCartToOrder", cart._id);
        // Return orderId as result from this after hook call.
        // This is done by extending the existing result.
        result.orderId = orderId;
      } else {
        throw new Meteor.Error(
          "An error occurred verifing payment method. Failed to save order."
        );
      }
    }
  }
  return result;
});
