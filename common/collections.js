ReactionCore.Schemas.ShopifyOrdersPackageConfig = new SimpleSchema([
  ReactionCore.Schemas.PackageConfig, {
    'settings.shopify.key': {
      type: String,
      label: 'Shopify API KEY',
      optional: true
    },
    'settings.shopify.password': {
      type: String,
      label: 'Shopify Password KEY',
      optional: true
    },
    'settings.shopify.shopname': {
      type: String,
      label: 'Shopify Name ',
      optional: true
    },
    'settings.public.lastUpdated': {
      type: Date,
      label: 'Last Time Orders Were Updated',
      optional: true
    }
  }
]);
