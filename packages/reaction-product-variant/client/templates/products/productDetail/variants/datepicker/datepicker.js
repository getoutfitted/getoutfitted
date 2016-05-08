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

Template.reservationDatepicker.onCreated(function () {
  Session.setDefault("selectedVariantId", ReactionProduct.selectedVariantId());
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
  let defaultReservationLength = 5;
  if (firstChild) {
    ReactionProduct.setCurrentVariant(firstChild._id);
    Session.set("selectedVariantId", firstChild._id);
    if (firstChild.rentalPriceBuckets) {
      defaultReservationLength = firstChild.rentalPriceBuckets[0].duration - 1;
    }
  }

  Session.setDefault("reservationLength", defaultReservationLength); // inclusive of return day, exclusive of arrivalDay
  Session.setDefault("nextMonthHighlight", 0);
  $("#rental-start").datepicker({
    startDate: "+4d",
    autoclose: true,
    daysOfWeekDisabled: [0, 1, 2, 3, 5, 6],
    endDate: "+540d",
    beforeShowDay: function (date) {
      let reservationLength = Session.get("reservationLength");
      let available;
      let classes = "";
      let tooltip = "";
      // if disabled day, skip this
      if (_.contains([1, 2, 3, 5, 6, 7], moment(date).isoWeekday())) {
        available = false;
        tooltip = "Please pick an available Thursday to take delivery."
      } else {
        const s = moment(date).startOf("day").tz("America/Denver");
        const e = moment(date).startOf("day").add(reservationLength, "days").tz("America/Denver");
        const shippingDay = TransitTimes.calculateShippingDay(s.toDate(), 4); // Default of 4 shipping days until zip-calculation is done
        const returnDay = TransitTimes.calculateReturnDay(e.toDate(), 4); // Default of 4 ^^
        const inventoryVariantsAvailable = RentalProducts.checkInventoryAvailability(
          Session.get("selectedVariantId"),
          {startTime: shippingDay, endTime: returnDay}
        );
        available = inventoryVariantsAvailable.length > 0;
        tooltip = "Fully Booked";
      }
      let selectedDate = $("#rental-start").val();
      if (!selectedDate) {
        return {enabled: available, classes: classes, tooltip: tooltip};
      }
      selectedDate = moment(selectedDate, "MM/DD/YYYY").startOf("day").tz("America/Denver");
      reservationEndDate = moment(selectedDate).startOf("day").add(reservationLength, "days").tz("America/Denver");

      let compareDate = moment(date).startOf("day").tz("America/Denver");
      if (+compareDate === +selectedDate) {
        inRange = true; // to highlight a range of dates
        return {enabled: available, classes: "selected selected-start", tooltip: "Woohoo, gear delivered today!"};
      } else if (+compareDate === +reservationEndDate) {
        if (inRange) inRange = false;  // to stop the highlight of dates ranges
        return {enabled: available, classes: "selected selected-end", tooltip: "Drop gear off at UPS by 3pm to be returned"};
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

  $("#rental-start").on({
    changeDate: function (event) {
      const cart = ReactionCore.Collections.Cart.findOne();
      const reservationLength = Session.get("reservationLength");

      const startDate = moment(event.currentTarget.value, "MM/DD/YYYY").startOf("day").tz("America/Denver");
      const endDate = moment(startDate).add(reservationLength, "days");

      if (+startDate !== +cart.startTime || +endDate !== +cart.endTime) {
        Meteor.call("rentalProducts/setRentalPeriod", cart._id, startDate.toDate(), endDate.toDate());
        Session.set("reservationStart", startDate.toDate());
        $("#rental-start").datepicker("update");
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
    const cart = ReactionCore.Collections.Cart.findOne();
    const resLength = Session.get("reservationLength");
    if (cart && cart.startTime) {
      return moment(cart.startTime).format("ddd M/DD")
        + " - " + moment(cart.startTime).add(resLength, "days").format("ddd M/DD");
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
    const cart = ReactionCore.Collections.Cart.findOne();
    const reservationLength = Session.get("reservationLength");

    const startDate = moment(event.currentTarget.value, "MM/DD/YYYY").startOf("day").tz("America/Denver");
    const endDate = moment(startDate).add(reservationLength, "days");

    if (+startDate !== +cart.startTime || +endDate !== +cart.endTime) {
      Meteor.call("rentalProducts/setRentalPeriod", cart._id, startDate.toDate(), endDate.toDate());
    }
  },

  "click .show-start": function () {
    $("#rental-start").datepicker("show");
  },
  "click #display-date": function () {
    $("#rental-start").datepicker("show");
  }
});
