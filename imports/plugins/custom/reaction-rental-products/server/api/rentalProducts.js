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

RentalProducts.server.buildUnavailableInventoryArrays = function (orderId, transitObj, turnaroundTime = 1) {
  check(orderId, String);
  check(transitObj, Match.Any);
  check(turnaroundTime, Match.Maybe(Number));

  let transit;
  let order;
  if (transitObj) {
    transit = transitObj;
  } else {
    order = Orders.findOne({_id: orderId});
    transit = new Transit(order);
  }
  const shipmentDate = transit.calculateShippingDay();
  const shippingTime = transit.calculateTotalShippingDays();

  const returnDate = transit.calculateReturnDay();
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
      reason = "Shipped"; // First reservation day is when order is shipped from warehouse
    } else if (counter === shippingTime - 1) {
      reason = "Delivered";          //
    } else if (counter < shippingTime - 1) {
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
