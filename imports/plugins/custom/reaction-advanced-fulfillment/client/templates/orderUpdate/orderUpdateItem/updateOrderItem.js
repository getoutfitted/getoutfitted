import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { ReactiveVar } from "meteor/reactive-var";
import { Logger, Reaction } from "/client/api";
import { _ } from "meteor/underscore";
import { Session } from "meteor/session";
import { Products, Orders } from "/lib/collections";
import { Backpack } from "../orderUpdate";
import RentalProducts  from "/imports/plugins/custom/reaction-rental-products/lib/api";

function uniqueFieldValues(products, field) {
  const fieldValues = {};
  const uniqueProducts = products.reduce(function (acc, product) {
    if (product[field]) {
      const val = product[field]
      if (!fieldValues[val]) {
        acc.push(product);
        fieldValues[val] = true;
      }
    }
    return acc;
  }, []);
  return uniqueProducts;
}

Template.updateOrderItem.onCreated(function () {
  this.subscribe("advancedFulfillmentOrder", Reaction.Router.getParam("orderId"));
});

Template.updateOrderItem.helpers({
  order: function () {
    let orderId = Reaction.Router.getParam('orderId');
    return Orders.findOne({ _id: orderId});
  },
  item: function () {
    let itemId = Reaction.Router.getParam('itemId');
    let order = this;
    let regItem = _.findWhere(order.items, {_id: itemId});
    let afItem = _.findWhere(order.advancedFulfillment.items, {_id: itemId});
    return {
      regItem: regItem,
      afItem: afItem
    };
  }
});

Template.productSelector.onCreated(function () {
  // TODO: Optimize this publication
  this.subscribe("afProducts");
  const instance = this;
  instance.productType = new ReactiveVar();
  instance.productColor = new ReactiveVar();
  instance.productGender = new ReactiveVar();
  instance.productTitle = new ReactiveVar();
  instance.productVariant = new ReactiveVar();
  instance.productAvailability = new ReactiveVar();
  instance.productId = new ReactiveVar();
});

Template.productSelector.onRendered(function () {
  const instance = this;
  instance.productType.set(undefined);
  instance.productColor.set(undefined);
  instance.productGender.set(undefined);
  instance.productTitle.set(undefined);
  instance.productId.set(undefined);
  instance.productAvailability.set(undefined);
  instance.productVariant.set(undefined);
});

Template.productSelector.helpers({
  order() {
    const orderId = Reaction.Router.getParam("_id");
    return Orders.findOne({_id: orderId});
  },
  addItem: function () {
    // If we passed an item into this template then we're exchanging that item.
    return !this.item;
  },
  productTypes: function () {
    const productTypes = Products.find({}, {field: {productType: 1}}).fetch();
    return uniqueFieldValues(productTypes, "productType");
  },
  productTypeSelected: function () {
    const instance = Template.instance();
    return !!instance.productType.get();
  },
  productGenders: function () {
    const instance = Template.instance();
    const productType = instance.productType.get();
    const products = Products.find({productType: productType}, {field: {gender: 1}}).fetch();
    return uniqueFieldValues(products, "gender");
  },
  productGenderSelected: function () {
    const instance = Template.instance();
    return !!instance.productGender.get();
  },
  productTitles: function () {
    const instance = Template.instance();
    const productType = instance.productType.get();
    const gender = instance.productGender.get();

    const products = Products.find({
      productType: productType,
      gender: gender
    }, {
      field: {
        title: 1,
        vendor: 1
      },
      sort: {
        vendor: 1
      }
    }).fetch();
    return uniqueFieldValues(products, "title");
  },
  productSelected: function () {
    const instance = Template.instance();
    return !!instance.productId.get();
  },
  productColorWays: function () {
    const instance = Template.instance();
    const productId = instance.productId.get();
    const products = Products.find({ancestors: productId}).fetch();
    return uniqueFieldValues(products, "color");
  },
  productColorSelected: function () {
    const instance = Template.instance();
    return !!instance.productColor.get();
  },
  productSizes: function () {
    const instance = Template.instance();
    const productId = instance.productId.get();
    const color = instance.productColor.get();
    const products = Products.find({
      ancestors: productId,
      color: color
    }, {sort: {numberSize: 1}}).fetch();

    return products;
  },
  productVariantSelected: function () {
    const instance = Template.instance();
    return !!instance.productVariant.get();
  },
  availabilityReady: function () {
    const instance = Template.instance();
    const availability = instance.productAvailability.get();
    return !!availability;
  },
  quantityAvailable(variantId) {
    const instance = Template.instance();
    const availability = instance.productAvailability.get();
    if (availability) {
      return availability[variantId];
    }
    return false;
  },
  isAvailable(variantId) {
    const instance = Template.instance();
    const availability = instance.productAvailability.get();
    if (availability && availability[variantId] > 0) {
      return "";
    }
    return "disabled";
  }
});

Template.productSelector.events({
  "change .productType-selector": function (event) {
    const instance = Template.instance();
    const type = event.target.value;

    instance.productType.set(type);
    instance.productGender.set(undefined);
    instance.productTitle.set(undefined);
    instance.productId.set(undefined);
    instance.productColor.set(undefined);
    instance.productVariant.set(undefined);
    instance.productAvailability.set(undefined);
  },
  "change .gender-selector": function (event) {
    const instance = Template.instance();
    const gender = event.target.value;

    instance.productGender.set(gender);
    instance.productTitle.set(undefined);
    instance.productColor.set(undefined);
    instance.productId.set(undefined);
    instance.productVariant.set(undefined);
    instance.productAvailability.set(undefined);
  },
  "change .product-selector": function (event) {
    const instance = Template.instance();
    const productId = event.target.value;

    instance.productId.set(productId);
    instance.productColor.set(undefined);
    instance.productVariant.set(undefined);
    instance.productAvailability.set(undefined);
  },
  "change .color-selector": function (event) {
    const instance = Template.instance();
    const color = event.target.value;
    const orderId = Reaction.Router.getParam("_id");
    const order = Orders.findOne({_id: orderId});
    const reservationRequest = {
      startTime: order.advancedFulfillment.shipmentDate,
      endTime: order.advancedFulfillment.returnDate
    };

    const variants = Products.find({
      ancestors: instance.productId.get(),
      color: color
    }, {sort: {numberSize: 1}}).fetch();

    const variantIds = variants.map(v => v._id);

    Meteor.call("rentalProducts/bulkCheckInventoryAvailability", variantIds, reservationRequest, function (error, result) {
      if (error) {
        Logger.warn("Error during rentalProducts/bulkCheckInventoryAvailability", error);
      } else {
        instance.productAvailability.set(result);
      }
    });

    instance.productColor.set(color);
    instance.productVariant.set(undefined);
  },
  "change .size-selector": function (event) {
    const instance = Template.instance();
    const productId = event.target.value;

    instance.productVariant.set(productId);
  },
  "click .exchange-item": function (event) {
    const instance = Template.instance();
    const orderId = Reaction.Router.getParam("_id");
    const existingItemCartId = this.item._id;
    const existingItemVariantId = this.item.variants._id;
    const variantId = instance.productVariant.get();
    const productId = instance.productId.get();

    const bundle = this.bundle || {};
    const bundleId = bundle.productId;
    const bundleIndex = bundle.index;

    Meteor.call("advancedFulfillment/itemExchange", {orderId, existingItemCartId, existingItemVariantId, productId, variantId, bundleId, bundleIndex});

    instance.productType.set(undefined);
    instance.productGender.set(undefined);
    instance.productTitle.set(undefined);
    instance.productId.set(undefined);
    instance.productColor.set(undefined);
    instance.productVariant.set(undefined);
    instance.productAvailability.set(undefined);

    Backpack.exchangingItem.set(existingItemCartId, false);
  },

  "click .add-item": function (event) {
    const instance = Template.instance();
    const orderId = Reaction.Router.getParam("_id");
    const bundleId = event.currentTarget.dataset.bundleId;
    const bundleCartItemId = event.currentTarget.dataset.bundleCartItemId;
    const bundleIndex = event.currentTarget.dataset.bundleIndex;
    const variantId = instance.productVariant.get();
    const productId = instance.productId.get();

    Meteor.call("advancedFulfillment/addItem", {orderId, productId, variantId, bundleId, bundleIndex});

    instance.productType.set(undefined);
    instance.productGender.set(undefined);
    instance.productTitle.set(undefined);
    instance.productId.set(undefined);
    instance.productColor.set(undefined);
    instance.productVariant.set(undefined);
    instance.productAvailability.set(undefined);

    if (bundleId) {
      Backpack.addingItems.set(bundleCartItemId, false);
    } else {
      Backpack.addingItems.set(orderId, false);
    }
  }
});
