import { Reaction } from "/client/api";
import { Cart, Media, Products } from "/lib/collections";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import _ from "lodash";

Template.checkoutReviewItems.onCreated(function () {
  if (Reaction.Subscriptions.Cart.ready()) {
    const cart = Cart.findOne();
    if (cart.workflow && cart.workflow.status === "new") {
      // console.log("cartworkflow");
        // if user logged in as normal user, we must pass it through the first stage
      // Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "checkoutItemReview", cart._id, "getoutfitted");
    }
  }
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
