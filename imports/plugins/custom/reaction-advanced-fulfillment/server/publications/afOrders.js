import { Meteor } from 'meteor/meteor';
import { Reaction } from '/server/api';
import AdvancedFulfillment from '../api';
import { Products, Orders } from '/lib/collections';
import { check } from 'meteor/check';
import moment from 'moment';


Meteor.publish('afOrders', function () {
  shopId = Reaction.getShopId();
  if (Roles.userIsInRole(this.userId, AdvancedFulfillment.server.permissions, Reaction.getShopId())) {
    return Orders.find({
      shopId: shopId
    }, {
      fields: {
        'startTime': 1,
        'advancedFulfillment.returnDate': 1,
        'advancedFulfillment.shipmentDate': 1,
        'advancedFulfillment.workflow.status': 1,
        'advancedFulfillment.items._id': 1,
        'advancedFulfillment.items.workflow': 1,
        'advancedFulfillment.arriveBy': 1,
        // 'email': 1,
        'shopifyOrderNumber': 1,
        // 'shipping.address.phone': 1,
        'history': 1,
        'shipping.address.region': 1,
        'shipping.address.city': 1,
        'shipping.address.fullName': 1,
        // 'billing.address.fullName': 1,
        'advancedFulfillment.localDelivery': 1,
        'advancedFulfillment.rushDelivery': 1,
        'advancedFulfillment.kayakRental.vendor': 1,
        'advancedFulfillment.kayakRental.qty': 1,
        'advancedFulfillment.rushShippingPaid': 1
      }
    });
  }
  return this.ready();
});

// TODO: This publication needs optimization
Meteor.publish('afProducts', function () {
  if (Roles.userIsInRole(this.userId, AdvancedFulfillment.server.permissions, Reaction.getShopId())) {
    return Products.find({});
  }
  return this.ready();
});

Meteor.publish('advancedFulfillmentOrder', function (orderId) {
  // Check should be just string, but known flow router error is throwing errors when rerunning
  check(orderId, Match.Maybe(String));
  if (!orderId) {
    return this.ready();
  }
  shopId = Reaction.getShopId();
  if (Roles.userIsInRole(this.userId, AdvancedFulfillment.server.permissions, Reaction.getShopId())) {
    return Orders.find({
      _id: orderId,
      shopId: shopId
    });
  }
  return this.ready();
});

Meteor.publish('searchOrders', function () {
  shopId = Reaction.getShopId();
  if (Roles.userIsInRole(this.userId, AdvancedFulfillment.server.permissions, Reaction.getShopId())) {
    return Orders.find({
      'shopId': shopId
    }, {
      fields: {
        _id: 1,
        shopifyOrderNumber: 1,
        orderNumber: 1
      }
    });
  }
  return this.ready();
});

Meteor.publish('shippingOrders', function () {
  shopId = Reaction.getShopId();
  if (Roles.userIsInRole(this.userId, AdvancedFulfillment.server.permissions, Reaction.getShopId())) {
    return Orders.find({
      'shopId': shopId,
      'advancedFulfillment.workflow.status': {
        $in: AdvancedFulfillment.orderShipping
      }
    }, {
      fields: AdvancedFulfillment.fields.ordersList
    });
  }
  return this.ready();
});

Meteor.publish('ordersByStatus', function (status) {
  check(status, String);
  shopId = Reaction.getShopId();
  if (Roles.userIsInRole(this.userId, AdvancedFulfillment.server.permissions, Reaction.getShopId())) {
    return Orders.find({
      'shopId': shopId,
      'advancedFulfillment.workflow.status': status
    }, {
      fields: AdvancedFulfillment.fields.ordersList
    });
  }
  return this.ready();
});

Meteor.publish('selectedOrders', function (orderIds) {
  check(orderIds, [String]);
  shopId = ReactionCore.getShopId();
  if (Roles.userIsInRole(this.userId, AdvancedFulfillment.server.permissions, Reaction.getShopId())) {
    return Orders.find({
      _id: {
        $in: orderIds
      }
    }, {
      fields: {
        'advancedFulfillment.paymentInformation.refunds': 0,
        'advancedFulfillment.paymentInformation.transactions': 0
      }
    });
  }
  return this.ready();
});

// Meteor.publish('nonWarehouseOrders', function () {
//   shopId = Reaction.getShopId();
//   if (Roles.userIsInRole(this.userId, AdvancedFulfillment.server.permissions, Reaction.getShopId())) {
//     return Orders.find({
//       'shopId': shopId,
//       'advancedFulfillment.workflow.status': 'nonWarehouseOrder'
//     });
//   }
//   return this.ready();
// });

Meteor.publish('userOrderQueue', function () {
  shopId = Reaction.getShopId();
  if (Roles.userIsInRole(this.userId, AdvancedFulfillment.server.permissions, Reaction.getShopId())) {
    return Orders.find({
      'shopId': shopId,
      'advancedFulfillment.workflow.status': {
        $in: AdvancedFulfillment.orderInQueue
      },
      'history.userId': this.userId
    });
  }
  return this.ready();
});

Meteor.publish('custServOrders', function () {
  shopId = Reaction.getShopId();
  if (Roles.userIsInRole(this.userId, AdvancedFulfillment.server.permissions, Reaction.getShopId())) {
    return Orders.find({
      'shopId': shopId,
      'advancedFulfillment.workflow.status': {
        $in: AdvancedFulfillment.orderShipping
      }
    });
  }
  return this.ready();
});

Meteor.publish('ordersWithMissing/DamagedItems', function () {
  shopId = Reaction.getShopId();
  if (Roles.userIsInRole(this.userId, AdvancedFulfillment.server.permissions, Reaction.getShopId())) {
    return Orders.find({
      'shopId': shopId,
      'advancedFulfillment.items.workflow.status': {
        $in: ['missing', 'damaged']
      }
    });
  }
  return this.ready();
});

Meteor.publish('ordersShippingOnDate', function (date) {
  check(date, String);
  const shopId = Reaction.getShopId();
  if (Roles.userIsInRole(this.userId, AdvancedFulfillment.server.permissions, Reaction.getShopId())) {
    const startOfDay = moment(date, 'MM-DD-YYYY').startOf('day').toDate();
    const endOfDay = moment(date, 'MM-DD-YYYY').endOf('day').toDate();
    return Orders.find({
      'shopId': shopId,
      'advancedFulfillment.workflow.status': {
        $in: AdvancedFulfillment.orderActive
      },
      'advancedFulfillment.shipmentDate': {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
  }

  return this.ready();
});

Meteor.publish('afReturnOrders', function () {
  shopId = Reaction.getShopId();
  if (Roles.userIsInRole(this.userId, ['admin', 'owner', 'dashboard/advanced-fulfillment', 'reaction-advanced-fulfillment'], Reaction.getShopId())) {
    return Orders.find({
      'shopId': shopId,
      'advancedFulfillment.workflow.status': {
        $in: AdvancedFulfillment.orderReturning
      }
    }, {
      fields: {
        'endTime': 1,
        'advancedFulfillment.returnDate': 1,
        'advancedFulfillment.workflow.status': 1,
        'advancedFulfillment.items._id': 1,
        'advancedFulfillment.items.workflow': 1,
        'advancedFulfillment.shipReturnBy': 1,
        'shopifyOrderNumber': 1,
        'history': 1,
        'shipping.address.region': 1,
        'shipping.address.city': 1,
        'shipping.address.fullName': 1,
        'advancedFulfillment.localDelivery': 1,
        'advancedFulfillment.rushDelivery': 1,
        'advancedFulfillment.kayakRental.vendor': 1,
        'advancedFulfillment.kayakRental.qty': 1,
        'advancedFulfillment.rushShippingPaid': 1,
        'orderNumber': 1
      }
    });
  }
  return this.ready();
});

Meteor.publish('ordersReturningOnDate', function (date) {
  check(date, String);
  const shopId = Reaction.getShopId();
  if (Roles.userIsInRole(this.userId, AdvancedFulfillment.server.permissions, Reaction.getShopId())) {
    const startOfDay = moment(date, 'MM-DD-YYYY').startOf('day').toDate();
    const endOfDay = moment(date, 'MM-DD-YYYY').endOf('day').toDate();
    return Orders.find({
      'shopId': shopId,
      'advancedFulfillment.workflow.status': {
        $in: AdvancedFulfillment.orderReturning
      },
      'advancedFulfillment.returnDate': {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }, {
      fields: {
        'endTime': 1,
        'advancedFulfillment.returnDate': 1,
        'advancedFulfillment.workflow.status': 1,
        'advancedFulfillment.items._id': 1,
        'advancedFulfillment.items.workflow': 1,
        'advancedFulfillment.shipReturnBy': 1,
        'shopifyOrderNumber': 1,
        'history': 1,
        'shipping.address.region': 1,
        'shipping.address.city': 1,
        'shipping.address.fullName': 1,
        'advancedFulfillment.localDelivery': 1,
        'advancedFulfillment.rushDelivery': 1,
        'advancedFulfillment.kayakRental.vendor': 1,
        'advancedFulfillment.kayakRental.qty': 1,
        'advancedFulfillment.rushShippingPaid': 1,
        'orderNumber': 1
      }
    });
  }

  return this.ready();
});
