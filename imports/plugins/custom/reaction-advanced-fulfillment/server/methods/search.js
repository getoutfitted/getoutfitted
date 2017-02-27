import { Meteor } from "meteor/meteor";
import { Orders } from "/lib/collections";

Meteor.methods({
  "advancedFulfillment/findOrderByOrderNumber": function (orderNumber) {
    check(orderNumber, String);
    const order = Orders.findOne({orderNumber: parseInt(orderNumber, 10)});
    if (order) {
      return order._id;
    }
    return "";
  }
});
