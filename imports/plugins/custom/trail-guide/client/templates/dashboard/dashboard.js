import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { _ } from 'meteor/underscore';
import { Orders } from '/lib/collections';
import { Reaction } from '/client/api';
import moment from 'moment';
import AdvancedFulfillment from '../../../../reaction-advanced-fulfillment/lib/api';

import './dashboard.html';
/*
  * To add additional fields, simply add the field to default fields
  ** Determine if that field should be in nonDefault
  *** Make sure data is returned in switch statements.
*/

const DefaultFields = {
  'orderNumber': 'Number',
  'rentalDays': 'Length',
  'startTime': 'Rental Start',
  'endTime': 'Rental End',
  'createdAt': 'Created',
  'email': 'Email',
  'advancedFulfillment.transitTime': 'Transit',
  'advancedFulfillment.shipmentDate': 'Ship Date',
  'advancedFulfillment.returnDate': 'Return Date',
  'shipping.address.fullName': 'Shipping Name',
  'shipping.address.region': 'Ship Region',
  'shipping.address.city': 'Ship City',
  'billing.address.fullName': 'Billing Name',
  'billing.address.region': 'Bill Region',
  'billing.address.phone': 'Phone',
  'billing.invoice.subtotal': 'Subtotal',
  'billing.invoice.taxes': 'Taxes',
  'billing.invoice.total': 'Total',
  'advancedFulfillment.localDelivery': 'Local',
  'advancedFulfillment.workflow.status': 'Status'
};


Template.trailGuideDashboard.onCreated(function () {
  Session.setDefault('sortField', 'orderNumber');
  Session.setDefault('sortOrder', -1);
  Session.setDefault('limit', 20);
  Session.setDefault('find', {});
  let displayFields = Object.keys(DefaultFields);
  let defaultDisplay = {};
  _.each(displayFields, function (df) {
    const nonDefault = ['email',
                        'billing.address.phone',
                        'advancedFulfillment.localDelivery',
                        'shipping.address.fullName'
                        ];
    if (_.contains(nonDefault, df)) {
      defaultDisplay[df] = false;
    } else {
      defaultDisplay[df] = true;
    }
  });
  Session.setDefault('enabledFields', defaultDisplay);
  this.autorun(() => {
    let field = Session.get('sortField');
    let order = Session.get('sortOrder');
    let limit = Session.get('limit') || 20;
    let activeFields = Session.get('enabledFields');
    let find = Session.get('find');
    let sort = {};
    sort[field] = order;
    this.subscribe('trailGuideAllOrders', find, limit, sort, activeFields);
  });
  this.subscribe('trailGuideProducts');
});

Template.trailGuideDashboard.helpers({
  orders: function () {
    let field = Session.get('sortField');
    let order = Session.get('sortOrder');
    let sortOrder = {};
    sortOrder[field] = order;
    return Orders.find({}, {
      sort: sortOrder
    });
  },
  currentLimit: function () {
    return Session.get('limit');
  },
  fields: function (field) {
    return Session.get('enabledFields')[field];
  },
  displayFields: function () {
    return Object.keys(DefaultFields);
  },
  humanReadableField: function (field) {
    return DefaultFields[field];
  },
  products: function () {
    return ReactionCore.Collections.Products.find();
  }
});

Template.trailGuideDashboard.events({
  'click .sortField': function (event) {
    event.preventDefault();
    let selectedField = event.currentTarget.dataset.field;
    let inverseOrder = -Session.get('sortOrder');
    Session.set('sortField', selectedField);
    Session.set('sortOrder', inverseOrder);
  },
  'change .limitFilter': function (event) {
    event.preventDefault();
    const limit = parseInt(event.target.value, 10);
    if (typeof limit === 'number') {
      Session.set('limit', limit);
    }
  },
  'change #customerEnabled': function () {
    Session.set('customerEnabled', event.target.checked);
  },
  'change .toggleDisplayField': function () {
    const field = event.target.name;
    let displaySettings = Session.get('enabledFields');
    displaySettings[field] = !displaySettings[field];
    Session.set('enabledFields', displaySettings);
  },
  'submit #findByOrderNumber': function (event) {
    event.preventDefault();
    const find = Session.get('find');
    const orderNumber = parseInt(event.target.findOrderNumber.value, 10);
    find.orderNumber = orderNumber;
    Session.set('find', find);
  },
  'submit .advancedSearchFilters': function (event) {
    event.preventDefault();
    const find = Session.get('find');
    const billingName = event.target.billingName.value;
    if (billingName) {
      find['billing.address.fullName'] = billingName;
    } else {
      delete find['billing.address.fullName'];
    }
    const shippingName = event.target.shippingName.value;
    if (shippingName) {
      find['shipping.address.fullName'] = shippingName;
    } else {
      delete find['shipping.address.fullName'];
    }
    const productId = event.target.products.value;
    if (productId) {
      find['items.productId'] = productId;
    } else {
      delete find['items.productId'];
    }
    const orderMin = parseInt(event.target.orderMin.value, 10);
    const orderMax = parseInt(event.target.orderMax.value, 10);
    if (orderMin && orderMax) {
      find.orderNumber = {};
      find.orderNumber.$gte = orderMin;
      find.orderNumber.$lte = orderMax;
    } else if (orderMin) {
      find.orderNumber = {};
      find.orderNumber.$gte = orderMin;
      find.orderNumber.$lte = Infinity;
    } else if (orderMax) {
      find.orderNumber = {};
      find.orderNumber.$gte = 0;
      find.orderNumber.$lte = orderMax;
    } else {
      delete find.orderNumber;
    }
    Session.set('find', find);
  },
  'click tr ': function (event) {
    event.preventDefault();
    const _id = this._id;
    if (_id && Reaction.hasPermission('advancedFulfillment')) {
      Reaction.Router.go('orderDetails', {_id: _id});
    }
  }
});

Template.columnGroupHeader.helpers({
  enabled: function () {
    const str = this.valueOf();
    return Session.get('enabledFields')[str];
  },
  active: function () {
    const str = this.valueOf();
    if (Session.get('sortField') === str) {
      return 'active';
    }
    return '';
  }
});

Template.columnMainHeaders.helpers({
  enabled: function () {
    const str = this.valueOf();
    return Session.get('enabledFields')[str];
  },
  label: function () {
    const str = this.valueOf();
    return DefaultFields[str];
  },
  upOrDown: function () {
    const field = this.valueOf();
    if (Session.get('sortField') === field && Session.get('sortOrder') === -1) {
      return 'upArrow';
    }
    return 'downArrow';
  }
});

Template.columnMainRow.helpers({
  enabled: function () {
    const str = this.valueOf();
    return Session.get('enabledFields')[str];
  },
  orderInfo: function () {
    if (!Template.parentData().advancedFulfillment) {
      return;
    }
    const order = Template.parentData();
    const fields = this.valueOf().split('.');

    let search = order;
    for (let i = 0; i < fields.length; i++) {
      search = search[fields[i]];

      if (fields[i] === 'shipping' || fields[i] === 'billing') {
        search = search[0];
      }
    }

    /* eslint-disable consistent-return */
    if (search instanceof Date) {
      return moment(search).format('M/D/YY');
    }
    return search;
    /* eslint-enable consistent-return */
  }
});
