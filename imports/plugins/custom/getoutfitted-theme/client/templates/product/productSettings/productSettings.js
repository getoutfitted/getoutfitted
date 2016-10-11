import { ReactionProduct } from "/lib/api";
import { Media } from "/lib/collections";

const weightDependency = new Tracker.Dependency;

Template.productSettings.helpers({
  hasSelectedProducts() {
    return this.products.length > 0;
  },
  itemWeightActive: function (weight) {
    weightDependency.depend();
    const tag = ReactionProduct.getTag();
    for (const product of this.products) {
      const positions = product.positions && product.positions[tag] || {};
      const currentWeight = positions.weight || 0;
      if (currentWeight === weight) {
        return "active";
      }
    }
    return "";
  }
});

Template.productSettingsGridItem.helpers({
  displayPrice: function () {
    if (this._id) {
      return ReactionProduct.getProductPriceRange(this._id).range;
    }
    return "";
  },

  media: function () {
    const media = Media.findOne({
      "metadata.productId": this._id,
      "metadata.priority": 0,
      "metadata.toGrid": 1
    }, { sort: { uploadedAt: 1 } });

    return media instanceof FS.File ? media : false;
  },
  additionalMedia: function () {
    const mediaArray = Media.find({
      "metadata.productId": this._id,
      "metadata.priority": {
        $gt: 0
      },
      "metadata.toGrid": 1
    }, { limit: 3 });

    if (mediaArray.count() > 1) {
      return mediaArray;
    }
    return false;
  },
  weightClass: function () {
    weightDependency.depend();
    const tag = ReactionProduct.getTag();
    const positions = this.positions && this.positions[tag] || {};
    const weight = positions.weight || 0;
    switch (weight) {
      case 1:
        return "product-medium";
      case 2:
        return "product-large";
      default:
        return "product-small";
    }
  },

  isMediumWeight: function () {
    weightDependency.depend();
    const tag = ReactionProduct.getTag();
    const positions = this.positions && this.positions[tag] || {};
    const weight = positions.weight || 0;
    return weight === 1;
  },
  isLargeWeight: function () {
    weightDependency.depend();
    const tag = ReactionProduct.getTag();
    const positions = this.positions && this.positions[tag] || {};
    const weight = positions.weight || 0;
    return weight === 3;
  },
  shouldShowAdditionalImages: function () {
    weightDependency.depend();

    if (this.isMediumWeight && this.mediaArray) {
      return true;
    }
    return false;
  }
});

Template.productSettingsListItem.inheritsHelpersFrom("productSettingsGridItem");

/**
 * productExtendedControls events
 */

Template.productSettings.events({
  "click [data-event-action=publishProduct]": function () {
    ReactionProduct.publishProduct(this.products);
  },
  "click [data-event-action=cloneProduct]": function () {
    ReactionProduct.cloneProduct(this.products);
  },
  "click [data-event-action=deleteProduct]": function () {
    ReactionProduct.maybeDeleteProduct(this.products);
  },
  "click [data-event-action=changeProductWeight]": function (event) {
    event.preventDefault();
    const tag = ReactionProduct.getTag();
    for (const product of this.products) {
      const weight = $(event.currentTarget).data("event-data") || 0;
      const positions = {
        weight: weight,
        updatedAt: new Date()
      };
      Meteor.call("products/updateProductPosition", product._id, positions, tag,
        (error, result) => {
          if (error) {
            Loggger.warn(error);
            throw new Meteor.Error(403, error);
          }
          if (result) {
            weightDependency.changed();
          }
        }
      );
    }
  }
});
