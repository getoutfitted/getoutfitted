import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Reaction, Logger } from '/server/api';
import { _ } from 'meteor/underscore';

import { Packages, Accounts, Orders } from '/lib/collections';

import { createClient } from 'mbsy';

function beforeExpiration(expirationString) {
  let expirationDate = new Date(expirationString);
  let todayDate = new Date();
  if (expirationDate >= todayDate) {
    return true;
  } else {
    return false;
  }
}

export const Ambassador = function (orderId) {
  check(orderId, String)
  const order = Orders.findOne(orderId);
  if (!order) {
    Logger.error('No order was found for Ambassador');
    return;
  }
  const account = Accounts.findOne({
    _id: order.userId,
    ambassador: {
      $exists: true
    }
  });
  const ambassadorPackage =  Packages.findOne({
    name: 'reaction-ambassador',
    shopId: Reaction.getShopId()
  });
  if (account
      && ambassadorPackage
      && ambassadorPackage.enabled
      && ambassadorPackage.settings
      && ambassadorPackage.settings.api
      && beforeExpiration(account.ambassador.expirationDate)) {
      const api = ambassadorPackage.settings.api;
      const Mbsy = createClient(api.account, api.key);
      const invoice = order.billing[0].invoice
      const ambassadorReportableRevenue = invoice.subtotal - invoice.discounts;
      Mbsy.Event.record({
        email: order.email,
        campaign_uid: account.ambassador.campaignId,
        short_code: account.ambassador.mbsy,
        revenue: ambassadorReportableRevenue,
        auto_create: 0,
        transaction_uid: order._id,
      }, function (err, res) {
        if (err) {
          Logger.error(`Ambassador encountered an Error with order ${order._id}`, err)
        } else {
          if (res.response.errors) {
            Logger.warn(`Ambassador Hit API for ${order._id} but returned Error:`, res.response.errors);
          } else {
            Logger.info(`Ambassador ${account.ambassador.mbsy} successfully referred for ${order._id}`);

          }
        }
      });
  } else {
    Logger.warn(`Ambassador settings are missing. Data for  ${order._id} not sent.`);
  }
}

