import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";

import { Cart } from "/lib/collections";

Template.layoutFooter.helpers({
  copyrightYear: function () {
    const date = new Date();
    return date.getFullYear();
  },
  reservationDatesSelected() {
    const cart = Cart.findOne({userId: Meteor.userId()});
    if (cart) {
      return cart.startTime && cart.endTime;
    }
    return false;
  }
});
