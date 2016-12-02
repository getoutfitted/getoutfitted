import { _ } from "meteor/underscore";
import moment from "moment";
import { Meteor } from "meteor/meteor";
import { Reaction } from "/client/api";
import { Template } from "meteor/templating";
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
  order() {
    const orderId = Reaction.Router.getParam("_id");
    return Orders.findOne({_id: orderId});
  },
  shipmentDetails() {
    return this.advancedFulfillment.shippingHistory;
  },
  orderActions() {
    const status = this.advancedFulfillment.workflow.status;
    if (AdvancedFulfillment.assignmentStatuses.indexOf(status) !== -1) {
      return "orderAssignmentActions";
    }
    return `${status}Actions`;
  },
  currentStatus: function () {
    const currentStatus = this.advancedFulfillment.workflow.status;
    const generalTemplates = [
      "orderCreated",
      "orderPrinted",
      "orderPicking",
      "orderPicked",
      "orderPacking",
      "orderPacked",
      "orderShipped",
      "orderReturned",
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
  orderIsNew: function () {
    return this.advancedFulfillment.workflow.status === "orderCreated";
  },
  shippingAddress() {
    // Currently assumes 1 address per order as is the limit in RC core as of 0.17.x
    if (Array.isArray(this.shipping) && this.shipping[0]) {
      return this.shipping[0].address;
    }
    return {};
  },
  billingAddress() {
    // Currently assumes 1 address per order as is the limit in RC core as of 0.17.x
    if (Array.isArray(this.billing) && this.billing[0]) {
      return this.billing[0].address;
    }
    return {};
  },
  paymentInfo() {
    const source = this.billing[0].paymentMethod.transactions[0].source;
    return {
      name: source.name,
      brand: source.brand,
      last4: source.last4
    };
  },
  phone() {
    if (Array.isArray(this.shipping) && this.shipping[0] && this.shipping[0].address) {
      return this.shipping[0].address.phone;
    }
    return "Unavailable";
  },
  noItemsToPick: function () {
    const numberOfItems = this.advancedFulfillment.items.length;
    const status = this.advancedFulfillment.workflow.status;
    if (status !== "nonWarehouseOrder") {
      return numberOfItems === 0;
    }
    return false;
  },
  hasShippingInfo: function () {
    return this.advancedFulfillment.shippingHistory;
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
  "click .advanceOrder": function () {
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
      Meteor.call("advancedFulfillment/updateOrderWorkflow", orderId, currentStatus);
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
    Meteor.call("advancedFulfillment/printInvoice", orderId, userId);
  },
  "click .noWarehouseItems": function (event) {
    event.preventDefault();
    const orderId = this._id;
    const userId = Meteor.userId();
    Meteor.call("advancedFulfillment/nonWarehouseOrder", orderId, userId);
  }
});

Template.orderDetailHeader.helpers({
  humanStatus() {
    return AdvancedFulfillment.humanOrderStatus[this.advancedFulfillment.workflow.status];
  }
});

Template.backpackShipmentDetails.helpers({
  shippingProviderIsUPS: function () {
    const transitTimes = ReactionCore.Collections.Packages.findOne({
      name: "transit-times",
      shopId: ReactionCore.getShopId()
    });
    if (transitTimes && transitTimes.settings && transitTimes.settings.selectedShippingProvider === "ups") {
      return true;
    }
    return false;
  }
});

Template.backpackReservationDetails.helpers({
  transitTime() {
    return this.advancedFulfillment.transitTime;
  },
  destination() {
    if (Array.isArray(this.shipping) && this.shipping[0] && this.shipping[0].address) {
      return this.shipping[0].address.region;
    }
    return "";
  }
});

Template.backpackOrderNotes.helpers({
  notes() {
    const order = this;
    if (order.backpackOrderNotes) {
      return order.backpackOrderNotes.filter(note => note.type === "Note");
    }
    return [];
  },
  statusUpdates() {
    const order = this;
    const updates = ["Status Update", "Status Revision"];
    if (order.backpackOrderNotes) {
      return order.backpackOrderNotes.filter(note => updates.indexOf(note.type) !== -1).reverse();
    }
    return [];
  },
  orderExceptions() {
    const order = this;
    const exceptions = ["Missing Product", "Damaged Product"];
    if (order.backpackOrderNotes) {
      return order.backpackOrderNotes.filter(note => exceptions.indexOf(note.type) !== -1);
    }
    return [];
  }
});

Template.backpackOrderNote.helpers({
  icon(type) {
    return AdvancedFulfillment.orderNoteIcons[type];
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
