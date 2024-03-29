function noteFormattedUser(user) {
  check(user, String);
  let date = moment().format('MM/DD/YY h:mma');
  return  '| <em>' + user + '-' + date + '</em>';
}

function userNameDeterminer(user) {
  check(user, Object);
  if (user.username) {
    return user.username;
  }
  return user.emails[0].address;
}

function anyOrderNotes(orderNotes) {
  if (!orderNotes) {
    return '';
  }
  return orderNotes;
}

Meteor.methods({
  'advancedFulfillment/bundleColorConfirmation': function (orderId, userId) {
    check(orderId, String);
    check(userId, String);
    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
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
    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
      throw new Meteor.Error(403, 'Access Denied');
    }
    let history = {
      event: 'updatedSkiInfoFromCustomer',
      userId: userId,
      updatedAt: new Date()
    };
    ReactionCore.Collections.Orders.update({
      '_id': orderId,
      'advancedFulfillment.skiPackages._id': skiId
    }, {
      $set: {
        'advancedFulfillment.skiPackages.$.age': age,
        'advancedFulfillment.skiPackages.$.shoeSize': shoeSize,
        'advancedFulfillment.skiPackages.$.skiLevel': level,
        'advancedFulfillment.skiPackages.$.contactedCustomer': true
      },
      $addToSet: {
        history: history
      }
    });
  },
  'advancedFulfillment/nonWarehouseOrder': function (orderId, userId) {
    check(orderId, String);
    check(userId, String);
    if (!Reaction.hasPermission(AdvancedFulfillment.server.permissions)) {
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
