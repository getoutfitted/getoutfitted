import { Media } from "/lib/collections";
import { Template } from "meteor/templating";
import _ from "lodash";
const sizeRegex = /(Extra Small|Small|Medium|Large|Extra Large|XXL|Standard|Premium|Over Glasses)/;

/**
 * cartLineItem helpers
 *
 */
Template.cartLineItemBundle.helpers({
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
  ifMoreThanOneOutfit() {
    return this.length > 1;
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
