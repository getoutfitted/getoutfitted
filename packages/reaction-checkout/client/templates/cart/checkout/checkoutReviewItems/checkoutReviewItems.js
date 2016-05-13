Template.checkoutReviewItems.helpers({
  cartItems: function () {
    return ReactionCore.Collections.Cart.findOne().items;
  },
  media: function () {
    let product = ReactionCore.Collections.Products.findOne(this.productId);
    let defaultImage = ReactionCore.Collections.Media.findOne({
      "metadata.variantId": this.variants._id,
      "metadata.purpose": "cart"
    });

    if (defaultImage) {
      return defaultImage;
    } else if (product) {
      _.any(product.variants, function (variant) {
        defaultImage = ReactionCore.Collections.Media.findOne({
          "metadata.variantId": variant._id
        });
        return !!defaultImage;
      });
    }
    return defaultImage;
  }
});
