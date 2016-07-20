import moment from "moment";
import "moment-timezone";

function adjustLocalToDenverTime(time) {
  let here = moment(time);
  let denver = here.clone().tz("America/Denver");
  denver.add(here.utcOffset() - denver.utcOffset(), "minutes");
  return denver.toDate();
}

function adjustDenverToLocalTime(time) {
  let denver = moment(time).tz("America/Denver");
  let here = moment(time);
  here.add(denver.utcOffset() - here.utcOffset(), "minutes");
  return here.toDate();
}


Template.registerHelper("fieldComponent", function () {
  if (ReactionCore.hasPermission("createProduct")) {
    return Template.productDetailEdit;
  }
  return Template.productDetailField;
});

Template.registerHelper("handleize", (str) => {
  let handle = str.toLowerCase();
  return handle.replace(/(\W+)/g, "-");
});

Template.registerHelper("displayTimeUnit", (timeUnit) => {
  if (timeUnit) {
    return timeUnit.slice(0, -1);
  }
  return "";
});

Template.registerHelper("startReservationHuman", () => {
  let cart = ReactionCore.Collections.Cart.findOne();
  if (cart && cart.startTime) {
    return moment(adjustDenverToLocalTime(moment(cart.startTime))).format("ddd M/DD");
  }
  return "";
});

Template.registerHelper("endReservationHuman", () => {
  let cart = ReactionCore.Collections.Cart.findOne();
  if (cart && cart.endTime) {
    return moment(adjustDenverToLocalTime(moment(cart.endTime))).format("ddd M/DD");
  }
  return "";
});
