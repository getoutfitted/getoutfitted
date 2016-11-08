import { Template } from "meteor/templating";
import { Cart } from "/lib/collections";
Template.goCheckoutPayment.helpers({
  customerHasAgreedToTermsOfService: function () {
    const cart = Cart.findOne({userId: Meteor.userId()});
    if (cart) {
      return cart.customerAgreedToTermsOfService;
    }
    return false;
  }
});
