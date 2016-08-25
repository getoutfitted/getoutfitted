import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Products } from '/lib/collections';
import $ from 'jquery';
import './lists.html';
Template.klaviyoListSetup.onCreated(function () {
  this.subscribe('Products');
});

Template.klaviyoListSetup.helpers({
  productsWithKlaviyoLists: function () {
    return Products.find({
      emailListId: {$exists: true},
      type: 'simple'
    }).fetch()
  },
  productsWithOutKlaviyoLists: function () {
    return Products.find({
      emailListId: {$exists: false},
      type: 'simple'
    }).fetch()
  }
});

Template.klaviyoListSetup.events({
  'submit .addKlaviyoToProduct': function(event) {
    event.preventDefault();
    const productId = event.target.selectedKlaviyoProduct.value;
    const listId = event.target.klaviyoListId.value;
    if (productId && listId) {
      Meteor.call('klaviyo/AddKlaviyoListToProduct', productId, listId);
      Alerts.inline("Klaviyo List Id added to Product", 'success', {
        placement: 'klaviyoUpdates',
        autoHide: 1000
      });
      event.target.klaviyoListId.value = "";
    }
  },
  'click .removeEmailListId': function (event) {
    event.preventDefault();
    const productId = event.target.dataset.id;
    Meteor.call('klaviyo/RemoveKlaviyoListFromProduct', productId);
    Alerts.inline("Klaviyo List Id Removed from Product", 'info', {
        placement: 'klaviyoUpdates',
        autoHide: 1000
      });
  },
  'click .updateEmailListId': function (event) {
    event.preventDefault();
    const productId = event.target.dataset.id;
    let newListId = $('#' + productId).val();
    if (productId && newListId) {
      Meteor.call('klaviyo/AddKlaviyoListToProduct', productId, newListId);
      Alerts.inline("Klaviyo List Id updated to Product", 'success', {
        placement: 'klaviyoUpdates',
        autoHide: 1000
      });
    }
  }
});
