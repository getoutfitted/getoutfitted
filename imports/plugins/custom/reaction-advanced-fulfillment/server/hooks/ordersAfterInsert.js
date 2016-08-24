import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { Orders, Packages } from '/lib/collections';
import { Logger, Reaction } from '/server/api';
import { TransitTimes } from '/imports/plugins/custom/transit-times/server';
import  AdvancedFulfillment from '../api';

Orders.after.insert(function () {
  const order = this.transform();
  const afPackage = Packages.findOne({
    name: 'reaction-advanced-fulfillment',
    shopId: Reaction.getShopId()
  });
  if (!afPackage.enabled) {
    Logger.warn(`Backpack is not enabled, so Order ${this._id} was not updated`);
    return;
  }
  let af = {};
  advancedFulfillment = af.advancedFulfillment = {};
  advancedFulfillment.workflow = {
    status: 'orderCreated',
    workflow: []
  };
  let orderHasNoRentals = _.every(order.items, function (item) {
    return item.variants.functionalType === 'variant';
  });
  const shippingAddress = TransitTimes.formatAddress(order.shipping[0].address); // XXX: do we need this?
  // check if local delivery
  advancedFulfillment.transitTime = TransitTimes.calculateTransitTime(shippingAddress);
  advancedFulfillment.localDelivery = TransitTimes.isLocalDelivery(shippingAddress.postal);
  advancedFulfillment.items = AdvancedFulfillment.itemsToAFItems(order.items);
  af.startTime = order.startTime || new Date();
  af.endTime = order.endTime || new Date();
  if (orderHasNoRentals) {
    let today = new Date();
    advancedFulfillment.shipmentDate = TransitTimes.date.nextBusinessDay(today);
  } else {
    if (!order.startTime || !order.endTime) {
      Logger.error(`Order: ${order._id} came through without a start or end time`);
      // Log CS Issue and Report to Dev Team
    }
  }
  // TODO Check this is now on cart!, So shouldn't need start and end time
  advancedFulfillment.arriveBy = order.startTime || new Date();
  advancedFulfillment.shipReturnBy = order.endTime || new Date();
  advancedFulfillment.shipmentDate = TransitTimes.calculateShippingDayByOrder(order);
  advancedFulfillment.returnDate = TransitTimes.calculateReturnDayByOrder(order);
  af.orderNumber = AdvancedFulfillment.findAndUpdateNextOrderNumber();
  Orders.update({
    _id: this._id
  }, {
    $set: af
  });
  Logger.info(`Backpack information added to ${this._id}`);
    // Shipstation Utilization
  if (afPackage.settings.shipstation) {
    AdvancedFulfillment.Shipstation.createOrder(this._id);
  }
  // Klaviyo Integration
  if (afPackage.settings.klaviyo && order.email) {
    Meteor.call('advancedFulfullment/createKlaviyoGeneralEvent', this._id, 'Checkout');
  }

  if (afPackage.settings.slack && afPackage.settings.slackChannel) {
    Meteor.call('advancedFulfullment/slackMessage', this._id, afPackage.settings.slackChannel);
  }
});
