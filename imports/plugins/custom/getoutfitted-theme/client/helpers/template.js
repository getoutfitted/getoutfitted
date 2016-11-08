import { ReactionProduct } from "/lib/api";
import { Router } from "/client/api";
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
    return moment(adjustDenverToLocalTime(moment(order.startTime))).subtract(1, "day").format("ddd M/DD");
  }
  if (this && this.endTime) {
    return moment(adjustDenverToLocalTime(moment(this.startTime))).subtract(1, "day").format("ddd M/DD");
  }

  return "";
});

// Cart / Order Date Helpers
Template.registerHelper("orderStartDay", function (order) {
  let startTime;
  if (order && order.startTime) {
    startTime = order.startTime;
  } else if (this && this.startTime) {
    startTime = this.startTime;
  } else {
    return "";
  }

  return moment(adjustDenverToLocalTime(moment(startTime))).format("dddd");
});

Template.registerHelper("orderStartDate", function (order) {
  let startTime;
  if (order && order.startTime) {
    startTime = order.startTime;
  } else if (this && this.startTime) {
    startTime = this.startTime;
  } else {
    return "";
  }

  return moment(adjustDenverToLocalTime(moment(startTime))).format("DD");
});

Template.registerHelper("orderStartMonth", function (order) {
  let startTime;
  if (order && order.startTime) {
    startTime = order.startTime;
  } else if (this && this.startTime) {
    startTime = this.startTime;
  } else {
    return "";
  }

  return moment(adjustDenverToLocalTime(moment(startTime))).format("MMM");
});

Template.registerHelper("orderEndDay", function (order) {
  let endTime;
  if (order && order.endTime) {
    endTime = order.endTime;
  } else if (this && this.endTime) {
    endTime = this.endTime;
  } else {
    return "";
  }

  return moment(adjustDenverToLocalTime(moment(endTime))).format("dddd");
});

Template.registerHelper("orderEndDate", function (order) {
  let endTime;
  if (order && order.endTime) {
    endTime = order.endTime;
  } else if (this && this.endTime) {
    endTime = this.endTime;
  } else {
    return "";
  }

  return moment(adjustDenverToLocalTime(moment(endTime))).format("DD");
});

Template.registerHelper("orderEndMonth", function (order) {
  let endTime;
  if (order && order.endTime) {
    endTime = order.endTime;
  } else if (this && this.endTime) {
    endTime = this.endTime;
  } else {
    return "";
  }

  return moment(adjustDenverToLocalTime(moment(endTime))).format("MMM");
});

Template.registerHelper("orderDeliveryDay", function (order) {
  let startTime;
  if (order && order.startTime) {
    startTime = order.startTime;
  } else if (this && this.startTime) {
    startTime = this.startTime;
  } else {
    return "";
  }

  return moment(adjustDenverToLocalTime(moment(startTime))).subtract(1, "day").format("dddd");
});

Template.registerHelper("orderDeliveryDate", function (order) {
  let startTime;
  if (order && order.startTime) {
    startTime = order.startTime;
  } else if (this && this.startTime) {
    startTime = this.startTime;
  } else {
    return "";
  }

  return moment(adjustDenverToLocalTime(moment(startTime))).subtract(1, "day").format("DD");
});

Template.registerHelper("orderDeliveryMonth", function (order) {
  let startTime;
  if (order && order.startTime) {
    startTime = order.startTime;
  } else if (this && this.startTime) {
    startTime = this.startTime;
  } else {
    return "";
  }

  return moment(adjustDenverToLocalTime(moment(startTime))).subtract(1, "day").format("MMM");
});

Template.registerHelper("summaryStartDate", function (order) {
  let startTime;
  if (order && order.startTime) {
    startTime = order.startTime;
  } else if (this && this.startTime) {
    startTime = this.startTime;
  } else {
    return "";
  }

  return moment(adjustDenverToLocalTime(moment(startTime))).format("MMM D");
});

Template.registerHelper("summaryEndDate", function (order) {
  let endTime;
  if (order && order.endTime) {
    endTime = order.endTime;
  } else if (this && this.endTime) {
    endTime = this.endTime;
  } else {
    return "";
  }

  return moment(adjustDenverToLocalTime(moment(endTime))).format("MMM D");
});

Template.registerHelper("summaryDeliveryDate", function (order) {
  let startTime;
  if (order && order.startTime) {
    startTime = order.startTime;
  } else if (this && this.startTime) {
    startTime = this.startTime;
  } else {
    return "";
  }

  return moment(adjustDenverToLocalTime(moment(startTime))).subtract(1, "day").format("MMM D");
});

Template.registerHelper("viewingCart", () => {
  return Router.current().route.name === "cart";
});

// Returns bool whether or not display price is zero
Template.registerHelper("isZero", function (price) {
  return price === 0 || price === "0.00";
});
