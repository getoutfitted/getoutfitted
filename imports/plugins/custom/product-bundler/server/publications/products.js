  // TODO import Inventory Variants!

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Reaction } from '/server/api';
import { Products }  from '/lib/collections';
import { InventoryVariants } from '/imports/plugins/custom/reaction-rental-products/lib/collections';

Meteor.publish('ProductsForBundles', function () {
  const shop = Reaction.getCurrentShop();
  if (Roles.userIsInRole(this.userId, ['admin', 'createProduct'], shop._id)) {
    return Products.find({});
  }
  return this.ready();
});

Meteor.publish('BundleProductAndVariants', function (orderId) {
  check(orderId, String);
  const shopId = Reaction.getShopId();
  if (Roles.userIsInRole(this.userId, ['admin', 'createProduct'], Reaction.getShopId())) {
    return Products.find({
      shopId: shopId,
      $or: [
        {_id: orderId},
        {ancestors: orderId}
      ]
    });
  }
  return this.ready();
});

Meteor.publish('bundleReservationStatus', function (productIds) {
  check(productIds, [String]);
  // TODO import Inventory Variants!
  return InventoryVariants.find({
    productId: {
      $in: productIds
    },
    active: true,
    'workflow.status': 'active'
  }, {
    fields: {productId: 1, unavailableDates: 1, numberOfDatesBooked: 1, active: 1, 'workflow.status': 1},
    sort: {unavailableDates: -1}
  });
});

Meteor.publish('productTypeAndTitle', function () {
  return Products.find(
    {},
    {fields: {
      productType: 1,
      title: 1
    }}
  );
});
