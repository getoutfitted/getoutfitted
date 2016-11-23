import moment from "moment";
import "twix";
import { Template } from "meteor/templating";
import { check } from "meteor/check";
import AdvancedFulfillment from "../../lib/api";

Template.registerHelper("displayOrderNumber", (order) => {
  if (order.orderNumber) {
    return "Order #" + order.orderNumber;
  }
  // Default
  return "Order #" + order._id;
});

Template.registerHelper("showOrderNumber", (order) => {
  if (order.orderNumber) {
    return order.orderNumber;
  }
  // Default
  return  order._id;
});

Template.registerHelper("formattedDate", (date) => {
  if (!date) {
    return "---------------";
  }
  return moment(date).calendar(null, AdvancedFulfillment.shippingCalendarReference);
});

Template.registerHelper("formatInputDate", (date) => {
  return moment(date).format("MM/DD/YYYY");
});

Template.registerHelper("formattedRange", (start, end) => {
  return moment(start).twix(end, {allDay: true}).format({
    monthFormat: "MMMM",
    dayFormat: "Do"
  });
});

// TODO: Rename to something like dateError
Template.registerHelper("pastDate", (date) => {
  check(date, Match.Maybe(Date));
  if (!date) {
    // if date is undefined or null, there"s an issue, flag it.
    return true;
  }
  return new Date() > moment(date).startOf("day").add(16, "hours");
});

Template.registerHelper("hasCustomerServiceIssue", (order) => {
  const issues = [
    order.advancedFulfillment.items.length === 0
  ];
  return _.some(issues);
});
