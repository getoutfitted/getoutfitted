/**
 * ordersListItems helpers
 *
 */
Template.ordersListItems.helpers({
  media: function () {
    // XXX: GETOUTFITTED MOD - use variant's cart image
    const variantImage = ReactionCore.Collections.Media.findOne({
      "metadata.productId": this.productId,
      "metadata.variantId": this.variants._id,
      "metadata.purpose": "cart"
    });
    // variant image
    if (variantImage) {
      return variantImage;
    }
    // find a default image
    const productImage = ReactionCore.Collections.Media.findOne({
      "metadata.productId": this.productId
    });
    if (productImage) {
      return productImage;
    }
    return false;
  }
});
