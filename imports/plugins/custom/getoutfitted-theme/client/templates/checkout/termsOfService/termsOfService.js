import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Cart } from "/lib/collections";

Template.goCheckoutTermsOfService.events({
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
