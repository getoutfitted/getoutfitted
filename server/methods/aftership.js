Meteor.methods({
  'aftership/processHook': function (body) {
    check(body, Match.Any);
    if (this.connection === null) {
      const msg = body.msg;
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
          'advancedFulfillment.aftership.currentStatus': currentShippingStatus.tag,
          'advancedFulfillment.aftership.currentMessage': currentShippingStatus.message,
          'advancedFulfillment.aftership.trackingNumber': msg.tracking_number,
          'advancedFulfillment.aftership.shippingHistory': pastCheckPoints
        }
      });
    } else {
      throw new Meteor.Error(403, 'Forbidden, method is only available from the server');
    }
  }
});
