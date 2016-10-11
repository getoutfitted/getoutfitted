import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { check } from 'meteor/check';
import { _ } from 'meteor/underscore';
import { Session } from 'meteor/session';
import { Products } from '/lib/collections';

import './dashboard.html';

function metafieldMaker(metaString) {
  check(metaString, String);
  try {
    const delimited = metaString.split('|');
    let metafields = [];
    _.each(delimited, function (objectValue) {
      let metafield = {};
      let keyValues = objectValue.split('=');
      let key = keyValues[0].trim();
      let v = keyValues[1].trim();
      metafield.key = key;
      metafield.value = v;
      metafields.push(metafield);
    });
    return metafields;
  }
  catch (e) {
    Alerts.removeSeen();
    Alerts.add(`Please check your MetaField Format, there is an error, metafields were not added.`, 'danger', {
          autoHide: true});
    return [];
  }
};
Template.productBundlesDashboard.onCreated(function () {
  this.subscribe('ProductsForBundles');
  Session.setDefault('bundlePriceBuckets', []);
});

Template.productBundlesDashboard.helpers({
  topProducts: function () {
    return Products.find({
      type: 'simple'
    });
  },
  anyExistingBundles: function () {
    return Products.find({
      functionalType: 'bundle',
      type: 'simple'
    }).count() > 0;
  },
  existingBundles: function () {
    return Products.find({
      functionalType: 'bundle',
      type: 'simple'
    });
  },
  anyPriceBuckets: function () {
    return Session.get('bundlePriceBuckets').length > 0;
  },
  bundlePriceBuckets: function () {
    return Session.get('bundlePriceBuckets');
  }
});

Template.productBundlesDashboard.events({
  'submit #createBundle': function (event) {
    event.preventDefault();
    let product = {};
    product.title = event.target.bundleTitle.value;
    product.pageTitle = event.target.bundlePageTitle.value;
    product.description = event.target.bundleDescription.value;
    product.handle = event.target.bundleHandle.value;
    product.vendor = event.target.bundleVendor.value;
    product.productType = event.target.bundleProductType.value;
    product.gender = event.target.bundleGender.value;
    product.sku = event.target.bundleSku.value;
    const metafields = metafieldMaker(event.target.bundleMetafields.value);
    const hashtags = event.target.bundleHashtags.value.split(',');
    const priceBuckets = Session.get('bundlePriceBuckets');
    if (priceBuckets.length > 0) {
      product.price = {
        max: _.max(priceBuckets, function (priceBucket) { return priceBucket.price}).price,
        min: _.min(priceBuckets, function (priceBucket) { return priceBucket.price}).price
      };
      product.price.range = `${product.price.min} - ${product.price.max}`;
      Meteor.call('productBundles/createBundleProduct', product, hashtags, priceBuckets, metafields);
      Session.set('bundlePriceBuckets', []);
      Alerts.removeSeen();
      Alerts.add(`Bundle Added`, 'success', {
          autoHide: true});
    } else {
      Alerts.removeSeen();
      Alerts.add(`You must add at least one Price Bucket for Bundle`, 'danger', {
          autoHide: true});
    }
  },
  'click .addBundlePriceBucket': function (event) {
    event.preventDefault();
    let priceBucket = {};
    priceBucket.timeUnit = $('[name=timeUnit]').val();
    priceBucket.duration = parseInt($('[name=duration]').val(), 10);
    priceBucket.price = parseFloat($('[name=bucketPrice]').val(), 10);
    let currentBuckets = Session.get('bundlePriceBuckets');
    let bucketExists = _.some(currentBuckets, function (bucket) {
      return bucket.duration === priceBucket.duration;
    });
    if (bucketExists) {
      Alerts.removeSeen();
      Alerts.add(`Price Bucket with a duration of ${priceBucket.duration} already exists.`, 'danger', {
        autoHide: true});
    } else {
      currentBuckets.push(priceBucket);
      Session.set('bundlePriceBuckets', currentBuckets);
    }
    $('[name=bucketPrice]').val('0.00');
  },
  'click .removePriceBucket': function () {
    event.preventDefault();
    const duration = parseInt(event.target.dataset.duration, 10);
    let currentBuckets = Session.get('bundlePriceBuckets');
    let updatedBuckets = _.reject(currentBuckets, function (bucket) {
      return bucket.duration === duration;
    });
    Session.set('bundlePriceBuckets', updatedBuckets);
  }
});
