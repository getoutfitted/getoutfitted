import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Reaction } from '/client/api';
import { Products } from '/lib/collections';
import './bundleEdit.html';

Template.productBundleEdit.onCreated(function () {
  this.autorun(() => {
    let orderId = Reaction.Router.getParam('_id');
    if (orderId) {
      this.subscribe('BundleProductAndVariants', orderId);
    }
  });
});

Template.productBundleEdit.helpers({
  bundleVariant: function () {
    if (ReactionRouter.getParam('_id')) {
      const bundleVariant = Products.findOne({
        shopId: Reaction.getShopId(),
        ancestors: Reaction.Router.getParam('_id')
      });
      Session.set('bundleVariant', bundleVariant._id);
      return bundleVariant;
    }
    return '';
  },
  productsAddedToBundle: function () {
    return this.bundleProducts && this.bundleProducts.length > 0;
  },
  productsInBundle: function () {
    return this.bundleProducts;
  },
  details: function (id, value) {
    let product = Products.findOne(id);
    if (product) {
      return product[value];
    }
    return 'Loading...';
  }
});

Template.productBundleEdit.events({
  'click .deleteBundle': function (event) {
    event.preventDefault();
    let bundleId = ReactionRouter.getParam('_id');
    Meteor.call('products/deleteProduct', bundleId);
    ReactionRouter.go('productBundles');
  },
  'click .deleteProduct': function (event) {
    event.preventDefault();
    const productId = event.target.dataset.productId;
    const index = parseInt(event.target.dataset.index, 10);
    const bundleId = Session.get('bundleVariant');
    Meteor.call('productBundles/deleteProduct', bundleId, productId, index);
  }
});


Template.addProductsToBundle.onCreated(function () {
  this.subscribe('ProductsForBundles');
});

Template.addProductsToBundle.onRendered(function () {
  Session.setDefault('productSelected', false);
  Session.set('productSelected');
});

Template.addProductsToBundle.helpers({
  allTopProducts: function () {
    return Products.find({
      shopId: Reaction.getShopId(),
      type: 'simple',
      ancestors: [],
      functionalType: { $ne: 'bundle'}
    }).fetch();
  },
  allVariantsForSelectedProduct: function () {
    let productId = Session.get('productToAddToBundle');
    return Products.find({
      shopId: Reaction.getShopId(),
      type: 'variant',
      color: {$exists: true},
      size: {$exists: true},
      ancestors: productId,
      functionalType: { $ne: 'bundleVariant'}
    }).fetch();
  },
  productSelected: function () {
    return Session.get('productSelected');
  }
});

Template.addProductsToBundle.events({
  'change #selectProduct': function (event) {
    event.preventDefault();
    let productId = event.target.value;
    Session.set('productSelected', true);
    Session.set('productToAddToBundle', productId);
  },
  'submit #addProductToBundleForm': function (event) {
    event.preventDefault();
    let variantIds = [];
    let bundleVariantId = event.target.dataset.bundleId;
    let productId = event.target.selectedProduct.value;
    let label = event.target.itemLabel.value;
    _.each(event.target, function (target) {
      if (target.type === 'checkbox' && target.checked) {
        let variantInfo = {};
        variantInfo.variantId = target.value;
        variantInfo.label = event.target[target.value].value;
        variantIds.push(variantInfo);
      }
    });
    if (variantIds.length > 0) {
      Meteor.call('productBundles/addProductToBundle',
                  bundleVariantId,
                  productId,
                  variantIds,
                  label
      );
      Alerts.removeSeen();
      Alerts.add('Successfully added product to Bundle.', 'success', {
                  autoHide: true});
    } else {
      Alerts.removeSeen();
      Alerts.add('You must check at least ONE variant!.', 'danger', {
                  autoHide: true});
    }
    Session.set('productSelected', false);
    Session.set('productToAddToBundle', undefined);
  }
});
