import { Template } from "meteor/templating";
//
// cartCheckout is a wrapper template
// controlling the load order of checkout step templates
//


Template.goCartCheckout.helpers({
  cart: function () {
    if (ReactionCore.Subscriptions.Cart.ready()) {
      return ReactionCore.Collections.Cart.findOne();
    }
  }
});


Template.cartCheckout.onCreated(function () {
  if (ReactionCore.Subscriptions.Cart.ready()) {
    const cart = ReactionCore.Collections.Cart.findOne();
    if (cart.workflow && cart.workflow.status === "new") {
        // if user logged in as normal user, we must pass it through the first stage
      Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "checkoutLogin", cart._id);
    }
  }
});

/**
 * checkoutSteps Helpers
 * helper isPending evaluates that this is
 * the current step, or has been processed already
 */
Template.goCheckoutSteps.helpers({
  isCompleted: function () {
    if (this.status === true) {
      return this.status;
    }
    return false;
  },

  isPending: function () {
    if (this.status === this.template) {
      return this.status;
    }
    return false;
  }
});

/**
 * checkoutStepBadge Helpers
 */
Template.goCheckoutStepBadge.helpers({
  checkoutStepBadgeClass: function () {
    const workflowStep = Template.instance().data;
    // let currentStatus = ReactionCore.Collections.Cart.findOne().workflow.status;
    if (workflowStep.status === true || workflowStep.status === this.template) {
      return "active";
    }
    return "";
  }
});
