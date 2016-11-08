import { Template } from "meteor/templating";
import { Accounts } from "/lib/collections";
/*
Template Helpers for checkout templates.
 */

Template.registerHelper("shippingAddressExists", () => {
  const account = Accounts.findOne({ userId: Meteor.userId() });
  if (account && account.profile && account.profile.addressBook && account.profile.addressBook[0]) {
    const defaultShippingAddress = account.profile.addressBook.find((address) => address.isShippingDefault === true);
    if (defaultShippingAddress) {
      return true;
    }
  }
  return false;
});
