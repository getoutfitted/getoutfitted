import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { ProductVariant} from '/lib/collections';

export const BundleVariants = new SimpleSchema({
  variantId: {
    type: String,
    optional: true
  },
  label: {
    type: String,
    optional: true
  }
});

export const BundleProducts = new SimpleSchema({
  productId: {
    type: String,
    optional: true
  },
  variantIds: {
    type: [BundleVariants],
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

export const SelectedBundleOption = new SimpleSchema({
  selectionForQtyNumber: {
    type: Number,
    optional: true
  },
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

export const ProductBundler = new SimpleSchema([
  ProductVariant, {
    bundleProducts: {
      type: [BundleProducts],
      optional: true
    },
    selectedBundleOptions: {
      type: [SelectedBundleOption],
      optional: true,
      defaultValue: []
    }
  }
]);
