import { ReactionProduct } from "/lib/api";
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

/*
 * Template helpers for cart
 *
 */
/**
 * filteredVariantOption
 * @param   {String} variantOption - option name or title from a variant
 * @returns {String} filtered variantOption without single color, size, or option variant titles
 */

Template.registerHelper("filteredVariantOption", function (variantOption) {
  if (variantOption) {
    return variantOption.replace(/(?:One|No)\s+(?:Color|Size|Option)/i, "");
  }
  return "";
});

Template.registerHelper("filteredVariantGender", function (variantGender) {
  if (variantGender) {
    return variantGender.replace(/unisex/i, "");
  }
  return "";
});

Template.registerHelper("hasReservationDates", function (order) {
  if (order && order.startTime && order.endTime) {
    return true;
  }
  if (this && this.startTime && this.endTime) {
    return true;
  }
  return false;
});

Template.registerHelper("orderStartReservationHuman", function (order) {
  if (order && order.startTime) {
    return moment(adjustDenverToLocalTime(moment(order.startTime))).format("ddd M/DD");
  }

  if (this && this.startTime) {
    return moment(adjustDenverToLocalTime(moment(this.startTime))).format("ddd M/DD");
  }

  return "";
});

Template.registerHelper("orderEndReservationHuman", function (order) {
  if (order && order.endTime) {
    return moment(adjustDenverToLocalTime(moment(order.endTime))).format("ddd M/DD");
  }
  if (this && this.endTime) {
    return moment(adjustDenverToLocalTime(moment(this.endTime))).format("ddd M/DD");
  }

  return "";
});

Template.registerHelper("orderArrivalHuman", function (order) {
  if (order && order.endTime) {
    return moment(adjustDenverToLocalTime(moment(order.endTime).subtract(1, "day"))).format("ddd M/DD");
  }
  if (this && this.endTime) {
    return moment(adjustDenverToLocalTime(moment(this.endTime).subtract(1, "day"))).format("ddd M/DD");
  }

  return "";
});

// Returns bool whether or not display price is zero
Template.registerHelper("isZero", function (price) {
  return price === 0 || price === "0.00";
});
