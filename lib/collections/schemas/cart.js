import { SimpleSchema } from "meteor/aldeed:simple-schema";
import { shopIdAutoValue } from "./helpers";
import { Payment } from "./payments";
import { ProductVariant } from "./products";
import { Shipment } from "./shipping";
import { Workflow } from "./workflow";

/**
 * CartItem Schema
 */

export const CartItem = new SimpleSchema({
  _id: {
    type: String
  },
  productId: {
    type: String,
    index: 1
  },
  shopId: {
    type: String,
    autoValue: shopIdAutoValue,
    index: 1,
    label: "Cart Item shopId",
    optional: true
  },
  quantity: {
    label: "Quantity",
    type: Number,
    min: 0
  },
  variants: {
    type: ProductVariant
  },
  title: {
    type: String,
    label: "CartItem Title"
  },
  type: {
    label: "Product Type",
    type: String,
    optional: true
  },
  cartItemId: { // Seems strange here but has to be here since we share schemas between cart and order
    type: String,
    optional: true
  },
  // GETOUTFITTED CUSTOM SCHEMA
  startTime: {
    type: Date,
    optional: true
  },
  endTime: {
    type: Date,
    optional: true
  },
  productType: {
    type: String,
    optional: true
  },
  functionalType: {
    type: String,
    optional: true
  },
  bundleIndex: { // index
    type: Number,
    label: "Id of Bundle Item Came From",
    optional: true
  },
  bundleProductId: {
    type: String,
    optional: true
  },
  customerViewType: {
    type: String,
    optional: true,
    label: "Display properties for Customer",
    allowedValues: ["bundle", "bundleComponent", "rental", "purchase", "demo"]
  }
});

/**
 * CartItem Schema
 * used in check by inventory/addReserve method
 */

export const CartItems = new SimpleSchema({
  items: {
    type: [CartItem],
    optional: true
  }
});

/**
 * Cart Schema
 */

export const Cart = new SimpleSchema({
  shopId: {
    type: String,
    autoValue: shopIdAutoValue,
    index: 1,
    label: "Cart ShopId"
  },
  userId: {
    type: String,
    unique: true,
    autoValue: function () {
      if (this.isInsert || this.isUpdate) {
        if (!this.isFromTrustedCode) {
          return this.userId;
        }
      } else {
        this.unset();
      }
    }
  },
  sessionId: {
    type: String,
    index: 1
  },
  email: {
    type: String,
    optional: true,
    index: 1,
    regEx: SimpleSchema.RegEx.Email
  },
  items: {
    type: [CartItem],
    optional: true
  },
  shipping: {
    type: [Shipment],
    optional: true,
    blackbox: true
  },
  billing: {
    type: [Payment],
    optional: true,
    blackbox: true
  },
  tax: {
    type: Number,
    decimal: true,
    optional: true
  },
  taxes: {
    type: [Object],
    optional: true,
    blackbox: true
  },
  workflow: {
    type: Workflow,
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
  },
  updatedAt: {
    type: Date,
    autoValue: function () {
      if (this.isUpdate) {
        return {
          $set: new Date
        };
      } else if (this.isUpsert) {
        return {
          $setOnInsert: new Date
        };
      }
    },
    optional: true
  },
  // GETOUTFITTED CUSTOM SCHEMA
  startTime: {
    type: Date,
    optional: true
  },
  endTime: {
    type: Date,
    optional: true
  },
  rentalMonths: {
    type: Number,
    optional: true
  },
  rentalWeeks: {
    type: Number,
    optional: true
  },
  rentalDays: {
    type: Number,
    optional: true
  },
  rentalHours: {
    type: Number,
    optional: true
  },
  rentalMinutes: {
    type: Number,
    optional: true
  },
  customerAgreedToTermsOfService: {
    type: Boolean,
    defaultValue: false,
    label: "Customer has agreed to Terms"
  },
  dateCustomerAgreedToTermsOfService: {
    type: Date,
    optional: true,
    label: "Date Customer Agreed to Terms"
  }
});
