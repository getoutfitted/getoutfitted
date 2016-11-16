import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { ProductReviews } from "../../lib/collections";

Meteor.publish("ProductReviewsByProductId", function (productId) {
  check(productId, String);
  if (!productId) {
    return this.ready();
  }
  return ProductReviews.find({productId: productId});
});

Meteor.publish("ProductReviewsByProductHandle", function (handle) {
  check(handle, String);
  if (!handle) {
    return this.ready();
  }
  return ProductReviews.find({productSlug: handle});
});
