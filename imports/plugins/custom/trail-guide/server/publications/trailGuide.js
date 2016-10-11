import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { _ } from 'meteor/underscore';
import { Reaction } from '/server/api';
import { Products, Orders } from '/lib/collections';

Meteor.publish('trailGuideAllOrders', function (find, limit, sort, fields) {
  check(find, Object);
  check(limit, Number);
  check(sort, Object);
  check(fields, Object);
  let returnFields = {};
  _.each(fields, function (value, index) {
    if (value) {
      returnFields[index] = 1;
    }
  });
  const shopId = Reaction.getShopId();
  let findCriteria = _.clone(find);
  findCriteria.shopId = shopId;
  if (findCriteria['billing.address.fullName']) {
    findCriteria['billing.address.fullName'] = new RegExp(findCriteria['billing.address.fullName'], 'i');
  }
  if (findCriteria['shipping.address.fullName']) {
    findCriteria['shipping.address.fullName'] = new RegExp(findCriteria['shipping.address.fullName'], 'i');
  }
  if (Roles.userIsInRole(this.userId, 'trail-guide', Reaction.getShopId())) {
    return Orders.find(findCriteria, {
      limit: limit,
      sort: sort,
      fields: returnFields
    });
  }
  return this.ready();
});

Meteor.publish('trailGuideProducts', function () {
  if (Roles.userIsInRole(this.userId, 'trail-guide', Reaction.getShopId())) {
    return Products.find({
      type: 'simple'
    }, {
      fields: {
        pageTitle: 1
      }
    });
  }
  return this.ready();
});
