import $ from "jquery";
import "bootstrap-datepicker";

import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { ReactiveDict } from "meteor/reactive-dict";

import { Reaction } from "/client/api";
import { Orders, Products } from "/lib/collections";

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

Template.updateReservationDates.onRendered(function () {
  $(".picker .input-daterange").datepicker({
    startDate: "today",
    todayBtn: "linked",
    clearBtn: true,
    calendarWeeks: false,
    autoclose: true,
    todayHighlight: true
  });
});

Template.updateReservationDates.events({
  "submit #updateReservationDates": function (event) {
    event.preventDefault();
    const orderId = this._id;
    const form = event.currentTarget;
    const startReservation = new Date(form.start.value);
    const endReservation = new Date(form.end.value);
    Alerts.alert({
      title: "Change Reservation Dates",
      text: "If the all items in the order are available to be shipped for the new reservation, the reservation will be changed.",
      type: "warning",
      reverseButtons: true,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Change Reservation",
      confirmButtonColor: "#AACBC9",
      showLoaderOnConfirm: true,
      preConfirm: function () {
        return new Promise(function (resolve, reject) {
          Meteor.call("advancedFulfillment/updateRentalDates", orderId, startReservation, endReservation, function (error, result) {
            if (error) {
              reject("Error checking availability of new rental dates");
            }
            if (result.successful) {
              resolve();
            } else {
              if (result.inventoryNotAvailable) {
                const products = result.inventoryNotAvailable.map(function (variantId) {
                  return Products.findOne({_id: variantId}).sku;
                });
                reject("The following items were not available with a reservation change: " + products.join(", "));
              }
              reject("Some items were not available, but there was an error determining which ones.");
            }
          });
        });
      },
      allowOutsideClick: false
    }, (isConfirm) => {
      if (isConfirm) {
        Alerts.alert({
          type: "success",
          title: "Reservation Date Change Successful"
        });
      }
    });
  }
});

Template.updateCustomerDetails.events({
  "submit #updateShippingAddressForm": function (event) {
    event.preventDefault();
    const form = event.currentTarget;
    const order = this;
    const orderId = this._id;
    const address = order.shipping[0].address;
    address.fullName = form.shippingName.value;
    address.company = form.company.value;
    address.address1 = form.shippingAddress1.value;
    address.address2 = form.shippingAddress2.value;
    address.city = form.shippingCity.value;
    address.postal = form.shippingPostal.value;
    address.region = form.shippingRegion.value;
    if (address.fullName && address.address1 && address.city && address.postal && address.region) {
      Alerts.alert({
        title: "Change Destination Address",
        text: "If the all items in the order are available to be shipped for the new address, the address will be changed.",
        type: "warning",
        reverseButtons: true,
        showCancelButton: true,
        cancelButtonText: "Cancel",
        confirmButtonText: "Change Destination",
        confirmButtonColor: "#AACBC9",
        showLoaderOnConfirm: true,
        preConfirm: function () {
          return new Promise(function (resolve, reject) {
            Meteor.call("advancedFulfillment/updateShippingAddress", orderId, address, function (error, result) {
              if (error) {
                reject("Error checking destination availability");
              }
              if (result.successful) {
                resolve();
              } else {
                if (result.inventoryNotAvailable) {
                  const products = result.inventoryNotAvailable.map(function (variantId) {
                    return Products.findOne({_id: variantId}).sku;
                  });
                  reject("The following items were not available with an address change: " + products.join(", "));
                }
                reject("Some items were not available, but there was an error determining which ones.");
              }
            });
          });
        },
        allowOutsideClick: false
      }, (isConfirm) => {
        if (isConfirm) {
          Alerts.alert({
            type: "success",
            title: "Destination Address Change Successful"
          });
        }
      });
    } else {
      Alerts.removeSeen();
      Alerts.add("All fields required except Address 2 and Company", "danger");
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
  }
});

Template.backpackCancelOrder.events({
  "click .cancel-order": function () {
    const orderId = Reaction.Router.getParam("_id");
    const order = Orders.findOne({_id: orderId});
    const orderNumber = order.orderNumber;
    Alerts.alert({
      title: "Are You Sure?",
      text: `You are about to cancel order #${orderNumber}. This is an irreversible decision.`,
      type: "warning",
      reverseButtons: true,
      showCancelButton: true,
      cancelButtonText: "No",
      confirmButtonText: "Yes, Cancel Order",
      confirmButtonColor: "#BB3526"
    }, (isConfirm) => {
      if (isConfirm) {
        Meteor.call("advancedFulfillment/cancelOrder", orderId);
        Reaction.Router.go("orderDetails", {_id: orderId});
      }
    });
  }
});
