import { Cart } from "/lib/collections";
import { Meteor } from "meteor/meteor";

Meteor.methods({
  "checkout/addEmailToCart": function (cartId, email) {
    check(cartId, String);
    check(email, String);
    Cart.update({
      _id: cartId
    }, {
      $set: {
        email: email
      }
    });
  }
});
