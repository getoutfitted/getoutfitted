function keyify(string) {
  let keyifiedString = string.replace(/([\W\/])/ig, '');
  keyifiedString = keyifiedString[0].toLowerCase() + keyifiedString.substr(1);
  return keyifiedString;
}

function formatDateForApi(date) {
  let shopifyOrders = ReactionCore.Collections.Packages.findOne({name: 'reaction-shopify-orders'}).settings.public;

  if (shopifyOrders.lastUpdated) {
    // return moment(date).format('YYYY-MM-DD HH:mm');
    // return moment(date).format('2015-11-19') + ' 00:00';

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

function generateShippingAddress(order) {
  return [ {address: {
    country: order.shipping_address.country_code,
    fullName: order.shipping_address.name,
    address1: order.shipping_address.address1,
    address2: order.shipping_address.address2,
    region: order.shipping_address.province_code,
    postal: order.shipping_address.zip,
    city: order.shipping_address.city,
    phone: order.shipping_address.phone
  }}];
}

function generateBillingAddress(order) {
  return [{address: {
    country: order.billing_address.country_code,
    fullName: order.billing_address.name,
    address1: order.billing_address.address1,
    address2: order.billing_address.address2,
    region: order.billing_address.province_code,
    postal: order.billing_address.zip,
    city: order.billing_address.city,
    phone: order.billing_address.phone
  }}];
}

function returnChecker(date) {
  if (moment(date).isoWeekday() === 7) {
    return moment(date).add(1, 'days')._d;
  }
  return date;
}

function createOrderItem(productId, variantObj, qty = 1) {
  return {
    _id: Random.id(),
    shopId: ReactionCore.getShopId(),
    productId: productId,
    quantity: qty,
    variants: variantObj,
    workflow: {
      status: 'orderCreated',
      workflow: ['inventoryAdjusted']
    }
  };
}

function createReactionOrder(order) {
  check(order, Object);
  const bundleIds = _.pluck(Bundles.find().fetch(), 'shopifyId');
  const productIds = _.pluck(Products.find().fetch(), 'shopifyId');
  const orderCreatedAt = new Date(order.created_at);
  const notes = order.note_attributes;

  let startDate;
  let endDate;
  let rentalLength;
  let validImport = false; // Flag order as invalid import
  let missingItem = false; // Flag order as missing an item
  let items = []; // Empty array of items that we will build for the order

  // stringStartDateNote and stringEndDateNote return an object such as {name: 'first_ski_day', value: '2015-12-30' }
  let stringStartDateNote = _.find(notes, function (note) {
    return ['first_ski_day', 'first_camping_day', 'first_activity_day'].indexOf(note.name) > -1;
  });

  let stringEndDateNote = _.find(notes, function (note) {
    return ['last_ski_day', 'last_camping_day', 'last_activity_day'].indexOf(note.name) > -1;
  });

  if (stringStartDateNote && stringEndDateNote) {
    ReactionCore.Log.info('Importing Shopify Order #'
      + order.order_number
      + ' - Rental Dates '
      + stringStartDateNote.value
      + ' to '
      + stringEndDateNote.value);

    // If we have both a start and end date, create js Date objects.
    startDate = new Date(stringStartDateNote.value);
    endDate = new Date(stringEndDateNote.value);
    // TODO: Make sure that this diff is identical to the number of rental days always.
    rentalLength = moment(endDate).diff(moment(startDate), 'days');
  } else {
    ReactionCore.Log.info('Importing Shopify Order #' + order.order_number + ' - Missing Rental Dates ');
    // Flag order
    validImport = true;
  }

  _.each(order.line_items, function (item) {
    // Check to see  if product_id exists in our bundIds array
    if (_.contains(bundleIds, item.product_id + '')) {
      let bundle = Bundles.findOne({shopifyId: item.product_id + ''});
      let color = _.findWhere(item.properties, {name: 'Color'});
      if (color) {
        color = keyify(color.value);
      } else {
        ReactionCore.Log.error('Order ' + order.order_number + ' contains an item missing colors');
        return; // XXX: This skips all remaining items in the order, just a hack to get all orders to process, not a solution.
        // If the order doesn't have a color, it's broken.
        // TODO: Flag this order for CSR team and continue.
      }

      // TODO: Abstract size finding to a function that returns an object of sizes
      let jacketSize = _.findWhere(item.properties, {name: 'Jacket Size'}).value;
      let pantsSize = _.findWhere(item.properties, {name: 'Pants Size'}).value;
      let glovesSize = _.findWhere(item.properties, {name: 'Gloves Size'}).value;
      let goggleType = _.findWhere(item.properties, {name: 'Goggles Choice'}).value;

      // Deprecated in favor of style.jacketId, style.jacketColor etc
      // XXX: remove after implementation is complete - for reference only
      // let jacketId = thisBundle.jacketId;
      // let jacketColor = thisBundle.jacketColor;
      // let pantsId = thisBundle.pantsId;
      // let pantsColor = thisBundle.pantsColor;
      // let glovesId = thisBundle.glovesId;
      // let glovesColor = thisBundle.glovesColor;
      // let gogglesId = thisBundle.gogglesId;
      // let gogglesColors = thisBundle.gogglesColor;

      // call the bundle + colorway a style;
      let style = bundle.colorWays[color];
      // We should be able to nuke most of this in exchange for just using style.jacketId etc.

      let jacket = ReactionCore.Collections.Products.findOne(style.jacketId);
      if (jacket && jacketSize && style.jacketColor) {
        let jacketVariant = _.findWhere(jacket.variants, {size: jacketSize, color: style.jacketColor});
        // TODO: Adjust inventory and create exception if inventory not available here
        items.push(createOrderItem(style.jacketId, jacketVariant));
      } else {
        // Flag this item as missing from the order if it's missing style or color or cannot be found
        missingItem = true;
      }

      let pants = ReactionCore.Collections.Products.findOne(style.pantsId);
      if (pants && style.pantsColor && pantsSize) {
        let pantsVariant = _.findWhere(pants.variants, {size: pantsSize, color: style.pantsColor});
        items.push(createOrderItem(style.pantsId, pantsVariant));
      } else {
        missingItem = true;
      }
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
      if (!variant) {
        missingItem = true;
      } else {
        let newItem = {
          _id: Random.id(),
          shopId: ReactionCore.getShopId(),
          productId: product._id,
          quantity: 1,
          variants: variant,
          workflow: {
            status: 'orderCreated',
            workflow: ['inventoryAdjusted']
          }
        };
        items.push(newItem);
      }
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
  let shippingAddress = generateShippingAddress(order);
  let billingAddress = generateBillingAddress(order);
  let itemsAF = [];
  if (items.length > 0) {
    itemsAF = _.map(items, function (item) {
    let product = Products.findOne(item.productId);
      if (item.variants) {
        return {
          _id: item._id,
          productId: item.productId,
          shopId: item.shopId,
          quantity: item.quantity,
          variantId: item.variants._id,
          itemDescription: product.vendor + ' ' + product.title,
          workflow: {
            status: 'In Stock',
            workflow: []
          },
          price: item.variants.price,
          sku: item.variants.sku,
          location: item.variants.location
        };
      } else {
        missingItem = true;
      }
    });
  }

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
    itemMissingDetails: missingItem,
    advancedFulfillment: {
      shipmentDate: shipmentChecker(shipmentDate),
      returnDate: returnChecker(returnDate),
      workflow: orderCreated,
      items: itemsAF // Throwing error related to Product required.
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
