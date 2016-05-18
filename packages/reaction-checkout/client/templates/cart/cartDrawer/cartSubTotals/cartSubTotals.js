/**
 * cartSubTotals helpers
 *
 * @returns cart
 */
Template.cartSubTotals.helpers({
  cart: function() {
    return ReactionCore.Collections.Cart.findOne();
  },
  isZero: function (price) {
    return price === 0 || price === "0.00";
  }
});
