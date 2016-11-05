import { Cart, Accounts } from "/lib/collections";
import { Meteor } from "meteor/meteor";

Meteor.methods({
  "checkout/addEmailToCart": function (cartId, email) {
    check(cartId, String);
    check(email, String);
    Cart.update({
      _id: cartId
    }, {
      $set: {
        email: email
      }
    });
  },

  "cart/customerAgreedToTermsOfService": function (agreed) {
    check(agreed, Boolean);
    ReactionCore.Collections.Cart.update({
      userId: Meteor.userId()
    }, {
      $set: {
        customerAgreedToTermsOfService: agreed,
        dateCustomerAgreedToTermsOfService: new Date()
      }
    });
  },
  "cart/useShippingForBilling": function (useShippingForBilling) {
    check(useShippingForBilling, Boolean);

    const cart = Cart.findOne({
      userId: Meteor.userId()
    });
    if (!cart) {
      Logger.error(`Cart not found for user: ${ Meteor.userId() }`);
      throw new Meteor.Error(404, "Cart not found",
        "Cart not found for user with such id");
    }

    if (useShippingForBilling) {
      // Customer would like to use existing shippingAddress for billing address.
      // Check to make sure cart shipping array exists and has exactly one entry
      if (Array.isArray(cart.shipping) && cart.shipping.length === 1) {
        const shippingAddress = cart.shipping[0].address;

        Cart.update({
          userId: Meteor.userId()
        }, {
          $set: {
            useShippingForBilling: useShippingForBilling
          }
        });

        Meteor.call("cart/setPaymentAddress", cart._id, shippingAddress);
      }
    } else {
      // if the customer has unset the flag, we need to reset the billing address.
      if (Array.isArray(cart.billing) && cart.billing.length === 1) {
        const account = Accounts.findOne({userId: Meteor.userId()});
        const billingAddress = cart.billing[0].address;
        Cart.update({ userId: Meteor.userId() }, { $set: { useShippingForBilling: useShippingForBilling } });

        // Check to see if a billing address exists before unsetting billing address
        // If address exists, set payment address to existing billing address.
        // Otherwise unset billing address.
        if (account && account.profile && Array.isArray(account.profile.addressBook)) {
          const defaultBillingAddress = account.profile.addressBook.find((address) => address.isBillingDefault === true);
          if (defaultBillingAddress) {
            return Meteor.call("cart/setPaymentAddress", cart._id, defaultBillingAddress);
          }
        }
        return Meteor.call("cart/unsetAddresses", billingAddress._id, Meteor.userId(), "billing");
      }
    }
  }

});
