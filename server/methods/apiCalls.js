Meteor.methods({
  'shopifyOrder/count': function () {
    let shopifyOrders = ReactionCore.Collections.Packages.findOne({name: 'reaction-shopify-orders'});
    if (shopifyOrders.settings.shopify.key && shopifyOrders.settings.shopify.password && shopifyOrders.settings.shopify.shopname) {
      return HTTP.get('https://' + shopifyOrders.settings.shopify.shopname + '.myshopify.com/admin/orders/count.json', {auth: shopifyOrders.settings.shopify.key + ':' + shopifyOrders.settings.shopify.password});
    }
  }
});
