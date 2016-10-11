export const AnalyticsHelpers = {
  capitalizeEventString(event) {
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
  },

  filteredProductVariantTitle(variant) {
    const title = `${variant.vendor}
                 ${variant.productTitle}
                 ${variant.gender}
                 ${variant.color}
                 ${variant.size}`;
    return title.replace(/(?:One|No)\s+(?:Color|Size|Option)/ig, "")
      .replace(/unisex/ig, "")
      .replace(/\s+/g, " ");
  },

  getProductTrackingProps(product, variant) {
    if (!product || !variant) {
      return {};
    }
    const props = {
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
  }
};
