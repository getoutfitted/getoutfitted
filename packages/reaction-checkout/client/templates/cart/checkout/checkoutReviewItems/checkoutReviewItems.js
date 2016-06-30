Template.checkoutReviewItems.onRendered(function () {
  ReactionAnalytics.trackEventWhenReady("Viewed Checkout Step", {
    "step": 1,
    "Step Name": "Review Cart"
  });
  ReactionAnalytics.trackEventWhenReady("Completed Checkout Step", {
    "step": 1,
    "Step Name": "Review Cart"
  });
});

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
  },
  productTitle: function () {
    if (this.variants.productTitle) {
      return this.variants.productTitle;
    } else if (this.variants.title) {
      return this.variants.title;
    }
    return "";
  }
});
