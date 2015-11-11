function sessionSetter() {
  Meteor.call('shopifyOrder/count', function (error, result) {
    if (error) {
      Session.set('error', error);
    } else {
      Session.set('count', result.data.count);
    }
  });
}

function randomId() {
  return Random.id();
}

Template.shopifyApi.helpers({
  count: function () {
    let stillValid = Session.get('count') === 0;
    if (Session.get('count') || stillValid) {
      return Session.get('count');
    }
    return '<em>calculating.....</em>';
  }
});

Template.shopifyApi.onRendered(function () {
  sessionSetter();
});

Template.shopifyApi.events({
  'click .updateShopifyOrders': function (event) {
    event.preventDefault();
    let date = new Date();
    let orderCount = Session.get('count');
    if (orderCount === 0) {
      Alerts.removeSeen();
      return Alerts.add('There are no new orders to update.', 'danger', {
        autoHide: true
      });
    }
    let numberOfPages = Math.ceil(orderCount / 50);
    let pageNumbers = _.range(1, numberOfPages + 1);
    let groupId = randomId();
    _.each(pageNumbers, function (pageNumber) {
      Meteor.call('shopifyOrders/getOrders', date, pageNumber, function (error, result) {
        if (result) {
          Meteor.call('shopifyOrders/saveQuery', result.data, date, pageNumber, numberOfPages, groupId);
        }
      });
    });
    Meteor.call('shopifyOrders/updateTimeStamp', date);
    Alerts.removeSeen();
    Alerts.add('Your ' + Session.get('count') + ' Shopify Orders have been saved.', 'success', {
      autoHide: true
    });
    sessionSetter();
  }
});
