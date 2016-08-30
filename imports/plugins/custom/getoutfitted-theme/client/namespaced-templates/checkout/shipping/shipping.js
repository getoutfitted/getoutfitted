import _ from "lodash";
import { Cart, Shipping } from "/lib/collections";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";

//
// These helpers can be used in general shipping packages
// cartShippingMethods to get current shipment methods
// until we handle multiple methods, we just use the first
function cartShippingMethods(currentCart) {
  let cart = currentCart || Cart.findOne();
  if (cart) {
    if (cart.shipping) {
      if (cart.shipping[0].shipmentQuotes) {
        return cart.shipping[0].shipmentQuotes;
      }
    }
  }
  return undefined;
}
// getShipmentMethod to get current shipment method
// until we handle multiple methods, we just use the first
function getShipmentMethod(currentCart) {
  let cart = currentCart || Cart.findOne();
  if (cart) {
    if (cart.shipping) {
      if (cart.shipping[0].shipmentMethod) {
        return cart.shipping[0].shipmentMethod;
      }
    }
  }
  return undefined;
}

Template.goCheckoutShipping.onCreated(function () {
  this.autorun(() => {
    this.subscribe("Shipping");
  });
});

Template.goCheckoutShipping.onRendered(function () {
  // ReactionAnalytics.trackEventWhenReady("Completed Checkout Step", {
  //   "step": 3,
  //   "Step Name": "Choose Shipping and Billing Address"
  // });
  //
  // ReactionAnalytics.trackEventWhenReady("Viewed Checkout Step", {
  //   "step": 4,
  //   "Step Name": "Select Shipping Option"
  // });
});

Template.goCheckoutShipping.helpers({
  // retrieves current rates and updates shipping rates
  // in the users cart collection (historical, and prevents repeated rate lookup)
  shipmentQuotes: function () {
    const cart = Cart.findOne();
    return cartShippingMethods(cart);
  },

  // helper to make sure there are some shipping providers
  shippingConfigured: function () {
    const instance = Template.instance();
    if (instance.subscriptionsReady()) {
      return Shipping.find({
        "methods.enabled": true
      }).count();
    }
  },

  // helper to display currently selected shipmentMethod
  isSelected: function () {
    let self = this;
    let shipmentMethod = getShipmentMethod();
    // if there is already a selected method, set active
    if (_.isEqual(self.method, shipmentMethod)) {
      return "active";
    }
    return null;
  }
});

//
// Set and store cart shipmentMethod
// this copies from shipmentMethods (retrieved rates)
// to shipmentMethod (selected rate)
//
Template.goCheckoutShipping.events({
  "click .list-group-item": function (event) {
    event.preventDefault();
    event.stopPropagation();
    let self = this;
    let cart = Cart.findOne();

    try {
      Meteor.call("cart/setShipmentMethod", cart._id, self.method);
    } catch (error) {
      throw new Meteor.Error(error,
        "Cannot change methods while processing.");
    }
    // ReactionAnalytics.trackEventWhenReady("Selected Shipping Option",
    //   Object.assign({}, self.method, {carrier: self.carrier})
    // );
  }
});
