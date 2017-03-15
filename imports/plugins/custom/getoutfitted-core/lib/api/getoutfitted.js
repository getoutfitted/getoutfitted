import { ReactiveDict } from "meteor/reactive-dict";
import moment from "moment";
import "moment-timezone";

export const GetOutfitted = {};

GetOutfitted.localDestinations = [80424, 80443, 80435];

GetOutfitted.adjustLocalToDenverTime = function (time) {
  const here = moment(time);
  const denver = here.clone().tz("America/Denver");
  denver.add(here.utcOffset() - denver.utcOffset(), "minutes");
  return denver.toDate();
};

GetOutfitted.adjustDenverToLocalTime = function (time) {
  const denver = moment(time).tz("America/Denver");
  const here = moment(time);
  here.add(denver.utcOffset() - here.utcOffset(), "minutes");
  return here.toDate();
};

// TODO: Maybe move this into rental products?
GetOutfitted.clientReservationDetails = new ReactiveDict();

GetOutfitted.shippingMethods = {};

GetOutfitted.shippingMethods.freeShippingMethod = {
  name: "Free",
  label: "Free Shipping",
  group: "Ground",
  enabled: true,
  rate: 0,
  validLocales: [ { deliveryBegin: 2, deliveryEnd: 7 } ],
  validRanges: [ { begin: 50 } ],
  _id: "GoFreeShippingMethod",
  handling: 0
};

GetOutfitted.shippingMethods.rushShippingMethod = {
  name: "Rush",
  label: "Rush Handling and Delivery",
  group: "Express",
  enabled: true,
  rate: 39,
  validLocales: [ { deliveryBegin: 2, deliveryEnd: 7 } ],
  validRanges: [ { begin: 50 } ],
  _id: "GoRushShippingMethod",
  handling: 0
};
