import moment from "moment";

import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";

import { Cart } from "/lib/collections";

import { GetOutfitted } from "/imports/plugins/custom/getoutfitted-core/lib/api";

Template.goDateAndDestinationForm.helpers({
  resorts: function () {
    return [{
      name: "Aspen",
      postal: 81611
    },
    {
      name: "Beaver Creek",
      postal: 81657
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
      postal: 80424
    },
    {
      name: "Deer Valley",
      postal: 84060
    },
    {
      name: "Jackson Hole",
      postal: 83001
    },
    {
      name: "Keystone",
      postal: 80424
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
      postal: 81611
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
  "submit #dateAndDestinationForm": function (event, instance) {
    event.preventDefault();
    const cart = Cart.findOne({userId: Meteor.userId()});
    const resort = event.target.destinationSelect.value;
    const start = event.target.start.value;
    const length = parseInt(event.target.lengthSelect.value, 10);

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

    Meteor.call("rentalProducts/setReservation", cart._id, {startTime, endTime, resort});
  },
  "change #destinationSelect": function () {
    Alerts.removeSeen();
  }
});
