import { Meteor } from "meteor/meteor";
import { Reaction } from "/client/api";
import { Template } from "meteor/templating";
import { _ } from "meteor/underscore";
import { Orders } from "/lib/collections";
import AdvancedFulfillment from "../../../lib/api";

import "../helpers";
import "./orderDetails.html";
import "./status";

function getIndexBy(array, name, value) {
  for (let i = 0; i < array.length; i++) {
    if (array[i][name] === value) {
      return i;
    }
  }
}

function labelMaker(label, labelStyle = "primary") {
  return `<span class="label label-${labelStyle}">${label}</span>`;
}

Template.orderDetails.onCreated(function () {
  this.orderId = () => Reaction.Router.getParam("_id");
  this.autorun(() => {
    if (this.orderId()) {
      this.subscribe("advancedFulfillmentOrder", this.orderId());
    }
  });
});

Template.orderDetails.helpers({
  order: function () {
    const orderId = Reaction.Router.getParam("_id");
    return Orders.findOne({_id: orderId});
  },
  currentStatus: function () {
    const currentStatus = this.advancedFulfillment.workflow.status;
    const generalTemplates = [
      "orderCreated",
      "orderPrinted",
      "orderPicked",
      "orderShipped",
      "orderIncomplete",
      "orderCompleted",
      "nonWarehouseOrder"
    ];
    // let generalTemplates = AdvancedFulfillment.assignmentStatuses;
    const valid = _.contains(generalTemplates, currentStatus);
    if (valid) {
      return "defaultStatus";
    }
    return currentStatus;
  },
  status: function () {
    return this.advancedFulfillment.workflow.status;
  },
  actualTransitTime: function () {
    return this.advancedFulfillment.transitTime;
  },
  actionStatus: function () {
    return AdvancedFulfillment.humanActionStatuses[this.advancedFulfillment.workflow.status];
  },
  humanStatus: function () {
    return AdvancedFulfillment.humanOrderStatuses[this.advancedFulfillment.workflow.status];
  },
  progressStatus: function () {
    return AdvancedFulfillment.orderProgressStatus[this.advancedFulfillment.workflow.status];
  },
  progressStatusNote: function () {
    return AdvancedFulfillment.orderProgressStatusNotes[this.advancedFulfillment.workflow.status];
  },
  orderCreated: function () {
    return this.advancedFulfillment.workflow.status === "orderCreated";
  },
  nextStatus: function () {
    const currentStatus = this.advancedFulfillment.workflow.status;
    const options = AdvancedFulfillment.workflow;
    const indexOfStatus = _.indexOf(options, currentStatus);
    return options[indexOfStatus + 1];
  },
  readyForAssignment: function () {
    const status = this.advancedFulfillment.workflow.status;
    const assignmentStatuses = AdvancedFulfillment.assignmentStatuses;
    return _.contains(assignmentStatuses, status);
  },
  shippingAddress() {
    // Currently assumes 1 address per order as is the limit in RC core as of 0.17.x
    return this.shipping[0].address;
  },
  billingAddress() {
    // Currently assumes 1 address per order as is the limit in RC core as of 0.17.x
    return this.billing[0].address;
  },
  paymentInfo() {
    const source = this.billing[0].paymentMethod.transactions[0].source;
    return {
      name: source.name,
      brand: source.brand,
      last4: source.last4
    };
  },
  destination() {
    if (Array.isArray(this.shipping) && this.shipping[0] && this.shipping[0].address) {
      return this.shipping[0].address.region;
    }
    return "";
  },
  contactInfo: function () {
    return this.email || "Checked Out As Guest";
  },
  phoneNumber: function () {
    return this.shipping[0].address.phone || "Missing Phone";
  },
  printLabel: function () {
    const status = this.advancedFulfillment.workflow.status;
    return status === "orderFulfilled";
  },
  currentlyAssignedUser: function () {
    const currentStatus = this.advancedFulfillment.workflow.status;
    const history = _.findWhere(this.history, {event: currentStatus});
    const assignedUser = history.userId;
    return Meteor.users.findOne(assignedUser).username;
  },
  currentlyAssignedTime: function () {
    const currentStatus = this.advancedFulfillment.workflow.status;
    const history = _.findWhere(this.history, {event: currentStatus});
    const assignedTime = history.updatedAt;
    return assignedTime;
  },
  noItemsToPick: function () {
    const numberOfItems = this.advancedFulfillment.items.length;
    const status = this.advancedFulfillment.workflow.status;
    if (status !== "nonWarehouseOrder") {
      return numberOfItems === 0;
    }
    return false;
  },
  myOrdersInCurrentStep: function () {
    const currentStatus = this.advancedFulfillment.workflow.status;
    const history = _.findWhere(this.history, {event: currentStatus});
    if (!history) {
      return false;
    }
    // TODO: Maybe change to cursor?
    const orders = Orders.find({
      "history.userId": Meteor.userId(),
      "history.event": currentStatus,
      "advancedFulfillment.workflow.status": currentStatus
    }).fetch();
    const myOrder = history.userId === Meteor.userId();
    const myOrders = {};
    const currentOrder = getIndexBy(orders, "_id", this._id);
    const nextOrder = myOrder ? orders[currentOrder - 1] : undefined;
    const prevOrder = myOrder ? orders[currentOrder + 1] : undefined;
    myOrders.nextOrderId = nextOrder ? nextOrder._id : undefined;
    myOrders.hasNextOrder = nextOrder ? true : false;
    myOrders.hasPrevOrder = prevOrder ? true : false;
    myOrders.prevOrderId = prevOrder ? prevOrder._id : undefined;
    myOrders.count = orders.length;
    return myOrders;
  },
  hasShippingInfo: function () {
    return this.advancedFulfillment.shippingHistory;
  },
  fedExShipping: function () {
    const transitTimes = ReactionCore.Collections.Packages.findOne({
      name: "transit-times",
      shopId: ReactionCore.getShopId()
    });
    if (transitTimes && transitTimes.settings && transitTimes.settings.selectedShippingProvider === "fedex") {
      return true;
    }
    return false;
  },
  upsShipping: function () {
    const transitTimes = ReactionCore.Collections.Packages.findOne({
      name: "transit-times",
      shopId: ReactionCore.getShopId()
    });
    if (transitTimes && transitTimes.settings && transitTimes.settings.selectedShippingProvider === "ups") {
      return true;
    }
    return false;
  },
  hasCustomerServiceIssue: function () {
    const issues = [
      this.infoMissing,
      this.itemMissingDetails,
      this.bundleMissingColor,
      this.advancedFulfillment.impossibleShipDate
    ];
    return _.some(issues);
  },
  typeofIssue: function () {
    let issues = "";
    if (this.infoMissing) {
      issues += labelMaker("Missing Rental Dates");
    }
    if (this.itemMissingDetails) {
      issues += labelMaker("Items Missing Color and Size");
    }
    if (this.bundleMissingColor) {
      issues += labelMaker("Bundle Packages Were Assigned Default Color");
    }
    if (this.bundleMissingColor) {
      issues += labelMaker("Arrive By Date is Impossible to Fulfill");
    }
    return "<h4>" + issues + "</h4>";
  }
});

// Template.orderDetails.onRendered(function () {
//   let orderId = ReactionRouter.getParam("_id");
//   $("#barcode").barcode(orderId, "code128", {
//     barWidth: 2,
//     barHeight: 150,
//     moduleSize: 15,
//     showHRI: true,
//     fontSize: 14
//   });
// });

Template.orderDetails.events({
  "click .advanceOrder": function (event) {
    event.preventDefault();
    const currentStatus = this.advancedFulfillment.workflow.status;
    const orderId = this._id;
    const userId = Meteor.userId();
    const orderShipped = currentStatus === "orderShipped";
    if (orderShipped) {
      Meteor.call("advancedFulfillment/updateItemsToShippedOrCompleted", this);
    }
    const noRentals = _.every(this.advancedFulfillment.items, function (afItem) {
      return afItem.functionalType === "variant";
    });
    if (orderShipped && noRentals) {
      Meteor.call("advancedFulfillment/bypassWorkflowAndComplete", orderId, userId);
    } else {
      Meteor.call("advancedFulfillment/updateOrderWorkflow", orderId, userId, currentStatus);
    }
  },
  "submit .add-notes": function (event) {
    event.preventDefault();
    const note = event.currentTarget.note.value;

    if (note) {
      const order = this;
      // Meteor.call("advancedFulfillment/updateOrderNotes", order, note, user);
      Meteor.call("advancedFulfillment/addOrderNote", order._id, note);
      Alerts.removeSeen();
      // TODO: place this strategically
      Alerts.add("Order Note Added", "success", {
        autoHide: true
      });
      event.currentTarget.note.value = "";
    } else {
      Alerts.removeSeen();
      Alerts.add("Order Note Cannot Be Blank", "danger", {
        autoHide: true
      });
    }
  },
  "click .print-invoice": function () {
    const orderId = event.target.dataset.orderId;
    const userId = Meteor.userId();
    Meteor.call("advancedFulfillment/printInvoice", orderId, userId);
  },
  "click .noWarehouseItems": function (event) {
    event.preventDefault();
    const orderId = this._id;
    const userId = Meteor.userId();
    Meteor.call("advancedFulfillment/nonWarehouseOrder", orderId, userId);
  }
});

Template.shippingLabel.helpers({
  label() {
    const processedOrder = this.advancedFulfillment;
    const label = {};

    if (!processedOrder) {
      return label;
    }

    if (processedOrder.localDelivery) {
      label.style = "info";
      label.content = "local";
      return label;
    }

    const now = new Date();
    const shipBy = moment(processedOrder.shipmentDate).startOf("day").add(16, "hours").toDate();

    if (now > shipBy) {
      label.style = "danger";
      label.content = "rush";
    } else if (processedOrder.rushDelivery) {
      label.style = "warning";
      label.content = "rush";
    } else {
      label.style = "primary";
      label.content = "ground";
    }

    return label;
  }
});
