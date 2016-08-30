Template.checkoutPayment.helpers({
  customerHasAgreedToTermsOfService: function () {
    return ReactionCore.Collections.Cart.findOne({userId: Meteor.userId()}).customerAgreedToTermsOfService;
  }
});
