import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { Orders, Packages } from '/lib/collections';
import { Logger, Reaction } from '/server/api';
import { Transit } from '/imports/plugins/custom/transit-times/server';
import  AdvancedFulfillment from '../api';
import { Ambassador } from '/imports/plugins/custom/reaction-ambassador/server/api';

Orders.after.insert(function () {
  const order = this.transform();
  const afPackage = Packages.findOne({
    name: 'reaction-advanced-fulfillment',
    shopId: Reaction.getShopId()
  });
  if (!afPackage || !afPackage.enabled) {
    Logger.warn(`Backpack is not enabled, so Order ${this._id} was not updated`);
    return;
  }
  const af = {};
  advancedFulfillment = af.advancedFulfillment = {};
  advancedFulfillment.workflow = {
    status: 'orderCreated',
    workflow: []
  };
  const orderHasNoRentals = _.every(order.items, function (item) {
    return item.variants.functionalType === 'variant';
  });
  if (orderHasNoRentals) {
    af.startTime = order.startTime = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
  }

  // Transit SetUp
  const transit = new Transit(order);
  advancedFulfillment.localDelivery = transit.isLocalDelivery();
  advancedFulfillment.transitTime = transit.transitTime;
  advancedFulfillment.arriveBy = transit.arriveBy;
  advancedFulfillment.shipReturnBy = transit.shipReturnBy;
  advancedFulfillment.shipmentDate = transit.shipmentDate;
  advancedFulfillment.returnDate = transit.returnDate;

  // Item Set up
  advancedFulfillment.items = AdvancedFulfillment.itemsToAFItems(order.items);

  if (!order.email) {
    // If no email, try to find past orders with emails
    const pastOrder = Orders.findOne({
      userId: order.userId,
      email: {$exists: true}
    });
    if (pastOrder) {
      Logger.warn('No Email was passed, so found email on past order from UserId');
      af.email = pastOrder.email;
    }
  }
  af.orderNumber = AdvancedFulfillment.findAndUpdateNextOrderNumber();
  Orders.update({
    _id: this._id
  }, {
    $set: af
  });

  try {
    Orders.update({
      _id: this._id
    }, {
      $set: af
    });
  } catch (error) {
    af.orderNumber = AdvancedFulfillment.findHighestOrderNumber();
    Orders.update({
      _id: this._id
    }, {
      $set: af
    });
  }
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
  if (afPackage.settings.ambassador) {
    Ambassador(this._id);
  }
});
