import { Router } from "/client/api";
import { Cart } from "/lib/collections";
import { Template } from "meteor/templating";

/**
 * cartIcon helpers
 *
 */
Template.cartIcon.helpers({
  cart() {
    return Cart.findOne();
  }
});

Template.cartIcon.events({
  // XXX: GetOutfitted MOD - use cart page instead of drawer
  "click .cart-icon"() {
    return Router.go("cart");
  }
});
