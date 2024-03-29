import { ReactionProduct } from "/lib/api";
import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";
/**
 * goVariantForm helpers
 */

Template.goVariantForm.helpers({
  variantDetails: function () {
    if (this.ancestors.length === 1) {
      return Template.parentVariantForm;
    }
    return Template.goChildVariantForm;
  },
  childVariants: function () {
    const _id = this._id;
    const variants = ReactionProduct.getVariants();
    const childVariants = [];
    variants.map(variant => {
      if (~variant.ancestors.indexOf(_id) && variant.type !== "inventory") {
        childVariants.push(variant);
      }
    });
    return childVariants;
  },
  hasChildVariants: function () {
    return ReactionProduct.checkChildVariants(this._id) > 0;
  },
  hasInventoryVariants: function () {
    if (!hasChildVariants()) {
      return ReactionProduct.checkInventoryVariants(this._id) > 0;
    }
  },
  nowDate: function () {
    return new Date();
  },
  variantFormId: function () {
    return "variant-form-" + this._id;
  },
  variantFormVisible: function () {
    if (!Session.equals("variant-form-" + this._id, true)) {
      return "hidden";
    }
  },
  displayInventoryManagement: function () {
    if (this.inventoryManagement !== true) {
      return "display:none;";
    }
  },
  displayLowInventoryWarning: function () {
    if (this.inventoryManagement !== true) {
      return "display:none;";
    }
  }
});

/**
 * goVariantForm events
 */

Template.goVariantForm.events({
  "change form :input": function (event, template) {
    let formId;
    formId = "#variant-form-" + template.data._id;
    template.$(formId).submit();
    ReactionProduct.setCurrentVariant(template.data._id);
  },
  "click .btn-child-variant-form": function (event, template) {
    let productId;
    event.stopPropagation();
    event.preventDefault();
    productId = ReactionProduct.selectedProductId();
    if (!productId) {
      return;
    }
    Meteor.call("products/createVariant", template.data._id);
  },
  "click .btn-remove-variant": function () {
    const title = this.title || i18next.t("productDetailEdit.thisVariant");
    if (confirm(i18next.t("productDetailEdit.removeVariantConfirm", { title }))) {
      const id = this._id;
      Meteor.call("products/deleteVariant", id, function (error, result) {
        if (result && ReactionProduct.selectedVariantId() === id) {
          return ReactionProduct.setCurrentVariant(null);
        }
      });
    }
  },
  "click .btn-clone-variant": function (event, template) {
    let productId;
    event.stopPropagation();
    event.preventDefault();
    productId = ReactionProduct.selectedProductId();
    if (!productId) {
      return;
    }
    Meteor.call("products/cloneVariant", productId, template.data._id,
      function (error, result) {
        return toggleSession("variant-form-" + result);
      });
  }
});
