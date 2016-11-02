import { Cart, Accounts } from "/lib/collections";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";

/*
 * handles display of addressBook grid
 */
Template.shippingAddressBook.helpers({
  account: function () {
    return Accounts.findOne({
      userId: Meteor.userId()
    });
  },
  selectedShipping: function () {
    const cart = Cart.findOne({
      userId: Meteor.userId()
    });

    if (cart) {
      if (cart.shipping) {
        if (cart.shipping[0].address) {
          if (this._id === cart.shipping[0].address._id) {
            return "active";
          }
        }
      } else { // if this is a first checkout review, we need to push default
        // shipping address to cart
        if (this.isShippingDefault) {
          Meteor.call("cart/setShipmentAddress", cart._id, this);
          // return "active";
        }
      }
    }
  },
  multipleAddressBookEntries: function () {
    const account = Accounts.findOne({
      userId: Meteor.userId()
    });
    if (account && account.profile && account.profile.addressBook) {
      return account.profile.addressBook.length > 1;
    }

    return false;
  }

});

/*
 * events
 */

Template.shippingAddressBook.events({
  "click [data-event-action=selectShippingAddress]": function () {
    return Meteor.call("accounts/addressBookUpdate", this, null,
      "isShippingDefault");
  },
  "click [data-event-action=selectBillingAddress]": function () {
    return Meteor.call("accounts/addressBookUpdate", this, null,
      "isBillingDefault");
  }
});




/*
 * handles display of billing address list
 */
Template.billingAddressBook.helpers({
  account: function () {
    return Accounts.findOne({
      userId: Meteor.userId()
    });
  },
  selectedBilling: function () {
    const cart = Cart.findOne({
      userId: Meteor.userId()
    });

    if (cart) {
      if (cart.billing) {
        if (cart.billing[0].address) {
          if (this._id === cart.billing[0].address._id) {
            return "active";
          }
        }
      } else { // if this is a first checkout review, we need to push default
        // shipping address to cart
        if (this.isShippingDefault) {
          Meteor.call("cart/setPaymentAddress", cart._id, this);
          // return "active";
        }
      }
    }
  },
  multipleAddressBookEntries: function () {
    const account = Accounts.findOne({
      userId: Meteor.userId()
    });
    if (account && account.profile && account.profile.addressBook) {
      return account.profile.addressBook.length > 1;
    }

    return false;
  }

});

/*
 * events
 */

Template.billingAddressBook.events({
  "click [data-event-action=selectBillingAddress]": function () {
    return Meteor.call("accounts/addressBookUpdate", this, null,
      "isBillingDefault");
  }
});
