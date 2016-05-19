ReactionCore.Schemas.BundleVariants = new SimpleSchema({
  variantId: {
    type: String,
    optional: true
  },
  label: {
    type: String,
    optional: true
  }
});

ReactionCore.Schemas.BundleProducts = new SimpleSchema({
  productId: {
    type: String,
    optional: true
  },
  variantIds: {
    type: [ReactionCore.Schemas.BundleVariants],
    optional: true
  },
  label: {
    type: String,
    optional: true
  },
  optional: {
    type: String,
    optional: true
  },
  addOnPrice: {
    type: Number,
    optional: true,
    decimal: true
  }
});

ReactionCore.Schemas.SelectedBundleOption = new SimpleSchema({
  productId: {
    type: String,
    optional: true // TODO - see if these have to be optional
  },
  variantId: {
    type: String,
    optional: true // TODO - see if these have to be optional if parent is optional
  },
  cartLabel: {
    type: String,
    optional: true
  }
});

ReactionCore.Schemas.RentalPriceBucket = new SimpleSchema({
  // Moment time unit
  timeUnit: {
    label: "Time Unit",
    type: String,
    optional: true,
    defaultValue: "days",
    allowedValues: [
      "years",
      "quarters",
      "months",
      "weeks",
      "days",
      "hours",
      "minutes",
      "seconds",
      "milliseconds"
    ]
  },
  duration: {
    label: "Amount of specified time periods",
    type: Number,
    optional: true,
    defaultValue: 6
  },
  price: {
    label: "Rental price for this duration",
    type: Number,
    optional: true,
    decimal: true,
    defaultValue: 150
  }
});

/**
 * VariantMedia Schema
 */
ReactionCore.Schemas.VariantMedia = new SimpleSchema({
  mediaId: {
    type: String,
    optional: true
  },
  priority: {
    type: Number,
    optional: true
  },
  metafields: {
    type: [ReactionCore.Schemas.Metafield],
    optional: true
  },
  updatedAt: {
    type: Date,
    optional: true
  },
  createdAt: {
    type: Date,
    autoValue: function () {
      if (this.isInsert) {
        return new Date;
      } else if (this.isUpsert) {
        return {
          $setOnInsert: new Date
        };
      }
    },
    denyUpdate: true
  }
});

/**
 * ProductPosition Schema
 */
ReactionCore.Schemas.ProductPosition = new SimpleSchema({
  tag: {
    type: String,
    optional: true
  },
  position: {
    type: Number,
    optional: true
  },
  pinned: {
    type: Boolean,
    optional: true
  },
  weight: {
    type: Number,
    optional: true,
    defaultValue: 0,
    min: 0,
    max: 3
  },
  updatedAt: {
    type: Date
  }
});

/**
 * ProductVariant Schema
 */
ReactionCore.Schemas.ProductVariant = new SimpleSchema({
  _id: {
    type: String,
    label: "Variant ID"
  },
  ancestors: {
    type: [String],
    defaultValue: []
  },
  // since implementing of flattened model this property is used for keeping
  // array index. This is needed for moving variants through list (drag'n'drop)
  index: {
    label: "Variant position number in list",
    type: Number,
    optional: true
  },
  barcode: {
    label: "Barcode",
    type: String,
    optional: true,
    custom: function () {
      if (Meteor.isClient) {
        if (this.siblingField("type").value === "inventory" && !this.value) {
          return "required";
        }
      }
    }
  },
  compareAtPrice: {
    label: "MSRP",
    type: Number,
    optional: true,
    decimal: true,
    min: 0
  },
  fulfillmentService: {
    label: "Fulfillment service",
    type: String,
    optional: true
  },
  weight: {
    label: "Weight",
    type: Number,
    min: 0,
    optional: true,
    custom: function () {
      if (Meteor.isClient) {
        if (!(this.siblingField("type").value === "inventory" || this.value ||
          this.value === 0)) {
          return "required";
        }
      }
    }
  },
  inventoryManagement: {
    type: Boolean,
    label: "Inventory Tracking",
    optional: true,
    defaultValue: true,
    custom: function () {
      if (Meteor.isClient) {
        if (!(this.siblingField("type").value === "inventory" || this.value ||
          this.value === false)) {
          return "required";
        }
      }
    }
  },
  // this represents an ability to sell item without keeping it on stock. In
  // other words if it is disabled, then you can sell item even if it is not in
  // stock.
  inventoryPolicy: {
    type: Boolean,
    label: "Deny when out of stock",
    optional: true,
    defaultValue: true,
    custom: function () {
      if (Meteor.isClient) {
        if (!(this.siblingField("type").value === "inventory" || this.value ||
          this.value === false)) {
          return "required";
        }
      }
    }
  },
  lowInventoryWarningThreshold: {
    type: Number,
    label: "Warn @",
    min: 0,
    optional: true
  },
  inventoryQuantity: {
    type: Number,
    label: "Quantity",
    optional: true,
    custom: function () {
      if (Meteor.isClient) {
        if (this.siblingField("type").value !== "inventory") {
          if (ReactionProduct.checkChildVariants(this.docId) === 0 && !this.value) {
            return "required";
          }
        }
      }
    }
  },
  minOrderQuantity: {
    label: "Minimum order quantity",
    type: Number,
    optional: true
  },
  price: {
    label: "Price",
    type: Number,
    decimal: true,
    min: 0,
    optional: true,
    defaultValue: 0,
    custom: function () {
      if (Meteor.isClient) {
        if (this.siblingField("type").value !== "inventory") {
          if (ReactionProduct.checkChildVariants(this.docId) === 0 && !this.value) {
            return "required";
          }
        }
      }
    }
  },
  shopId: {
    type: String,
    autoValue: ReactionCore.shopIdAutoValue,
    index: 1,
    label: "Variant ShopId"
  },
  sku: {
    label: "SKU",
    type: String,
    optional: true
  },
  type: {
    label: "Type",
    type: String,
    defaultValue: "variant"
  },
  taxable: {
    label: "Taxable",
    type: Boolean,
    optional: true
  },
  // Label for customers
  title: {
    label: "Label",
    type: String,
    optional: true,
    custom: function () {
      if (Meteor.isClient) {
        if (!(this.siblingField("type").value === "inventory" || this.value)) {
          return "required";
        }
      }
    }
  },
  // Option internal name
  optionTitle: {
    label: "Option",
    type: String,
    optional: true
  },
  metafields: {
    type: [ReactionCore.Schemas.Metafield],
    optional: true
  },
  createdAt: {
    label: "Created at",
    type: Date,
    optional: true
  },
  updatedAt: {
    label: "Updated at",
    type: Date,
    optional: true
  },
  // GetOutfitted ProductVariant Schema Additions
  functionalType: { // functionalType allows us to add-on to the schema for the `simple` and `variant` types
    type: String,   // and still maintain opportunity to have unique product types.
    defaultValue: "variant"
  },
  location: {
    label: "Warehouse Storage Location",
    type: String,
    optional: true
  },
  color: {
    type: String,
    optional: true
  },
  size: {
    type: String,
    optional: true
  },
  gender: {
    type: String,
    optional: true
  },
  pricePerDay: {
    label: "Daily Rate",
    type: Number,
    defaultValue: 0.0,
    decimal: true,
    min: 0,
    optional: true
  },
  rentalPriceBuckets: {
    label: "Rental Prices",
    type: [ReactionCore.Schemas.RentalPriceBucket],
    optional: true
  },
  // Duplicate product title to keep things moving in the cart
  productTitle: {
    label: "Product Title",
    type: String,
    optional: true
  },
  workflow: { // XXX: Not 100% certain we need this here, definitely need it on inventory and product
    type: ReactionCore.Schemas.Workflow,
    optional: true
  },
  vendor: {
    type: String,
    optional: true,
    label: "Vendor"
  },
  bundleProducts: {
    type: [ReactionCore.Schemas.BundleProducts],
    optional: true
  },
  selectedBundleOptions: {
    type: [ReactionCore.Schemas.SelectedBundleOption],
    optional: true,
    defaultValue: []
  }
});

ReactionCore.Schemas.PriceRange = new SimpleSchema({
  range: {
    type: String
  },
  min: {
    type: Number,
    decimal: true,
    optional: true
  },
  max: {
    type: Number,
    decimal: true,
    optional: true
  }
});

/**
 * Product Schema
 */
ReactionCore.Schemas.Product = new SimpleSchema({
  _id: {
    type: String,
    label: "Product Id"
  },
  ancestors: {
    type: [String],
    defaultValue: []
  },
  shopId: {
    type: String,
    autoValue: ReactionCore.shopIdAutoValue,
    index: 1,
    label: "Product ShopId"
  },
  title: {
    type: String,
    defaultValue: ""
  },
  pageTitle: {
    type: String,
    optional: true
  },
  description: {
    type: String,
    optional: true
  },
  type: {
    label: "Type",
    type: String,
    defaultValue: "simple"
  },
  vendor: {
    type: String,
    optional: true
  },
  metafields: {
    type: [ReactionCore.Schemas.Metafield],
    optional: true
  },
  positions: {
    type: Object, // ReactionCore.Schemas.ProductPosition
    blackbox: true,
    optional: true
  },
  // Denormalized field: object with range string, min and max
  price: {
    label: "Price",
    type: ReactionCore.Schemas.PriceRange
  },
  // Denormalized field: Indicates when at least one of variants
  // `inventoryQuantity` are lower then their `lowInventoryWarningThreshold`.
  // This is some kind of marketing course.
  isLowQuantity: {
    label: "Indicates that the product quantity is too low",
    type: Boolean,
    optional: true
  },
  // Denormalized field: Indicates when all variants `inventoryQuantity` is zero
  isSoldOut: {
    label: "Indicates when the product quantity is zero",
    type: Boolean,
    optional: true
  },
  // Denormalized field. It is `true` if product not in stock, but customers
  // anyway could order it.
  isBackorder: {
    label: "Indicates when the seller has allowed the sale of product which" +
    " is not in stock",
    type: Boolean,
    optional: true
  },
  requiresShipping: {
    label: "Require a shipping address",
    type: Boolean,
    defaultValue: true,
    optional: true
  },
  parcel: {
    type: ReactionCore.Schemas.ShippingParcel,
    optional: true
  },
  hashtags: {
    type: [String],
    optional: true,
    index: 1
  },
  twitterMsg: {
    type: String,
    optional: true,
    max: 140
  },
  facebookMsg: {
    type: String,
    optional: true,
    max: 255
  },
  googleplusMsg: {
    type: String,
    optional: true,
    max: 255
  },
  pinterestMsg: {
    type: String,
    optional: true,
    max: 255
  },
  metaDescription: {
    type: String,
    optional: true
  },
  handle: {
    type: String,
    optional: true,
    index: 1,
    autoValue: function () {
      let slug = this.value ||  getSlug(this.siblingField("title").value) ||
        this.siblingField("_id").value || "";
      if (this.isInsert) {
        return slug;
      } else if (this.isUpsert) {
        return {
          $setOnInsert: slug
        };
      }
    }
  },
  isVisible: {
    type: Boolean,
    index: 1,
    defaultValue: false
  },
  templateSuffix: {
    type: String,
    optional: true
  },
  createdAt: {
    type: Date,
    autoValue: function () {
      if (this.isInsert) {
        return new Date;
      } else if (this.isUpsert) {
        return {
          $setOnInsert: new Date
        };
      }
    }
  },
  updatedAt: {
    type: Date,
    autoValue: function () {
      return new Date;
    },
    optional: true
  },
  publishedAt: {
    type: Date,
    optional: true
  },
  publishedScope: {
    type: String,
    optional: true
  },
  workflow: {
    type: ReactionCore.Schemas.Workflow,
    optional: true
  },
  // GetOutfitted Product Schema Additions
  functionalType: { // functionalType allows us to add-on to the schema for the `simple` and `variant` types
    type: String,   // and still maintain opportunity to have unique product types.
    defaultValue: "simple"
  },
  gender: {
    type: String,
    optional: true
  },
  colors: {
    type: [String],
    optional: true
  },
  sizes: {
    type: [String],
    optional: true
  },
  cleaningBuffer: {
    type: Number,
    defaultValue: 0,
    optional: true
  },
  productType: { // E.g. product category (Tent, Jacket)
    type: String,
    index: 1,
    optional: true
  }
});
