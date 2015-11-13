function setOrderCount() {
  Meteor.call('shopifyOrder/count');
}

Template.shopifyApi.helpers({
  count: function () {
    let shopifyOrders = ReactionCore.Collections.Packages.findOne({name: 'reaction-shopify-orders'}).settings.public;
    if (shopifyOrders.ordersSinceLastUpdate) {
      return shopifyOrders.ordersSinceLastUpdate;
    }
    return  '<em>Calculating.....</em>';
  }
});

Template.shopifyApi.onRendered(function () {
  setOrderCount();
});

Template.shopifyApi.events({
  'click .updateShopifyOrders': function (event) {
    event.preventDefault();
    // let date = new Date();
    let orderCount = ReactionCore.Collections.Packages.findOne({name: 'reaction-shopify-orders'}).settings.public.ordersSinceLastUpdate;
    if (orderCount === 0) {
      Alerts.removeSeen();
      return Alerts.add('There are no new orders to update.', 'danger', {
        autoHide: true
      });
    }
    // let numberOfPages = Math.ceil(orderCount / 50);
    // let pageNumbers = _.range(1, numberOfPages + 1);
    // let groupId = randomId();
    // debugger;
    Meteor.call('shopifyOrders/getOrders');
    // _.each(pageNumbers, function (pageNumber) {
    //   Meteor.call('shopifyOrders/getOrders', date, pageNumber, function (error, result) {
    //     if (result) {
    //       Meteor.call('shopifyOrders/saveQuery', result.data, date, pageNumber, numberOfPages, groupId);
    //       _.each(result.data.orders, function (order) {
    //         Meteor.call('shopifyOrders/createReactionOrder', order);
    //       });
    //     }
    //   });
    // });

    Alerts.removeSeen();
    Alerts.add('Your ' + orderCount + ' Shopify Orders have been saved.', 'success', {
      autoHide: true
    });
    setOrderCount();
  }
});
