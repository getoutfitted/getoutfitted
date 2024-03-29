// import { Meteor } from "meteor/meteor";
// import { ReactiveVar } from "meteor/reactive-var";
// import { i18next } from "/client/api";
// import * as Collections from "/lib/collections";
// import { Template } from "meteor/templating";
//
// /*
//  * Template.checkoutAddressBook
//  * template determines which view should be used:
//  * addAddress (edit or add)
//  * addressBookView (view)
//  */
//
// Template.addressBook.onCreated(function () {
//   this.currentViewTemplate = ReactiveVar("addressBookAdd");
//   this.templateData = ReactiveVar({});
//
//   this.autorun(() => {
//     this.subscribe("Accounts", Meteor.userId());
//
//     const account = Collections.Accounts.findOne({
//       userId: Meteor.userId()
//     });
//
//     if (account) {
//       if (account.profile) {
//         if (account.profile.addressBook) {
//           if (account.profile.addressBook.length === 0) {
//             this.currentViewTemplate.set("addressBookAdd");
//           } else {
//             this.currentViewTemplate.set("addressBookGrid");
//           }
//         }
//       }
//     }
//   });
// });
//
// // Template.addressBook.onRendered(function () {
// //   let view = this.$("[blaze-view="addressBook"]").get(0);
// // });
//
// Template.addressBook.helpers({
//   account: function () {
//     const account = Collections.Accounts.findOne({
//       userId: Meteor.userId()
//     });
//     return account;
//   },
//
//   data: function () {
//     return Template.instance().templateData.get();
//   },
//
//   currentView: function () {
//     return Template.instance().currentViewTemplate.get();
//   },
//
//   selectedAddress: function () {
//     return Template.instance.templateData.get();
//   }
// });
//
// Template.addressBook.events({
//
//   // **************************************************************************
//   //
//   //
//   "click [data-event-action=addNewAddress]": function (event) {
//     event.preventDefault();
//     event.stopPropagation();
//
//     Template.instance().currentViewTemplate.set("addressBookAdd");
//   },
//
//   // **************************************************************************
//   // Edit an address
//   //
//   "click [data-event-action=editAddress]": function (event) {
//     event.preventDefault();
//     event.stopPropagation();
//
//     Template.instance().templateData.set({
//       address: this
//     });
//
//     Template.instance().currentViewTemplate.set("addressBookEdit");
//   },
//
//   // **************************************************************************
//   // Remove the address from the address book
//   //
//   "click [data-event-action=removeAddress]": function (event, template) {
//     event.preventDefault();
//     event.stopPropagation();
//
//     Meteor.call("accounts/addressBookRemove", this._id, (error, result) => {
//       if (error) {
//         Alerts.toast(i18next.t("addressBookGrid.cantRemoveThisAddress", { err: error.message }), "error");
//       }
//       if (result) {
//         const account = Collections.Accounts.findOne({
//           userId: Meteor.userId()
//         });
//         if (account) {
//           if (account.profile) {
//             if (account.profile.addressBook.length === 0) {
//               template.currentViewTemplate.set("addressBookAdd");
//             }
//           }
//         }
//       }
//     });
//   },
//
//   "click [data-event-action=cancelAddressEdit], form submit, showMainView": function (event) {
//     event.preventDefault();
//     event.stopPropagation();
//
//     Template.instance().currentViewTemplate.set("addressBookGrid");
//   }
// });
