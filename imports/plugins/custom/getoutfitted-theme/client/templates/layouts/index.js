import moment from "moment";
import momentBusiness from "moment-business";

import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";

import { Cart } from "/lib/collections";
import { Router } from "/client/api";

import { GetOutfitted } from "/imports/plugins/custom/getoutfitted-core/lib/api";

Template.goDateAndDestinationForm.onCreated(function () {
  const instance = this;
  const cart = Cart.findOne({userId: Meteor.userId()});
  instance.rush = new ReactiveVar(cart.isRushDelivery);
});

Template.goDateAndDestinationForm.helpers({
  selectedResort() {
    const cart = Cart.findOne({userId: Meteor.userId()});
    if (cart && cart.resort) {
      return cart.resort;
    }
    return "";
  },
  currentResort(resort) {
    strResort = `${resort}`;
    const cart = Cart.findOne({userId: Meteor.userId()});
    if (cart && cart.resort) {
      return strResort === cart.resort ? "selected" : "";
    }
    return strResort === "" ? "selected" : "";
  },
  resorts: function () {
    return [{
      name: "Aspen",
      postal: 81611
    },
    {
      name: "Beaver Creek",
      postal: 81620
    },
    {
      name: "Big Sky",
      postal: 59716
    },
    {
      name: "Breckenridge",
      postal: 80424
    },
    {
      name: "Copper",
      postal: 80443
    },
    {
      name: "Deer Valley",
      postal: 84068
    },
    {
      name: "Jackson Hole",
      postal: 83001
    },
    {
      name: "Keystone",
      postal: 80435
    },
    {
      name: "North Lake Tahoe",
      postal: 96160
    },
    {
      name: "Park City",
      postal: 84060
    },
    {
      name: "Salt Lake City",
      postal: 84101
    },
    {
      name: "Snowmass",
      postal: 81654
    },
    {
      name: "South Lake Tahoe",
      postal: 96150
    },
    {
      name: "Steamboat",
      postal: 80477
    },
    {
      name: "Sun Valley",
      postal: 83353
    },
    {
      name: "Telluride",
      postal: 81435
    },
    {
      name: "Vail",
      postal: 81657
    }];
  }
});

Template.goDateAndDestinationForm.events({
  "submit #dateAndDestinationForm": function (event) {
    event.preventDefault();
    const instance = Template.instance();
    const cart = Cart.findOne({userId: Meteor.userId()});
    const resort = event.target.destinationSelect.value;
    const start = event.target.start.value;
    const length = parseInt(event.target.lengthSelect.value, 10);
    const rush = instance.rush.get();

    Alerts.removeSeen();
    if (resort === "" || start === "") {
      if (resort === "") {
        Alerts.inline("Please choose your resort from the list.", "danger", {
          autoHide: false,
          placement: "reservationResortSelect"
        });
      }
      if (start === "") {
        Alerts.inline("Please select your ski dates.", "danger", {
          autoHide: false,
          placement: "reservationDatepicker"
        });
      }
      return;
    }

    const startTime = GetOutfitted.adjustLocalToDenverTime(moment(start, "MM/DD/YYYY").startOf("day").toDate());

    const endTime = moment(startTime).add(length - 1, "days").toDate();

    Meteor.call("rentalProducts/setReservation", cart._id, {startTime, endTime, resort, rush});
    $("#nav-datepicker").datepicker("update", start);
    if (resort === "other") {
      Router.go("/collections/outfits");
    } else {
      Router.go("/collections/plus");
    }
  },
  "change #destinationSelect": function (event) {
    Alerts.removeSeen();
    const instance = Template.instance();
    if (instance.rush.get()) {
      const destination = parseInt(event.currentTarget.value, 10);
      const localDestination = GetOutfitted.localDestinations.indexOf(destination) !== -1;
      if (!localDestination) {
        const selectedStartDate = $("#rental-start").val();
        const firstShippableDay = momentBusiness.addWeekDays(moment().startOf("day"), 3);
        const selectedMoment = moment(selectedStartDate, "MM/DD/YYYY");
        // Check to see if selected date is within non-local rush window
        if (firstShippableDay > selectedMoment) {
          event.currentTarget.value = event.currentTarget.dataset.prevResort;
          Alerts.inline(`
            A ${selectedMoment.format("MMM D")} ski date is only available to Breckenridge, Keystone, or Copper.
            Please select a date on or after ${firstShippableDay.format("MMM D")} to select a different resort.
          `, "danger", {
            autoHide: false,
            placement: "reservationResortSelect"
          });
        }
      }
    }
  }
});
