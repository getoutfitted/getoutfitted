import moment from "moment";
import "twix";
import { Orders } from "/lib/collections";
import RentalProducts from "../../lib/api";
import { GetOutfitted } from "/imports/plugins/custom/getoutfitted-core/lib/api";
import { Transit } from "/imports/plugins/custom/transit-times/server/api";

RentalProducts.server = {};

RentalProducts.server.permissions = [
  "admin",
  "owner",
  "dashboard/rental-products",
  "reaction-rental-products"
];

RentalProducts.server.buildUnavailableInventoryArrays = function (orderId, turnaroundTime = 1) {
  check(orderId, String);
  check(turnaroundTime, Match.Maybe(Number));

  const order = Orders.findOne({_id: orderId});
  const transit = new Transit(order);
  const shipmentDate = order.advancedFulfillment.shipmentDate;
  const shippingTime = transit.calculateTotalShippingDays();

  const returnDate = order.advancedFulfillment.returnDate;
  const returnTime = transit.calculateTotalReturnDays();

  const datesToReserve = [];
  const detailsToReserve = [];

  const reservation = moment(shipmentDate).twix(moment(returnDate).add(turnaroundTime, "days"), { allDay: true });
  const reservationLength = reservation.count("days");
  const iter = reservation.iterate("days"); // Momentjs twix iterator

  let counter = 0;
  while (iter.hasNext()) {
    let reason = "In Use";
    const requestedDate = iter.next().toDate();
    const denverRequestedDate = GetOutfitted.adjustLocalToDenverTime(requestedDate);
    datesToReserve.push(denverRequestedDate);

    // Insert into Unavailable Details
    if (counter === 0) {
      reason = "Shipped";            // First reservation day is when order is shipped from warehouse
    } else if (counter === shippingTime) {
      reason = "Delivered";          //
    } else if (counter - 1 < shippingTime) {
      reason = "In Transit";         // Second day through transitTime is delivery
    } else if (counter === reservationLength - returnTime - turnaroundTime - 1) {
      reason = "Return Shipped";
    } else if (counter === reservationLength - turnaroundTime - 1) {
      reason = "Return Delivered";
    } else if (counter >= reservationLength - turnaroundTime) {
      reason = "Return Processing";
    } else if (counter >= reservationLength - returnTime - turnaroundTime) {
      reason = "Return In Transit";
    }

    detailsToReserve.push({
      date: denverRequestedDate,
      reason: reason,
      orderId: orderId
    });
    counter++;
  }  // Create array of requested dates
  return {datesToReserve, detailsToReserve};
};


export default RentalProducts;
