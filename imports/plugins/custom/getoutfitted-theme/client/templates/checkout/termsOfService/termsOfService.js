import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Cart } from "/lib/collections";

Template.termsOfService.onRendered(function () {
  // ReactionAnalytics.trackEventWhenReady("Completed Checkout Step", {
  //   "step": 4,
  //   "Step Name": "Select Shipping Option"
  // });
  //
  // ReactionAnalytics.trackEventWhenReady("Viewed Checkout Step", {
  //   "step": 5,
  //   "Step Name": "Review Terms of Service"
  // });
});

Template.termsOfService.events({
  "click #termsOfService": function (event) {
    let customerAgreedToTermsOfService = event.target.checked;
    Meteor.call("cart/customerAgreedToTermsOfService", customerAgreedToTermsOfService);
    // ReactionAnalytics.trackEventWhenReady("Agree to Terms Of Service");
  }
});

Template.checkoutPayment.helpers({
  customerHasAgreedToTermsOfService: function () {
    const cart = Cart.findOne({userId: Meteor.userId()})
    if (cart) {
      return cart.customerAgreedToTermsOfService;
    }
    return false;
  }
});
