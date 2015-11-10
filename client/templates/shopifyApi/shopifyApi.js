Template.shopifyApi.helpers({
  count: function () {
    if (Session.get('count')) {
      return Session.get('count');
    }
    return '<em>calculating.....</em>';
  }

});

Template.shopifyApi.onRendered(function () {
  Meteor.call('shopifyOrder/count', function (error, result) {
    if (error) {
      Session.set('error', error);
    } else {
      Session.set('count', JSON.parse(result.content).count);
    }
  });
});

Template.shopifyApi.events({
  'click .updateShopifyOrders': function (event) {
    event.preventDefault();
    let date = new Date();
    Meteor.call('shopifyOrders/updateTimeStamp', date);
  }
});
