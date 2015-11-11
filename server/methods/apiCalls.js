function formatDateForApi(date) {
   // return moment(date).format('YYYY-MM-DD HH:mm');
   return moment(date).format('YYYY-MM-DD') + ' 00:00';
}
Meteor.methods({
  'shopifyOrder/count': function () {
    let shopifyOrders = ReactionCore.Collections.Packages.findOne({name: 'reaction-shopify-orders'});
    if (shopifyOrders.settings.shopify.key && shopifyOrders.settings.shopify.password && shopifyOrders.settings.shopify.shopname) {
      let key = shopifyOrders.settings.shopify.key;
      let password = shopifyOrders.settings.shopify.password;
      let shopname = shopifyOrders.settings.shopify.shopname;
      if (shopifyOrders.settings.public) {
        let date = formatDateForApi(shopifyOrders.settings.public.lastUpdated);
        return HTTP.get('https://' + shopname + '.myshopify.com/admin/orders/count.json', {
          auth: key + ':' + password,
          params: { created_at_min: date}
        });
      }
      return HTTP.get('https://' + shopname + '.myshopify.com/admin/orders/count.json', {
        auth: key + ':' + password
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
  },
  'shopifyOrders/getOrders': function (date) {
    check(date, Date);
    let shopifyOrders = ReactionCore.Collections.Packages.findOne({name: 'reaction-shopify-orders'});
    let key = shopifyOrders.settings.shopify.key;
    let password = shopifyOrders.settings.shopify.password;
    let shopname = shopifyOrders.settings.shopify.shopname;
    if (shopifyOrders.settings.public) {
      let lastDate = formatDateForApi(shopifyOrders.settings.public.lastUpdated);
      return HTTP.get('https://' + shopname + '.myshopify.com/admin/orders.json', {
        auth: key + ':' + password,
        params: { created_at_min: lastDate}
      });
    }
    return HTTP.get('https://' + shopname + '.myshopify.com/admin/orders.json', {
      auth: key + ':' + password
    });
  },
  'shopifyOrders/saveQuery': function (data, dateTo) {
    check(data, Object);
    check(dateTo, Date);
    let shopifyOrders = ReactionCore.Collections.Packages.findOne({name: 'reaction-shopify-orders'}).settings;
    let dateFrom = new Date('2003-09-20'); //This was before Shopify
    if (shopifyOrders.public) {
      dateFrom = shopifyOrders.public.lastUpdated;
    }
    ReactionCore.Collections.Shopify.insert({
      dateFrom: dateFrom,
      dateTo: dateTo,
      information: data
    });
  }
});
