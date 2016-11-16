import { SimpleSchema } from "meteor/aldeed:simple-schema";

export const ProductReviews = new SimpleSchema({
  productId: {
    type: String,
    optional: true
  },
  productSlug: {
    type: String
  },
  name: {
    type: String
  },
  height: {
    type: String
  },
  weight: {
    type: String
  },
  quote: {
    type: String
  }
});
