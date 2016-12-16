import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { Reaction } from "/server/api";
import AdvancedFulfillment from "../api";
import { Orders } from "/lib/collections";

Meteor.methods({
  "advancedFulfillment/updateItemWorkflow": function (orderId, itemId, itemStatus) {
    check(orderId, String);
    check(itemId, String);
    check(itemStatus, String);

    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }

    const workflow = AdvancedFulfillment.itemWorkflow;
    Orders.update({
      "_id": orderId,
      "advancedFulfillment.items._id": itemId
    }, {
      $set: { "advancedFulfillment.items.$.workflow.status": workflow[itemStatus] },
      $addToSet: {"advancedFulfillment.items.$.workflow.workflow": itemStatus }
    });
  },

  /**
   * advancedFulfillment/updateAllItems
   */

  "advancedFulfillment/updateAllItems": function (order, itemStatus) {
    check(order, Object);
    check(itemStatus, String);

    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }

    // Check to make sure all pickable items have current status
    const items = order.advancedFulfillment.items.filter(item => item.functionalType !== "bundleVariant");
    const itemsHaveCurrentStatus = items.every(item => item.workflow.status === itemStatus);
    if (!itemsHaveCurrentStatus) {
      // if they don't, throw an error.
      throw new Meteor.Error("Invalid Item Status", itemStatus);
      // TODO: should invalidate transaction / roll back updates to order.
    }

    // update
    const updatedItems = order.advancedFulfillment.items.map(function (item) {
      if (item.functionalType !== "bundleVariant") {
        // Push completed step into workflow log
        item.workflow.workflow.push(itemStatus);
        // Update status to next workflow step
        item.workflow.status = AdvancedFulfillment.itemWorkflow[itemStatus];
      }
      return item;
    });

    Orders.update({
      _id: order._id
    }, {
      $set: {
        "advancedFulfillment.items": updatedItems
      }
    });
  },

  "advancedFulfillment/itemIssue": function (orderId, itemId, issue) {
    check(orderId, String);
    check(itemId, String);
    check(issue, String);

    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }

    const userId = Meteor.userId();
    const historyEvent = {
      event: issue + " Item",
      userId: userId,
      updatedAt: new Date()
    };

    Orders.update({
      "_id": orderId,
      "advancedFulfillment.items._id": itemId
    }, {
      $set: {"advancedFulfillment.items.$.workflow.status": issue},
      $addToSet: {
        "history": historyEvent,
        "advancedFulfillment.items.$.workflow.workflow": issue
      }
    });

    const capitalizedIssue = issue[0].toUpperCase() + issue.slice(1);
    const note = `Item ${itemId} was ${issue} when returned.`;
    const noteType = `${capitalizedIssue} Product`;

    Meteor.call("advancedFulfillment/addOrderNote", orderId, note, noteType);
  },

  "advancedFulfillment/itemResolved": function (orderId, itemId, issue) {
    check(orderId, String);
    check(itemId, String);
    check(issue, String);

    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }

    // TODO: Check to see if issue is actually a valid status

    ReactionCore.Collections.Orders.update({
      "_id": orderId,
      "advancedFulfillment.items._id": itemId
    }, {
      $set: {
        "advancedFulfillment.items.$.workflow.status": "returned"
      },
      $addToSet: {
        "advancedFulfillment.items.$.workflow.workflow": issue
      }
    });
    return Orders.findOne(orderId);
  },

  "advancedFulfillment/setOrderItemsToStatus": function (orderId, status) {
    check(orderId, String);
    check(status, String);

    // TODO: Check to see if status is actually a valid status
    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }
    const order = Orders.findOne({_id: orderId});
    const items = order.advancedFulfillment.items;
    const updatedItems = items.map(function(item) {
      item.workflow.status = status;
      return item;
    });

    Orders.update({
      _id: order._id
    }, {
      $set: {
        "advancedFulfillment.items": updatedItems
      }
    });

    const note = `Set all items to ${status}.`;
    Meteor.call("advancedFulfillment/addOrderNote", orderId, note, "Status Revision");
  },

  // "advancedFulfillment/updateAllItemsToSpecificStatus": function (order, desiredItemStatus) {
  //   check(order, Object);
  //   check(desiredItemStatus, String);
  //   // TODO XXX: Check to see if status is actually a valid status
  //   let items = order.advancedFulfillment.items;
  //   _.each(items, function (item) {
  //     item.workflow.status = desiredItemStatus;
  //   });
  //   Orders.update({
  //     _id: order._id
  //   }, {
  //     $set: {
  //       "advancedFulfillment.items": items
  //     }
  //   });
  // },


  'advancedFulfillment/updateItemsToShippedOrCompleted': function (order) {
    check(order, Object);
    let items = order.advancedFulfillment.items;
    _.each(items, function (item) {
      if (item.functionalType === 'variant') {
        item.workflow.status = 'completed';
      } else {
        item.workflow.status = 'shipped';
      }
    });
    Orders.update({
      _id: order._id
    }, {
      $set: {
        'advancedFulfillment.items': items
      }
    });
  }
});
