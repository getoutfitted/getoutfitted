import { Reaction } from "/server/api";

Reaction.registerPackage({
  label: "Product Reviews",
  name: "product-reviews",
  icon: "fa fa-commenting",
  autoEnable: true,
  settings: {},
  registry: [{
    provides: "dashboard",
    name: "productReviews",
    label: "Product Reviews",
    description: "Customer reviews for products",
    container: "getoutfitted",
    icon: "fa fa-commenting",
    priority: 3
  }],
  layout: []
});
