import $ from "jquery";
import "bootstrap-datepicker";
import moment from "moment";
import "twix";
import "moment-timezone";

function includedWeekendDays(startDay, endDay) {
  const dayRange = moment(startDay).endOf("day").twix(moment(endDay).endOf("day"), {allDay: true});
  const days = dayRange.count("days");
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  let skipDays = 0;

  skipDays = 2 * weeks;
  if (remainingDays === 0) {
    return skipDays;
  }
  const leftovers = moment(startDay).twix(moment(startDay).add(remainingDays - 1, "days"));
  const iter = leftovers.iterate("days");
  while (iter.hasNext()) {
    let next = iter.next();
    if (next.isoWeekday() >= 6) {
      skipDays++;
    }
  }
  return skipDays;
}

// TODO: Add holiday calculations
function calcShippingDay(startDay, timeInTransit) {
  let start = moment(startDay);
  let bonusTransitDays = 0;
  if (start.isoWeekday() === 6) {
    bonusTransitDays = bonusTransitDays + 1;
  } else if (start.isoWeekday() === 7) {
    bonusTransitDays = bonusTransitDays + 2;
  }

  shippingDays = timeInTransit;
  let shippingDay = moment(start).subtract(timeInTransit + bonusTransitDays, "days");
  if (shippingDay.isoWeekday() >= 6 || shippingDay.isoWeekday() + shippingDays >= 6) {
    return shippingDay.subtract(2, "days");
  }
  return shippingDay;
}

function destroyDatepicker() {
  $("#datepicker input").datepicker("destroy");
}

function initDatepicker() {

}


Template.reservationDatepicker.onRendered(function () {
  Session.setDefault("reservationLength", 5); // inclusive of return day, exclusive of arrivalDay
  Session.setDefault("nextMonthHighlight", 0);
  $("#datepicker input").datepicker({
    startDate: "+4d",
    autoclose: true,
    daysOfWeekDisabled: [0, 1, 2, 3, 5, 6],
    endDate: "+540d",
    beforeShowDay: function (date) {
      // let cart = ReactionCore.Collections.Cart.findOne();
      let selectedDate = $("#datepicker input").val();
      if (!selectedDate) {
        return undefined;
      }
      console.log("selectedDate", selectedDate);
      let reservationLength = Session.get("reservationLength");
      selectedDate = moment(selectedDate, "MM/DD/YYYY").startOf("day").tz("America/Denver");
      reservationEndDate = moment(selectedDate).startOf("day").add(reservationLength, "days").tz("America/Denver");
      // if (cart && cart.startTime) {
      //   selectedDate = Session.get("reservationStart") ? moment(Session.get("reservationStart")) : undefined;
      //   if (!selectedDate) {
      //     selectedDate = moment(cart.startTime).startOf("day").tz("America/Denver");
      //   }
      //   reservationEndDate = moment(cart.startTime).startOf("day").add(reservationLength, "days").tz("America/Denver");
      // }

      let compareDate = moment(date).startOf("day").tz("America/Denver");
      if (+compareDate === +selectedDate) {
        // console.log("session date", Session.get("reservationStart"));
        // console.log("date", compareDate.format("dd DD hh z"));
        // console.log("selectedDate", selectedDate.format("dd DD hh z"));
        // console.log("endDate", reservationEndDate.format("dd DD hh z"));
        inRange = true; // to highlight a range of dates
        return {classes: "selected selected-start", tooltip: "Gear Delivered"};
      }
      if (+compareDate === +reservationEndDate) {
        if (inRange) inRange = false;  // to stop the highlight of dates ranges
        return {classes: "selected selected-end", tooltip: "Gear Dropped at UPS"};
      }
      if (inRange) {
        return {classes: "selected selected-range"}; // create a custom class in css with back color you want
      }
      return undefined;
    }
  });

  $(document).on({
    mouseenter: function () {
      let $nextWeeks = $(this).parent().nextAll().find(".day");
      let $remainingDaysThisWeek = $(this).nextAll();
      let numDaysToHighlight = Session.get("reservationLength");

      if ($remainingDaysThisWeek.length >= numDaysToHighlight) {
        return $remainingDaysThisWeek.slice(0, numDaysToHighlight).addClass("highlight");
      }
      $remainingDaysThisWeek.addClass("highlight");
      numDaysToHighlight = numDaysToHighlight - $remainingDaysThisWeek.length;
      return $nextWeeks.slice(0, numDaysToHighlight).addClass("highlight");
    },
    mouseleave: function () {
      $(".day").removeClass("highlight");
    }
  }, ".day:not(.disabled)");

  $("#datepicker input").on({
    changeDate: function (event) {
      const cart = ReactionCore.Collections.Cart.findOne();
      const reservationLength = Session.get("reservationLength");

      const startDate = moment(event.currentTarget.value, "MM/DD/YYYY").startOf("day").tz("America/Denver");
      const endDate = moment(startDate).add(reservationLength, "days");

      if (+startDate !== +cart.startTime || +endDate !== +cart.endTime) {
        Meteor.call("rentalProducts/setRentalPeriod", cart._id, startDate.toDate(), endDate.toDate());
        Session.set("reservationStart", startDate.toDate());
        $('#datepicker input').datepicker('update');
      }
    }
  });
});

Template.reservationDatepicker.helpers({
  startDate: function () {
    let cart = ReactionCore.Collections.Cart.findOne();
    if (cart && cart.startTime) {
      return moment(cart.startTime).format("MM/DD/YYYY");
    }
    return "";
  },

  startDateHuman: function () {
    let cart = ReactionCore.Collections.Cart.findOne();
    if (cart && cart.startTime) {
      return moment(cart.startTime).format("MMM DD, YYYY");
    }
    return "";
  },

  endDate: function () {
    let cart = ReactionCore.Collections.Cart.findOne();
    if (cart && cart.endTime) {
      return moment(cart.endTime).format("MM/DD/YYYY");
    }
    return "";
  },

  endDateHuman: function () {
    let cart = ReactionCore.Collections.Cart.findOne();
    if (cart && cart.endTime) {
      return moment(cart.endTime).format("MMM DD, YYYY");
    }
    return "";
  },

  rentalLength: function () {
    if (Session.get("cartRentalLength")) {
      return Session.get("cartRentalLength");
    }
    let cart = ReactionCore.Collections.Cart.findOne();
    return cart.rentalDays;
  }
});

Template.reservationDatepicker.events({
  "changeDate #datepicker": function (event) {
    console.log("change start date");
    const cart = ReactionCore.Collections.Cart.findOne();
    const reservationLength = Session.get("reservationLength");

    const startDate = moment(event.currentTarget.value, "MM/DD/YYYY").startOf("day").tz("America/Denver");
    const endDate = moment(startDate).add(reservationLength, "days");

    if (+startDate !== +cart.startTime || +endDate !== +cart.endTime) {
      Meteor.call("rentalProducts/setRentalPeriod", cart._id, startDate.toDate(), endDate.toDate());
    }
  },

  // "changeDate .end": function (event) {
  //   let cart = ReactionCore.Collections.Cart.findOne();
  //   let endDate = moment(event.currentTarget.value, "MM/DD/YYYY");
  //   let startDate;
  //   if (cart.startTime) {
  //     startDate = moment(cart.startTime);
  //   } else {
  //     startDate = moment(endDate);
  //   }
  //   if (+startDate !== +cart.startTime || +endDate !== +cart.endTime) {
  //     let cartRentalLength = moment(startDate).twix(endDate).count("days");
  //     Session.set("cartRentalLength", cartRentalLength);
  //     Meteor.call("rentalProducts/setRentalPeriod", cart._id, startDate.toDate(), endDate.toDate());
  //   }
  // },

  "click .show-start": function () {
    $("#datepicker .start").datepicker("show");
  }
});
