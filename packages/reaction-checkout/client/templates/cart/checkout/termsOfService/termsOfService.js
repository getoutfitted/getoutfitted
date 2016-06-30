Template.termsOfService.onRendered(function () {
  ReactionAnalytics.trackEventWhenReady("Completed Checkout Step", {
    "step": 4,
    "Step Name": "Select Shipping Option"
  });

  ReactionAnalytics.trackEventWhenReady("Viewed Checkout Step", {
    "step": 5,
    "Step Name": "Review Terms of Service"
  });
});

Template.termsOfService.events({
  "click #termsOfService": function (event) {
    let customerAgreedToTermsOfService = event.target.checked;
    Meteor.call("cart/customerAgreedToTermsOfService", customerAgreedToTermsOfService);
    ReactionAnalytics.trackEventWhenReady("Agree to Terms Of Service");
  }
});
