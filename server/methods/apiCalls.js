function formatDateForApi(date) {
  // return moment(date).format('YYYY-MM-DD HH:mm');
  return moment(date).format('YYYY-MM-DD') + ' 00:00';
  // return moment(new Date('2003-09-20')).format('YYYY-MM-DD');
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
  'shopifyOrders/getOrders': function (date, pageNumber) {
    check(date, Date);
    check(pageNumber, Number);
    let shopifyOrders = ReactionCore.Collections.Packages.findOne({name: 'reaction-shopify-orders'});
    let key = shopifyOrders.settings.shopify.key;
    let password = shopifyOrders.settings.shopify.password;
    let shopname = shopifyOrders.settings.shopify.shopname;
    if (shopifyOrders.settings.public) {
      let lastDate = formatDateForApi(shopifyOrders.settings.public.lastUpdated);
      return HTTP.get('https://' + shopname + '.myshopify.com/admin/orders.json', {
        auth: key + ':' + password,
        params: {
          created_at_min: lastDate,
          page: pageNumber
        }
      });
    }
    return HTTP.get('https://' + shopname + '.myshopify.com/admin/orders.json', {
      auth: key + ':' + password,
      params: {
        page: pageNumber
      }
    });
  },
  'shopifyOrders/saveQuery': function (data, dateTo, pageNumber, pageTotal, groupId) {
    check(data, Object);
    check(dateTo, Date);
    check(pageNumber, Number);
    check(pageTotal, Number);
    check(groupId, String);
    let shopifyOrders = ReactionCore.Collections.Packages.findOne({name: 'reaction-shopify-orders'}).settings;
    let dateFrom = new Date('2003-09-20'); //This was before Shopify
    if (shopifyOrders.public) {
      dateFrom = shopifyOrders.public.lastUpdated;
    }
    ReactionCore.Collections.ShopifyOrders.insert({
      dateFrom: dateFrom,
      dateTo: dateTo,
      information: data,
      pageNumber: pageNumber,
      pageTotal: pageTotal,
      groupId: groupId
    });
  },
  'shopifyOrders/createReactionOrder': function (order) {
    check(order, Object);
    let shippingAddress = [ {address: {
      country: order.shipping_address.country_code,
      fullName: order.shipping_address.name,
      address1: order.shipping_address.address1,
      address2: order.shipping_address.address2,
      region: order.shipping_address.province_code,
      postal: order.shipping_address.zip,
      city: order.shipping_address.city,
      phone: order.shipping_address.phone
    }}];
    let billingAddress = [{address: {
      country: order.billing_address.country_code,
      fullName: order.billing_address.name,
      address1: order.billing_address.address1,
      address2: order.billing_address.address2,
      region: order.billing_address.province_code,
      postal: order.billing_address.zip,
      city: order.billing_address.city,
      phone: order.billing_address.phone
    }}];
    ReactionCore.Collections.Orders.insert({
      userId: Random.id(),
      email: order.email,
      shopId: ReactionCore.getShopId(),
      'shipping': shippingAddress,
      'billing': billingAddress
    });
  }
});
