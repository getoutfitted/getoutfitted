import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Cart } from "/lib/collections";

Template.goNavigationBar.helpers({
  reservationDatesSelected() {
    const cart = Cart.findOne({userId: Meteor.userId()});
    return cart.startTime && cart.endTime;
  }
});
