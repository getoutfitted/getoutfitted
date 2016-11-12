import { Meteor } from "meteor/meteor";
import { Reaction } from "/client/api";
import { Cart } from "/lib/collections";
import { Template } from "meteor/templating";

/**
 * cartDrawer helpers
 *
 * @provides displayCartDrawer
 * @returns  open or closed cart drawer template
 */

Template.cart.onCreated(function () {
  Reaction.Subscriptions.Manager.subscribe("CartMedia", Meteor.userId());
});

Template.cart.helpers({
  cart() {
    return Cart.findOne();
  },
  cartHasItems() {
    return this.items && this.items.length > 0;
  },
  displayCartDrawer: function () {
    const storedCart = Cart.findOne();
    let count = 0;

    if (typeof storedCart === "object" && storedCart.items) {
      for (const items of storedCart.items) {
        count += items.quantity;
      }
    }

    if (count === 0) {
      return Template.emptyCartDrawer;
    }
    return Template.openCartDrawer;
  }
});
