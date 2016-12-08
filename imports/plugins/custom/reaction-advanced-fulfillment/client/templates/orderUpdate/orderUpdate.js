import $ from "jquery";
import "bootstrap-datepicker";

import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { ReactiveDict } from "meteor/reactive-dict";

import { Reaction } from "/client/api";
import { Orders } from "/lib/collections";

export const Backpack = {};

Template.updateOrder.onCreated(function () {
  const orderId = () => Reaction.Router.getParam("_id");
  Backpack.addingItems = new ReactiveDict();
  Backpack.exchangingItem = new ReactiveDict();
  this.autorun(() => {
    this.subscribe("afProducts");
    this.subscribe("advancedFulfillmentOrder", orderId());
  });
});

Template.updateOrder.helpers({
  order: function () {
    const orderId = () => Reaction.Router.getParam("_id");
    return Orders.findOne({_id: orderId()});
  },
  bundles: function () {
    const orderId = () => Reaction.Router.getParam("_id");
    const order = Orders.findOne({_id: orderId()});
    const index = {};
    const bundles = order.items.reduce(function (acc, item) {
      if (item.variants.functionalType === "bundleVariant") {
        if (index[item.productId]) {
          index[item.productId] += 1;
        } else {
          index[item.productId] = 1;
        }
        acc.push(Object.assign({index: index[item.productId]}, item));
      }
      return acc;
    }, []);
    return bundles;
  },
  itemsByBundle: function (bundle) {
    const orderId = Reaction.Router.getParam("_id");
    const order = Orders.findOne({ _id: orderId});
    itemsByBundle = order.items.filter(function (item) {
      itemMatches = item.bundleProductId === bundle.productId;
      indexMatches = item.bundleIndex === bundle.index;
      return itemMatches && indexMatches;
    });
    return itemsByBundle;
  },
  nonBundleItems() {
    const order = this;
    return order.items.filter(function (item) {
      const notBundleVariant = item.variants.functionalType !== "bundleVariant";
      const notBundleComponent = item.customerViewType !== "bundleComponent";
      return notBundleVariant && notBundleComponent;
    });
  },
  addingItems: function (bundleId) {
    const addingItems = Backpack.addingItems.get(bundleId);
    return addingItems || false;
  },
  exchangingItem(itemId) {
    const exchangingItem = Backpack.exchangingItem.get(itemId);
    return exchangingItem || false;
  }
});

Template.updateCustomerDetails.onCreated(function () {
  this.autorun(() => {
    let orderId = Reaction.Router.getParam('_id');
    this.subscribe('advancedFulfillmentOrder', orderId);
  });
});

Template.updateCustomerDetails.helpers({
  address: function (param) {
    return this.shipping[0].address[param];
  },
  cancelOrder: function () {
    const orderId = this._id;
    return Session.get('cancel-order-' + orderId);
  },
  userName: function () {
    let userName = Meteor.user().username || Meteor.user().emails[0].address || 'Guest';
    return userName;
  }
});

Template.updateOrder.events({
  "click .add-item-start": function (event) {
    const bundleId = event.currentTarget.dataset.bundleId;
    const orderId = event.currentTarget.dataset.orderId;
    if (bundleId) {
      return Backpack.addingItems.set(bundleId, true);
    }
    return Backpack.addingItems.set(orderId, true);
  },
  "click .add-item-cancel": function (event) {
    const bundleId = event.currentTarget.dataset.bundleId;
    const orderId = event.currentTarget.dataset.orderId;
    if (bundleId) {
      return Backpack.addingItems.set(bundleId, false);
    }
    return Backpack.addingItems.set(orderId, false);
  },
  "click .exchange-item-start": function (event) {
    const itemId = event.currentTarget.dataset.itemId;
    return Backpack.exchangingItem.set(itemId, true);
  },
  "click .exchange-item-cancel": function (event) {
    const itemId = event.currentTarget.dataset.itemId;
    return Backpack.exchangingItem.set(itemId, false);
  },
  "click .remove-item": function (event) {
    const orderId = Reaction.Router.getParam("_id");
    const cartItemId = event.currentTarget.dataset.itemId;
    const variantId = event.currentTarget.dataset.itemProductId;
    Meteor.call("advancedFulfillment/removeItem", {orderId, cartItemId, variantId});
  }
});

Template.updateCustomerDates.onRendered(function () {
  $('.picker .input-daterange').datepicker({
    startDate: 'today',
    todayBtn: 'linked',
    clearBtn: true,
    calendarWeeks: true,
    autoclose: true,
    todayHighlight: true
  });
});

Template.updateCustomerDates.events({
  'click .update-rental-dates': function (event) {
    event.preventDefault();
    let orderId = this._id;
    let startDate = new Date($('#' + orderId + ' [name="start"]').val());
    let endDate = new Date($('#' + orderId + ' [name="end"]').val());
    let user = Meteor.user();
    Meteor.call('advancedFulfillment/updateRentalDates', orderId, startDate, endDate, user);
    Alerts.removeSeen();
    Alerts.add('Rental Dates updated', 'success', {
      autoHide: true
    });
  }
});

Template.updateCustomerDetails.events({
  'submit #updateShippingAddressForm': function (event) {
    event.preventDefault();
    const form = event.currentTarget;
    let address = this.shipping[0].address;
    address.fullName = form.shippingName.value;
    address.address1 = form.shippingAddress1.value;
    address.address2 = form.shippingAddress2.value;
    address.city = form.shippingCity.value;
    address.postal = form.shippingPostal.value;
    address.region = form.shippingRegion.value;
    if (address.fullName && address.address1 && address.city && address.postal && address.region) {
      Meteor.call('advancedFulfillment/updateShippingAddress', this._id, address);
      Alerts.removeSeen();
      Alerts.add('Shipping Address Updated', 'success', {autoHide: true});
    } else {
      Alerts.removeSeen();
      Alerts.add('All fields required except Address 2', 'danger');
    }
  },
  'submit #updateContactInformationForm': function (event) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = form.contactEmail.value;
    const phone = form.contactPhone.value;
    if (email && phone) {
      Meteor.call('advancedFulfillment/updateContactInformation', this._id, phone, email);
      Alerts.removeSeen();
      Alerts.add('Contact Information Updated', 'success', {autoHide: true});
    } else {
      Alerts.removeSeen();
      Alerts.add('Phone and Email are both required', 'danger');
    }
  },
  'click .confirm-to-cancel': function (event) {
    event.preventDefault();
    const orderId = this._id;
    Session.set('cancel-order-' + orderId, !Session.get('cancel-order-' + orderId));
  },
  'click .cancel-order': function (event) {
    event.preventDefault();
    const orderId = this._id;
    Meteor.call('advancedFulfillment/cancelOrder', orderId, Meteor.userId());
    Alerts.removeSeen();
    Alerts.add('Order #' + this.shopifyOrderNumber + ' has been cancelled', 'info', {
      autoHide: true
    });
    Session.set('cancel-order-' + orderId, !Session.get('cancel-order-' + orderId));
  }
});
