import $ from "jquery";

import moment from "moment";
import momentBusiness from "moment-business";

import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Cart } from "/lib/collections";

import { GetOutfitted } from "/imports/plugins/custom/getoutfitted-core/lib/api";


changeReservationDates = function (options) {
  const {cart, startTime, endTime} = options;

  Meteor.call("rentalProducts/setReservation", cart._id, {startTime, endTime}, function (error, result) {
    if (error) {
      Alerts.alert(
        "Error Changing Dates!",
        "If this problem persists please call or live-chat our customer support team. 888-618-0305",
        {
          type: "error"
        });
    }
    if (result.successful) {
      Alerts.alert(
        {
          title: "Reservation dates changed successfully!",
          type: "success"
        });
    } else {
      itemsToRemove = result.inventoryNotAvailable.reduce(function (items, variantId) {
        const itemInCart = cart.items.find(i => i.variants.selectedBundleOptions.find(sbo => sbo.variantId === variantId));
        const variant = itemInCart.variants.selectedBundleOptions.find(v => v.variantId === variantId);
        const constructedTitle = `${itemInCart.title} : ${variant.cartLabel}`;
        items.names.push(constructedTitle);
        items.ids.push(itemInCart._id);
        return items;
      }, {names: [], ids: []});

      Alerts.alert({
        title: "Can't update reservation!",
        html: `
          The following items in your cart were not available for your requested dates.
          <br><br>
          ${itemsToRemove.names.join("<br>")}
          <br><br>
          You can remove those items from your cart and try again or keep your current dates.
        `,
        type: "warning",
        reverseButtons: true,
        showCancelButton: true,
        cancelButtonText: "Keep Cart",
        confirmButtonText: "Remove items from cart",
        confirmButtonColor: "#AACBC9"
      }, (isConfirm) => {
        if (isConfirm) {
          Meteor.call("cart/removeFromCartBulk", itemsToRemove.ids, function (err) {
            if (error) {
              Logger.error("Error removing items from cart", err);
            } else {
              changeReservationDates(options);
            }
          });
        }
      });
    }
  });
};


Template.goNavigationBar.onCreated(function () {
  const instance = this;
  instance.reservation = new ReactiveVar({startDate: null, endDate: null});
  instance.startTime = new ReactiveVar(null);
  instance.mobileCalendar = new ReactiveVar(false);
  instance.rush = new ReactiveVar(false);
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
      instance.reservation.set({
        startTime: GetOutfitted.adjustDenverToLocalTime(cart.startTime),
        endTime: GetOutfitted.adjustDenverToLocalTime(cart.endTime)
      });
    }
  }
  if (!instance.startTime.get()) {
    if (cart.startTime) {
      instance.startTime.set(GetOutfitted.adjustDenverToLocalTime(cart.startTime));
    }
  }

  this.autorun(function () {
    instance.rush.set(cart.isRushDelivery);

    $("#nav-datepicker").datepicker({
      startDate: "+1d",
      endDate: "+540d",
      maxViewMode: 0,
      beforeShowDay: function (date) {
        const reservationLength = GetOutfitted.clientReservationDetails.get("reservationLength");
        let classes = "";
        const destination = parseInt(cart.resort, 10);
        const localDestination = GetOutfitted.localDestinations.indexOf(destination) !== -1;

        // We require 5 business days lead time unless "Rush Shipping" has been selected.
        let processingDelay = 5;
        if (instance.rush.get()) {
          processingDelay = localDestination ? 1 : 3;
        }

        // Change date checkers to check against Denver time
        const start = GetOutfitted.adjustLocalToDenverTime(moment(date).startOf("day"));

        // Calculate the first day we could possibly ship to based on destination
        // Should include holidays in here as well in the future.
        const firstShippableDay = GetOutfitted.adjustLocalToDenverTime(
          momentBusiness.addWeekDays(moment().startOf("day"), processingDelay)
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
  }, "#nav-datepicker .day:not(.disabled)");

  $("#nav-datepicker").on("changeDate", function () {
    const selectedDate = $("#nav-datepicker").datepicker("getFormattedDate");
    $("#navDatepickerStart").val(selectedDate);
    instance.startTime.set($("#nav-datepicker").datepicker("getDate"));

    if (instance.rush.get()) {
      const firstShippableDay = momentBusiness.addWeekDays(moment().startOf("day"), 5);
      const selectedMoment = moment(selectedDate, "MM/DD/YYYY");
      // Check to see if selected date is within rush window
      if (+firstShippableDay <= +selectedMoment) {
        instance.rush.set(false);
        Meteor.call("cart/setShipmentMethod", cart._id, GetOutfitted.shippingMethods.freeShippingMethod);
        $(".nav-rush-span i").removeClass("fa-check-square-o");
        $(".nav-rush-span i").addClass("fa-square-o");
      }
    }

    $("#nav-datepicker").datepicker("update", instance.startTime.get());
  });
});

Template.goNavigationBar.helpers({
  selectedResLength: function (len) {
    const setLen = GetOutfitted.clientReservationDetails.get("reservationLength") || 1;
    return len === setLen + 1 ? "selected" : "";
  },
  reservationDatesSelected() {
    const cart = Cart.findOne({userId: Meteor.userId()});
    if (cart) {
      return cart.startTime && cart.endTime;
    }
    return false;
  },
  reservationStart() {
    const cart = Cart.findOne({userId: Meteor.userId()});
    if (cart) {
      return moment(GetOutfitted.adjustDenverToLocalTime(cart.startTime)).format("MM/DD/YYYY");
    }
    return "";
  },
  reservationDates() {
    const cart = Cart.findOne({userId: Meteor.userId()});
    if (cart) {
      if (cart.startTime && cart.endTime) {
        const start = moment(GetOutfitted.adjustDenverToLocalTime(cart.startTime)).format("ddd M/DD");
        const end = moment(GetOutfitted.adjustDenverToLocalTime(cart.endTime)).format("ddd M/DD");
        return `${start} - ${end}`;
      }
    }
    return "";
  },
  goPlusLocation() {
    const cart = Cart.findOne({userId: Meteor.userId()});
    if (cart && cart.resort && cart.resort !== "other") {
      return true;
    }
    return false;
  },
  isRushDelivery() {
    const cart = Cart.findOne({userId: Meteor.userId()});
    if (cart && cart.isRushDelivery) {
      return "fa-check-square-o";
    }
    return "fa-square-o";
  }
});

Template.goNavigationBar.events({
  "click .length-select": function (event) {
    event.stopPropagation();
  },
  "change #navLengthSelect": function (event) {
    GetOutfitted.clientReservationDetails.set("reservationLength", parseInt(event.currentTarget.value, 10) - 1);
    $("#nav-datepicker").datepicker("update");
  },
  "submit #navReservationForm": function (event) {
    event.preventDefault();

    const instance = Template.instance();
    const cart = Cart.findOne({userId: Meteor.userId()});
    const start = event.target.navDatepickerStart.value;
    const length = parseInt(event.target.navLengthSelect.value, 10);
    const startTime = GetOutfitted.adjustLocalToDenverTime(moment(start, "MM/DD/YYYY").startOf("day").toDate());
    const endTime = moment(startTime).add(length - 1, "days").toDate();
    const rush = instance.rush.get();

    changeReservationDates({cart, startTime, endTime, rush});
  },
  // Toggles to move the calendar from desktop menu to mobile menu and vice versa
  "click #mobileCalendarToggle": function (event, template) {
    const instance = Template.instance();
    if (!instance.mobileCalendar.get()) {
      template.$("#mobileCalendarContainer").prepend(template.$("#navReservationContainer"));
      template.$("#mobileCalendarContainer .datepicker-days .table-condensed").css("margin", "0 auto");
      instance.mobileCalendar.set(true);
    }
  },
  "click #desktopCalendarToggle": function (event, template) {
    const instance = Template.instance();
    if (instance.mobileCalendar.get()) {
      template.$("#desktopCalendarContainer").prepend(template.$("#navReservationContainer"));
      instance.mobileCalendar.set(false);
    }
  },
  "click .nav-rush-span": function (event) {
    event.stopPropagation();
    const instance = Template.instance();
    const selectedStartDate = $("#navDatepickerStart").val();
    if (instance.rush.get() && selectedStartDate !== "") {
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
          placement: "navRushContainer"
        });
        return;
      }
    }
    // If rush isn't selected, or the date isn't within the rush window, flip the flag
    const newRushValue = !instance.rush.get();
    instance.rush.set(newRushValue);
    const shippingMethod = newRushValue ? GetOutfitted.shippingMethods.rushShippingMethod : GetOutfitted.shippingMethods.freeShippingMethod;
    Meteor.call("cart/setShipmentMethod", cart._id, shippingMethod);

    $(".nav-rush-span i").removeClass("fa-check-square-o fa-square-o");
    $(".nav-rush-span i").addClass(instance.rush.get() ? "fa-check-square-o" : "fa-square-o");
    // Refresh datepicker
    $("#nav-datepicker").datepicker("update", instance.startTime.get());
  }
});
