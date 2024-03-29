import { $ } from "meteor/jquery";
import { Reaction } from "/client/api";
import { ReactionProduct } from "/lib/api";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
// load modules
// require("jquery-ui/sortable");
// import "jquery-ui";

/**
 * goVariant helpers
 */

Template.goVariant.helpers({
  progressBar: function () {
    if (this.inventoryPercentage <= 10) {
      return "progress-bar-danger";
    } else if (this.inventoryPercentage <= 30) {
      return "progress-bar-warning";
    }
    return "progress-bar-success";
  },
  selectedVariant: function () {
    const _id = this._id;
    const current = ReactionProduct.selectedVariant();
    if (typeof current === "object" &&
      (_id === current._id || ~current.ancestors.indexOf(this._id))) {
      return "variant-detail-selected";
    }
  },
  displayQuantity: function () {
    // console.log(this);
    return ReactionProduct.getVariantQuantity(this);
  },
  displayPrice: function () {
    return ReactionProduct.getVariantPriceRange(this._id);
  },
  isSoldOut: function () {
    return ReactionProduct.getVariantQuantity(this) < 1;
  }
});

/**
 * goVariant events
 */

Template.goVariant.events({
  "click .variant-edit": function () {
    ReactionProduct.setCurrentVariant(this._id);
    return toggleSession("variant-form-" + this._id);
  },
  "dblclick .variant-detail": function () {
    if (Reaction.hasPermission("createProduct")) {
      ReactionProduct.setCurrentVariant(this._id);
      return toggleSession("variant-form-" + this._id);
    }
  },
  "click .variant-detail > *": function (event) {
    event.preventDefault();
    event.stopPropagation();
    Alerts.removeSeen();
    return ReactionProduct.setCurrentVariant(this._id);
  }
});

/**
 * goVariant onRendered
 */

Template.goVariant.onRendered(function () {
  return this.autorun(function () {
    let variantSort;
    if (Reaction.hasPermission("createProduct")) {
      variantSort = $(".variant-list");
      return variantSort.sortable({
        items: "> li.variant-list-item",
        cursor: "move",
        opacity: 0.3,
        helper: "clone",
        placeholder: "variant-sortable",
        forcePlaceholderSize: true,
        axis: "y",
        update: function () {
          const uiPositions = $(this).sortable("toArray", {
            attribute: "data-id"
          });
          Meteor.defer(function () {
            Meteor.call("products/updateVariantsPosition", uiPositions);
          });
        },
        start: function (event, ui) {
          ui.placeholder.height(ui.helper.height());
          ui.placeholder.html("Drop variant to reorder");
          ui.placeholder.css("padding-top", ui.helper.height() /
            3);
          ui.placeholder.css("border", "1px dashed #ccc");
          return ui.placeholder.css("border-radius", "6px");
        }
      });
    }
  });
});

Template.goVariantOption.helpers({
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
