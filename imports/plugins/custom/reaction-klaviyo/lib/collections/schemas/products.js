import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Product } from '/lib/collections/schemas';

export const KlaviyoProduct = new SimpleSchema([
  Product, {
    emailListId: {
      type: String,
      optional: true,
      label: "A unique id for emails"
    }
  }
]);
