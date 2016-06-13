Template.termsOfService.events({
  "click #termsOfService": function (event) {
    let customerAgreedToTermsOfService = event.target.checked;
    Meteor.call("cart/customerAgreedToTermsOfService", customerAgreedToTermsOfService);
  }
});

