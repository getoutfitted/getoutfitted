import { Meteor } from "meteor/meteor";
import { Media, Products, Tags, Cart, Orders } from "/lib/collections";
import { Reaction } from "/server/api";

/**
 * CollectionFS - Image/Video Publication
 * @params {Array} shops - array of current shop object
 */
Meteor.publish("Media", function (shops) {
  check(shops, Match.Optional(Array));
  let selector;
  const shopId = Reaction.getShopId();
  if (!shopId) {
    return this.ready();
  }
  if (shopId) {
    selector = {
      "metadata.shopId": shopId
    };
  }
  if (shops) {
    selector = {
      "metadata.shopId": {
        $in: shops
      }
    };
  }
  return Media.find(selector, {
    sort: {
      "metadata.priority": 1
    }
  });
});

/**
 * CollectionFS - Image/Video Publication
 * @params {String} productIdOrSlug - handle or _id of current product
 */
Meteor.publish("MediaByProductIdOrSlug", function (productIdOrSlug) {
  check(productIdOrSlug, String);
  const product = Products.findOne({$or: [
    {_id: productIdOrSlug},
    {handle: productIdOrSlug}
  ]});
  if (!product || !product._id) {
    return this.ready();
  }
  // const variantIds = Products.find({ancestors: product._id}).fetch().map(prod => prod._id);
  const selector = {$or: [
    {"metadata.productId": product._id}
  ]};
  return Media.find(selector, {
    sort: {
      "metadata.priority": 1
    },
    fields: {
      "copies.image": 0,
      "copies.medium": 0,
      "copies.small": 0,
      "copies.portrait": 0
    }
  });
});

/**
 * CollectionFS - Image/Video Publication
 * @params {String} slug - slug of current tag on product grid
 */
Meteor.publish("FeaturedMediaByTag", function (slug) {
  check(slug, Match.Maybe(String));
  let productSelector;
  if (!slug) {
    productSelector = { isVisible: true };
  } else {
    const tag = Tags.findOne({ slug: slug });
    productSelector = { ancestors: [], hashtags: tag._id, isVisible: true };
  }

  const productIds = Products.find(productSelector).fetch().map(prod => prod._id);
  const selector = {
    "metadata.productId": {$in: productIds},
    "metadata.purpose": "featured"
  };
  return Media.find(selector, {
    fields: {
      "copies.image": 0,
      "copies.medium": 0,
      "copies.small": 0,
      "copies.portrait": 0
    }
  });
});

Meteor.publish("CartMedia", function (userId) {
  check(userId, String);
  const cart = Cart.findOne({userId: userId});

  const productIds = cart.items.map(prod => prod.productId);
  const selector = {
    "metadata.productId": {$in: productIds},
    "metadata.purpose": "cart"
  };
  return Media.find(selector, {
    fields: {
      "copies.image": 0,
      "copies.medium": 0,
      "copies.small": 0,
      "copies.portrait": 0
    }
  });
});


Meteor.publish("OrderMedia", function (cartId) {
  check(cartId, String);
  const order = Orders.findOne({cartId: cartId});

  const productIds = order.items.map(prod => prod.productId);
  const selector = {
    "metadata.productId": {$in: productIds},
    "metadata.purpose": "cart"
  };
  return Media.find(selector, {
    fields: {
      "copies.image": 0,
      "copies.medium": 0,
      "copies.small": 0,
      "copies.portrait": 0
    }
  });
});
