import { Orders, Shops, Media } from "/lib/collections";
import { Template } from "meteor/templating";
import _ from "underscore"; // TODO: Migrate to lodash
import moment from "moment";
import "moment-timezone";

/**
 * cartLineItems helpers
 *
 */
Template.cartLineItems.helpers({
  cartHasItems() {
    return this.items && this.items.length > 0;
  },
  pluralize(items) {
    return items > 1 ? "s" : "";
  },
  nonComponentItemCount: function () {
    let items = _.filter(this.items, function (item) {
      return item.customerViewType !== "bundleComponent";
    });
    return items.length;
  },
  items: function () {
    let items = _.filter(this.items, function (item) {
      const notBundle = item.variants.functionalType !== "bundleVariant";
      const notComponent = item.customerViewType !== "bundleComponent";
      return notBundle && notComponent;
    });
    return items;
  },

  bundles: function () {
    let bundleIndexNumbers = {};
    let bundles = _.filter(this.items, function (item) {
      return item.variants.functionalType === "bundleVariant";
    });
    _.map(bundles, function (bundle) {
      if (bundleIndexNumbers[bundle.productId]) {
        bundleIndexNumbers[bundle.productId] += 1;
        bundle.bundleIndexNumber = bundleIndexNumbers[bundle.productId];
      } else {
        bundleIndexNumbers[bundle.productId] = 1;
        bundle.bundleIndexNumber = 1;
      }
      return bundle;
    });

    return bundles;
  },

  bundleComponents: function () {
    const currentBundle = this;
    const orderItems = Template.parentData().items;
    let components = _.filter(orderItems, function (item) {
      const isComponent = item.customerViewType === "bundleComponent";
      const isCurrentBundleId = currentBundle.productId === item.bundleProductId;
      const isCurrentBundleIndex = currentBundle.bundleIndexNumber === item.bundleIndex;
      return isComponent && isCurrentBundleId && isCurrentBundleIndex;
    });

    let count = {};
    uniqueComponents = _.reduce(components, function(components, component) {
      let id = component.variants._id;

      if (count[id]) {
        count[id] += 1;
      } else {
        count[id] = 1;
        components.push(component);
      }

      return components;
    }, []);

    _.map(uniqueComponents, function(component) {
      let id = component.variants._id;
      if (count[id]) {
        component.quantity = count[id];
      }
      return component;
    });

    return uniqueComponents;
  },

  media: function () {
    // XXX: GETOUTFITTED MOD - use variant's cart image
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
  }
});
