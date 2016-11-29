import { Template } from 'meteor/templating';
import { Reaction } from '/client/api';
import { Orders } from '/lib/collections';
import { Blaze } from 'meteor/blaze';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import moment from 'moment';
import './advancedFulfillment.html';

Template.advancedFulfillmentPDF.onCreated(function () {
  Blaze._allowJavascriptUrls();
  const orderId = Reaction.Router.getParam('_id');
  this.subscribe('advancedFulfillmentOrder', orderId);
});

Template.advancedFulfillmentPDF.onRendered(function () {
  BlazeLayout.render('advancedFulfillmentPDF');
});

Template.advancedFulfillmentPDF.helpers({
  orders: function () {
    const orderId = Reaction.Router.getParam("_id");
    return Orders.find({
      _id: orderId
    });
  },
  shippingDate: function () {
    let date = this.advancedFulfillment.shipmentDate;
    return moment(date).format('MMMM Do, YYYY');
  },
  returnDate: function () {
    let date = this.advancedFulfillment.returnDate;
    return moment(date).format('MMMM Do, YYYY');
  },
  // shippingAddress: function () {
  //   return this.shipping[0].address;
  // },
  // billingAddress: function () {
  //   return this.billing[0].address;
  // },
  humanReadableDate: function (day) {
    // let date = this.advancedFulfillment.shipmentDate;
    return moment(day).format('MMMM Do, YYYY');
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
  itemAttr: function (attr) {
    item = _.findWhere(Template.parentData().items, {_id: this._id});
    if (!item) {
      return false;
    }
    return item.variants[attr];
  },
  nonBundleItems() {
    const order = this;
    return order.items.filter(function (item) {
      const notBundleVariant = item.variants.functionalType !== "bundleVariant";
      const notBundleComponent = item.customerViewType !== "bundleComponent";
      return notBundleVariant && notBundleComponent;
    });
  },
  bundles: function () {
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
    }, [])
    return bundles;
  },
  itemsByBundle: function (bundle) {
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

// Template.barcode.onRendered(function () {
//   $('.admin-controls-menu').remove();
//   let orderId = ReactionRouter.getParam('_id');
//   $('#barcode').barcode(orderId, 'code128', {
//     barWidth: 2,
//     barHeight: 100,
//     moduleSize: 15,
//     showHRI: true,
//     fontSize: 14
//   });
// });
