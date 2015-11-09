ReactionCore.Schemas.ShopifyOrdersPackageConfig = new SimpleSchema([
  ReactionCore.Schemas.PackageConfig, {
    'settings.shopify.key': {
      type: String,
      label: 'Shopify API KEY',
      optional: true
    }
  }
]);
