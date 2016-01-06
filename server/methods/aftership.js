Meteor.methods({
  'aftership/processHook': function (body) {
    check(body, Match.Any);
    if (this.connection === null) {
      const msg = body.msg;
      console.log('msg', msg)
      const shopifyId = parseInt(msg.order_id, 10);
      let pastCheckPoints = [];
      const sortedCheckPoints = _.sortBy(msg.checkpoints, msg.checkpoints.checkpoint_time);
      // TODO: add information about what items are included in each package.
      _.each(sortedCheckPoints, function (checkPoint) {
        let thisCheckPoint = {
          city: checkPoint.city,
          state: checkPoint.state,
          message: checkPoint.message,
          status: checkPoint.tag,
          checkPointTime: checkPoint.checkpoint_time
        };
        pastCheckPoints.push(thisCheckPoint);
      });
      const currentShippingStatus = _.last(sortedCheckPoints);
      ReactionCore.Collections.Orders.update({
        shopifyOrderNumber: shopifyId
      }, {
        $set: {
          'advancedFulfillment.workflow.status': 'orderShipped',
          'advancedFulfillment.shippingHistory.currentStatus': currentShippingStatus.tag,
          'advancedFulfillment.shippingHistory.currentMessage': currentShippingStatus.message,
          'advancedFulfillment.shippingHistory.trackingNumber': msg.tracking_number,
          'advancedFulfillment.shippingHistory.history': pastCheckPoints
        }
      });
    } else {
      throw new Meteor.Error(403, 'Forbidden, method is only available from the server');
    }
  }
});
