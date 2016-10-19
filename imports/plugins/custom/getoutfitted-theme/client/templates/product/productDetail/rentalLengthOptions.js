import { $ } from "meteor/jquery";
import { ReactionProduct } from "/lib/api";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";
import { Cart } from "/lib/collections";
import { _  } from "meteor/underscore";
import "bootstrap-datepicker";
import moment from "moment";

Template.rentalLengthOptions.onCreated(function () {
  const cart = Cart.findOne({userId: Meteor.userId()});
  let defaultReservationLength = 1; // 1 + day selected, so actually 2. Yes it's confusing. TODO: Make it less confusing
  if (cart && typeof cart.rentalDays === "number") {
    defaultReservationLength = cart.rentalDays;
  }
  Session.setDefault("reservationLength", defaultReservationLength);
});

Template.rentalLengthOptions.helpers({
  twoOptions: () => {
    const current = ReactionProduct.selectedVariant();
    if (current && current.rentalPriceBuckets && current.rentalPriceBuckets.length === 2) {
      return true;
    }
    return false;
  },

  moreThanTwoOptions: () => {
    const current = ReactionProduct.selectedVariant();
    if (current && current.rentalPriceBuckets && current.rentalPriceBuckets.length > 2) {
      return true;
    }
    return false;
  },

  rentalPriceBuckets: () => {
    const current = ReactionProduct.selectedVariant();
    if (current && current.rentalPriceBuckets) {
      return _.sortBy(current.rentalPriceBuckets, "duration");
    }
    return [];
  },

  rentalPriceBucket: () => {
    const current = ReactionProduct.selectedVariant();
    if (current && current.rentalPriceBuckets) {
      return current.rentalPriceBuckets[0];
    }
    return [];
  },

  /**
   * adjustedDuration returns the duration - 1 to setup the number of days
   * in addition to the selected calendar day to highlight.
   * @param   {Number} duration the duration of the rentalPriceBucket
   * @returns {Number} duration - 1
   */
  adjustedDuration: (duration) => {
    return duration - 1;
  },
  isChecked: (index, duration) => {
    const currentResLength = Session.get("reservationLength");
    const adjustedDuration = duration - 1; // Subtract one because we count from selected day
    if (!currentResLength && index === 0) {
      return "checked";
    }
    return adjustedDuration  === currentResLength ? "checked" : "";
  },
  isFirst: (index) => {
    if (index === 0) {
      return "checked";
    }
    return "";
  },
  isSelected: function () {
    if (Session.get("reservationLength") === this.duration - 1) {
      return "selected";
    }
  }
});

Template.rentalLengthOptions.events({
  "change input[name='reservationLength']:radio, change .rentalLengthSelect ": function (event) {
    // rentalLength is reservation length - 1 because we are calculating days in addition to customer selected date.
    const rentalLength = parseInt(event.currentTarget.value, 10);
    Session.set("reservationLength", rentalLength);
    $("#rental-start").datepicker("update");
    const cart = Cart.findOne({userId: Meteor.userId()});
    if (cart) {
      Meteor.call("rentalProducts/setRentalPeriod",
        cart._id,
        cart.startTime,
        moment(cart.startTime).add(rentalLength, "days").toDate()
      );
    }
  }
});
