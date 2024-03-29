import { Reaction } from "/client/api";
import { Cart, Media, Products } from "/lib/collections";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import _ from "lodash";

Template.checkoutReviewItems.onCreated(function () {
  // ReactionAnalytics.trackEventWhenReady("Completed Checkout Step", {
  //   "step": 1,
  //   "Step Name": "Review Cart"
  // });
});

Template.checkoutReviewItems.helpers({
  cart() {
    return Cart.findOne({userId: Meteor.userId()});
  },
  cartItems: function () {
    return Cart.findOne({userId: Meteor.userId()}).items;
  },

  media: function () {
    const product = Products.findOne(this.productId);
    let defaultImage = Media.findOne({
      "metadata.variantId": this.variants._id,
      "metadata.purpose": "cart"
    });

    if (defaultImage) {
      return defaultImage;
    } else if (product) {
      _.some(product.variants, function (variant) {
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
