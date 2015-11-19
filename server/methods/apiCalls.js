function formatDateForApi(date) {
  let shopifyOrders = ReactionCore.Collections.Packages.findOne({name: 'reaction-shopify-orders'}).settings.public;

  if (shopifyOrders.lastUpdated) {
    // return moment(date).format('YYYY-MM-DD HH:mm');
    // return moment(date).format('YYYY-MM-DD') + ' 00:00';
    return moment(date).format('2003-11-12') + ' 00:00';
  }
  return moment(new Date('2003-09-20')).format('YYYY-MM-DD');
}

function shipmentChecker(date) {
  if (moment(date).isoWeekday() === 7) {
    return moment(date).subtract(2, 'days')._d;
  } else if (moment(date).isoWeekday() === 6) {
    return moment(date).subtract(1, 'days')._d;
  }
  return date;
}

function returnChecker(date) {
  if (moment(date).isoWeekday() === 7) {
    return moment(date).add(1, 'days')._d;
  }
  return date;
}

function createReactionOrder(order) {
  check(order, Object);
  let bundleIds = _.pluck(Bundles.find().fetch(), 'shopifyId');
  let productIds = _.pluck(Products.find().fetch(), 'shopifyId');
  let orderCreatedAt = new Date(order.created_at);
  let notes = order.note_attributes;
  let stringStartDate = _.findWhere(notes, {name: 'first_ski_day'}) || _.findWhere(notes, {name: 'first_camping_day'}) || _.findWhere(notes, {name: 'first_activity_day'});
  let stringEndDate = _.findWhere(notes, {name: 'last_ski_day'}) || _.findWhere(notes, {name: 'last_camping_day'}) || _.findWhere(notes, {name: 'last_activity_day'});
  let startDate;
  let endDate;
  let rentalLength;
  let validImport = false;
  if (stringStartDate && stringEndDate) {
    startDate = moment(new Date(stringStartDate.value))._d;
    endDate = moment(new Date(stringEndDate.value))._d;
    rentalLength = moment(endDate).diff(moment(startDate), 'days');
  } else {
    validImport = true;
  }
  let items = [];
  _.each(order.line_items, function (item) {
    if (_.contains(bundleIds, item.product_id + '')) {
      // console.log('we have a bundle!!!!!!!');
    } else if (_.contains(productIds, item.product_id + '')) {
      let colorObj =  _.findWhere(item.properties, {name: 'Color'});
      let color;
      if (colorObj) {
        color = colorObj.value;
      }
      let size;
      let sizeObj = _.find(item.properties, function (prop) {
        return prop.name.indexOf('Size') > 1;
      });
      if (sizeObj) {
        size = sizeObj.value;
      }
      let product = Products.findOne({shopifyId: item.product_id + ''});
      let variant;
      if (product) {
        variant = _.findWhere(product.variants, {size: size, color: color});
      }
      let newItem = {
        _id: Random.id(),
        shopId: ReactionCore.getShopId(),
        productId: item.product_id + '',
        quantity: 1,
        variants: variant,
        workflow: {
          status: 'orderCreated',
          workflow: ['inventoryAdjusted']
        }
      };
      items.push(newItem);
    }
  });
  let buffer = ReactionCore.Collections.Packages.findOne({name: 'reaction-advanced-fulfillment'}).settings.buffer || {shipping: 0, returning: 0};
  let shippingBuffer = buffer.shipping;
  let returnBuffer = buffer.returning;
  let shipmentDate = new Date();
  let returnDate = new Date(2100, 8, 20);

  if (startDate && endDate) {
    shipmentDate = moment(startDate).subtract(shippingBuffer, 'days')._d;
    returnDate = moment(endDate).add(returnBuffer, 'days')._d;
  }
  let orderCreated = {status: 'orderCreated'};
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
    shipping: shippingAddress,
    billing: billingAddress,
    startTime: startDate,
    endTime: endDate,
    rentalDays: rentalLength,
    createdAt: orderCreatedAt,
    shopifyOrderNumber: order.order_number,
    infoMissing: validImport,
    advancedFulfillment: {
      shipmentDate: shipmentChecker(shipmentDate),
      returnDate: returnChecker(returnDate),
      workflow: orderCreated
    },
    items: items
  });
}

function saveOrdersToShopifyOrders(data, dateTo, pageNumber, pageTotal, groupId) {
  check(data, Object);
  check(dateTo, Date);
  check(pageNumber, Number);
  check(pageTotal, Number);
  check(groupId, String);
  let shopifyOrders = ReactionCore.Collections.Packages.findOne({name: 'reaction-shopify-orders'}).settings;
  let dateFrom = new Date('2003-09-20'); // This was before Shopify
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
}


Meteor.methods({
  'shopifyOrder/count': function () {
    let shopifyOrders = ReactionCore.Collections.Packages.findOne({name: 'reaction-shopify-orders'});
    if (shopifyOrders.settings.shopify.key && shopifyOrders.settings.shopify.password && shopifyOrders.settings.shopify.shopname) {
      let key = shopifyOrders.settings.shopify.key;
      let password = shopifyOrders.settings.shopify.password;
      let shopname = shopifyOrders.settings.shopify.shopname;
      let result;
      if (shopifyOrders.settings.public) {
        let date = formatDateForApi(shopifyOrders.settings.public.lastUpdated);
        result = HTTP.get('https://' + shopname + '.myshopify.com/admin/orders/count.json', {
          auth: key + ':' + password,
          params: { created_at_min: date}
        });
      } else {
        result = HTTP.get('https://' + shopname + '.myshopify.com/admin/orders/count.json', {
          auth: key + ':' + password
        });
      }
      ReactionCore.Collections.Packages.update({_id: shopifyOrders._id}, {
        $set: {
          'settings.public.ordersSinceLastUpdate': result.data.count
        }
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
  'shopifyOrders/getOrders': function () {
    let date = new Date();
    let shopifyOrders = ReactionCore.Collections.Packages.findOne({name: 'reaction-shopify-orders'});
    let key = shopifyOrders.settings.shopify.key;
    let password = shopifyOrders.settings.shopify.password;
    let shopname = shopifyOrders.settings.shopify.shopname;
    let orderCount = shopifyOrders.settings.public.ordersSinceLastUpdate;
    let numberOfPages = Math.ceil(orderCount / 50);
    let pageNumbers = _.range(1, numberOfPages + 1);
    let groupId = Random.id();
    let lastDate = formatDateForApi(shopifyOrders.settings.public.lastUpdated);
    if (lastDate) {
      _.each(pageNumbers, function (pageNumber) {
        let result = HTTP.get('https://' + shopname + '.myshopify.com/admin/orders.json', {
          auth: key + ':' + password,
          params: {
            created_at_min: lastDate,
            page: pageNumber
          }
        }).data;
        saveOrdersToShopifyOrders(result, date, pageNumber, numberOfPages, groupId);
        _.each(result.orders, function (order) {
          createReactionOrder(order);
        });
      });
    } else {
      _.each(pageNumbers, function (pageNumber) {
        let result = HTTP.get('https://' + shopname + '.myshopify.com/admin/orders.json', {
          auth: key + ':' + password,
          params: {
            page: pageNumber
          }
        }).data;
        saveOrdersToShopifyOrders(result, date, pageNumber, numberOfPages, groupId);
        _.each(result.orders, function (order) {
          createReactionOrder(order);
        });
      });
    }
    Meteor.call('shopifyOrders/updateTimeStamp', date);
    return true;
  }
});
