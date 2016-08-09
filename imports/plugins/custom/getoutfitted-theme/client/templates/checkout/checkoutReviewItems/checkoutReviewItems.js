import _ from "lodash";
import { Cart, Media, Products } from "/lib/collections";
import { Template } from "meteor/templating";

Template.checkoutReviewItems.onRendered(function () {
  // ReactionAnalytics.trackEventWhenReady("Viewed Checkout Step", {
  //   "step": 1,
  //   "Step Name": "Review Cart"
  // });
  // ReactionAnalytics.trackEventWhenReady("Completed Checkout Step", {
  //   "step": 1,
  //   "Step Name": "Review Cart"
  // });
});

Template.checkoutReviewItems.helpers({
  cartItems: function () {
    return Cart.findOne().items;
  },
  media: function () {
    let product = Products.findOne(this.productId);
    let defaultImage = Media.findOne({
      "metadata.variantId": this.variants._id,
      "metadata.purpose": "cart"
    });

    if (defaultImage) {
      return defaultImage;
    } else if (product) {
      _.any(product.variants, function (variant) {
        defaultImage = Media.findOne({
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
