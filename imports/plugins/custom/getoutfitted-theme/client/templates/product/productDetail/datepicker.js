import { ReactionProduct } from "/lib/api";
import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";
import { Cart, Products } from "/lib/collections";
import { InventoryVariants } from "/imports/plugins/custom/reaction-rental-products/lib/collections";
import $ from "jquery";
import "bootstrap-datepicker";
import moment from "moment";
import "twix";
import "moment-timezone";
import RentalProducts  from "/imports/plugins/custom/reaction-rental-products/lib/api";

const TransitTimes = {};

TransitTimes.calculateShippingDay = function (startTime, timeInTransit) {
  if (timeInTransit === 0) {
    return startTime;
  }

  const start = moment(startTime);
  let weekendArrivalDays = 0;
  if (start.isoWeekday() === 6) {
    weekendArrivalDays = weekendArrivalDays + 1;
  } else if (start.isoWeekday() === 7) {
    weekendArrivalDays = weekendArrivalDays + 2;
  }


  const shippingDay = moment(start).subtract(timeInTransit + weekendArrivalDays, "days");
  if (shippingDay.isoWeekday() + timeInTransit >= 6) {
    return shippingDay.subtract(2, "days").toDate();
  }
  return shippingDay.toDate();
};

TransitTimes.calculateReturnDay = function (endTime, timeInTransit) {
  check(endTime, Match.Optional(Date));
  check(timeInTransit, Number);

  if (timeInTransit === 0) {
    return endTime;
  }

  const end = moment(endTime);
  let weekendReturnDays = 0;
  if (end.isoWeekday() === 6) {
    weekendReturnDays = weekendReturnDays + 2;
  } else if (end.isoWeekday() === 7) {
    weekendReturnDays = weekendReturnDays + 1;
  }

  const dropoffDay = moment(end).add(weekendReturnDays, "days");
  const returnDay = moment(end).add(timeInTransit + weekendReturnDays, "days");
  if (dropoffDay.isoWeekday() + timeInTransit >= 6) {
    return returnDay.add(2, "days").toDate();
  }
  return returnDay.toDate();
};

// TODO: Move these to getoutfitted client API
function adjustLocalToDenverTime(time) {
  const here = moment(time);
  const denver = here.clone().tz("America/Denver");
  denver.add(here.utcOffset() - denver.utcOffset(), "minutes");
  return denver.toDate();
}

function adjustDenverToLocalTime(time) {
  const denver = moment(time).tz("America/Denver");
  const here = moment(time);
  here.add(denver.utcOffset() - here.utcOffset(), "minutes");
  return here.toDate();
}

const today = adjustLocalToDenverTime(moment().startOf("day"));

// function includedWeekendDays(startDay, endDay) {
//   const dayRange = moment(startDay).endOf("day").twix(moment(endDay).endOf("day"), {allDay: true});
//   const days = dayRange.count("days");
//   const weeks = Math.floor(days / 7);
//   const remainingDays = days % 7;
//   let skipDays = 0;
//   skipDays = 2 * weeks;
//   if (remainingDays === 0) {
//     return skipDays;
//   }
//   const leftovers = moment(startDay).twix(moment(startDay).add(remainingDays - 1, "days"));
//   const iter = leftovers.iterate("days");
//   while (iter.hasNext()) {
//     let next = iter.next();
//     if (next.isoWeekday() >= 6) {
//       skipDays++;
//     }
//   }
//   return skipDays;
// }
// // TODO: Add holiday calculations
// function calcShippingDay(startDay, timeInTransit) {
//   let start = moment(startDay);
//   let bonusTransitDays = 0;
//   if (start.isoWeekday() === 6) {
//     bonusTransitDays = bonusTransitDays + 1;
//   } else if (start.isoWeekday() === 7) {
//     bonusTransitDays = bonusTransitDays + 2;
//   }

//   shippingDays = timeInTransit;
//   let shippingDay = moment(start).subtract(timeInTransit + bonusTransitDays, "days");
//   if (shippingDay.isoWeekday() >= 6 || shippingDay.isoWeekday() + shippingDays >= 6) {
//     return shippingDay.subtract(2, "days");
//   }
//   return shippingDay;
// }

Template.reservationDatepicker.onCreated(function () {
  const variants = ReactionProduct.getVariants(this.data._id);
  const firstChild = variants.find(function (variant) {
    return variant.ancestors.length === 2;
  });
  if (firstChild) {
    ReactionProduct.setCurrentVariant(firstChild._id);
    Session.setDefault("selectedVariantId", firstChild._id);
  }
  this.autorun(() => {
    if (Session.get("selectedVariantId")) {
      this.subscribe("productReservationStatus", Session.get("selectedVariantId"));
      $("#rental-start").datepicker("update");
    }
  });
});


Template.reservationDatepicker.onRendered(function () {
  const variants = ReactionProduct.getVariants(this.data._id);
  const firstChild = variants.find(function (variant) {
    return variant.ancestors.length === 2;
  });
  const cart = Cart.findOne();
  // default reservation length is one less than customer facing and rental
  // bucket lengths because the datepicker includes the selected day
  // So duration is default to 5 for a 6 day rental.
  // let defaultReservationLength = 5;
  if (firstChild) {
    ReactionProduct.setCurrentVariant(firstChild._id);
    Session.set("selectedVariantId", firstChild._id);
    if (firstChild.rentalPriceBuckets) {
      // find duration - 1 of the price bucket because selected day is not included
      defaultReservationLength = firstChild.rentalPriceBuckets[0].duration - 1;
    }
    // TODO: If we can't find a price bucket, exit gracefully.
  }
  Session.setDefault("reservationLength", defaultReservationLength); // inclusive of return day, exclusive of arrivalDay
  Session.setDefault("nextMonthHighlight", 0);
  $("#rental-start").datepicker({
    startDate: "+4d",
    autoclose: true,
    endDate: "+540d",
    maxViewMode: 0,
    beforeShowDay: function (date) {
      const reservationLength = Session.get("reservationLength");
      let available;
      let classes = "";
      let tooltip = "";
      // Change date checkers to check against Denver time
      const s = adjustLocalToDenverTime(moment(date).startOf("day"));
      const e = adjustLocalToDenverTime(moment(date).startOf("day").add(reservationLength, "days"));
      const shippingDay = TransitTimes.calculateShippingDay(s, 4); // Default of 4 shipping days until zip-calculation is done
      const returnDay = TransitTimes.calculateReturnDay(e, 4); // Default of 4 ^^
      const inventoryVariantsAvailable = RentalProducts.checkInventoryAvailability(
        Session.get("selectedVariantId"),
        {startTime: shippingDay, endTime: returnDay}
      );

      available = inventoryVariantsAvailable.length > 0;
      if (available) {
        if (+s > +today) {
          tooltip = "Available!";
        } else {
          tooltip = "Pick a date in the future";
        }
      } else {
        tooltip = "Fully Booked";
      }


      let selectedDate = $("#rental-start").val();
      if (!selectedDate) {
        return {enabled: available, classes: classes, tooltip: tooltip};
      }
      selectedDate = moment(selectedDate, "MM/DD/YYYY").startOf("day");
      reservationEndDate = moment(selectedDate).startOf("day").add(reservationLength, "days");
      const compareDate = moment(date).startOf("day");
      if (+compareDate === +selectedDate) {
        if (!available) {
          // if dates are unavailable, reset dates;
          $("#add-to-cart").prop("disabled", true);
          if ($("#unavailable-note").length === 0) {
            $("#add-to-cart").parent().prepend(
              "<div class='small text-center' id='unavailable-note'>"
              + "<em>This product is unavailable for the selected dates</em></div>"
            );
          }
        } else {
          $("#add-to-cart").prop("disabled", false);
          $("#unavailable-note").remove();
        }
        inRange = true; // to highlight a range of dates
        return {enabled: available, classes: "selected selected-start", tooltip: "Woohoo, your adventure begins!"};
      } else if (+compareDate === +selectedDate.subtract(1, "days")) {
        return {enabled: available, classes: "arrivalSet", tooltip: "Your gear arrives!"};
      } else if (+compareDate === +reservationEndDate) {
        if (inRange) inRange = false;  // to stop the highlight of dates ranges
        return {enabled: available, classes: "selected selected-end", tooltip: "Rental day, have fun!"};
      }  else if (+compareDate === +reservationEndDate.add(1, "days")) {
        return {enabled: available, classes: "returnSet", tooltip: "Drop gear off at UPS by 3pm to be returned"};
      } else if (+compareDate > +selectedDate && +compareDate < +reservationEndDate) {
        inRange = true;
      } else if (+compareDate < +selectedDate || +compareDate > +reservationEndDate) {
        inRange = false;
      }

      if (inRange) {
        return {enabled: available, classes: "selected selected-range", tooltip: "Rental day, have fun!"}; // create a custom class in css with back color you want
      }
      return {enabled: available, classes: classes, tooltip: tooltip};
    }
  });

  const inventoryVariants = InventoryVariants.find();
  this.autorun(() => {
    if (inventoryVariants.fetch().length > 0) {
      $("#rental-start").datepicker("update");
    }
  });

  $(document).on({
    mouseenter: function () {
      const $nextWeeks = $(this).parent().nextAll().find(".day");
      const $remainingDaysThisWeek = $(this).nextAll();
      let numDaysToHighlight = Session.get("reservationLength");
      let $arrivalDay = $(this).prev();
      let $returnDay;
      if ($arrivalDay.length === 0) {
        $arrivalDay = $(this).parent().prev().children().last();
      }
      $arrivalDay.addClass("arrive-by");
      if ($remainingDaysThisWeek.length >= numDaysToHighlight) {
        $remainingDaysThisWeek.slice(0, numDaysToHighlight).addClass("highlight");
        $returnDay = $remainingDaysThisWeek.slice(numDaysToHighlight, numDaysToHighlight + 1);
        if ($returnDay.length === 0) {
          $returnDay = $(this).parent().next().children().first();
        }
        $returnDay.addClass("return-by");
        return $remainingDaysThisWeek.slice(numDaysToHighlight - 1, numDaysToHighlight).addClass("last-day");
      }
      $remainingDaysThisWeek.addClass("highlight");
      numDaysToHighlight = numDaysToHighlight - $remainingDaysThisWeek.length;
      $nextWeeks.slice(0, numDaysToHighlight).addClass("highlight");
      $returnDay = $nextWeeks.slice(numDaysToHighlight, numDaysToHighlight + 1);
      $returnDay.addClass("return-by");
      return $nextWeeks.slice(numDaysToHighlight - 1, numDaysToHighlight).addClass("last-day");
    },
    mouseleave: function () {
      $(".day").removeClass("highlight").removeClass("arrive-by").removeClass("last-day").removeClass("return-by");
    }
  }, ".day:not(.disabled)");

  $("#rental-start").on({
    changeDate: function (event) {
      $(".tooltip").remove();

      const reservationLength = Session.get("reservationLength");

      // Sets cart dates to Denver time - need to set as local time on display.
      const startDate = adjustLocalToDenverTime(moment(event.currentTarget.value, "MM/DD/YYYY").startOf("day"));
      const endDate = adjustLocalToDenverTime(moment(event.currentTarget.value, "MM/DD/YYYY").startOf("day").add(reservationLength, "days"));

      if (+startDate !== +cart.startTime || +endDate !== +cart.endTime) {
        Meteor.call("rentalProducts/setRentalPeriod", cart._id, startDate, endDate);
        Session.set("reservationStart", startDate);
        $("#rental-start").datepicker("update");
      }
    }
  });
});

Template.reservationDatepicker.helpers({
  startDate: function () {
    const cart = Cart.findOne();
    if (cart && cart.startTime) {
      return moment(adjustDenverToLocalTime(moment(cart.startTime))).format("MM/DD/YYYY");
    }
    return "";
  },

  startDateHuman: function () {
    const cart = Cart.findOne();
    const resLength = Session.get("reservationLength");
    if (cart && cart.startTime) {
      return moment(adjustDenverToLocalTime(moment(cart.startTime))).format("ddd M/DD")
        + " - " + moment(adjustDenverToLocalTime(moment(cart.startTime).add(resLength, "days"))).format("ddd M/DD");
    }
    return "";
  },

  rentalLength: function () {
    if (Session.get("cartRentalLength")) {
      return Session.get("cartRentalLength");
    }
    const cart = Cart.findOne();
    return cart.rentalDays;
  }
});

const calendarHtml = "<div class='calendar-header'>" +
                     "<h4>Please select a delivery date</h4>" +
                     "<a class='thursday-modal-link'>How it works</a>" +
                     "</div>";

const calendarLegendHtml = `
  <div class='row calendar-footer'>
    <div class='arrival-day-legend'>
      <div class='cal-square'></div>
      <label>Your first ski day!</label>
    </div>
    <div class='return-day-legend'>
      <div class='cal-square'></div>
      <label>Your last ski day</label>
    </div>
  </div>
  <div class='row shipping'>
    <div class='arrival-day-legend'>
      <div class='cal-square'></div>
      <label>We'll deliver your gear<br>before 8:00pm</label>
    </div>
    <div class='return-day-legend'>
      <div class='cal-square'></div>
      <label>Return to a UPS<br>location by 5:00pm</label>
    </div>
  </div>`;

Template.reservationDatepicker.events({
  "click .show-start": function () {
    $("#rental-start").datepicker("show");
  },
  "click #display-date": function () {
    $("#rental-start").datepicker("show");
    if ($(".datepicker-days .calendar-header").length === 0) {
      $(".datepicker-days").prepend(calendarHtml);
      $(".datepicker-days").append(calendarLegendHtml);
      $(".datepicker-days").tooltip({
        selector: ".day",
        container: "body"
      });
    }
    $(".datepicker-days .calendar-header").on("click", ".thursday-modal-link", function () {
      Modal.show("thursdayDeliveryExplanation");
    });
  }

});

Template.bundleReservationDatepicker.onCreated(function () {
  const bundleVariants = Products.findOne({
    ancestors: {
      $size: 1
    }
  });
  const defaultSelectedVariants = [];
  _.each(bundleVariants.bundleProducts, function (bundleOptions) {
    defaultSelectedVariants.push(bundleOptions.variantIds[0].variantId);
  });
  Session.setDefault("selectedBundleOptions", defaultSelectedVariants);
  this.autorun(() => {
    if (Session.get("selectedBundleOptions")) {
      const selectedOptions = Session.get("selectedBundleOptions");
      const instance = this;
      if (selectedOptions) {
        // this.subscribe("bundleReservationStatus", selectedOptions);
        selectedOptions.forEach(function (variantId) {
          instance.subscribe("variantReservationStatus",
            {start: new Date(), end: moment().add(1, "month").toDate()},
            variantId
          );
        });
        $("#rental-start").datepicker("update");
      }
    }
  });
});


Template.bundleReservationDatepicker.onRendered(function () {
  const variants = ReactionProduct.getVariants();
  const firstChild = variants.find(function (variant) {
    return variant.ancestors.length === 1;
  });
  // default reservation length is one less than customer facing and rental
  // bucket lengths because the datepicker includes the selected day
  // So duration is default to 5 for a 6 day rental.
  let defaultReservationLength = 5;
  if (firstChild) {
    ReactionProduct.setCurrentVariant(firstChild._id);
    if (firstChild.rentalPriceBuckets) {
      // find duration - 1 of the price bucket because selected day is not included
      defaultReservationLength = firstChild.rentalPriceBuckets[0].duration - 1;
    }
    // TODO: If we can't find a price bucket, exit gracefully.
  }

  Session.setDefault("reservationLength", defaultReservationLength); // inclusive of return day, exclusive of arrivalDay
  Session.setDefault("nextMonthHighlight", 0);

  $("#rental-start").datepicker({
    startDate: "+4d",
    autoclose: true,
    endDate: "+540d",
    maxViewMode: 0,
    beforeShowDay: function (date) {
      const reservationLength = Session.get("reservationLength");
      let available;
      let classes = "";
      let tooltip = "";
        // Change date checkers to check against Denver time
      const s = adjustLocalToDenverTime(moment(date).startOf("day"));
      const e = adjustLocalToDenverTime(moment(date).startOf("day").add(reservationLength, "days"));
      const shippingDay = TransitTimes.calculateShippingDay(s, 4); // Default of 4 shipping days until zip-calculation is done
      const returnDay = TransitTimes.calculateReturnDay(e, 4); // Default of 4
      const selectedVariantIds = Session.get("selectedBundleOptions");
      const selectedVariantsCount = _.countBy(selectedVariantIds);
        // Should give us {variantId: 1, variantId2: 1}
      const keys = Object.keys(selectedVariantsCount);
      available = _.every(keys, function (variantId) {
        const inventoryVariantsAvailable = RentalProducts.checkInventoryAvailability(
          variantId,
          {startTime: shippingDay, endTime: returnDay},
          selectedVariantsCount[variantId]
        );
        return inventoryVariantsAvailable.length > 0;
      });
      if (available) {
        if (+s > +today) {
          tooltip = "Available!";
        } else {
          tooltip = "Pick a date in the future";
        }
      } else {
        tooltip = "Fully Booked";
      }
      // }
      let selectedDate = $("#rental-start").val();
      if (!selectedDate) {
        return {enabled: available, classes: classes, tooltip: tooltip};
      }
      selectedDate = moment(selectedDate, "MM/DD/YYYY").startOf("day");
      reservationEndDate = moment(selectedDate).startOf("day").add(reservationLength, "days");

      const compareDate = moment(date).startOf("day");

      if (+compareDate === +selectedDate) {
        if (!available) {
           // if dates are unavailable, reset dates;
          $("#bundle-add-to-cart").prop("disabled", true);
          if ($("#unavailable-note").length === 0) {
            $("#bundle-add-to-cart").parent().prepend(
              "<div class='small text-center' id='unavailable-note'>"
              + "<em>This product is unavailable for the selected dates</em></div>"
            );
          }
        } else {
          $("#bundle-add-to-cart").prop("disabled", false);
          $("#unavailable-note").remove();
        }
        inRange = true; // to highlight a range of dates
        return {enabled: available, classes: "selected selected-start", tooltip: "Woohoo, your adventure begins!"};
      } else if (+compareDate === +selectedDate.subtract(1, "days")) {
        return {enabled: available, classes: "arrivalSet", tooltip: "Your gear arrives!"};
      } else if (+compareDate === +reservationEndDate) {
        if (inRange) inRange = false;  // to stop the highlight of dates ranges
        return {enabled: available, classes: "selected selected-end", tooltip: "Rental day, have fun!"};
      }  else if (+compareDate === +reservationEndDate.add(1, "days")) {
        return {enabled: available, classes: "returnSet", tooltip: "Drop gear off at UPS by 3pm to be returned"};
      } else if (+compareDate > +selectedDate && +compareDate < +reservationEndDate) {
        inRange = true;
      } else if (+compareDate < +selectedDate || +compareDate > +reservationEndDate) {
        inRange = false;
      }

      if (inRange) {
        return {enabled: available, classes: "selected selected-range", tooltip: "Rental day, have fun!"}; // create a custom class in css with back color you want
      }
      return {enabled: available, classes: classes, tooltip: tooltip};
    }
  });
  const inventoryVariants = InventoryVariants.find();
  this.autorun(() => {
    if (inventoryVariants.fetch().length > 0) {
      $("#rental-start").datepicker("update");
    }
  });
  // Update calendar each time bundleOptions change
  this.autorun(() => {
    Session.get("selectedBundleOptions");
    $("#rental-start").datepicker("update");
  });

  $(document).on({
    mouseenter: function () {
      const $nextWeeks = $(this).parent().nextAll().find(".day");
      const $remainingDaysThisWeek = $(this).nextAll();
      let numDaysToHighlight = Session.get("reservationLength");
      let $arrivalDay = $(this).prev();
      let $returnDay;
      if ($arrivalDay.length === 0) {
        $arrivalDay = $(this).parent().prev().children().last();
      }
      $arrivalDay.addClass("arrive-by");
      if ($remainingDaysThisWeek.length >= numDaysToHighlight) {
        $remainingDaysThisWeek.slice(0, numDaysToHighlight).addClass("highlight");
        $returnDay = $remainingDaysThisWeek.slice(numDaysToHighlight, numDaysToHighlight + 1);
        if ($returnDay.length === 0) {
          $returnDay = $(this).parent().next().children().first();
        }
        $returnDay.addClass("return-by");
        return $remainingDaysThisWeek.slice(numDaysToHighlight - 1, numDaysToHighlight).addClass("last-day");
      }
      $remainingDaysThisWeek.addClass("highlight");
      numDaysToHighlight = numDaysToHighlight - $remainingDaysThisWeek.length;
      $nextWeeks.slice(0, numDaysToHighlight).addClass("highlight");
      $returnDay = $nextWeeks.slice(numDaysToHighlight, numDaysToHighlight + 1);
      $returnDay.addClass("return-by");
      return $nextWeeks.slice(numDaysToHighlight - 1, numDaysToHighlight).addClass("last-day");
    },
    mouseleave: function () {
      $(".day").removeClass("highlight").removeClass("arrive-by").removeClass("last-day").removeClass("return-by");
    }
  }, ".day:not(.disabled)");

  $("#rental-start").on({
    changeDate: function (event) {
      $(".tooltip").remove();
      const cart = Cart.findOne();
      const reservationLength = Session.get("reservationLength");

      // Sets cart dates to Denver time - need to set as local time on display.
      const startDate = adjustLocalToDenverTime(moment(event.currentTarget.value, "MM/DD/YYYY").startOf("day"));
      const endDate = adjustLocalToDenverTime(moment(event.currentTarget.value, "MM/DD/YYYY").startOf("day").add(reservationLength, "days"));

      if (+startDate !== +cart.startTime || +endDate !== +cart.endTime) {
        Meteor.call("rentalProducts/setRentalPeriod", cart._id, startDate, endDate);
        Session.set("reservationStart", startDate);
        $("#rental-start").datepicker("update");
      }
    }
  });
});

Template.bundleReservationDatepicker.helpers({
  startDate: function () {
    const cart = Cart.findOne();
    if (cart && cart.startTime) {
      return moment(adjustDenverToLocalTime(moment(cart.startTime))).format("MM/DD/YYYY");
    }
    return "";
  },

  startDateHuman: function () {
    const cart = Cart.findOne();
    const resLength = Session.get("reservationLength");
    if (cart && cart.startTime) {
      return moment(adjustDenverToLocalTime(moment(cart.startTime))).format("ddd M/DD")
        + " - " + moment(adjustDenverToLocalTime(moment(cart.startTime).add(resLength, "days"))).format("ddd M/DD");
    }
    return "";
  },

  rentalLength: function () {
    if (Session.get("cartRentalLength")) {
      return Session.get("cartRentalLength");
    }
    const cart = Cart.findOne();
    return cart.rentalDays;
  }
});

Template.bundleReservationDatepicker.events({
  "click .show-start": function () {
    $("#rental-start").datepicker("show");
  },
  "click #display-date": function () {
    $("#rental-start").datepicker("show");
    if ($(".datepicker-days .calendar-header").length === 0) {
      $(".datepicker-days").prepend(calendarHtml);
      $(".datepicker-days").append(calendarLegendHtml);
      $(".datepicker-days").tooltip({
        selector: ".day",
        container: "body"
      });
    }
    $(".datepicker-days .calendar-header").on("click", ".thursday-modal-link", function () {
      Modal.show("thursdayDeliveryExplanation");
    });
  }
});
