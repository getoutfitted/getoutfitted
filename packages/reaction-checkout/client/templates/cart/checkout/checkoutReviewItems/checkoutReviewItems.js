Template.checkoutReviewItems.helpers({
  cartItems: function () {
    return ReactionCore.Collections.Cart.findOne().items;
  },
  test: function () {
    debugger;
  }
});
