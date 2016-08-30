import { Meteor } from 'meteor/meteor';
import { MethodHooks } from '/server/api';
import { Cart } from '/lib/collections';
import { _ } from 'meteor/underscore';


/**
 * Before Copy CartToOrder
 * @summary this method occurs after payment, turns selected bundled variants into items so that we can perform inventory check
 * This hook, loops throgh items looking for BundleVariants which has a field of selectedBundleOptions
 * It then looks at QTY since in cart products have multiple QTY
 * then adds items to cart, with special flags to identify as part of a bundle and which ones are grouped together.
 * @return {Options} same thing we started with, so that other hooks can occur
 */
MethodHooks.before('cart/copyCartToOrder', function (options) {
  const cart = Cart.findOne(options.arguments[0]);
  if (cart) {
    _.each(cart.items, function (item) {
      if (item.variants.functionalType === 'bundleVariant') {
        let quantityRange = _.range(1, item.quantity + 1);
        _.each(quantityRange, function (itemQty) {
          let chosen = _.find(item.variants.selectedBundleOptions, function (option) {
            return option.selectionForQtyNumber === itemQty;
          });
          let chosenVariants = _.where(item.variants.selectedBundleOptions, {selectionForQtyNumber: itemQty});
          _.each(chosenVariants, function (chosenOption) {
            Meteor.call('productBundler/addBundleItemToCart',
                        chosenOption.productId,
                        chosenOption.variantId,
                        item.productId,
                        itemQty
            );
          });
        });
      }
    });
  }
  return options;
});
