import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";

/**
 * Inline login form for instance where guest login is needed.
 */
 Template.goLoginInline.events({
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

 Template.goLoginInline.helpers({
   emailRequired: function () {
     if (Session.get("validEmail")) {
       return "";
     }
     return "disabled";
   }
 });
