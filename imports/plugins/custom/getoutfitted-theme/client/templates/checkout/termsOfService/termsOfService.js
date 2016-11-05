import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Cart } from "/lib/collections";

Template.goCheckoutReview.events({
  "click #termsOfService": function (event) {
    const customerAgreedToTermsOfService = event.target.checked;
    Meteor.call("cart/customerAgreedToTermsOfService", customerAgreedToTermsOfService);
    if (typeof analytics === "object") {
      analytics.track("Checkout Step Completed", {
        "step": 3,
        "Step Name": "Agree to Terms of Service"
      });
    }
  }
});

Template.checkoutPayment.helpers({
  customerHasAgreedToTermsOfService: function () {
    const cart = Cart.findOne({userId: Meteor.userId()});
    if (cart) {
      return cart.customerAgreedToTermsOfService;
    }
    return false;
  }
});
