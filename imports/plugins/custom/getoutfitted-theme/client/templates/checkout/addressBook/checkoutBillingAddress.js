import { Meteor } from "meteor/meteor";
import { ReactiveVar } from "meteor/reactive-var";
import { Template } from "meteor/templating";
import { Accounts, Cart } from "/lib/collections";

Template.goCheckoutBillingAddress.onCreated(function () {
  this.currentAddressTemplate = ReactiveVar("billingAddressAdd");
  this.templateData = ReactiveVar({});

  this.autorun(() => {
    this.subscribe("Accounts", Meteor.userId());

    const account = Accounts.findOne({ userId: Meteor.userId() });

    if (account && account.profile && account.profile.addressBook) {
      if (account.profile.addressBook.length === 0) {
        this.currentAddressTemplate.set("billingAddressAdd");
      } else {
        this.currentAddressTemplate.set("billingAddressBook");
        console.log("pushing cart workflow to shippingOptions");
        Meteor.call("workflow/pushCartWorkflow", "goCartWorkflow", "goCheckoutShippingOptions");
      }
    }
  });
});

Template.goCheckoutBillingAddress.helpers({
  currentView() {
    return Template.instance().currentAddressTemplate.get();
  },
  data() {
    return Template.instance().templateData.get();
  }
});

Template.goCheckoutBillingAddress.onRendered(function () {
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

Template.goCheckoutBillingAddress.events({
  "click [data-event-action=addNewAddress]": function (event) {
    event.preventDefault();
    event.stopPropagation();

    Template.instance().currentAddressTemplate.set("billingAddressAdd");
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
              template.currentAddressTemplate.set("billingAddressAdd");
            }
          }
        }
      }
    });
  },

  "click [data-event-action=cancelAddressEdit], form submit, showMainView": function (event) {
    event.preventDefault();
    event.stopPropagation();

    Template.instance().currentAddressTemplate.set("billingAddressBook");
  }
});
