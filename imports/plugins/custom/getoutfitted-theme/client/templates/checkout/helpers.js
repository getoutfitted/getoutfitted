import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Accounts, Cart } from "/lib/collections";

/*
Template Helpers for checkout templates.
 */

Template.registerHelper("shippingAddressExists", () => {
  const account = Accounts.findOne({ userId: Meteor.userId() });
  if (account && account.profile && account.profile.addressBook && account.profile.addressBook[0]) {
    const defaultShippingAddress = account.profile.addressBook.find((address) => address.isShippingDefault === true);
    if (defaultShippingAddress) {
      return true;
    }
  }
  return false;
});

// Checks to make sure that the shipping and billing addresses exist and that the customer has agreed to our TOS
// Returns disabled if not ready.
Template.registerHelper("submitPaymentButtonDisabled", () => {
  const cart = Cart.findOne({ userId: Meteor.userId() });
  // check cart existance and that customer has agreed to TOS
  if (cart && cart.customerAgreedToTermsOfService) {
    // Check that billing address exists and has postal code
    if (Array.isArray(cart.billing) && cart.billing[0].address && cart.billing[0].address.postal) {
      // Check that shipping address exists and has postal code
      if (Array.isArray(cart.shipping) && cart.shipping[0].address && cart.shipping[0].address.postal) {
        // Payment button is _not_ disabled
        return false;
      }
    }
  }
  // All other conditions, disable payment button
  return true;
});
