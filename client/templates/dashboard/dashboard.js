Template.dashboardShopifyOrders.helpers({
  apiConfigured: function () {
    let shopifyOrders = ReactionCore.Collections.Packages.findOne({
      name: 'reaction-shopify-orders'
    });
    if (shopifyOrders.settings) {
      if (shopifyOrders.settings.shopify.key && shopifyOrders.settings.shopify.password && shopifyOrders.settings.shopify.shopname) {
        return true;
      }
    }
    return false;
  },
  importFailsCount: function () {
    return ReactionCore.Collections.Orders.find({importSuccessful: false}).count();
  },
  importFails: function () {
    return ReactionCore.Collections.Orders.find({importSuccessful: false}).count() > 0;
  }
});
