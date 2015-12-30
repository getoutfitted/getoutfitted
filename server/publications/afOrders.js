Meteor.publish('afOrders', function () {
  shopId = ReactionCore.getShopId();

  if (Roles.userIsInRole(this.userId, ['admin', 'owner'], ReactionCore.getShopId())) {
    return ReactionCore.Collections.Orders.find({
      shopId: shopId
    }, {
      fields: {
        'startTime': 1,
        'advancedFulfillment.returnDate': 1,
        'advancedFulfillment.shipmentDate': 1,
        'advancedFulfillment.workflow.status': 1,
        'advancedFulfillment.items._id': 1,
        'advancedFulfillment.items.workflow': 1,
        'advancedFulfillment.arriveBy': 1,
        // 'email': 1,
        'shopifyOrderNumber': 1,
        // 'shipping.address.phone': 1,
        'history': 1,
        'shipping.address.region': 1,
        // 'shipping.address.fullName': 1,
        // 'billing.address.fullName': 1,
        'advancedFulfillment.localDelivery': 1,
        'advancedFulfillment.rushDelivery': 1
      }

    });
  }
  return this.ready();
});

Meteor.publish('afProducts', function () {
  return ReactionCore.Collections.Products.find({});
});
