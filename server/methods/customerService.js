Meteor.methods({
  'advancedFulfillment/cancelOrder': function (orderId, userId) {
    check(orderId, String);
    check(userId, String);
    if (!ReactionCore.hasPermission(advancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, 'Access Denied');
    }
    let history = {
      event: 'orderCanceled',
      userId: userId,
      updatedAt: new Date()
    };
    ReactionCore.Collections.Orders.update({
      _id: orderId
    }, {
      $addToSet: {
        history: history
      },
      $set: {
        'advancedFulfillment.workflow.status': 'orderCanceled',
        'advancedFulfillment.impossibleShipDate': false
      }
    });
  },
  'advancedFulfillment/bundleColorConfirmation': function (orderId, userId) {
    check(orderId, String);
    check(userId, String);
    if (!ReactionCore.hasPermission(advancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, 'Access Denied');
    }
    let history = {
      event: 'bundleColorConfirmed',
      userId: userId,
      updatedAt: new Date()
    };
    ReactionCore.Collections.Orders.update({
      _id: orderId
    }, {
      $addToSet: {
        history: history
      },
      $set: {
        bundleMissingColor: false
      }
    });
  },
  'advancedFulfillment/updateSkiPackageWithCustomerInfo': function (orderId, userId, skiId, age, shoeSize, level) {
    check(orderId, String);
    check(userId, String);
    check(skiId, String);
    check(age, Number);
    check(shoeSize, String);
    check(level, String);
    if (!ReactionCore.hasPermission(advancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, 'Access Denied');
    }
    ReactionCore.Collections.Orders.update({
      '_id': orderId,
      'advancedFulfillment.skiPackages._id': skiId
    }, {
      $set: {
        'advancedFulfillment.skiPackages.$.age': age,
        'advancedFulfillment.skiPackages.$.shoeSize': shoeSize,
        'advancedFulfillment.skiPackages.$.skiLevel': level,
        'advancedFulfillment.skiPackages.$.contactedCustomer': true
      }
    });
  },
  'advancedFulfillment/nonWarehouseOrder': function (orderId, userId) {
    check(orderId, String);
    check(userId, String);
    if (!ReactionCore.hasPermission(advancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, 'Access Denied');
    }
    let history = {
      event: 'nonWarehouseOrder',
      userId: userId,
      updatedAt: new Date()
    };
    ReactionCore.Collections.Orders.update({
      _id: orderId
    }, {
      $set: {
        'advancedFulfillment.workflow.status': 'nonWarehouseOrder'
      },
      $addToSet: {
        history: history
      }
    });
  }
});
