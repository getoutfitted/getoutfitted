import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Reaction } from "/client/api";
// import { Orders } from "/lib/collections";

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
