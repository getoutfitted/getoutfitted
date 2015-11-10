Template.shopifyApi.helpers({
  count: function () {
    if (Session.get('count')) {
      return JSON.parse(Session.get('count').content).count;
    }
    return '<em>calculating.....</em>';
  }

});

Template.shopifyApi.onRendered(function () {
  Meteor.call('shopifyOrder/count', function (error, result) {
    if (error) {
      Session.set('error', error);
    } else {
      Session.set('count', result);
    }
  });
});

Template.shopifyApi.events({
  'click .updateShopifyOrders': function(event) {
    event.preventDefault();
    console.log('we here!!!!!!!!!')
  }
})
