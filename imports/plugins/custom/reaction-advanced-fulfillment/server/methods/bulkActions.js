import { Meteor } from 'meteor/meteor';
import { Reaction } from '/server/api';
import { check } from 'meteor/check';
import { Orders } from '/lib/collections';
import AdvancedFulfillment from '../api';

// TODO Refactor into `advancedFulfillment/bulkProcessOrders`

Meteor.methods({
  "advancedFulfillment/bulkProcessOrders": function (orderIds, orderStatus, itemStatus) {
    check(orderIds, [String]);
    check(orderStatus, String);
    check(itemStatus, Match.Maybe(String));
    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }
    this.unblock();
    orderIds.forEach(function (orderId) {
      // Do Stuff
    });
  },
  "advancedFulfillment/shipSelectedOrders": function (orderIds) {
    check(orderIds, [String]);
    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }
    this.unblock();
    _.each(orderIds, function (orderId) {
      let order = Orders.findOne(orderId);
      let currentStatus = order.advancedFulfillment.workflow.status;
      if (currentStatus === "orderReadyToShip") {
        Meteor.call("advancedFulfillment/updateOrderWorkflow", order._id, currentStatus);
      }
    });
  },
  "advancedFulfillment/unshipSelectedOrders": function (orderIds) {
    check(orderIds, [String]);
    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }
    this.unblock();
    _.each(orderIds, function (orderId) {
      let order = Orders.findOne(orderId);
      let currentStatus = order.advancedFulfillment.workflow.status;
      if (currentStatus === "orderShipped") {
        Meteor.call("advancedFulfillment/reverseOrderWorkflow", order._id, currentStatus);
      }
    });
  },
  "advancedFulfillment/printSelectedOrders": function (orderIds) {
    check(orderIds, [String]);
    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }
    this.unblock();
    _.each(orderIds, function (orderId) {
      let order = Orders.findOne({_id: orderId});
      let currentStatus = order.advancedFulfillment.workflow.status;
      if (currentStatus === "orderCreated") {
        Meteor.call("advancedFulfillment/updateOrderWorkflow", order._id, currentStatus);
      }
    });
  },
  "advancedFulfillment/returnSelectedOrders": function (orderIds) {
    check(orderIds, [String]);
    this.unblock();
    _.each(orderIds, function (orderId) {
      let order = Orders.findOne(orderId);
      let currentStatus = order.advancedFulfillment.workflow.status;
      if (currentStatus === "orderShipped") {
        Meteor.call("advancedFulfillment/setOrderItemsToStatus", order._id, "shipped");
        Meteor.call("advancedFulfillment/updateOrderWorkflow", order._id, currentStatus);
      }
    });
  },
  "advancedFulfillment/completeSelectedOrders": function (orderIds) {
    check(orderIds, [String]);
    this.unblock();
    _.each(orderIds, function (orderId) {
      let order = Orders.findOne(orderId);
      let currentStatus = order.advancedFulfillment.workflow.status;
      if (currentStatus === "orderShipped" || currentStatus === "orderReturned") {
        Meteor.call("advancedFulfillment/bypassWorkflowAndComplete", order._id);
      }
    });
  }
});
