import { $ } from "meteor/jquery";
import { ReactionProduct } from "/lib/api";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";
import "bootstrap-datepicker";

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
      return current.rentalPriceBuckets;
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
  }
});

Template.rentalLengthOptions.events({
  "change input[name='reservationLength']:radio": function (event) {
    Session.set("reservationLength", parseInt(event.currentTarget.value, 10));
    $("#rental-start").datepicker("update");
  }
});
