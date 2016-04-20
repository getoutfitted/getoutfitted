/**
 * variantList helpers
 */
Template.variantList.helpers({
  variants: function () {
    let inventoryTotal = 0;
    const variants = ReactionProduct.getTopVariants();

    if (variants.length) {
      // calculate inventory total for all variants
      for (let variant of variants) {
        if (variant.inventoryManagement) {
          let qty = ReactionProduct.getVariantQuantity(variant);
          if (typeof qty === "number") {
            inventoryTotal += qty;
          }
        }
      }
      // calculate percentage of total inventory of this product
      for (let variant of variants) {
        let qty = ReactionProduct.getVariantQuantity(variant);
        variant.inventoryTotal = inventoryTotal;
        if (variant.inventoryManagement && inventoryTotal) {
          variant.inventoryPercentage = parseInt(qty / inventoryTotal * 100, 10);
        } else {
          // for cases when sellers doesn't use inventory we should always show
          // "green" progress bar
          variant.inventoryPercentage = 100;
        }
        if (variant.title) {
          variant.inventoryWidth = parseInt(variant.inventoryPercentage -
            variant.title.length, 10);
        } else {
          variant.inventoryWidth = 0;
        }
      }
      // sort variants in correct order
      variants.sort((a, b) => a.index - b.index);

      return variants;
    }
    return [];
  },
  showChoices: function (list) {
    // Should probably show fixed color for items that actually have a color
    // or for items that have multiple colors for some sizes
    return list && list.length > 1 ? "" : "hide";
  },
  variantOptionLabel: function () {
    const variants = ReactionProduct.getTopVariants();
    if (variants.length > 0) {
      if (variants[0].optionTitle) {
        return variants[0].optionTitle;
      }
    }
    return "Option";
  },
  childVariants: function () {
    const childVariants = [];
    const variants = ReactionProduct.getVariants();
    if (variants.length > 0) {
      const current = ReactionProduct.selectedVariant();

      if (! current) {
        return [];
      }

      if (current.ancestors.length === 1) {
        variants.map(variant => {
          if (typeof variant.ancestors[1] === "string" &&
            variant.ancestors[1] === current._id &&
            variant.optionTitle &&
            variant.type !== "inventory") {
            childVariants.push(variant);
          }
        });
      } else {
        // TODO not sure we need this part...
        variants.map(variant => {
          if (typeof variant.ancestors[1] === "string" &&
            variant.ancestors.length === current.ancestors.length &&
            variant.ancestors[1] === current.ancestors[1] &&
            variant.optionTitle
          ) {
            childVariants.push(variant);
          }
        });
      }
      return childVariants;
    }
  },
  childVariantOptionLabel: function () {
    const variants = ReactionProduct.getVariants();
    let optVariant;
    if (variants.length > 0) {
      const current = ReactionProduct.selectedVariant();
      if (!current) {
        return "Option";
      }
      if (current.ancestors.length === 1) {
        optVariant = _.find(variants, function (variant) {
          if (typeof variant.ancestors[1] === "string" &&
            variant.optionTitle &&
            variant.type !== "inventory"
          ) {
            return variant;
          }
          return undefined;
        });
      } else {
        optVariant = _.find(variants, function (variant) {
          if (typeof variant.ancestors[1] === "string" &&
            variant.ancestors.length === current.ancestors.length &&
            variant.ancestors[1] === current.ancestors[1] &&
            variant.optionTitle
          ) {
            return variant.optionTitle;
          }
          return undefined;
        });
      }
    }
    if (optVariant) {
      return optVariant.optionTitle;
    }
    return "Option";
  },
  isAvailable: function () {
    const inventoryManaged = this.inventoryManagement;
    const soldOut = ReactionProduct.getVariantQuantity(this) < 1;
    const availableForPurchase = !soldOut || !this.inventoryPolicy;
    const isAvailable = !inventoryManaged || availableForPurchase;
    return isAvailable ? "" : "disabled";
  },
  isSoldOut: function () {
    return ReactionProduct.getVariantQuantity(this) < 1;
  },
  displayPrice: function () {
    return ReactionProduct.getVariantPriceRange(this._id);
  }
});

/**
 * variantList events
 */

Template.variantList.events({
  "click #create-variant": function () {
    return Meteor.call("products/createVariant", this._id);
  },
  "click .variant-select-option": function (event, template) {
    template.$(".variant-select-option").removeClass("active");
    $(event.target).addClass("active");
    Alerts.removeSeen();
    return ReactionProduct.setCurrentVariant(this._id);
  },
  "change select": function (event) {
    const variantId = event.currentTarget.value;
    const childVariants = ReactionProduct.getVariants(variantId);
    if (childVariants.length > 0) {
      return ReactionProduct.setCurrentVariant(childVariants[0]._id);
    }
    return variantId;
  }
});

Template.variantList.onCreated(function () {
  
});

Template.variantList.onRendered(function () {
  const variants = ReactionProduct.getVariants(this.data._id);
  const firstChild = variants.find(function (variant) {
    return variant.ancestors.length === 2;
  });
  ReactionProduct.setCurrentVariant(firstChild._id);
});
