import { Template } from "meteor/templating";
import { Reaction } from "/client/api";
import { Orders } from "/lib/collections";
import { Blaze } from "meteor/blaze";
import { BlazeLayout } from "meteor/kadira:blaze-layout";
import moment from "moment";
import "./advancedFulfillment.html";

Template.advancedFulfillmentPDF.onCreated(function () {
  Blaze._allowJavascriptUrls();
  const instance = this;
  const orderId = () => Reaction.Router.getParam("_id");
  const date = () => Reaction.Router.getParam("date");
  const selectedOrders = () => JSON.parse(localStorage.getItem("selectedOrdersToPrint"));

  instance.autorun(() => {
    if (orderId()) {
      instance.subscribe("advancedFulfillmentOrder", orderId());
    } else if (selectedOrders()) {
      instance.subscribe("selectedOrders", selectedOrders());
    } else if (date()) {
      instance.subscribe("ordersShippingOnDate", date);
    }
  });
});

Template.advancedFulfillmentPDF.onRendered(function () {
  BlazeLayout.render("advancedFulfillmentPDF");
});

Template.advancedFulfillmentPDF.helpers({
  orders: function () {
    // Find individual orders
    const orderId = Reaction.Router.getParam("_id");
    if (orderId) {
      return Orders.find({
        _id: orderId
      });
    }

    const selectedOrders = JSON.parse(localStorage.selectedOrdersToPrint || "[]");
    if (selectedOrders.length > 0) {
      return Orders.find({
        "_id": {
          $in: selectedOrders
        },
        "advancedFulfillment.workflow.status": {
          $in: AdvancedFulfillment.orderActive
        }
      });
    }

    // Find all orders by Date
    const day = Reaction.Router.getParam("date");
    if (day) {
      return Orders.find({
        "advancedFulfillment.workflow.status": {
          $in: AdvancedFulfillment.orderActive
        },
        "advancedFulfillment.shipmentDate": {
          $gte: moment(day, "MM-DD-YYYY").startOf("day").toDate(),
          $lte: moment(day, "MM-DD-YYYY").endOf("day").toDate()
        }
      }, {
        sort: {
          orderNumber: 1
        }
      });
    }

    // No relevant orders found.
    return false;
  },
  hasNotes() {
    if (!this.backpackOrderNotes) {
      return false;
    }
    const notes = this.backpackOrderNotes.filter(note => note.type === "Note");
    return notes && notes.length > 0;
  },
  notes() {
    if (this.backpackOrderNotes) {
      return this.backpackOrderNotes.filter(note => note.type === "Note");
    }
    return [];
  },
  shippingDate: function () {
    const date = this.advancedFulfillment.shipmentDate;
    return moment(date).format("MMMM Do, YYYY");
  },
  returnDate: function () {
    const date = this.advancedFulfillment.returnDate;
    return moment(date).format("MMMM Do, YYYY");
  },
  humanReadableDate: function (day) {
    // let date = this.advancedFulfillment.shipmentDate;
    return moment(day).format("MMMM Do, YYYY");
  },
  shippingAddress: function (order) {
    if (!order.shipping) { // TODO: Build default message for missing shipping address
      return {};
    }
    return order.shipping[0].address;
  },
  billingAddress: function (order) {
    // TODO: Build default message for missing billing address
    if (!order.billing) {
      return {};
    }
    return order.billing[0].address;
  },
  paymentDetails: function (order) {
    if (!order.billing) {
      return {};
    }
    return order.billing[0].invoice;
  },
  nonBundleItems() {
    const order = this;
    return order.items.filter(function (item) {
      const notBundleVariant = item.variants.functionalType !== "bundleVariant";
      const notBundleComponent = item.customerViewType !== "bundleComponent";
      return notBundleVariant && notBundleComponent;
    });
  },
  bundles() {
    const order = this;
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
  itemsByBundle(bundle) {
    const order = this;
    itemsByBundle = order.items.filter(function (item) {
      itemMatches = item.bundleProductId === bundle.productId;
      indexMatches = item.bundleIndex === bundle.index;
      return itemMatches && indexMatches;
    });
    return itemsByBundle;
  },
  bundleIndex(bundle) {
    return bundle.index > 1 ? `#${bundle.index}` : "";
  }
});
