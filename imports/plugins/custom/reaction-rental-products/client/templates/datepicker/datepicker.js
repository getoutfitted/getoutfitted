// npm imports
import $ from "jquery";
import "bootstrap-datepicker";
import moment from "moment";
import "twix";
import "moment-timezone";
import momentBusiness from "moment-business";

// Meteor Imports
import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";

// Reaction Imports
import { Cart } from "/lib/collections";

// GetOutfitted Imports
import { GetOutfitted } from "/imports/plugins/custom/getoutfitted-core/lib/api";

Template.goReservationDatepicker.onRendered(function () {
  const cart = Cart.findOne();
  // default reservation length is one less than customer facing and rental
  // bucket lengths because the datepicker includes the selected day
  // So duration is default to 5 for a 6 day rental.

  if (!GetOutfitted.clientReservationDetails.get("reservationLength")) {
    GetOutfitted.clientReservationDetails.set("reservationLength", 1);
  }

  if (!GetOutfitted.clientReservationDetails.get("nextMonthHighlight")) {
    GetOutfitted.clientReservationDetails.set("nextMonthHighlight", 0);
  }
  // Session.setDefault("reservationLength", 2); // inclusive of return day, exclusive of arrivalDay
  // Session.setDefault("nextMonthHighlight", 0);
  $("#rental-start").datepicker({
    startDate: "+1d",
    autoclose: true,
    endDate: "+540d",
    maxViewMode: 0,
    beforeShowDay: function (date) {
      const reservationLength = GetOutfitted.clientReservationDetails.get("reservationLength");
      let available;
      let inRange = false;
      const classes = "";
      const tooltip = "";

      // Change date checkers to check against Denver time
      const start = GetOutfitted.adjustLocalToDenverTime(moment(date).startOf("day"));
      // const end = GetOutfitted.adjustLocalToDenverTime(moment(date).startOf("day").add(reservationLength, "days"));
      // Calculate the first day we could possibly ship to based on destination
      // Should include holidays in here as well in the future.
      const firstShippableDay = GetOutfitted.adjustLocalToDenverTime(
        momentBusiness.addWeekDays(moment().startOf("day"), 5)
      );

      if (+start < +firstShippableDay) {
        return {
          enabled: false,
          classes: classes,
          tooltip: "We're sorry but we can't ship gear to your destination by this date."
        };
      }

      let selectedDate = $("#rental-start").val();
      if (!selectedDate) {
        return {enabled: available, classes: classes, tooltip: tooltip};
      }
      selectedDate = moment(selectedDate, "MM/DD/YYYY").startOf("day");
      reservationEndDate = moment(selectedDate).startOf("day").add(reservationLength, "days");
      const compareDate = moment(date).startOf("day");

      // TODO: Clean this up, impossible to read.
      if (+compareDate === +selectedDate) {
        inRange = true; // to highlight a range of dates
        return {enabled: available, classes: "selected selected-start", tooltip: "First Ski Day!" };
      } else if (+compareDate === +moment(selectedDate).subtract(1, "days")) {
        return {enabled: available, classes: "delivery-day", tooltip: "Gear Delivered!" };
      } else if (+compareDate === +reservationEndDate) {
        if (inRange) { inRange = false; } // to stop the highlight of dates ranges
        return { enabled: available, classes: "selected selected-end", tooltip: "Ski Day!" };
      } else if (+compareDate === +moment(reservationEndDate).add(1, "days")) {
        return { enabled: available, classes: "return-day", tooltip: "Drop gear off at UPS by 3pm to be returned" };
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

  $(document).on({
    mouseenter() {
      if ($(".day").length === 0) {
        return false;
      }

      // This code calculates what to highlight on the calendar.
      const $nextWeeks = $(this).parent().nextAll().find(".day");
      const $remainingDaysThisWeek = $(this).nextAll();
      let numDaysToHighlight = GetOutfitted.clientReservationDetails.get("reservationLength");
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

    mouseleave() {
      $(".day").removeClass("highlight").removeClass("arrive-by").removeClass("last-day").removeClass("return-by");
    }
  }, ".day:not(.disabled)");

  $("#rental-start").on({
    changeDate: function (event) {
      $(".tooltip").remove();

      const reservationLength = GetOutfitted.clientReservationDetails.get("reservationLength");

      // Sets cart dates to Denver time - need to set as local time on display.
      const startDate = GetOutfitted.adjustLocalToDenverTime(moment(event.currentTarget.value, "MM/DD/YYYY").startOf("day"));
      const endDate = GetOutfitted.adjustLocalToDenverTime(moment(event.currentTarget.value, "MM/DD/YYYY").startOf("day").add(reservationLength, "days"));

      if (+startDate !== +cart.startTime || +endDate !== +cart.endTime) {
        Meteor.call("rentalProducts/setRentalPeriod", cart._id, startDate, endDate);
        Session.set("reservationStart", startDate);
        $("#rental-start").datepicker("update");
      }
    }
  });
});

Template.goReservationDatepicker.helpers({
  startDate: function () {
    const cart = Cart.findOne();
    if (cart && cart.startTime) {
      return moment(GetOutfitted.adjustDenverToLocalTime(moment(cart.startTime))).format("MM/DD/YYYY");
    }
    return "";
  },

  startDateHuman: function () {
    const cart = Cart.findOne();
    const resLength = GetOutfitted.clientReservationDetails.get("reservationLength");
    if (cart && cart.startTime) {
      return moment(GetOutfitted.adjustDenverToLocalTime(moment(cart.startTime))).format("ddd M/DD")
        + " - " + moment(GetOutfitted.adjustDenverToLocalTime(moment(cart.startTime).add(resLength, "days"))).format("ddd M/DD");
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
                     "<h4>Please select a your first ski day.</h4>" +
                     "<a class='thursday-modal-link'>How it works</a>" +
                     "</div>";

Template.goReservationDatepicker.events({
  "click .show-start": function () {
    $("#rental-start").datepicker("show");
  },
  "click #display-date": function () {
    $("#rental-start").datepicker("show");
    if ($(".datepicker-days .calendar-header").length === 0) {
      $(".datepicker-days").prepend(calendarHtml);
      $(".datepicker-days").tooltip({
        selector: ".day",
        container: "body"
      });
    }
    $(".datepicker-days .calendar-header").on("click", ".thursday-modal-link", function () {
      Modal.show("thursdayDeliveryExplanation");
    });
  },
  "change #lengthSelect": function (event) {
    GetOutfitted.clientReservationDetails.set("reservationLength", parseInt(event.currentTarget.value, 10));
  }
});
