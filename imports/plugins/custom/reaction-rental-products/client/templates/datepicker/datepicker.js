// npm imports
import $ from "jquery";
import "bootstrap-datepicker";
import moment from "moment";
import "twix";
import "moment-timezone";
import momentBusiness from "moment-business";
import smoothscroll from "smoothscroll-polyfill";

// Meteor Imports
import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";

// Reaction Imports
import { Cart } from "/lib/collections";

// GetOutfitted Imports
import { GetOutfitted } from "/imports/plugins/custom/getoutfitted-core/lib/api";

Template.goReservationDatepicker.onCreated(function () {
  const instance = this;
  instance.reservation = new ReactiveVar({startDate: null, endDate: null});
  smoothscroll.polyfill();
});

Template.goReservationDatepicker.onRendered(function () {
  const instance = this;
  const parent = instance.view.parentView.templateInstance();
  const cart = Cart.findOne();
  // default reservation length is one less than customer facing and rental
  // bucket lengths because the datepicker includes the selected day
  // So duration is default to 5 for a 6 day rental.

  if (!GetOutfitted.clientReservationDetails.get("reservationLength")) {
    if (cart.rentalDays) {
      GetOutfitted.clientReservationDetails.set("reservationLength", cart.rentalDays - 1);
    } else {
      GetOutfitted.clientReservationDetails.set("reservationLength", 1);
    }
  }

  if (!GetOutfitted.clientReservationDetails.get("nextMonthHighlight")) {
    GetOutfitted.clientReservationDetails.set("nextMonthHighlight", 0);
  }
  if (!instance.reservation.get() || !instance.reservation.get().startTime) {
    if (cart.startTime && cart.endTime) {
      instance.reservation.set({
        startTime: GetOutfitted.adjustDenverToLocalTime(cart.startTime),
        endTime: GetOutfitted.adjustDenverToLocalTime(cart.endTime)
      });
    }
  }

  $("#rental-start").datepicker({
    container: "#datepicker-container",
    orientation: "left",
    startDate: "+1d",
    autoclose: true,
    endDate: "+540d",
    maxViewMode: 0,
    beforeShowDay: function (date) {
      const reservationLength = GetOutfitted.clientReservationDetails.get("reservationLength");
      let classes = "";
      const destination = parseInt($("#destinationSelect").val(), 10);
      const localDestination = GetOutfitted.localDestinations.indexOf(destination) !== -1;

      // We require 5 business days lead time unless "Rush Shipping" has been selected.
      let processingDelay = 5;
      if (parent.rush.get()) {
        processingDelay = localDestination ? 1 : 3;
      }

      // Change date checkers to check against Denver time
      const start = GetOutfitted.adjustLocalToDenverTime(moment(date).startOf("day"));

      // Calculate the first day we could possibly ship to based on destination
      // Should include holidays in here as well in the future.
      const firstShippableDay = GetOutfitted.adjustLocalToDenverTime(
        momentBusiness.addWeekDays(moment().startOf("day"), processingDelay)
      );

      const selectedDate = moment($("#rental-start").val(), "MM/DD/YYYY").startOf("day"); // Get currently selected date from #rental-start input
      const reservationEndDate = moment(selectedDate).startOf("day").add(reservationLength, "days");
      const compareDate = moment(date).startOf("day");

      if (+start < +firstShippableDay) {
        // The only valid coloring for a preshippable date is "delivery"
        if (+compareDate === +moment(selectedDate).subtract(1, "days")) {
          classes += "delivery-day";
        }
        return {
          enabled: false,
          classes: classes,
          tooltip: "We're sorry but we can't ship gear to your destination by this date."
        };
      }

      // important dates for calendar
      const firstSkiDay = +compareDate === +selectedDate;
      const lastSkiDay = +compareDate === +reservationEndDate;
      const deliveryDay = +compareDate === +moment(selectedDate).subtract(1, "days"); // Day gear is delivered
      const dropoffDay = +compareDate === +moment(reservationEndDate).add(1, "days"); // Day customer drops off or returns gear at UPS
      const reservedDay = +compareDate > +selectedDate && +compareDate < +reservationEndDate; // Reserved day other than first/last

      if (deliveryDay) {
        classes = "delivery-day";
      } else if (firstSkiDay) {
        classes = "selected selected-start";
      } else if (lastSkiDay) {
        classes = "selected selected-end";
      } else if (dropoffDay) {
        classes = "return-day";
      } else if (reservedDay) {
        classes = "selected selected-range";
      }

      return {enabled: true, classes: classes, tooltip: ""};
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

  $(document).on({
    mouseenter() {
      days = document.getElementsByClassName("day");
      for (let i = 0; i < days.length; i++) {
        days[i].classList.add("hover");
      }
    },
    mouseleave() {
      days = document.getElementsByClassName("day");
      for (let i = 0; i < days.length; i++) {
        days[i].classList.remove("hover");
      }
    }
  }, "#datepicker-container .datepicker-days tbody");

  $("#rental-start").on({
    changeDate: function (event) {
      $(".tooltip").remove();

      const reservationLength = GetOutfitted.clientReservationDetails.get("reservationLength");

      // Sets cart dates to Denver time - need to set as local time on display.
      const startTime = GetOutfitted.adjustLocalToDenverTime(moment(event.currentTarget.value, "MM/DD/YYYY").startOf("day"));
      const endTime = GetOutfitted.adjustLocalToDenverTime(moment(event.currentTarget.value, "MM/DD/YYYY").startOf("day").add(reservationLength, "days"));

      // Set temp reservation
      instance.reservation.set({startTime, endTime});

      if (parent.rush.get()) {
        const firstShippableDay = momentBusiness.addWeekDays(moment().startOf("day"), 5);
        const selectedMoment = moment(event.currentTarget.value, "MM/DD/YYYY");
        // Check to see if selected date is within rush window
        if (firstShippableDay <= selectedMoment) {
          parent.rush.set(false);
          Meteor.call("cart/setShipmentMethod", cart._id, GetOutfitted.shippingMethods.freeShippingMethod);
          $(".rush-span i").removeClass("fa-check-square-o");
          $(".rush-span i").addClass("fa-square-o");
        }
      }

      // Update Datepicker
      $("#rental-start").datepicker("update");
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

  reservationHuman: function () {
    const instance = Template.instance();
    const cart = Cart.findOne();
    const resLength = GetOutfitted.clientReservationDetails.get("reservationLength");

    let reservation = instance.reservation.get();
    if (!reservation || !reservation.startTime) {
      reservation = { startTime: cart.startTime, endTime: cart.endTime };
    }
    if (reservation && reservation.startTime) {
      const start = moment(GetOutfitted.adjustDenverToLocalTime(moment(reservation.startTime))).format("ddd M/DD");
      const end = moment(GetOutfitted.adjustDenverToLocalTime(moment(reservation.startTime).add(resLength, "days"))).format("ddd M/DD");

      return `${start} - ${end}`;
    }
    return "";
  },

  selectedResLength: function (len) {
    const setLen = GetOutfitted.clientReservationDetails.get("reservationLength") || 1;
    return len === setLen + 1 ? "selected" : "";
  },

  rentalLength: function () {
    if (Session.get("cartRentalLength")) {
      return Session.get("cartRentalLength");
    }
    const cart = Cart.findOne();
    return cart.rentalDays;
  }
});

const calendarHelp = "<small><a class='calendar-help-link'><i class='fa fa-question-circle'></i> </a></small>";

Template.goReservationDatepicker.events({
  "click .show-start": function () {
    $("#rental-start").datepicker("show");
  },
  "click #display-date": function () {
    const instance = Template.instance();
    const parent = instance.view.parentView.templateInstance();
    const cart = Cart.findOne({userId: Meteor.userId()});
    const faCheckbox = parent.rush.get() ? "fa-check-square-o" : "fa-square-o";
    const rushCheckbox = `
      <div class='rush-checkbox-container'>
        <p class="rush-description">
          Need it sooner?
        </p>
        <span class='rush-span'>
          <i class="fa ${faCheckbox}"></i>
          <span class="rush-text">Rush Order ($39)</span>
        </span>
      </div>
    `;

    $("#rental-start").datepicker("show");

    if ($(".datepicker-switch .calendar-help-link").length === 0) {
      $(".datepicker-switch").prepend(calendarHelp);
      $(".datepicker.datepicker-dropdown").append(rushCheckbox);

      // Register event listener for rush checkbox
      Blaze.renderWithData(Template.rushAlertContainer, {}, $(".rush-checkbox-container")[0]);
      $(".datepicker").on("click", ".rush-checkbox-container", function () {
        const selectedStartDate = $("#rental-start").val();
        if (parent.rush.get() && selectedStartDate !== "") {
          const firstShippableDay = momentBusiness.addWeekDays(moment().startOf("day"), 5);
          const selectedMoment = moment(selectedStartDate, "MM/DD/YYYY");
          // Check to see if selected date is within rush window
          if (firstShippableDay > selectedMoment) {
            // Inform user.
            Alerts.removeSeen();
            Alerts.inline(`
              ${selectedMoment.format("MMM D")} is only available with Rush Order.
              Please select a date on or after ${firstShippableDay.format("MMM D")} to remove Rush Delivery.
            `, "danger", {
              autoHide: false,
              placement: "rushAlertContainer"
            });
            return;
          }
        }
        // If rush isn't selected, or the date isn't within the rush window, flip the flag
        const newRushValue = !parent.rush.get();
        const shippingMethod = newRushValue ? GetOutfitted.shippingMethods.rushShippingMethod : GetOutfitted.shippingMethods.freeShippingMethod;
        parent.rush.set(newRushValue);
        Meteor.call("cart/setShipmentMethod", cart._id, shippingMethod);
        $(".rush-span i").removeClass("fa-check-square-o fa-square-o");
        $(".rush-span i").addClass(parent.rush.get() ? "fa-check-square-o" : "fa-square-o");
        // Refresh datepicker
        $("#rental-start").datepicker("update");
      });
      window.scroll({
        left: 0,
        top: $(".datepicker.datepicker-dropdown").offset().top,
        behavior: "smooth"
      });
    } else {
      $(".rush-checkbox-container").show();
      window.scroll(0, $(".datepicker.datepicker-dropdown").offset().top);
    }

    $(".datepicker-switch").on("click", ".calendar-help-link", function () {
      Modal.show("goCalendarHelp");
    });

    $(".datepicker-switch").on("click", function (event) {
      event.stopPropagation();
    });
  },
  "change #lengthSelect": function (event) {
    GetOutfitted.clientReservationDetails.set("reservationLength", parseInt(event.currentTarget.value, 10) - 1);
    $("#rental-start").datepicker("update");
  },
  "click .calendar-help-link": function () {
    Modal.show("goCalendarHelp");
  }
});
