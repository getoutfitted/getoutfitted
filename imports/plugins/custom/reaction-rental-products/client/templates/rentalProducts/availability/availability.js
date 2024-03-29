import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { ReactiveVar } from "meteor/reactive-var";

import { Reaction } from "/client/api";
import { Products } from "/lib/collections";
import { InventoryVariants } from "../../../../lib/collections";
import moment from "moment";
import "moment-timezone";
import "twix";

import "./availability.html";

function adjustLocalToDenverTime(time) {
  const here = moment(time);
  const denver = here.clone().tz("America/Denver");
  denver.add(here.utcOffset() - denver.utcOffset(), "minutes");
  return denver.toDate();
}

Template.dashboardRentalProductAvailability.onCreated(function () {
  const instance = this;
  instance.inventoryMarkedForInactivity = new ReactiveVar(false);
});

Template.dashboardRentalProductAvailability.onRendered(function () {
  const instance = this;
  const productId = Reaction.Router.getParam("_id");
  Session.setDefault("showInactiveInventoryVariants", false);

  instance.autorun(() => {
    instance.subscribe("inventoryVariantsById", productId);
    instance.subscribe("Product", productId);
    instance.subscribe("ParentProduct", productId);
  });
});

Template.dashboardRentalProductAvailability.helpers({
  currentMonth: () => {
    Session.setDefault("dashboardViewStart", moment().startOf("month").toDate());
    Session.setDefault("dashboardViewEnd", moment().endOf("month").toDate());
    return moment(Session.get("dashboardViewStart")).format("MMMM");
  },
  inventoryVariants: () => {
    const productId = Reaction.Router.getParam("_id");
    return InventoryVariants.find({productId: productId});
  },
  product: () => {
    const productId = ReactionRouter.getParam("_id");
    return Products.findOne(productId);
  },
  parent: () => {
    const productId = Reaction.Router.getParam("_id");
    const product = Products.findOne(productId);
    if (product) {
      return Products.findOne(product.ancestors[0]);
    }
    return {};
  },
  viewStart: () => {
    return Session.get("dashboardViewStart");
  },
  viewEnd: () => {
    Session.get("dashboardViewEnd");
  },
  days: () => {
    const viewStart = Session.get("dashboardViewStart");
    const viewEnd = Session.get("dashboardViewEnd");
    return moment(viewStart).twix(moment(viewEnd)).split(1, "day");
  },
  showInactiveInventoryVariants() {
    return Session.get("showInactiveInventoryVariants") ? "checked" : "";
  },
  showInactiveToggle() {
    const instance = Template.instance();
    return instance.inventoryMarkedForInactivity.get() ? "hidden" : "";
  },
  showDeactivateButton() {
    const instance = Template.instance();
    return instance.inventoryMarkedForInactivity.get() ? "" : "hidden";
  }
});

Template.dashboardRentalProductAvailability.events({
  "click #showInactive": function () {
    const showing = Session.get("showInactiveInventoryVariants");
    Session.set("showInactiveInventoryVariants", !showing);
  }
});

// TODO: This could be made MUCH more efficient by calculating
// each inventory variant a month/view start-view end at a time
// rather than each day independently
Template.dashboardVariantAvailability.helpers({
  viewStart: Session.get("dashboardViewStart"),
  viewEnd: Session.get("dashboardViewEnd"),
  currentMonth: moment(Session.get("dashboardViewStart")).format("MMMM"),
  days: function () {
    let viewStart = Session.get("dashboardViewStart");
    let viewEnd = Session.get("dashboardViewEnd");
    return moment(viewStart).twix(moment(viewEnd)).split(1, "day");
  },
  reservationStatus: function (day, unavailableDetails) {
    const icons = {
      "Shipped": "fa fa-upload fa-rotate-90 delivery-brown",
      "In Transit": "fa fa-truck fa-flip-horizontal delivery-brown",
      "Delivered": "fa fa-download fa-rotate-270 delivery-brown",
      "Return Shipped": "fa fa-upload fa-rotate-90 returning-green",
      "Return In Transit": "fa fa-truck fa-flip-horizontal returning-green",
      "Return Delivered": "fa fa-download fa-rotate-270 returning-green",
      "In Transit - Rush Delivery": "fa fa-plane rush-delivery-orange",
      "In Transit - Rush Returning": "fa fa-plane fa-flip-horizontal rush-delivery-orange",
      "Return Processing": "fa fa-refresh",
      "In Use": "fa fa-user primary-color",
      "Waiting For Transit": "fa fa-user-secret primary-color"
    };

    if (!unavailableDetails || unavailableDetails.length === 0) {
      return "hide";
    }
    let denverDay = adjustLocalToDenverTime(day.start());
    let pos =  _.sortedIndex(unavailableDetails, {date: denverDay}, "date");
    if (unavailableDetails[pos]
      && +denverDay === +unavailableDetails[pos].date) {
      return icons[unavailableDetails[pos].reason];
    }
    return "hide";
  },
  isWeekendDay: function (day) {
    if (+day.start() === +moment().startOf("day")) {
      return "inventory-day-today";
    }
    if (day.start().isoWeekday() >= 6) {
      return "inventory-day-weekend";
    }
    return "inventory-day-weekday";
  },
  isAvailableProduct: function () {
    if (this.active) {
      return "";
    }
    return "inactive";
  },
  showInactiveInventoryVariants() {
    if (this.active) {
      return "";
    }
    return Session.get("showInactiveInventoryVariants") ? "" : "hidden";
  }
});

Template.dashboardCalendarDay.helpers({
  formattedDay: function (d) {
    return d.format("dd DD");
  },
  isWeekendDay: function (day) {
    if (day.isoWeekday() >= 6) {
      return "inventory-day-weekend";
    }
    return "inventory-day-weekday";
  }
});


Template.dashboardRentalProductAvailability.events({
  "click .viewPrevCalendar": function () {
    const viewMonth = moment(Session.get("dashboardViewStart")).subtract(1, "month");
    const viewStart = moment(viewMonth).startOf("month").toDate();
    const viewEnd = moment(viewMonth).endOf("month").toDate();
    Session.set("dashboardViewStart", viewStart);
    Session.set("dashboardViewEnd", viewEnd);
  },
  "click .viewNextCalendar": function () {
    const viewMonth = moment(Session.get("dashboardViewStart")).add(1, "month");
    const viewStart = moment(viewMonth).startOf("month").toDate();
    const viewEnd = moment(viewMonth).endOf("month").toDate();
    Session.set("dashboardViewStart", viewStart);
    Session.set("dashboardViewEnd", viewEnd);
  },
  "click .deactivateSelectedInventory": function () {
    const instance = Template.instance();
    const selectedInventory = document.querySelectorAll(".variantItemSelect:checked");
    const variantIds = [...selectedInventory].map(i => i.dataset.id);
    Meteor.call("rentalProducts/markInventoryVariantInactive", variantIds);
    $("th.short-header:has(.variantItemSelect:checked)").removeClass("item-selected");
    $(".variantItemSelect").prop("checked", false);
    instance.inventoryMarkedForInactivity.set(false);
  }
});

Template.dashboardRentalProductAvailability.events({
  "click .variantItemSelect": function () {
    instance = Template.instance();
    $("th.short-header:has(.variantItemSelect:checked)").addClass("item-selected");
    $("th.short-header:has(.variantItemSelect:not(:checked))").removeClass("item-selected");

    if ($("th.short-header:has(.variantItemSelect:checked)").length > 0) {
      instance.inventoryMarkedForInactivity.set(true);
    } else {
      instance.inventoryMarkedForInactivity.set(false);
    }
  }
});
