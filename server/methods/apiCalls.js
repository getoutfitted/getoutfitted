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

function setupRentalFromOrderNotes(notes) {
  let rental = {};
  // startDateObj and endDateObj return an object such as {name: 'first_ski_day', value: '2015-12-30' }
  let startDateObj = _.find(notes, function (note) {
    return ['first_ski_day', 'first_camping_day', 'first_activity_day'].indexOf(note.name) > -1;
  });

  let endDateObj = _.find(notes, function (note) {
    return ['last_ski_day', 'last_camping_day', 'last_activity_day'].indexOf(note.name) > -1;
  });

  if (startDateObj && endDateObj) {
    // If we have both a start and end date, create js Date objects.
    rental.start = new Date(startDateObj.value);
    rental.end = new Date(endDateObj.value);
    // TODO: Make sure that this diff is identical to the number of rental days always.
    rental.tripLength = moment(rental.start).diff(moment(rental.end), 'days');
    return rental;
  }
  return false;
}

function getShippingBuffers() {
  let advancedFulfillment = ReactionCore.Collections.Packages.findOne({name: 'reaction-advanced-fulfillment'});
  if (advancedFulfillment && advancedFulfillment.settings && advancedFulfillment.settings.buffer) {
    return advancedFulfillment.settings.buffer;
  }
  return {shipping: 0, returning: 0};
}

function getBundleVariant(productId, color, size) {
  let product = ReactionCore.Collections.Products.findOne(productId);
  if (product && size && color) {
    let variant = _.findWhere(product.variants, {size: size, color: color});
    return createOrderItem(productId, variant);
  }
  return false;
}

function setupOrderItems(lineItems, orderNumber) {
  // TODO: Consider abstracting this into two separate functions.
  const bundleIds = _.pluck(Bundles.find().fetch(), 'shopifyId');
  const productIds = _.pluck(Products.find().fetch(), 'shopifyId');
  let items = [];
  _.each(lineItems, function (item) {
    // Check to see  if product_id exists in our bundIds array
    if (_.contains(bundleIds, item.product_id + '')) {
      let bundle = Bundles.findOne({shopifyId: item.product_id + ''});
      let color = _.findWhere(item.properties, {name: 'Color'});

      if (color) {
        color = keyify(color.value);
      } else {
        ReactionCore.Log.error('Order ' + orderNumber + ' contains an item missing colors');
        return; // XXX: This skips all remaining items in the order, just a hack to get all orders to process, not a solution.
        // If the order doesn't have a color, it's broken.
        // TODO: Flag this item in this order for CSR team and continue.
      }

      let style = bundle.colorWays[color]; // call the bundle + colorway a style;
      let size = {
        jacket: _.findWhere(item.properties, {name: 'Jacket Size'}).value,
        midlayer: _.findWhere(item.properties, {name: 'Jacket Size'}).value,
        pants: _.findWhere(item.properties, {name: 'Pants Size'}).value,
        gloves: _.findWhere(item.properties, {name: 'Gloves Size'}).value
      };
      let goggleChoice  = _.findWhere(item.properties, {name: 'Goggles Choice'}).value;
      let goggleType = goggleChoice === 'Over Glasses' ? 'otg' : 'std';
      let goggleVariant = getBundleVariant(style[goggleType + 'GogglesId'], style[goggleType + 'GogglesColor'], 'One Size')
      // let goggleVariantItem = getBundleVariant(style[goggleType + 'GogglesId'], style[goggleType + 'GogglesColor'], 'STD');
      if (goggleVariantItem) {
        items.push(goggleVariantItem);
      } else {
        missingItem = true;
      }

      let productTypes = ['jacket', 'pants', 'midlayer', 'gloves'];
      _.each(productTypes, function (productType) {
        let variantItem = getBundleVariant(style[productType + 'Id'], style[productType + 'Color'], size[productType]);
        if (variantItem) {
          items.push(variantItem);
        } else {
          missingItem = true;
        }
      });
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
  return items;
}

/**
 * setupAdvancedFulfillmentItems
 * @param   {Array} items - Array of existing items - reactionOrder.items by default
 * @returns {Object} - returns object with advancedFulfillment items and the missingItemDetails flag
 */
function setupAdvancedFulfillmentItems(items) {
  let missingItemDetails = false; // Flag we will pass back
  if (items.length > 0) {
    let afItems = _.map(items, function (item) {
      let product = Products.findOne(item.productId);
      if (item.variants) {
        // TODO: refactor - shouldn't need an ID, or duplicate existing fields
        return {
          _id: item._id,
          productId: item.productId,
          shopId: item.shopId,
          quantity: item.quantity,
          variantId: item.variants._id,
          price: item.variants.price,
          sku: item.variants.sku,
          location: item.variants.location,
          itemDescription: product.vendor + ' - ' + product.title,
          workflow: {
            status: 'In Stock',
            workflow: []
          }
        };
      }
      missingItemDetails = true;
    });

    return {afItems: afItems, missingItemDetails: missingItemDetails};
  }
  return {afItems: [], missingItemDetails: missingItemDetails};
}


function createReactionOrder(order) {
  check(order, Object);
  const notes = order.note_attributes;
  const rental = setupRentalFromOrderNotes(notes); // Returns start, end, and triplength of rental or false
  const buffers = getShippingBuffers();

  // Initialize reaction order
  let reactionOrder = {
    shopifyOrderNumber: order.order_number,
    email: order.email,
    shopId: ReactionCore.getShopId(),
    userId: Random.id(),
    shipping: generateShippingAddress(order),
    billing: generateBillingAddress(order),
    startTime: rental.start,
    endTime: rental.end,
    missingInfo: false,                   // Missing info flag (dates, etc)
    missingItemDetails: false,            // Missing item information flag (color, size, etc)
    items: setupOrderItems(order.line_items, order.order_number),
    advancedFulfillment: {
      shipmentDate: new Date(),           // Initialize shipmentDate to today
      returnDate: new Date(2100, 8, 20),  // Initialize return date to 85 years from now
      workflow: {
        status: 'orderCreated'
      }
    },
    createdAt: new Date(order.created_at)
  };

  let afDetails = setupAdvancedFulfillmentItems(reactionOrder.items);
  reactionOrder.advancedFulfillment.items = afDetails.afItems;
  reactionOrder.missingItemDetails = afDetails.missingItemDetails;

  if (!rental) {
    ReactionCore.Log.error('Importing Shopify Order #' + order.order_number + ' - Missing Rental Dates ');
    reactionOrder.missingInfo = true; // Flag order
  } else {
    reactionOrder.advancedFulfillment.shipmentDate = moment(rental.start).subtract(buffers.shipping, 'days').toDate();
    reactionOrder.advancedFulfillment.returnDate = moment(rental.end).add(buffers.returning, 'days').toDate();
  }

  ReactionCore.Log.info('Importing Shopify Order #'
    + order.order_number
    + ' - Rental Dates '
    + rental.start
    + ' to '
    + rental.end);

  ReactionCore.Collections.Orders.insert(reactionOrder);
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
