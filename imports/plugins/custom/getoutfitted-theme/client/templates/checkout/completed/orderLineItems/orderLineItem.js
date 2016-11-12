import { Media } from "/lib/collections";
import { Template } from "meteor/templating";
import { Router } from "/client/api";
import _ from "lodash";
const sizeRegex = /(Extra Small|Small|Medium|Large|Extra Large|XXL|Standard|Premium|Over Glasses)/;

/**
 * cartLineItem helpers
 *
 */
Template.orderLineItemBundle.helpers({
  cartProductTitle() {
    return this.title;
  },
  media: function () {
    const variantImage = Media.findOne({
      "metadata.productId": this.productId,
      "metadata.variantId": this.variants._id,
      "metadata.purpose": "cart"
    });
    // variant image
    if (variantImage) {
      return variantImage;
    }
    // find a default image
    const productImage = Media.findOne({
      "metadata.productId": this.productId
    });
    if (productImage) {
      return productImage;
    }
    return false;
  },
  moreThanOneOutfit(context) {
    return context.quantity > 1;
  },
  groupedOutfitComponentSelections() {
    return _.toPairs(
      _.groupBy(this.variants.selectedBundleOptions, function (opt) {
        return opt.selectionForQtyNumber;
      }));
  },
  outfitNumber() {
    return this[0];
  },
  perOutfitComponentSelections() {
    return this[1];
  },
  componentLabel() {
    const splitLabel = this.cartLabel.split(sizeRegex);
    return splitLabel[0].trim();
  },
  componentSelection() {
    const splitLabel = this.cartLabel.split(sizeRegex);
    return splitLabel[1];
  }
});

Template.orderLineItemBundle.events({
  "click .remove-cart-item": function (event) {
    event.stopPropagation();
    event.preventDefault();
    const currentCartItemId = this._id;
    const removedCartItem = this;
    return $(event.currentTarget).fadeOut(300, function () {
      Meteor.call("cart/removeFromCart", currentCartItemId);
      if (typeof analytics === "object") {
        analytics.track("Product Removed", {
          "product_id": removedCartItem.variants._id,
          "name": removedCartItem.title,
          "price": removedCartItem.variants.price,
          "quantity": removedCartItem.quantity
        });
      }
    });
  }
});
