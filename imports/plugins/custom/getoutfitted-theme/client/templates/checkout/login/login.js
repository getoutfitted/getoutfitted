import _ from "lodash";
import { Reaction } from "/client/api";
import { Cart } from "/lib/collections";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Session } from "meteor/session";

/**
 * Inline login form for instance where guest login is needed.
 */

Template.guestCheckoutEmail.events({
  "keyup #guestEmail, blur #guestEmail": (event) => {
    event.preventDefault();
    const email = event.target.value;
    let result = _.debounce(function () {
      const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      let res = re.test(email);
      if (res) {
        Session.set("validEmail", res);
        Session.set("guestCheckoutEmailAddress", email);
      } else {
        // Set to false if they delete part of email;
        Session.set("validEmail", res);
      }
    }, 300);
    result(email);
  }
});

Template.loginInline.events({
    /**
     * Continue as guest.
     * @param  {Event} event - jQuery Event
     * @return {void}
     */
    "click .continue-guest": (event) => {
      event.preventDefault();
      if (Session.get("validEmail")) {
        const cart = Cart.findOne({}, {fields: {_id: 1}});
        Meteor.call("checkout/addEmailToCart", cart._id, Session.get("guestCheckoutEmailAddress"));
        Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "checkoutLogin");
      }
    }
});

Template.loginInline.helpers({
  emailRequired: function () {
    if (Session.get("validEmail")) {
      return "";
    }
    return "disabled";
  }
});
