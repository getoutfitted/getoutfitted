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
  const arriveBy = transit.getArriveBy();
  const startTime = transit.getStartTime();
  const endTime = transit.getEndTime();
  const shipReturnBy = transit.getShipReturnBy();
  const returnDate = transit.calculateReturnDay();

  const datesToReserve = [];
  const detailsToReserve = [];

  const reservation = moment(shipmentDate).twix(moment(returnDate).add(turnaroundTime, "days"), { allDay: true });
  const iter = reservation.iterate("days"); // Momentjs twix iterator
  while (iter.hasNext()) {
    let reason = "Waiting For Transit";
    const requestedDate = iter.next().toDate();
    const denverRequestedDate = GetOutfitted.adjustLocalToDenverTime(requestedDate);
    datesToReserve.push(denverRequestedDate);
    const ts = +denverRequestedDate;
    if (+ts <= +shipmentDate) {
      reason = "Shipped";
    } else if (+ts < +arriveBy) {
      reason = "In Transit";
    } else if (+ts < +startTime) {
      reason = "Delivered";
    } else if (+ts <= +endTime) {
      reason = "In Use";
    } else if (+ts < +shipReturnBy) {
      reason = "Waiting For Transit";
    } else if (+ts === +shipReturnBy) {
      reason = "Return Shipped";
    } else if (+ts < +returnDate) {
      reason = "Return In Transit";
    } else if (+ts === +returnDate) {
      reason = "Return Delivered";
    } else {
      reason = "Return Processing";
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
