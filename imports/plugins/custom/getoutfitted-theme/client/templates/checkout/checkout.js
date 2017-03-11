import { Reaction } from "/client/api";
import { Cart } from "/lib/collections";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import "./checkout.html";

//
// cartCheckout is a wrapper template
// controlling the load order of checkout step templates
//

const freeShippingMethod = {
  name: "Free",
  label: "Free Shipping",
  group: "Ground",
  enabled: true,
  rate: 0,
  validLocales: [ { deliveryBegin: 2, deliveryEnd: 7 } ],
  validRanges: [ { begin: 50 } ],
  _id: "GoFreeShippingMethod",
  handling: 0
};

const rushShippingMethod = {
  name: "Rush",
  label: "Rush Handling and Delivery",
  group: "Express",
  enabled: true,
  rate: 39,
  validLocales: [ { deliveryBegin: 2, deliveryEnd: 7 } ],
  validRanges: [ { begin: 50 } ],
  _id: "GoRushShippingMethod",
  handling: 0
};

Template.cartCheckout.onCreated(function () {
  Reaction.Subscriptions.Manager.subscribe("CartMedia", Meteor.userId());
});


Template.cartCheckout.helpers({
  cart() {
    if (Reaction.Subscriptions.Cart.ready()) {
      return Cart.findOne();
    }
    return {};
  }
});


Template.cartCheckout.onCreated(function () {
  if (Reaction.Subscriptions.Cart.ready()) {
    const cart = Cart.findOne();
    if (cart.workflow && (
      // catch any new workflow, or legacy workflow and migrate to new cart workflow
      cart.workflow.status === "new" ||
      cart.workflow.status === "checkoutLogin" ||
      cart.workflow.status === "checkoutAddressBook" ||
      cart.workflow.status === "coreCheckoutShipping" ||
      cart.workflow.status === "checkoutReview" ||
      cart.workflow.status === "checkoutPayment")
    ) {
      // if user logged in as normal user, we must pass it through the first stage
      // Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "checkoutLogin", cart._id);
      // XXX: GetOutfitted MOD: use custom cart workflow
      if (cart.rushShipping) {
        Meteor.call("cart/setShipmentMethod", cart._id, rushShippingMethod);
      } else {
        Meteor.call("cart/setShipmentMethod", cart._id, freeShippingMethod);
      }
      // Meteor.call("workflow/pushCartWorkflow", "goCartWorkflow", "goCheckoutShippingAddress");
      // Meteor.call("workflow/pushCartWorkflow", "goCartWorkflow", "goCheckoutBillingAddress");
      // Meteor.call("workflow/pushCartWorkflow", "goCartWorkflow", "goCheckoutTermsOfService");
    }
  }
});

/**
 * checkoutSteps Helpers
 * helper isPending evaluates that this is
 * the current step, or has been processed already
 */
Template.checkoutSteps.helpers({
  isCompleted() {
    if (this.status === true) {
      return this.status;
    }
    return false;
  },

  isPending() {
    if (this.status === this.template) {
      return this.status;
    }
    return false;
  }
});

/**
 * checkoutStepBadge Helpers
 */
Template.checkoutStepBadge.helpers({
  checkoutStepBadgeClass: function () {
    const workflowStep = Template.instance().data;
    // let currentStatus = Cart.findOne().workflow.status;
    if (workflowStep.status === true || workflowStep.status === this.template) {
      return "active";
    }
    return "";
  }
});
