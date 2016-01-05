Meteor.methods({
  'shopifyOrders/newFulfillment': function (fulfillment, shopifyOrderNumber) {
    check(fulfillment, Match.Any);
    check(shopifyOrderNumber, Number);
    if (this.connection === null) {
      const trackingNumbers = fulfillment.tracking_numbers;
      const trackingUrls = fulfillment.tracking_urls;

      ReactionCore.Collections.Orders.update({shopifyOrderNumber: shopifyOrderNumber}, {
        $addToSet: {
          'advancedFulfillment.outboundTrackingNumbers': { $each: trackingNumbers },
          'advancedFulfillment.outboundTrackingUrls': { $each: trackingUrls },
          'advancedFulfillment.workflow.workflow': 'orderPacked'
        },
        $set: {
          'advancedFulfillment.workflow.status': 'orderReadyToShip'
        }
      });
      // TODO: add information about what items are included in each package.
    } else {
      throw new Meteor.Error(403, 'Forbidden, method is only available from the server');
    }
  }
});

