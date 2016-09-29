import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Reaction } from '/server/api';
import { Products }  from '/lib/collections';
import { InventoryVariants } from '/imports/plugins/custom/reaction-rental-products/lib/collections';
import _ from "lodash";

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

Meteor.publish('variantReservationStatus', function (dates, productId, limit=5) {
  check(dates, {start: Date, end: Date});
  check(productId, String);
  check(limit, Match.OneOf(null, undefined, Number));

  const reservationAvailability = InventoryVariants.find({
    productId: productId,
    active: true,
    'workflow.status': 'active',
    unavailableDates: {
      $not: {
        $elemMatch: {
          $gte: dates.start,
          $lte: dates.end
        }
      }
    }
  }, {
    fields: {productId: 1, unavailableDates: 1, numberOfDatesBooked: 1, active: 1, 'workflow.status': 1},
    sort: {unavailableDates: 1},
    limit: limit
  });

  // console.log("run publication with pid", productId, reservationAvailability.fetch());
  // return this.ready();
  return reservationAvailability;
});

Meteor.publish('bundleReservationStatus', function (productIds) {
  check(productIds, [String]);
  check(limit, Match.Optional(Number));

  const reservationAvailability = InventoryVariants.find({
    productId: {
      $in: productIds
    },
    active: true,
    'workflow.status': 'active'
  }, {
    fields: {productId: 1, unavailableDates: 1, numberOfDatesBooked: 1, active: 1, 'workflow.status': 1},
    sort: {unavailableDates: 1}
  });

  // console.log("run publication with pids", productIds, _.countBy(_.map(reservationAvailability.fetch(), "productId")));
  // return this.ready();
  return reservationAvailability;
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
