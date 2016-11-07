import { Meteor } from "meteor/meteor";
import { ReactiveVar } from "meteor/reactive-var";
import { Template } from "meteor/templating";
import { Accounts, Cart } from "/lib/collections";

Template.goCheckoutShippingAddress.onCreated(function () {
  this.currentAddressTemplate = ReactiveVar("shippingAddressAdd");
  this.templateData = ReactiveVar({});

  this.autorun(() => {
    this.subscribe("Accounts", Meteor.userId());

    const account = Accounts.findOne({ userId: Meteor.userId() });
    const cart = Cart.findOne({ userId: Meteor.userId() });

    if (account && account.profile && account.profile.addressBook) {
      if (account.profile.addressBook.length === 0) {
        this.currentAddressTemplate.set("shippingAddressAdd");
      } else {
        this.currentAddressTemplate.set("shippingAddressBook");
        Meteor.call("workflow/pushCartWorkflow", "goCartWorkflow", "goCheckoutBillingAddress", cart._id);
      }
    }
  });
});

Template.goCheckoutShippingAddress.helpers({
  currentView() {
    return Template.instance().currentAddressTemplate.get();
  },
  data() {
    return Template.instance().templateData.get();
  },
  shippingSelected() {
    const cart = Cart.findOne({
      userId: Meteor.userId()
    });
    if (cart && Array.isArray(cart.shipping) && cart.shipping[0] && cart.shipping[0].address) {
      if (cart.shipping[0].address.postal) {
        return true;
      }
    }
    return false;
  }
});

Template.goCheckoutShippingAddress.onRendered(function () {
  // ReactionAnalytics.trackEventWhenReady("Completed Checkout Step", {
  //   "step": 2,
  //   "Step Name": "Sign In or Checkout As Guest"
  // });
  //
  // ReactionAnalytics.trackEventWhenReady("Viewed Checkout Step", {
  //   "step": 3,
  //   "Step Name": "Choose Shipping and Billing Address"
  // });
});

Template.goCheckoutShippingAddress.events({
  "click [data-event-action=addNewAddress]": function (event) {
    event.preventDefault();
    event.stopPropagation();

    Template.instance().currentAddressTemplate.set("shippingAddressAdd");
  },

  // **************************************************************************
  // Edit an address
  //
  "click [data-event-action=editAddress]": function (event) {
    event.preventDefault();
    event.stopPropagation();

    Template.instance().templateData.set({
      address: this
    });

    Template.instance().currentAddressTemplate.set("shippingAddressEdit");
  },

  "click [data-event-action=removeAddress]": function (event, template) {
    event.preventDefault();
    event.stopPropagation();

    Meteor.call("accounts/addressBookRemove", this._id, (error, result) => {
      if (error) {
        Alerts.toast(i18next.t("addressBookGrid.cantRemoveThisAddress", { err: error.message }), "error");
      }
      if (result) {
        const account = Accounts.findOne({
          userId: Meteor.userId()
        });
        if (account) {
          if (account.profile) {
            if (account.profile.addressBook.length === 0) {
              template.currentAddressTemplate.set("shippingAddressAdd");
            }
          }
        }
      }
    });
  },

  "click [data-event-action=cancelAddressEdit], form submit, showMainView": function (event) {
    event.preventDefault();
    event.stopPropagation();

    Template.instance().currentAddressTemplate.set("shippingAddressBook");
  }
});
