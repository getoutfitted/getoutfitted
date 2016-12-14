import { _ } from "meteor/underscore";
import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { Reaction } from "/server/api";
import { Orders } from "/lib/collections";
import AdvancedFulfillment from "../../lib/api";

Meteor.methods({
  "advancedFulfillment/updateOrderWorkflow": function (orderId, status) {
    check(orderId, String);
    check(status, String);
    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }
    const order = Orders.findOne({_id: orderId});
    const currentStatus = order.advancedFulfillment.workflow.status;
    const userId = Meteor.userId();
    const workflow = AdvancedFulfillment.workflow;

    if (status !== currentStatus) {
      throw new Meteor.Error("500", `Error updating update order from ${currentStatus} to ${workflow[status]} - incongruent steps`);
    }

    const historyEvent = {
      event: workflow[status],
      userId: userId,
      updatedAt: new Date()
    };

    const note = AdvancedFulfillment.humanOrderStatus[workflow[status]];

    ReactionCore.Collections.Orders.update({_id: orderId}, {
      $addToSet: {
        "history": historyEvent,
        "advancedFulfillment.workflow.workflow": status
      },
      $set: {
        "advancedFulfillment.workflow.status": workflow[status]
      }
    });

    Meteor.call("advancedFulfillment/addOrderNote", orderId, note, type = "Status Update");

    if (status === "orderReadyToShip") {
      Meteor.call("advancedFulfillment/klaviyoEnabled", orderId, "Shipped Product", "advancedFulfullment/createKlaviyoItemEvents");
      Meteor.call("advancedFulfillment/klaviyoEnabled", orderId, "Shipped", "advancedFulfullment/createKlaviyoGeneralEvent");
    } else if (status === "orderShipped") {
      Meteor.call("advancedFulfillment/klaviyoEnabled", orderId, "Returned", "advancedFulfullment/createKlaviyoGeneralEvent");
    }
  },

  // Reverses order workflow by one step. Loggs reversal in notes and history.
  // Does _not_ update order items workflow status.
  "advancedFulfillment/reverseOrderWorkflow": function (orderId, status) {
    check(orderId, String);
    check(userId, String);
    check(status, String);

    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }

    const reverseWorkflow = AdvancedFulfillment.reverseWorkflow;
    const historyEvent = {
      event: reverseWorkflow[status],
      userId: userId,
      updatedAt: new Date()
    };

    const note = AdvancedFulfillment.humanOrderStatus[workflow[status]];

    ReactionCore.Collections.Orders.update({_id: orderId}, {
      $addToSet: {
        "history": historyEvent,
        "advancedFulfillment.workflow.workflow": status
      },
      $set: {
        "advancedFulfillment.workflow.status": reverseWorkflow[status]
      }
    });

    Meteor.call("advancedFulfillment/addOrderNote", orderId, note, type = "Status Revision");
  },

  "advancedFulfillment/markOrderCompleted": function (orderId) {
    check(orderId, String);

    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }

    const userId = Meteor.userId();
    const order = Orders.findOne({_id: orderId});
    const returnedStatus = ["returned", "completed"];

    const items = order.advancedFulfillment.items.filter(item => item.functionalType !== "bundleVariant");
    const itemsReturned = items.every(item => returnedStatus.indexOf(item.workflow.status) !== -1);
    const status = itemsReturned ? "orderCompleted" : "orderIncomplete";

    const historyEvent = {
      event: status,
      userId: userId,
      updatedAt: new Date()
    };

    const note = AdvancedFulfillment.humanOrderStatus[status];

    ReactionCore.Collections.Orders.update({_id: orderId}, {
      $addToSet: {
        "history": historyEvent,
        "advancedFulfillment.workflow.workflow": order.advancedFulfillment.workflow.status
      },
      $set: {
        "advancedFulfillment.workflow.status": status
      }
    });

    Meteor.call("advancedFulfillment/addOrderNote", orderId, note, "Status Update");
  },

  // Legacy - replaced by advancedFulfillment/markOrderCompleted
  "advancedFulfillment/orderCompletionVerifier": function (order, userId) {
    check(order, Object);
    check(userId, String);

    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }

    let afItems = order.advancedFulfillment.items;
    let allItemsReturned = _.every(afItems, function (item) {
      return item.workflow.status === "returned" || item.workflow.status === "completed";
    });
    let orderStatus = "orderIncomplete";
    if (allItemsReturned) {
      orderStatus = "orderCompleted";
    }
    let date = new Date();
    let historyEvent = {
      event: orderStatus,
      userId: userId,
      updatedAt: date
    };
    ReactionCore.Collections.Orders.update({_id: order._id}, {
      $addToSet: {
        "history": historyEvent,
        "advancedFulfillment.workflow.workflow": order.advancedFulfillment.workflow.status
      },
      $set: {
        "advancedFulfillment.workflow.status": orderStatus
      }
    });
  },

  "advancedFulfillment/addOrderNote": function (orderId, note, type = "Note") {
    check(orderId, String);
    check(note, String);
    check(type, String);

    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }

    const user = Meteor.user();
    const noteObj = {
      note: note,
      userId: user._id,
      username: user.username,
      type: type,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return Orders.update({_id: orderId}, {
      $push: { backpackOrderNotes: noteObj }
    });
  },

  /**
   * advancedFulfillment/updateOrderNotes is the *legacy* method for adding and changing notes on an order. This method changes the `orderNotes` string value on an order.
   * @param {Object} order      The order object
   * @param {String} orderNotes The notes to add to the order
   * @param {String} user       The username
   * @returns {undefined}
   */
  // "advancedFulfillment/updateOrderNotes": function (order, orderNotes, user) {
  //   check(order, Object);
  //   check(orderNotes, String);
  //   check(user, String);
  //
  //   if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
  //     throw new Meteor.Error(403, "Access Denied");
  //   }
  //   if (!order.orderNotes) {
  //     order.orderNotes = "";
  //   }
  //   const userInfo = noteFormattedUser(user);
  //   const notes = order.orderNotes + "<p>" + orderNotes + userInfo + "</p>";
  //   ReactionCore.Collections.Orders.update({_id: order._id}, {
  //     $set: {orderNotes: notes}
  //   });
  // },

  // "advancedFulfillment/printInvoices": function (startDate, endDate, userId) {
  //   check(startDate, Date);
  //   check(endDate, Date);
  //   check(userId, String);
  //
  //   if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
  //     throw new Meteor.Error(403, "Access Denied");
  //   }
  //
  //   ReactionCore.Collections.Orders.update({
  //     "advancedFulfillment.shipmentDate": {
  //       $gte: startDate,
  //       $lte: endDate
  //     }
  //   }, {
  //     $set: {
  //       "advancedFulfillment.workflow.status": "orderPrinted"
  //     },
  //     $addToSet: {
  //       history: {
  //         event: "orderPrinted",
  //         userId: userId,
  //         updatedAt: new Date()
  //       }
  //     }
  //   }, {
  //     multi: true
  //   });
  // },


  // TODO: use updateOrderWorkflow instead.
  // "advancedFulfillment/printInvoice": function (orderId, userId) {
  //   check(orderId, String);
  //   check(userId, String);
  //
  //   if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
  //     throw new Meteor.Error(403, "Access Denied");
  //   }
  //
  //   ReactionCore.Collections.Orders.update({
  //     _id: orderId
  //   }, {
  //     $set: {
  //       "advancedFulfillment.workflow.status": "orderPrinted"
  //     },
  //     $addToSet: {
  //       history: {
  //         event: "orderPrinted",
  //         userId: userId,
  //         updatedAt: new Date()
  //       }
  //     }
  //   });
  // },
  "advancedFulfillment/bypassWorkflowAndComplete": function (orderId) {
    check(orderId, String);

    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, "Access Denied");
    }

    const userId = Meteor.userId();
    const history = [
      {
        event: "bypassedWorkFlowToComplete",
        userId: userId,
        updatedAt: new Date()
      }, {
        event: "orderCompleted",
        userId: userId,
        updatedAt: new Date()
      }
    ];
    ReactionCore.Collections.Orders.update({
      _id: orderId
    }, {
      $set: {
        "advancedFulfillment.workflow.status": "orderCompleted"
      },
      $addToSet: {
        history: {
          $each: history
        }
      }
    });
  }
});
