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
    const cart = Cart.findOne({ userId: Meteor.userId() });

    if (cart && cart.useShippingForBilling) {
      this.currentAddressTemplate.set("useShippingForBilling");
    } else if (account && account.profile && account.profile.addressBook) {
      if (account.profile.addressBook.length === 0) {
        this.currentAddressTemplate.set("billingAddressAdd");
      } else {
        // Determine if billing address has been set.
        const defaultBillingAddress = account.profile.addressBook.find((address) => address.isBillingDefault === true );
        if (defaultBillingAddress) {
          this.currentAddressTemplate.set("billingAddressBook");
        } else {
          this.currentAddressTemplate.set("billingAddressAdd");
        }
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
  },
  useShippingForBilling() {
    const cart = Cart.findOne({userId: Meteor.userId()});
    if (cart) {
      return cart.useShippingForBilling;
    }
    return false;
  },
  showUseShippingForBilling() {
    const account = Accounts.findOne({ userId: Meteor.userId() });
    if (account && account.profile && Array.isArray(account.profile.addressBook)) {
      const defaultShippingAddress = account.profile.addressBook.find((address) => address.isShippingDefault === true);
      const defaultBillingAddress = account.profile.addressBook.find((address) => address.isBillingDefault === true);

      if (defaultShippingAddress && !defaultBillingAddress) {
        return true;
      }
    }
    return false;
  },
  billingSelected() {
    const cart = Cart.findOne({
      userId: Meteor.userId()
    });
    if (cart && Array.isArray(cart.billing) && cart.billing[0] && cart.billing[0].address) {
      if (cart.billing[0].address.postal) {
        return true;
      }
    }
    return false;
  }
});

Template.goCheckoutBillingAddress.onRendered(function () {
});

Template.goCheckoutBillingAddress.events({
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

  "click [data-event-action=cancelAddressEdit], form submit, showMainView": function (event) {
    event.preventDefault();
    event.stopPropagation();

    Template.instance().currentAddressTemplate.set("billingAddressBook");
  },

  "click #useShippingForBilling": function (event) {
    const useShippingForBilling = event.target.checked;
    Meteor.call("cart/useShippingForBilling", useShippingForBilling);
  }
});
