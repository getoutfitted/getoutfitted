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

AdvancedFulfillment.orderProgressStatus = {
  "orderCreated": "Mark as Printed",
  "orderPrinted": "Mark as Picked",
  "orderPicking": "Mark as Picked",
  "orderPicked": "Mark as Packed",
  "orderPacking": "Mark as Packed",
  "orderPacked": "Mark as Labeled",
  "orderReadyToShip": "Mark as Shipped",
  "orderShipped": "Mark as Returned",
  "orderReturned": "Archive Order",
  "orderComplete": "View Order",
  "orderIncomplete": "View Order"
};

AdvancedFulfillment.orderProgressStatusNotes = {
  "orderCreated": "",
  "orderPrinted": "",
  "orderPicking": "",
  "orderPicked": "",
  "orderPacking": "",
  "orderPacked": "",
  "orderReadyToShip": "When hooked into AfterShip, shipped status will automatically update when order is picked up by carrier",
  "orderShipped": "",
  "orderReturned": "",
  "orderComplete": "",
  "orderIncomplete": ""
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
AdvancedFulfillment.itemStatus = ["In Stock", "picked", "packed", "shipped"];

AdvancedFulfillment.localDeliveryZipcodes = [
  "80424",
  "80435",
  "80443",
  "80497",
  "80498",
  "81657",
  "81620",
  "81657"
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

AdvancedFulfillment.dateFormatter = function (date) {
  return moment(date).format("MMMM Do, YYYY");
};

AdvancedFulfillment.orderNoteIcons = {
  note: "fa fa-sticky-note cancel-color"
};
