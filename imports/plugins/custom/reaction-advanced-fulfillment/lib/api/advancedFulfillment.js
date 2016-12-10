import moment from "moment";
export default AdvancedFulfillment = {};

AdvancedFulfillment.humanActionStatus = {
  "orderCreated": "Print Order",
  "orderPrinted": "Pick Order",
  "orderPicking": "Pick Order",
  "orderPicked": "Pack Order",
  "orderPacking": "Pack Order",
  "orderPacked": "Label Order",
  "orderReadyToShip": "Ship Order",
  "orderShipped": "Return Order",
  "orderReturned": "Archive Order",
  "orderComplete": "View Order",
  "orderIncomplete": "View Order"
};

AdvancedFulfillment.humanOrderStatus = {
  "orderCreated": "Ready",
  "orderPrinted": "Printed",
  "orderPicking": "Picking",
  "orderPicked": "Picked",
  "orderPacking": "Packing",
  "orderPacked": "Packed",
  "orderReadyToShip": "Labeled",
  "orderShipped": "Shipped",
  "orderReturned": "Returned",
  "orderCompleted": "Complete",
  "orderIncomplete": "Incomplete",
  "nonWarehouseOrder": "nonWarehouseOrder",
  "orderCancelled": "Cancelled"
};

AdvancedFulfillment.workflow = {
  orderCreated: "orderPrinted",
  orderPrinted: "orderPicking",
  orderPicking: "orderPicked",
  orderPicked: "orderPacking",
  orderPacking: "orderPacked",
  orderPacked: "orderReadyToShip",
  orderReadyToShip: "orderShipped",
  orderShipped: "orderReturned",
  orderReturned: "orderCompleted",
  orderIncomplete: "orderCompleted",
  orderCompleted: "orderCompleted"
};

AdvancedFulfillment.reverseWorkflow = {
  orderCreated: "orderCreated",
  orderPrinted: "orderCreated",
  orderPicking: "orderPrinted",
  orderPicked: "orderPicking",
  orderPacking: "orderPicked",
  orderPacked: "orderPacking",
  orderReadyToShip: "orderPacked",
  orderShipped: "orderReadyToShip",
  orderReturned: "orderShipped",
  orderIncomplete: "orderReturned",
  orderCompleted: "orderReturned"
};

AdvancedFulfillment.workflowSteps = [
  "orderCreated",
  "orderPrinted",
  "orderPicking",
  "orderPicked",
  "orderPacking",
  "orderPacked",
  "orderReadyToShip",
  "orderShipped",
  "orderReturned"
];

AdvancedFulfillment.orderActive = [
  "orderCreated",
  "orderPrinted",
  "orderPicking",
  "orderPicked",
  "orderPacking",
  "orderPacked",
  "orderReadyToShip"
];

AdvancedFulfillment.orderShipping = [
  "orderCreated",
  "orderPrinted",
  "orderPicking",
  "orderPicked",
  "orderPacking",
  "orderPacked",
  "orderReadyToShip"
];

AdvancedFulfillment.orderInQueue = [
  "orderCreated",
  "orderPrinted",
  "orderPicking",
  "orderPicked",
  "orderPacking",
  "orderPacked",
  "orderReadyToShip",
  "orderShipped",
  "orderReturned"
];

AdvancedFulfillment.orderReturning = [
  "orderShipped",
  "orderReturned"
];

AdvancedFulfillment.orderArchivedStatus = [
  "orderComplete",
  "orderIncomplete"
];

AdvancedFulfillment.assignmentStatuses = ["orderPrinted", "orderPicked",  "orderShipped"];

AdvancedFulfillment.nonAssignmentStatuses = ["orderCreated", "orderPicking", "orderPacking", "orderPacked", "orderReturned"];

AdvancedFulfillment.itemStatus = [
  "In Stock",
  "picked",
  "packed",
  "shipped"
];

AdvancedFulfillment.itemWorkflow = {
  "In Stock": "picked",
  "picked": "packed",
  "packed": "shipped",
  "shipped": "returned",
  "returned": "completed",
  "completed": "completed"
};

AdvancedFulfillment.reverseItemWorkflow = {
  "In Stock": "In Stock",
  "picked": "In Stock",
  "packed": "picked",
  "shipped": "packed",
  "returned": "shipped",
  "completed": "returned"
};

AdvancedFulfillment.localDeliveryZipcodes = [
  "80424",
  "80435",
  "80443",
  "80497",
  "80498"
];

AdvancedFulfillment.calendarReferenceTime = {
  sameDay: "[Today]",
  nextDay: "[Tomorrow]",
  nextWeek: "dddd MMM D",
  lastDay: "[Yesterday]",
  lastWeek: "dddd MMM D",
  sameElse: "ll"
};

AdvancedFulfillment.shippingCalendarReference = {
  sameDay: "[Today] MMM D",
  nextDay: "[Tomorrow]  MMM D",
  nextWeek: "dddd MMM D",
  lastDay: "[Yesterday] MMM D",
  lastWeek: "[Last] dddd MMM D",
  sameElse: "ddd MMM D"
};

AdvancedFulfillment.orderNoteIcons = {
  "Note": "fa fa-pencil-square-o cancel-color",
  "Status Update": "fa fa-check success-color",
  "Status Revision": "fa fa-undo warning-color",
  "Missing Product": "fa fa-question cancel-color",
  "Damaged Product": "fa fa-wrench warning-color",
  "Product Added": "fa fa-plus info-color",
  "Product Exchanged": "fa fa-exchange warning-color",
  "Product Removed": "fa fa-times danger-color",
  "Order Cancelled": "fa fa-times danger-color",
  "Order Rescheduled": "fa fa-exchange warning-color",
  "Order Destination Changed": "fa fa-address-card-o warning-color"
};

AdvancedFulfillment.dateFormatter = function (date) {
  return moment(date).format("MMMM Do, YYYY");
};

AdvancedFulfillment.isLocalAddress = function (addressOrPostal) {
  check(addressOrPostal, Match.OneOf(Object, Number));
  if (typeof addressOrPostal === "object" && addressOrPostal.postal) {
    return AdvancedFulfillment.localDeliveryZipcodes.indexOf(addressOrPostal.postal) !== -1;
  }
  return AdvancedFulfillment.localDeliveryZipcodes.indexOf(addressOrPostal) !== -1;
};

AdvancedFulfillment.timeSince = function (eventTime) {
  const ms = moment().diff(moment(eventTime));
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

  let stringTimeSince = seconds;
  if (seconds < 10) {
    stringTimeSince = "0" + seconds;
  }
  if (ms > 1000 * 60) {
    stringTimeSince = minutes + ":" + stringTimeSince;
  }
  if (ms > 1000 * 60 * 60) {
    stringTimeSince = hours + ":" + stringTimeSince;
  }

  return stringTimeSince;
};
