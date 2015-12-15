function keyify(string) {
  let keyifiedString = string.replace(/([\W\/])/ig, '');
  keyifiedString = keyifiedString[0].toLowerCase() + keyifiedString.substr(1);
  return keyifiedString;
}

function formatDateForApi(date) {
  let shopifyOrders = ReactionCore.Collections.Packages.findOne({name: 'reaction-shopify-orders'}).settings.public;

  if (shopifyOrders.lastUpdated) {
    return moment(date).format('YYYY-MM-DD HH:mm'); // current orders
    // return moment(date).format('2015-11-19') + ' 00:00';

    // return moment(date).format('YYYY-MM-DD') + ' 00:00'; // Todays Orders
    // return moment(date).format('2003-11-12') + ' 00:00';
  }
  return moment(new Date('2003-09-20')).format('YYYY-MM-DD');
}

function shipmentChecker(date) {
  if (moment(date).isoWeekday() === 7) {
    return moment(date).subtract(2, 'days').toDate();
  } else if (moment(date).isoWeekday() === 6) {
    return moment(date).subtract(1, 'days').toDate();
  }
  return date;
}

function getFedexTransitTime(address) {
  const shopifyOrders = ReactionCore.Collections.Packages.findOne({
    name: 'reaction-shopify-orders'
  });
  if (!shopifyOrders.settings.fedex) {
    ReactionCore.Log.warn('Fedex API not setup. Transit Days will not be estimated');
    return false;
  }
  fedexTimeTable = {
    'ONE_DAY': 1,
    'TWO_DAYS': 2,
    'THREE_DAYS': 3,
    'FOUR_DAYS': 4,
    'FIVE_DAYS': 5,
    'SIX_DAYS': 6,
    'SEVEN_DAYS': 7,
    'EIGHT_DAYS': 8,
    'NINE_DAYS': 9,
    'TEN_DAYS': 10,
    'ELEVEN_DAYS': 11,
    'TWELVE_DAYS': 12,
    'THIRTEEN_DAYS': 13,
    'FOURTEEN_DAYS': 14,
    'FIFTEEN_DAYS': 15,
    'SIXTEEN_DAYS': 16,
    'SEVENTEEN_DAYS': 17,
    'EIGHTEEN_DAYS': 18,
    'NINETEEN_DAYS': 19,
    'TWENTY_DAYS': 20
  };

  let fedex = new Fedex({
    'environment': shopifyOrders.settings.fedex.liveApi ? 'live' : 'sandbox',
    'key': shopifyOrders.settings.fedex.key,
    'password': shopifyOrders.settings.fedex.password,
    'account_number': shopifyOrders.settings.fedex.accountNumber,
    'meter_number': shopifyOrders.settings.fedex.meterNumber,
    'imperial': true
  });

  let shipment = {
    ReturnTransitAndCommit: true,
    CarrierCodes: ['FDXE', 'FDXG'],
    RequestedShipment: {
      DropoffType: 'REGULAR_PICKUP',
      ServiceType: 'FEDEX_GROUND', // GROUND_HOME_DELIVERY
      PackagingType: 'YOUR_PACKAGING',
      Shipper: {
        Contact: {
          PersonName: 'Shipper Person',
          CompanyName: 'GetOutfitted',
          PhoneNumber: '5555555555'
        },
        Address: {
          StreetLines: [
            '103 Main St'
          ],
          City: 'Dillon',
          StateOrProvinceCode: 'CO',
          PostalCode: '80435',
          CountryCode: 'US'
        }
      },
      Recipient: {
        Contact: {
          PersonName: 'Receiver Person',
          CompanyName: 'Hotel',
          PhoneNumber: '5555555555'
        },
        Address: {
          StreetLines: [
            address.address1,
            address.address2
          ],
          City: address.city,
          StateOrProvinceCode: address.province_code,
          PostalCode: address.zip,
          CountryCode: address.country_code,
          Residential: false // Or true
        }
      },
      ShippingChargesPayment: {
        PaymentType: 'SENDER',
        Payor: {
          ResponsibleParty: {
            AccountNumber: fedex.options.account_number
          }
        }
      },
      PackageCount: '1',
      RequestedPackageLineItems: {
        SequenceNumber: 1,
        GroupPackageCount: 1,
        Weight: {
          Units: 'LB',
          Value: '7.0'
        },
        Dimensions: {
          Length: 24,
          Width: 14,
          Height: 6,
          Units: 'IN'
        }
      }
    }
  };

  let fedexRatesSync = Meteor.wrapAsync(fedex.rates);

  let rates = fedexRatesSync(shipment);
  if (!rates.RateReplyDetails) {
    return false;
  }
  let groundRate = rates.RateReplyDetails[0];
  console.log(fedexTimeTable[groundRate.TransitTime]);
  return fedexTimeTable[groundRate.TransitTime];
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
  if (!order.billing_address) {
    order.billing_address = order.shipping_address;
  }
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
    return moment(date).add(1, 'days').toDate();
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
  let bundleMissingColor = false;
  _.each(lineItems, function (item) {
    // Check to see  if product_id exists in our bundIds array
    if (_.contains(bundleIds, item.product_id + '')) {
      let bundle = Bundles.findOne({shopifyId: item.product_id + ''});
      if (item.properties.length === 0) {
        ReactionCore.Log.error('CS created order ' + orderNumber);
        let defaultColor = _.keys(bundle.colorWays)[0];
        let defaultColorWay = bundle.colorWays[defaultColor];
        let productTypes = [
          'jacketId',
          'pantsId',
          'glovesId',
          'stdGogglesId'
        ];
        _.each(productTypes, function (productType){
          items.push({
            _id: Random.id(),
            shopId: ReactionCore.getShopId(),
            productId: defaultColorWay[productType],
            quantity: item.quantity,
            workflow: {
              status: 'orderCreated',
              workflow: ['inventoryAdjusted']
            }
          });
        });
        if (defaultColorWay.midlayerId) {
          items.push(
            {
              _id: Random.id(),
              shopId: ReactionCore.getShopId(),
              productId: defaultColorWay.midlayerId,
              quantity: item.quantity,
              workflow: {
                status: 'orderCreated',
                workflow: ['inventoryAdjusted']
              }
            });
        }
        return;
      }
      let color = _.findWhere(item.properties, {name: 'Color'});

      if (color) {
        color = keyify(color.value);
      } else {
        ReactionCore.Log.error('Order ' + orderNumber + ' contains an item missing colors');
        bundleMissingColor = true;
        let colorOptions = _.keys(bundle.colorWays);
        color = keyify(colorOptions[0]);
      }

      let style = bundle.colorWays[color]; // call the bundle + colorway a style;
      let size = {
        jacket: _.findWhere(item.properties, {name: 'Jacket Size'}).value.trim(),
        midlayer: _.findWhere(item.properties, {name: 'Jacket Size'}).value.trim(),
        pants: _.findWhere(item.properties, {name: 'Pants Size'}).value.trim(),
        gloves: _.findWhere(item.properties, {name: 'Gloves Size'}).value.trim()
      };
      let goggleChoice  = _.findWhere(item.properties, {name: 'Goggles Choice'});
      if (goggleChoice) {
        goggleChoice = goggleChoice.value.trim();
      } else {
        goggleChoice = 'Standard';
      }
      let goggleType = goggleChoice === 'Over Glasses' ? 'otg' : 'std';
      let goggleVariantItem = getBundleVariant(style[goggleType + 'GogglesId'], style[goggleType + 'GogglesColor'], 'One Size');
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
      if (sizeObj && !sizeObj === 'unselected') {
        size = sizeObj.value;
      }
      let product = Products.findOne({shopifyId: item.product_id + ''});
      let variant;
      if (product) {
        variant = _.findWhere(product.variants, {size: size, color: color});
      }
      let newItem;
      if (!variant) {
        newItem = {
          _id: Random.id(),
          shopId: ReactionCore.getShopId(),
          productId: product._id,
          quantity: item.quantity,
          workflow: {
            status: 'orderCreated',
            workflow: ['inventoryAdjusted']
          }
        };
      } else {
        newItem = {
          _id: Random.id(),
          shopId: ReactionCore.getShopId(),
          productId: product._id,
          quantity: item.quantity,
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
  return {
    items: items,
    bundleMissingColor: bundleMissingColor
  };
}

/**
 * setupAdvancedFulfillmentItems
 * @param   {Array} items - Array of existing items - reactionOrder.items by default
 * @returns {Object} - returns object with advancedFulfillment items and the itemMissingDetails flag
 */
function setupAdvancedFulfillmentItems(items) {
  let itemMissingDetails = false; // Flag we will pass back
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
          itemDescription: product.gender + ' - ' + product.vendor + ' - ' + product.title,
          workflow: {
            status: 'In Stock',
            workflow: []
          }
        };
      }
      itemMissingDetails = true;
      return {
        _id: item._id,
        productId: item.productId,
        shopId: item.shopId,
        quantity: item.quantity,
        itemDescription: product.gender + ' - ' + product.vendor + ' - ' + product.title,
        workflow: {
          status: 'In Stock',
          workflow: []
        }
      };
    });

    return {afItems: afItems, itemMissingDetails: itemMissingDetails};
  }
  return {afItems: [], itemMissingDetails: itemMissingDetails};
}


function createReactionOrder(order) {
  check(order, Object);

  const orderExists = ReactionCore.Collections.Orders.findOne({shopifyOrderNumber: parseInt(order.order_number, 10)});
  if (orderExists) {
    ReactionCore.Log.warn('Import of order #' + order.order_number + ' aborted because it already exists');
    return false;
  }

  const notes = order.note_attributes;
  const rental = setupRentalFromOrderNotes(notes); // Returns start, end, and triplength of rental or false
  const buffers = getShippingBuffers();
  const fedexTransitTime = getFedexTransitTime(order.shipping_address);
  if (fedexTransitTime) {
    buffers.shipping = fedexTransitTime + 1;
  }
  let orderItems = setupOrderItems(order.line_items, order.order_number);
  // Initialize reaction order
  let reactionOrder = {
    shopifyOrderNumber: order.order_number,
    shopifyOrderId: order.id,
    email: order.email,
    shopId: ReactionCore.getShopId(),
    userId: Random.id(),
    shipping: generateShippingAddress(order),
    billing: generateBillingAddress(order),
    startTime: rental.start,
    endTime: rental.end,
    orderNotes: order.note,
    infoMissing: false,                   // Missing info flag (dates, etc)
    itemMissingDetails: false,            // Missing item information flag (color, size, etc)
    bundleMissingColor: orderItems.bundleMissingColor,
    items: orderItems.items,
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
  reactionOrder.itemMissingDetails = afDetails.itemMissingDetails;

  if (!rental) {
    ReactionCore.Log.error('Importing Shopify Order #' + order.order_number + ' - Missing Rental Dates ');
    reactionOrder.infoMissing = true; // Flag order
  } else {
    reactionOrder.advancedFulfillment.shipmentDate = shipmentChecker(moment(rental.start).subtract(buffers.shipping, 'days').toDate());
    reactionOrder.advancedFulfillment.returnDate = returnChecker(moment(rental.end).add(buffers.returning, 'days').toDate());
  }

  ReactionCore.Log.info('Importing Shopify Order #'
    + order.order_number
    + ' - Rental Dates '
    + rental.start
    + ' to '
    + rental.end);
  return ReactionCore.Collections.Orders.insert(reactionOrder);
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
  'shopifyOrders/newOrder': function (order) {
    check(order, Match.Any);
    if (this.connection === null) {
      createReactionOrder(order);
    } else {
      throw new Meteor.Error(403, 'Forbidden, method is only available from the server');
    }
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
