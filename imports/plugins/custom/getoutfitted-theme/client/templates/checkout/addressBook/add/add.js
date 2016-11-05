import { i18next } from "/client/api";
import { Accounts, Cart } from "/lib/collections";
import { Session } from "meteor/session";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";

Template.goAddressBookAdd.helpers({
  thisAddress: function () {
    const thisAddress = {};
    // admin should receive his account
    const account = Accounts.findOne({
      userId: Meteor.userId()
    });
    if (account) {
      if (account.profile) {
        if (account.profile.name) {
          thisAddress.fullName = account.profile.name;
        }
        // if this will be the first address we set defaults here and not display
        // them inside form
        if (account.profile.addressBook) {
          if (account.profile.addressBook.length === 0) {
            thisAddress.isShippingDefault = true;
            thisAddress.isBillingDefault = true;
          }
        }
      }
    }

    if (Session.get("address")) {
      thisAddress.postal = Session.get("address").zipcode;
      thisAddress.country = Session.get("address").countryCode;
      thisAddress.city = Session.get("address").city;
      thisAddress.region = Session.get("address").state;
    }

    return thisAddress;
  }
});


Template.goAddressBookAdd.helpers({
  hasAddressBookEntries: function () {
    const account = Accounts.findOne({
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


/**
 * addressBookAddForm form handling
 * @description gets accountId and calls addressBookAdd method
 * @fires "accounts/addressBookAdd" method
 */
AutoForm.hooks({
  addressBookAddForm: {
    onSubmit: function (insertDoc) {
      this.event.preventDefault();
      const cart = Cart.findOne({userId: Meteor.userId()});
      const addressBook = $(this.template.firstNode).closest(".address-book");
      Meteor.call("accounts/addressBookAdd", insertDoc, (error, result) => {
        if (error) {
          Alerts.toast(i18next.t("addressBookAdd.failedToAddAddress", { err: error.message }), "error");
          this.done(new Error("Failed to add address: ", error));
          return false;
        }
        if (result) {
          this.done();
          addressBook.trigger($.Event("showMainView"));
          Meteor.call("workflow/pushCartWorkflow", "goCartWorkflow", "goCheckoutBillingAddress", cart._id);
        }
      });
    }
  }
});

/**
 * billingAddressAddForm form handling
 * @description gets accountId and calls addressBookAdd method
 * @fires "accounts/addressBookAdd" method
 */
AutoForm.hooks({
  billingAddressAddForm: {
    onSubmit: function (insertDoc) {
      this.event.preventDefault();
      const cart = Cart.findOne({userId: Meteor.userId()});
      const addressBook = $(this.template.firstNode).closest(".address-book");
      Meteor.call("accounts/addressBookAdd", insertDoc, (error, result) => {
        if (error) {
          Alerts.toast(i18next.t("addressBookAdd.failedToAddAddress", { err: error.message }), "error");
          this.done(new Error("Failed to add address: ", error));
          return false;
        }
        if (result) {
          this.done();
          addressBook.trigger($.Event("showMainView"));
          Meteor.call("workflow/pushCartWorkflow", "goCartWorkflow", "goCheckoutReview", cart._id);
        }
      });
    }
  }
});
