import _ from "lodash";
import { Session } from "meteor/session";
import { Meteor } from "meteor/meteor";
import * as Collections from "/lib/collections";
import { Template } from "meteor/templating";

Template.usAddressBookForm.helpers({
  states: [
    {
      label: "Alabama",
      value: "AL"
    },
    {
      label: "Alaska",
      value: "AK"
    },
    {
      label: "Arizona",
      value: "AZ"
    },
    {
      label: "Arkansas",
      value: "AR"
    },
    {
      label: "California",
      value: "CA"
    },
    {
      label: "Colorado",
      value: "CO"
    },
    {
      label: "Connecticut",
      value: "CT"
    },
    {
      label: "Delaware",
      value: "DE"
    },
    {
      label: "District Of Columbia",
      value: "DC"
    },
    {
      label: "Florida",
      value: "FL"
    },
    {
      label: "Georgia",
      value: "GA"
    },
    {
      label: "Hawaii",
      value: "HI"
    },
    {
      label: "Idaho",
      value: "ID"
    },
    {
      label: "Illinois",
      value: "IL"
    },
    {
      label: "Indiana",
      value: "IN"
    },
    {
      label: "Iowa",
      value: "IA"
    },
    {
      label: "Kansas",
      value: "KS"
    },
    {
      label: "Kentucky",
      value: "KY"
    },
    {
      label: "Louisiana",
      value: "LA"
    },
    {
      label: "Maine",
      value: "ME"
    },
    {
      label: "Maryland",
      value: "MD"
    },
    {
      label: "Massachusetts",
      value: "MA"
    },
    {
      label: "Michigan",
      value: "MI"
    },
    {
      label: "Minnesota",
      value: "MN"
    },
    {
      label: "Mississippi",
      value: "MS"
    },
    {
      label: "Missouri",
      value: "MO"
    },
    {
      label: "Montana",
      value: "MT"
    },
    {
      label: "Nebraska",
      value: "NE"
    },
    {
      label: "Nevada",
      value: "NV"
    },
    {
      label: "New Hampshire",
      value: "NH"
    },
    {
      label: "New Jersey",
      value: "NJ"
    },
    {
      label: "New Mexico",
      value: "NM"
    },
    {
      label: "New York",
      value: "NY"
    },
    {
      label: "North Carolina",
      value: "NC"
    },
    {
      label: "North Dakota",
      value: "ND"
    },
    {
      label: "Ohio",
      value: "OH"
    },
    {
      label: "Oklahoma",
      value: "OK"
    },
    {
      label: "Oregon",
      value: "OR"
    },
    {
      label: "Pennsylvania",
      value: "PA"
    },
    {
      label: "Rhode Island",
      value: "RI"
    },
    {
      label: "South Carolina",
      value: "SC"
    },
    {
      label: "South Dakota",
      value: "SD"
    },
    {
      label: "Tennessee",
      value: "TN"
    },
    {
      label: "Texas",
      value: "TX"
    },
    {
      label: "Utah",
      value: "UT"
    },
    {
      label: "Vermont",
      value: "VT"
    },
    {
      label: "Virgin Islands",
      value: "VI"
    },
    {
      label: "Virginia",
      value: "VA"
    },
    {
      label: "Washington",
      value: "WA"
    },
    {
      label: "West Virginia",
      value: "WV"
    },
    {
      label: "Wisconsin",
      value: "WI"
    },
    {
      label: "Wyoming",
      value: "WY"
    }
  ],
  hasAddressBookEntries: function () {
    const account = Collections.Accounts.findOne({
      userId: Meteor.userId()
    });
    if (account) {
      if (account.profile) {
        if (account.profile.addressBook) {
          return account.profile.addressBook.length > 0;
        }
      }
    }

    return false;
  }
});
