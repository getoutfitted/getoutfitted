import { $ } from "meteor/jquery";
import { ReactiveDict } from "meteor/reactive-dict";
import { Reaction, i18next, Logger } from "/client/api";
import { ReactionProduct } from "/lib/api";
import { Cart, Tags } from "/lib/collections";
import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";
import _ from "lodash";

// import { ReactionAnalytics } from "some/analtyics/module";
// load modules
require("jquery-ui");

Template.goProductDetail.onCreated(function () {
  Session.setDefault("productManagementPanelVisibility", true);
  this.state = new ReactiveDict();
  this.state.setDefault({
    product: {},
    tags: []
  });
  this.subscribe("Tags");
  this.productId = () => Reaction.Router.getParam("handle");
  this.variantId = () => Reaction.Router.getParam("variantId");
  this.autorun(() => {
    if (this.productId()) {
      this.subscribe("Product", this.productId());
    }
  });

  this.autorun(() => {
    if (this.subscriptionsReady()) {
      // Get the product
      const product = ReactionProduct.setProduct(this.productId(), this.variantId());
      this.state.set("product", product);

      if (Reaction.hasPermission("createProduct")) {
        if (!Reaction.getActionView() && Reaction.isActionViewOpen() === true) {
          Reaction.setActionView({
            template: "productDetailForm",
            data: product
          });
        }
      }

      // Get the product tags
      if (product) {
        if (_.isArray(product.hashtags)) {
          const tags = _.map(product.hashtags, function (id) {
            return Tags.findOne(id);
          });

          this.state.set("tags", tags);
        }
      }
    }
  });
});


/**
 * productDetail helpers
 * see helper/product.js for
 * product data source
 */
Template.goProductDetail.helpers({
  tagListProps() {
    const instance = Template.instance();
    const product = instance.state.get("product") || {};
    const tags = instance.state.get("tags");
    const productId = product._id;
    const canEdit = Reaction.hasPermission("createProduct");

    return {
      tags,
      isEditing: canEdit,
      controls: [
        {
          type: "button",
          icon: "bookmark-o",
          onIcon: "bookmark",
          toggle: true,
          toggleOn(tag) {
            const handle = product.handle;
            if (Reaction.getSlug(handle) === tag.slug) {
              return true;
            }
            return false;
          },
          onClick(event, tag) {
            Meteor.call("products/setHandleTag", productId, tag._id,
              function (error, result) {
                if (result) {
                  return Reaction.Router.go("product", {
                    handle: result
                  });
                }
                return null;
              });
          }
        }
      ],
      onTagCreate(tagName) {
        Meteor.call("products/updateProductTags", productId, tagName, null,
          function (error) {
            if (error) {
              Alerts.toast("Tag already exists, duplicate add failed.", "error");
            }
          });
      },
      onTagRemove(tag) {
        Meteor.call("products/removeProductTag", productId, tag._id,
          function (error) {
            if (error) {
              Alerts.toast("Tag already exists, duplicate add failed.", "error");
            }
          });
      },
      onTagSort(tagIds) {
        Meteor.call("products/updateProductField", productId, "hashtags", _.uniq(tagIds));
      },
      onTagUpdate(tagId, tagName) {
        Meteor.call("products/updateProductTags", productId, tagName, tagId,
          function (error) {
            if (error) {
              Alerts.toast("Tag already exists, duplicate add failed.", "error");
            }
          });
      }
    };
  },
  SocialEditButton() {
    return {
      component: EditButton,
      toggleOn: Reaction.getActionView().template === "productDetailSocialForm" && Reaction.isActionViewOpen(),
      onClick() {
        if (Reaction.hasPermission("createProduct")) {
          Reaction.showActionView({
            label: "Social",
            i18nKeyLabel: "social.socialTitle",
            template: "productDetailSocialForm"
          });
        }
      }
    };
  },
  product: function () {
    const instance = Template.instance();
    if (instance.subscriptionsReady()) {
      return ReactionProduct.setProduct(instance.productId(),
        instance.variantId());
    }
  },
  tags: function () {
    let product = ReactionProduct.selectedProduct();
    if (product) {
      if (product.hashtags) {
        return _.map(product.hashtags, function (id) {
          return Tags.findOne(id);
        });
      }
    }
  },
  tagsComponent: function () {
    if (Reaction.hasPermission("createProduct")) {
      return Template.goProductTagInputForm;
    }
    return Template.goProductDetailTags;
  },
  metaComponent: function () {
    if (Reaction.hasPermission("createProduct")) {
      return Template.productMetaFieldForm;
    }
    return Template.productMetaField;
  },
  actualPrice: function () {
    const current = ReactionProduct.selectedVariant();
    if (typeof current === "object") {
      const childVariants = ReactionProduct.getVariants(current._id);
      // when top variant has no child variants we display only its price
      if (childVariants.length === 0) {
        return current.price;
      }
      // otherwise we want to show child variants price range
      return ReactionProduct.getVariantPriceRange();
    }
  },
  fieldComponent: function () {
    if (Reaction.hasPermission("createProduct")) {
      return Template.goProductDetailEdit;
    }
    return Template.goProductDetailField;
  },
  goFeatureComponent: function () {
    this.featureKey = "feature";
    if (Reaction.hasPermission("createProduct")) {
      return Template.goProductFeatureFieldForm;
    }
    return Template.goProductFeatureField;
  },
  productIconComponent: function () {
    this.featureKey = "productIcon";
    if (Reaction.hasPermission("createProduct")) {
      return Template.goProductFeatureFieldForm;
    }
    return Template.goProductFeatureImageField;
  },
  productManagementPanelVisibility: function () {
    if (Session.get("productManagementPanelVisibility")) {
      return "";
    }
    return "hidden";
  },
  productManagementPanelButtonVisibility: function () {
    if (!Session.get("productManagementPanelVisibility")) {
      return "";
    }
    return "hidden";
  },
  widget: function () {
    if (this.functionalType === "bundle") {
      return "bundleVariantWidget";
    }
    return "variantWidget";
  },
  productHasEmailList: function () {
    if (this.emailListId) {
      return true;
    }
    return false;
  }
});

/**
 * productDetail events
 */

Template.goProductDetail.events({
  "click #toggleAdminPanelVisibilityOff": function () {
    Session.set("productManagementPanelVisibility", false);
  },
  "click #toggleAdminPanelVisibilityOn": function () {
    Session.set("productManagementPanelVisibility", true);
  },
  "click #price": function () {
    let formName;
    if (Reaction.hasPermission("createProduct")) {
      let variant = ReactionProduct.selectedVariant();
      if (!variant) {
        return;
      }

      if (typeof variant.ancestors[1] === "string") {
        formName = variant.ancestors[1];
      } else {
        formName = variant._id;
      }

      formName = "variant-form-" + formName;
      Session.set(formName, true);
      $(`#${formName}[name="price"]`).focus();
    }
  },
  "click #add-to-cart-quantity": function (event) {
    event.preventDefault();
    return event.stopPropagation();
  },
  "change #add-to-cart-quantity": function (event, template) {
    let currentVariant;
    let qtyField;
    let quantity;
    event.preventDefault();
    event.stopPropagation();
    currentVariant = ReactionProduct.selectedVariant();
    if (currentVariant) {
      qtyField = template.$('input[name="addToCartQty"]');
      quantity = qtyField.val();
      if (quantity < 1) {
        quantity = 1;
      }
      if (currentVariant.inventoryManagement && quantity > currentVariant.inventoryQuantity) {
        qtyField.val(currentVariant.inventoryQuantity);
      }
    }
  },
  "click #add-to-cart": function (event, template) {
    let productId;
    let qtyField;
    let quantity;
    let currentVariant = ReactionProduct.selectedVariant();
    let currentProduct = ReactionProduct.selectedProduct();

    let cart = Cart.findOne({userId: Meteor.userId() });
    if (!cart.startTime && this.functionalType === "rental") {
      Alerts.inline("Please select an arrival date before booking", "error", {
        placement: "datepicker",
        autoHide: 10000
      });
      return [];
    }

    if (currentVariant) {
      if (currentVariant.ancestors.length === 1) {
        const options = ReactionProduct.getVariants(currentVariant._id);

        if (options.length > 0) {
          Alerts.inline("Please choose options before adding to cart", "warning", {
            placement: "productDetail",
            i18nKey: "productDetail.chooseOptions",
            autoHide: 10000
          });
          return [];
        }
      }

      if (currentVariant.inventoryPolicy && currentVariant.inventoryQuantity < 1) {
        Alerts.inline("Sorry, this item is out of stock!", "warning", {
          placement: "productDetail",
          i18nKey: "productDetail.outOfStock",
          autoHide: 10000
        });
        return [];
      }

      qtyField = template.$('input[name="addToCartQty"]');
      quantity = parseInt(qtyField.val(), 10);

      if (quantity < 1) {
        quantity = 1;
      }

      if (!this.isVisible) {
        Alerts.inline("Publish product before adding to cart.", "error", {
          placement: "productDetail",
          i18nKey: "productDetail.publishFirst",
          autoHide: 10000
        });
      } else {
        productId = currentProduct._id;

        if (productId) {
          Meteor.call("cart/addToCart", productId, currentVariant._id, quantity,
            function (error) {
              if (error) {
                ReactionCore.Log.error("Failed to add to cart.", error);
                return error;
              }
              // TODO: Re-add analytics tracking
              // let trackReadyProduct = ReactionAnalytics.getProductTrackingProps(currentProduct, currentVariant);
              // trackReadyProduct.quantity = quantity;
              // trackReadyProduct["Reservation Start"] = cart.startTime;
              // trackReadyProduct["Reservation End"] = cart.endTime;
              // trackReadyProduct["Reservation Length"] = cart.rentalDays;
              // return ReactionAnalytics.trackEventWhenReady("Added Product", trackReadyProduct);
            }
          );
        }

        template.$(".variant-select-option").removeClass("active");
        // XXX: GETOUTFITTED MOD - Remove set current variant to null
        qtyField.val(1);
        // scroll to top on cart add
        $("html,body").animate({
          scrollTop: 0
        }, 0);
        // slide out label
        let addToCartText = i18next.t("productDetail.addedToCart");
        let addToCartTitle = currentProduct.title || "";
        if (currentVariant && currentVariant.size && currentVariant.color) {
          addToCartTitle = addToCartTitle + ` ${currentVariant.size} ${currentVariant.color}`;
        }

        $(".cart-alert-text").text(`${quantity} ${addToCartTitle} ${addToCartText}`);
        return $(".cart-alert").toggle("slide", {
          direction: i18next.t("languageDirection") === "rtl" ? "left" : "right",
          width: currentVariant.title.length + 50 + "px"
        }, 600).delay(4000).toggle("slide", {
          direction: i18next.t("languageDirection") === "rtl" ? "left" : "right"
        });
      }
    } else {
      Alerts.inline("Select an option before adding to cart", "warning", {
        placement: "productDetail",
        i18nKey: "productDetail.selectOption",
        autoHide: 8000
      });
    }
  },
  "click .toggle-product-isVisible-link": function (event, template) {
    let errorMsg = "";
    const self = this;
    if (!self.title) {
      errorMsg += `${i18next.t("error.isRequired", { field: i18next.t("productDetailEdit.title") })} `;
      template.$(".title-edit-input").focus();
    }
    const variants = ReactionProduct.getVariants(self._id);
    variants.forEach((variant, index) => {
      if (!variant.title) {
        errorMsg +=
          `${i18next.t("error.variantFieldIsRequired", { field: i18next.t("productVariant.title"), number: index + 1 })} `;
      }
      // if top variant has children, it is not necessary to check its price
      if (variant.ancestors.length === 1 && !ReactionProduct.checkChildVariants(variant._id) ||
        variant.ancestors.length !== 1) {
        if (!variant.price) {
          errorMsg +=
            `${i18next.t("error.variantFieldIsRequired", { field: i18next.t("productVariant.price"), number: index + 1 })} `;
        }
      }
    });
    if (errorMsg.length > 0) {
      Alerts.inline(errorMsg, "warning", {
        placement: "productManagement",
        i18nKey: "productDetail.errorMsg"
      });
    } else {
      Meteor.call("products/publishProduct", self._id, function (error) {
        if (error) {
          return Alerts.inline(error.reason, "error", {
            placement: "productManagement",
            id: self._id,
            i18nKey: "productDetail.errorMsg"
          });
        }
      });
    }
  },
  "click .delete-product-link": function () {
    ReactionProduct.maybeDeleteProduct(this);
  },
  "click .fa-facebook": function () {
    if (ReactionCore.hasPermission("createProduct")) {
      $(".facebookMsg-edit").fadeIn();
      return $(".facebookMsg-edit-input").focus();
    }
  },
  "click .fa-twitter": function () {
    if (ReactionCore.hasPermission("createProduct")) {
      $(".twitterMsg-edit").fadeIn();
      return $(".twitterMsg-edit-input").focus();
    }
  },
  "click .fa-pinterest": function () {
    if (ReactionCore.hasPermission("createProduct")) {
      $(".pinterestMsg-edit").fadeIn();
      return $(".pinterestMsg-edit-input").focus();
    }
  },
  "click .fa-google-plus": function () {
    if (ReactionCore.hasPermission("createProduct")) {
      $(".googleplusMsg-edit").fadeIn();
      return $(".googleplusMsg-edit-input").focus();
    }
  },
  "focusout .facebookMsg-edit-input,.twitterMsg-edit-input,.pinterestMsg-edit-input,.googleplusMsg-edit": function () {
    Session.set("editing-" + this.field, false);
    return $(".social-media-inputs > *").hide();
  }
});

Template.goProductFeatures.helpers({
  includedComponent: function () {
    this.featureKey = "included";
    if (Reaction.hasPermission("createProduct")) {
      return Template.goProductIncludedFieldForm;
    }
    return Template.goProductIncludedField;
  }
});

// Template.emailListForm.events({
//   "submit .subscribeToEmailList": function (event) {
//     event.preventDefault();
//     const email = event.target.subscribeEmail.value;
//     const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
//     if (emailRegex.test(email)) {
//       const productId = ReactionProduct.selectedProductId();
//       Klaviyo.addUserToList(productId, email);
//       event.target.subscribeEmail.value = "";
//       Alerts.removeSeen();
//       Alerts.inline(`${email} was successfully subscribed.`,
//         "success",
//         {
//           autoHide: 3000,
//           placement: "emailSubscriptions"
//         });
//     } else {
//       Alerts.removeSeen();
//       Alerts.inline(`${email} is not a valid email. Please enter a valid email to subscribe.`,
//         "danger",
//         {
//           autoHide: 3000,
//           placement: "emailSubscriptions"
//       });
//     }
//   }
// });
