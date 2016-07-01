/**
 * checkoutLoginCompleted
 * returns true if we've already past this stage,
 * or if the user is a guest but not anonymous
 */

Template.checkoutLogin.onRendered(function () {
  ReactionAnalytics.trackEventWhenReady("Viewed Checkout Step", {
    "step": 2,
    "Step Name": "Sign In or Checkout As Guest"
  });
});

Template.checkoutLogin.helpers({
  checkoutLoginCompleted: function () {
    const self = this;
    const cart = ReactionCore.Collections.Cart.findOne();
    if (cart && cart.workflow) {
      const currentStatus = cart.workflow.status;
      const guestUser = ReactionCore.hasPermission("guest", Meteor.user());
      const anonUser = Roles.userIsInRole("anonymous", Meteor.user(), ReactionCore.getShopId());

      if (currentStatus !== self.template && guestUser === true && anonUser === false) {
        return true;
      }
    }
    return false;
  }
});
