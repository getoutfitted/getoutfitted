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

Template.reservationDatepicker.rendered = function () {
  $("#datepicker input").datepicker({
    startDate: "+4d",
    autoclose: true,
    daysOfWeekDisabled: [0, 1, 2, 3, 5, 6],
    endDate: "+540d"
  });


  $(document).on({
    mouseenter: function () {
      let $nextWeek = $(this).parent().next().find(".day");
      let $remainingDaysThisWeek = $(this).nextAll();
      $remainingDaysThisWeek.addClass("highlight");
      $nextWeek.slice(0, 3).addClass("highlight");
    },
    mouseleave: function () {
      let $nextWeek = $(this).parent().next().find(".day");
      let $remainingDaysThisWeek = $(this).nextAll();
      $remainingDaysThisWeek.removeClass("highlight");
      $nextWeek.slice(0, 3).removeClass("highlight");
    }
  }, ".day:not(.disabled)");
};

Template.reservationDatepicker.helpers({
  startDate: function () {
    let cart = ReactionCore.Collections.Cart.findOne();
    if (cart && cart.startTime) {
      return moment(cart.startTime).format('MM/DD/YYYY');
    }
    return '';
  },

  startDateHuman: function () {
    let cart = ReactionCore.Collections.Cart.findOne();
    if (cart && cart.startTime) {
      return moment(cart.startTime).format('MMM DD, YYYY');
    }
    return '';
  },

  endDate: function () {
    let cart = ReactionCore.Collections.Cart.findOne();
    if (cart && cart.endTime) {
      return moment(cart.endTime).format('MM/DD/YYYY');
    }
    return '';
  },

  endDateHuman: function () {
    let cart = ReactionCore.Collections.Cart.findOne();
    if (cart && cart.endTime) {
      return moment(cart.endTime).format('MMM DD, YYYY');
    }
    return '';
  },

  rentalLength: function () {
    if (Session.get('cartRentalLength')) {
      return Session.get('cartRentalLength');
    }
    let cart = ReactionCore.Collections.Cart.findOne();
    return cart.rentalDays;
  }
});

Template.reservationDatepicker.events({
  'changeDate .start': function (event) {
    const cart = ReactionCore.Collections.Cart.findOne();
    const startDate = moment(event.currentTarget.value, 'MM/DD/YYYY');
    let endDate;
    if (cart.endTime) {
      endDate = moment(cart.endTime);
    } else {
      endDate = moment(startDate);
    }

    if (+startDate !== +cart.startTime || +endDate !== +cart.endTime) {
      const cartRentalLength = moment(startDate).twix(endDate).count('days');
      Session.set('cartRentalLength', cartRentalLength);
      Meteor.call('rentalProducts/setRentalPeriod', cart._id, startDate.toDate(), endDate.toDate());
      $('#datepicker .end').datepicker('show');
    }
  },

  'changeDate .end': function (event) {
    let cart = ReactionCore.Collections.Cart.findOne();
    let endDate = moment(event.currentTarget.value, 'MM/DD/YYYY');
    let startDate;
    if (cart.startTime) {
      startDate = moment(cart.startTime);
    } else {
      startDate = moment(endDate);
    }
    if (+startDate !== +cart.startTime || +endDate !== +cart.endTime) {
      let cartRentalLength = moment(startDate).twix(endDate).count('days');
      Session.set('cartRentalLength', cartRentalLength);
      Meteor.call('rentalProducts/setRentalPeriod', cart._id, startDate.toDate(), endDate.toDate());
    }
  },

  'click .show-start': function () {
    $('#datepicker .start').datepicker('show');
  },
  'mouseenter .day': function (event) {
    console.log(event.currentTarget);
  }
});
