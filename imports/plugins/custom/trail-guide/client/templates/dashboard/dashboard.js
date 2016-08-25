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
  'orderNumber': '#',
  'billing.address.fullName': 'Customer',
  'shipping.address.fullName': 'Shipping To',
  'email': 'Email',
  'billing.address.phone': 'Phone',
  'billing.invoice.total': 'Total',
  'createdAt': 'Created',
  'advancedFulfillment.transitTime': 'Transit',
  'advancedFulfillment.shipmentDate': 'Shipping',
  'startTime': 'Rental Start',
  'endTime': 'Rental End',
  'advancedFulfillment.returnDate': 'Returning',
  'rentalDays': 'Length',
  'shipping.address.region': 'Ship To',
  'billing.address.region': 'Bill To',
  'advancedFulfillment.workflow.status': 'Status',
  'advancedFulfillment.localDelivery': 'Local'
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
  'submit .advancedSearchFilters': function (event) {
    event.preventDefault();
    let find = Session.get('find');
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
    const field = this.valueOf();
    switch (field) {
    // Using Fall through technique which is || in Switch
    case 'billing.address.fullName':
    case 'shipping.address.fullName':
      const billOrShip = field.split('.')[0];
      return Template.parentData()[billOrShip][0].address.fullName;
    case 'billing.address.phone':
      return Template.parentData().billing[0].address.phone;
    case 'advancedFulfillment.localDelivery':
    case 'advancedFulfillment.transitTime':
      const afField = field.split('.')[1];
      return Template.parentData().advancedFulfillment[afField];
    case 'createdAt':
    case 'startTime':
    case 'endTime':
      const date = Template.parentData()[this.valueOf()];
      return moment(date).format('M/D/YY');
    case 'advancedFulfillment.shipmentDate':
      const shipDate = Template.parentData().advancedFulfillment.shipmentDate;
      return moment(shipDate).format('M/D/YY');
    case 'advancedFulfillment.returnDate':
      const returnDate = Template.parentData().advancedFulfillment.returnDate;
      return moment(returnDate).format('M/D/YY');
    case 'shipping.address.region':
    case 'billing.address.region':
      const billingOrShipping = field.split('.')[0];
      return Template.parentData()[billingOrShipping][0].address.region;
    case 'billing.invoice.total':
      return `$${Template.parentData().billing[0].invoice.total}`;
    case 'advancedFulfillment.workflow.status':
      const status = Template.parentData().advancedFulfillment.workflow.status;
      return AdvancedFulfillment.humanOrderStatuses[status];
    default:
      return Template.parentData()[this.valueOf()];
    }
  }
});
