import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Reaction } from "/client/api";
import AdvancedFulfillment from "/imports/plugins/custom/reaction-advanced-fulfillment/lib/api";
// import { Orders } from "/lib/collections";

Template.orderAssignmentActions.helpers({
  status() {
    const order = this;
    return order.advancedFulfillment.workflow.status;
  },
  actionStatus() {
    const order = this;
    return AdvancedFulfillment.humanActionStatus[order.advancedFulfillment.workflow.status];
  }
});

Template.orderPickingActions.events({
  "click #all-items-picked": function (event) {
    event.preventDefault();
    const order = this;
    const orderId = order._id;
    // const orderStatus = order.advancedFulfillment.workflow.status;
    // const order = Orders.findOne({_id: orderId});

    const items = order.advancedFulfillment.items.filter(item => item.functionalType !== "bundleVariant");
    const allItemsPicked = items.every(item => item.workflow.status === "picked");
    if (allItemsPicked) {
      Meteor.call("advancedFulfillment/updateOrderWorkflow", orderId, "orderPicking");
    } else {
      Alerts.removeSeen();
      Alerts.add("All Items Have Not Been Picked", "danger", {
        autoHide: false
      });
    }
  },

  "click #all-items-picked-new-order": function (event) {
    event.preventDefault();
    const order = this;
    const orderId = order._id;
    // const orderStatus = order.advancedFulfillment.workflow.status;
    // const order = Orders.findOne({_id: orderId});

    const items = order.advancedFulfillment.items.filter(item => item.functionalType !== "bundleVariant");
    const allItemsPicked = items.every(item => item.workflow.status === "picked");
    if (allItemsPicked) {
      Meteor.call("advancedFulfillment/updateOrderWorkflow", orderId, "orderPicking");
      Reaction.Router.go("advancedFulfillment.picker");
    } else {
      Alerts.removeSeen();
      Alerts.add("All Items Have Not Been Picked", "danger", {
        autoHide: false
      });
    }
  }
});

Template.orderPackingActions.events({
  "click #all-items-packed": function () {
    const order = this;
    const currentItemStatus = "picked";
    Meteor.call("advancedFulfillment/updateAllItems", order, currentItemStatus);
    Meteor.call("advancedFulfillment/updateOrderWorkflow", order._id, "orderPacking");
  }
});

Template.orderPackedActions.helpers({
  localDelivery: function () {
    const order = this;
    if (order && Array.isArray(order.shipping) && order.shipping[0]) {
      const shipping = order.shipping[0].address;
      return AdvancedFulfillment.isLocalAddress(shipping);
    }
    return false;
  }
});

Template.orderPackedActions.events({
  "click .js-label-print": function () {
    const order = this;
    const currentItemStatus = "packed";
    const status = this.advancedFulfillment.workflow.status;
    Meteor.call("advancedFulfillment/updateAllItems", order, currentItemStatus);
    Meteor.call("advancedFulfillment/updateOrderWorkflow", order._id, status);
  }
});

Template.orderReadyToShipActions.events({
  "click .js-mark-as-shipped": function () {
    const order = this;
    const orderId = order._id;
    const currentStatus = order.advancedFulfillment.workflow.status;

    if (currentStatus === "orderShipped") {
      const noRentals = _.every(this.advancedFulfillment.items, function (afItem) {
        return afItem.functionalType === "variant";
      });

      if (noRentals) {
        Meteor.call("advancedFulfillment/bypassWorkflowAndComplete", orderId, userId);
      } else {
        Meteor.call("advancedFulfillment/updateItemsToShippedOrCompleted", this);
      }
    } else {
      Meteor.call("advancedFulfillment/updateOrderWorkflow", orderId, currentStatus);
    }
  }
});
