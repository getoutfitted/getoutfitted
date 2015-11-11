ReactionCore.Collections.Shopify = Shopify = this.Shopify = new Mongo.Collection('Shopify');

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

ReactionCore.Schemas.Shopify = new SimpleSchema({
  information: {
    type: Object,
    optional: true,
    blackbox: true
  },
  dateFrom: {
    type: Date,
    optional: true
  },
  dateTo: {
    type: Date,
    optional: true
  }
});

ReactionCore.Collections.Shopify.attachSchema(ReactionCore.Schemas.Shopify);
