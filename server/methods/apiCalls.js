function formatDateForApi(date) {
  return moment(date).format('YYYY-MM-DD');
}
Meteor.methods({
  'shopifyOrder/count': function () {
    let shopifyOrders = ReactionCore.Collections.Packages.findOne({name: 'reaction-shopify-orders'});
    if (shopifyOrders.settings.public.lastUpdated) {
      let date = formatDateForApi(shopifyOrders.settings.public.lastUpdated);
      if (shopifyOrders.settings.shopify.key && shopifyOrders.settings.shopify.password && shopifyOrders.settings.shopify.shopname) {
        return HTTP.get('https://' + shopifyOrders.settings.shopify.shopname + '.myshopify.com/admin/orders/count.json', {
          auth: shopifyOrders.settings.shopify.key + ':' + shopifyOrders.settings.shopify.password,
          params: { created_at_min: date}
        });
      }
    }
    if (shopifyOrders.settings.shopify.key && shopifyOrders.settings.shopify.password && shopifyOrders.settings.shopify.shopname) {
      return HTTP.get('https://' + shopifyOrders.settings.shopify.shopname + '.myshopify.com/admin/orders/count.json', {
        auth: shopifyOrders.settings.shopify.key + ':' + shopifyOrders.settings.shopify.password
      });
    }
  },
  'shopifyOrders/updateTimeStamp': function (date) {
    check(date, Date);
    ReactionCore.Collections.Packages.update({
      name: 'reaction-shopify-orders'
    }, {
      $set: {'settings.public.lastUpdated': date}
    });
  }
});
