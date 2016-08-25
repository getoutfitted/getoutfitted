import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Reaction, Logger } from '/server/api';
import { Products } from '/lib/collections';
import { _ } from 'meteor/underscore';
Meteor.methods({
  'productBundles/createBundleVariant': function (productId, product, rentalPriceBuckets) {
    check(productId, String);
    check(product, {
      title: String,
      pageTitle: String,
      description: String,
      handle: String,
      vendor: String,
      productType: String,
      price: {
        max: Number,
        min: Number,
        range: String
      },
      gender: String,
      sku: String
    });
    check(rentalPriceBuckets, Match.OneOf(Array, [Object]));
    let variant = _.clone(product);
    variant.ancestors = [productId];
    variant.price = product.price.max;
    variant.functionalType = 'bundleVariant';
    variant.type = 'variant';
    variant.shopId = Reaction.getShopId();
    variant.inventoryManagement = false;
    if (rentalPriceBuckets.length > 0) {
      variant.rentalPriceBuckets = rentalPriceBuckets;
    }
    let variantId = Products.insert(variant, {selector: {type: 'variant'}});
    Logger.info('Bundle Variant ' + variantId + ' was successfully created.');
  },
  'productBundles/createBundleProduct': function (product, hashtags, rentalPriceBuckets, metafields) {
    check(product, {
      title: String,
      pageTitle: String,
      description: String,
      handle: String,
      vendor: String,
      productType: String,
      price: {
        max: Number,
        min: Number,
        range: String
      },
      gender: String,
      sku: String
    });
    check(rentalPriceBuckets, Match.OneOf(Array, [Object]));
    check(hashtags, [String]);
    check(metafields, Match.OneOf(Array, [Object]));
    let insertProduct = _.clone(product);
    insertProduct.functionalType = 'bundle';
    insertProduct.shopId = ReactionCore.getShopId();
    insertProduct.metafields = metafields;
    let productId = Products.insert(insertProduct, {selector: {type: 'simple'}});
    if (productId) {
      _.each(hashtags, function (hashtag) {
        Meteor.call('products/updateProductTags', productId, hashtag.trim(), null);
      });
      Logger.info('Bundle Product ' + productId + ' was successfully created.');
      Meteor.call('productBundles/createBundleVariant', productId, product, rentalPriceBuckets);
    }
  },
  'productBundles/addProductToBundle': function (bundleVariantId, productId, variantIds, label) {
    check(bundleVariantId, String);
    check(productId, String);
    check(variantIds, [Object]);
    check(label, Match.Optional(String));
    let product = {
      productId: productId,
      variantIds: variantIds
    };
    if (label) {
      product.label = label;
    }
    Products.update({
      _id: bundleVariantId
    }, {
      $addToSet: {
        bundleProducts: product
      }
    }, {
      selector: {
        type: 'variant'
      }
    });
  },
  'productBundles/deleteProduct': function (bundleVariantId, productId, index) {
    check(bundleVariantId, String);
    check(productId, String);
    check(index, Number);
    const productBundle = Products.findOne(bundleVariantId);
    if (productBundle) {
      const bundleProductOptions = productBundle.bundleProducts;
      if (bundleProductOptions[index].productId === productId) {
        bundleProductOptions.splice(index, 1);
        Products.update({
          _id: bundleVariantId
        }, {
          $set: {
            bundleProducts: bundleProductOptions
          }
        }, {
          selector: {
            type: 'variant'
          }
        });
      }
    }
  }
});
