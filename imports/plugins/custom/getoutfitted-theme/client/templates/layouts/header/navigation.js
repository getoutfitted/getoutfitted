import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Cart } from "/lib/collections";

import momentBusiness from "moment-business";
import { GetOutfitted } from "/imports/plugins/custom/getoutfitted-core/lib/api";

Template.goNavigationBar.onCreated(function () {
  const instance = this;
  instance.reservation = new ReactiveVar({startDate: null, endDate: null});
  instance.startTime = new ReactiveVar(null);
});

Template.goNavigationBar.onRendered(function () {
  const instance = this;
  const cart = Cart.findOne();

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
      instance.reservation.set({startTime: cart.startTime, endTime: cart.endTime});
    }
  }
  if (!instance.startTime.get()) {
    if (cart.startTime) {
      instance.startTime.set(cart.startTime);
    }
  }

  this.autorun(function () {
    $("#nav-datepicker").datepicker({
      startDate: "+1d",
      endDate: "+540d",
      maxViewMode: 0,
      beforeShowDay: function (date) {
        const reservationLength = GetOutfitted.clientReservationDetails.get("reservationLength");
        let classes = "";

        // Change date checkers to check against Denver time
        const start = GetOutfitted.adjustLocalToDenverTime(moment(date).startOf("day"));

        // Calculate the first day we could possibly ship to based on destination
        // Should include holidays in here as well in the future.
        const firstShippableDay = GetOutfitted.adjustLocalToDenverTime(
          momentBusiness.addWeekDays(moment().startOf("day"), 5)
        );

        // const selectedDate = moment($("#nav-datepicker-start").val(), "MM/DD/YYYY").startOf("day"); // Get currently selected date from #rental-start input
        const selectedDate = instance.startTime.get();
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
  });

  $('#nav-datepicker').on('changeDate', function(event) {
    $('#nav-datepicker-start').val($('#nav-datepicker').datepicker('getFormattedDate'));
    instance.startTime.set($('#nav-datepicker').datepicker('getDate'));
    $('#nav-datepicker').datepicker('update', instance.startTime.get());
  });
});

Template.goNavigationBar.helpers({
  reservationDatesSelected() {
    const cart = Cart.findOne({userId: Meteor.userId()});
    return cart.startTime && cart.endTime;
  },
  reservationStart() {
    const cart = Cart.findOne({userId: Meteor.userId()});
    return moment(cart.startTime).format("MM/DD/YYYY");
  },
  reservationDates() {
    const cart = Cart.findOne({userId: Meteor.userId()});
    if (cart.startTime && cart.endTime) {
      const start = moment(cart.startTime).format("ddd M/DD");
      const end = moment(cart.endTime).format("ddd M/DD");
      return `${start} - ${end}`;
    }
    return "";
  }
});
