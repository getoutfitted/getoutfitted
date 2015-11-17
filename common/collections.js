ReactionCore.Collections.ShopifyOrders = ShopifyOrders = this.ShopifyOrders = new Mongo.Collection('ShopifyOrders');

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
    },
    'settings.public.ordersSinceLastUpdate': {
      type: Number,
      label: 'Number of orders since last update',
      optional: true
    }
  }
]);

ReactionCore.Schemas.ShopifyOrderNumber = new SimpleSchema([
  ReactionCore.Schemas.Order, {
    shopifyOrderNumber: {
      type: Number,
      optional: true
    },
    importSuccessful: {
      type: Boolean,
      optional: true
    }
  }
]);

ReactionCore.Schemas.ShopifyOrders = new SimpleSchema({
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
  },
  pageNumber: {
    type: Number,
    optional: true
  },
  pageTotal: {
    type: Number,
    optional: true
  },
  groupId: {
    type: String,
    optional: true
  }
});

ReactionCore.Collections.ShopifyOrders.attachSchema(ReactionCore.Schemas.ShopifyOrders);
ReactionCore.Collections.Orders.attachSchema(ReactionCore.Schemas.ShopifyOrderNumber);
