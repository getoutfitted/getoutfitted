function sessionSetter() {
  Meteor.call('shopifyOrder/count', function (error, result) {
    if (error) {
      Session.set('error', error);
    } else {
      Session.set('count', result.data.count);
    }
  });
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
    Meteor.call('shopifyOrders/getOrders', date, function (error, result) {
      if (result) {
        Meteor.call('shopifyOrders/saveQuery', result.data, date);
        Meteor.call('shopifyOrders/updateTimeStamp', date);
        sessionSetter();
      }
    });
  }
});
