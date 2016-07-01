ReactionAnalytics = {};

ReactionAnalytics.capitalizeEventString = function (event) {
  if (!event) {
    return event;
  }
  let capitalizedEvent = event;
  // Split camelcase words
  capitalizedEvent = capitalizedEvent.replace(/([A-Z])/g, " $1");
  // Split non-word, underscore, or hyphen connected words
  capitalizedEvent = capitalizedEvent.replace(/([\W_\-]+)/g, " ");
  // Capitalize words
  capitalizedEvent = capitalizedEvent.replace(/([^[a-zA-Z0-9]|^)([a-zA-Z0-9])([\w]*)/g, function (_, g1, g2, g3) {
    return g1 + g2.toUpperCase() + g3;
  });
  return capitalizedEvent;
};

ReactionAnalytics.filteredProductVariantTitle = function (variant) {
  let title = `${variant.vendor}
               ${variant.productTitle}
               ${variant.gender}
               ${variant.color}
               ${variant.size}`;
  return title.replace(/(?:One|No)\s+(?:Color|Size|Option)/ig, "")
    .replace(/unisex/ig, "")
    .replace(/\s+/g, " ");
};

ReactionAnalytics.getProductTrackingProps = function (product, variant) {
  if (!product || !variant) {
    return {};
  }
  let props = {
    "id": variant._id,
    "sku": variant.sku,
    "Product Sku": variant.sku,
    "Product Title": variant.productTitle,
    "Product Vendor": product.vendor,
    "Product Gender": variant.gender,
    "Product Color": variant.color,
    "Product Size": variant.size,
    "Product Type": product.productType,
    "category": product.productType,
    "Variant Title": ReactionAnalytics.filteredProductVariantTitle(variant),
    "name": ReactionAnalytics.filteredProductVariantTitle(variant),
    "Product Price": variant.price,
    "price": variant.price, // TODO: This should check selected dates/reservation length
    "Product Weight": variant.weight,
    "Variant Total Inventory": variant.inventoryQuantity,
    "Variant Ancestors": variant.ancestors
  };

  props[variant.optionTitle] = variant.title;
  props["Available Rental Lengths"] = _.pluck(variant.rentalPriceBuckets, "duration");
  props["Available Prices"] = _.pluck(variant.rentalPriceBuckets, "price");
  props["Price Buckets"] = variant.rentalPriceBuckets;
  props["Is Bundle Component"] = product.customerViewType === "bundleComponent";
  return props;
};

ReactionAnalytics.getOrderTrackingProps = function (order) {
  if (!order) {
    return {};
  }
  let props = {
    "id": order._id,
    "orderId": order._id,
    "createdAt": order.createdAt,
    "total": order.billing[0].invoice.total,
    "shipping": order.billing[0].invoice.shipping,
    "subtotal": order.billing[0].invoice.subtotal,
    "taxes": order.billing[0].invoice.taxes,
    "discount": order.billing[0].invoice.discounts,
    "currency": "USD",
    "email": order.email,
    "Billing Payment Processor": order.billing[0].paymentMethod.processor,
    "Billing Payment Method": order.billing[0].paymentMethod.method,
    "Billing Postal Code": order.billing[0].address.postal,
    "Billing City": order.billing[0].address.city,
    "Billing Region": order.billing[0].address.region,
    "Billing Country": order.billing[0].address.country,
    "Shipping Method Name": order.shipping[0].shipmentMethod.name,
    "Shipping Method Label": order.shipping[0].shipmentMethod.label,
    "Shipping Method Rate": order.shipping[0].shipmentMethod.rate,
    "Shipping Postal Code": order.shipping[0].address.postal,
    "Shipping City": order.shipping[0].address.city,
    "Shipping Region": order.shipping[0].address.region,
    "Shipping Country": order.shipping[0].address.country,
    "Reservation Start": order.startTime,
    "Reservation End": order.endTime,
    "Reservation Length": order.rentalDays,
    "Scheduled Shipment Date": order.advancedFulfillment.shipmentDate,
    "Scheduled Return Date": order.advancedFulfillment.returnDate,
    "Carrier Transit Time": order.advancedFulfillment.transitTime,
    "Order Number": order.orderNumber,
    "products": []
  };
  props.products = _.map(order.items, function (item) {
    return ReactionAnalytics.getProductTrackingProps(item, item.variants);
  });
  return props;
};
