const $ = require("jquery");
// load modules
require("jquery-ui");
function stickyWidget() {
  const bubbleTop = 75; // This must be set identically to the CSS bubble;
  let $variantWidget = $("#variantWidget");
  let $pricingAnchor = $("#description");
  let width = parseInt($variantWidget.outerWidth(), 10) + "px";
  let left = parseInt($variantWidget.offset().left, 10) + "px";

  function adjustPosition() {
    let anchorTop = $pricingAnchor.offset().top - bubbleTop;
    let scrollTop = $(window).scrollTop();
    if (scrollTop > anchorTop && $variantWidget.css("position") !== "fixed" ||
    scrollTop > anchorTop && scrollTop > bubbleTop && $variantWidget.css("position") !== "fixed") {
      $variantWidget.addClass("sticky");
      $variantWidget.css({
        left: left,
        width: width
      });
    } else if ($variantWidget.css("position") === "fixed") {
      if (scrollTop < 2 * bubbleTop) {
        $variantWidget.removeClass("sticky");
        $variantWidget.css({
          left: "",
          width: ""
        });
      }
    }
  }

  $(window).scroll(adjustPosition);
  adjustPosition();
}

Template.variantWidget.onRendered(function () {
  if(window.innerWidth > 767) {
    stickyWidget();
  }
});

Template.variantWidget.helpers({
  rentalProduct: function () {
    return this.functionalType === "rental";
  },
  actualPrice: function () {
    const current = ReactionProduct.selectedVariant();
    if (typeof current === "object") {
      const childVariants = ReactionProduct.getVariants(current._id);
      if (childVariants.length === 0) {
        return current.price;
      }
      return ReactionProduct.getProductPriceRange().range;
    }
    return undefined;
  },
  reservation: () => {
    const current = ReactionProduct.selectedVariant();
    const reservationLength = Session.get("reservationLength");
    if (typeof current === "object") {
      const childVariants = ReactionProduct.getVariants(current._id);
      if (childVariants.length === 0 && current.functionalType === "rentalVariant") {
        let selectedReservation = _.find(current.rentalPriceBuckets, function (priceBucket) {
          return priceBucket.duration === reservationLength + 1;
        });
        if (selectedReservation) {
          return selectedReservation;
        }
        if (current.rentalPriceBuckets) {
          return current.rentalPriceBuckets[0];
        }
      }
    }
    return {};
  }
});

Template.bundleVariantWidget.onRendered(function () {
  if (window.innerWidth > 767) {
    stickyWidget();
  }
});

Template.bundleVariantWidget.helpers({
  bundleProduct: function () {
    return this.functionalType === "bundle";
  },
  actualPrice: function () {
    const current = ReactionProduct.selectedVariant();
    if (typeof current === "object") {
      const childVariants = ReactionProduct.getVariants(current._id);
      if (childVariants.length === 0) {
        return current.price;
      }
      return ReactionProduct.getProductPriceRange().range;
    }
    return undefined;
  },
  bundleVariant: function () {
    const variants = ReactionCore.getVariants(this._id);
    if (variants) {
      return variants[0];
    }
    return "";
  },
  reservation: () => {
    const current = ReactionProduct.selectedVariant();
    const reservationLength = Session.get("reservationLength");
    if (typeof current === "object" && reservationLength) {
      const childVariants = ReactionProduct.getVariants(current._id);
      if (childVariants.length === 0 && current.functionalType === "bundleVariant") {
        let selectedReservation = _.find(current.rentalPriceBuckets, function (priceBucket) {
          return priceBucket.duration === reservationLength + 1;
        });
        if (selectedReservation) {
          return selectedReservation;
        }
        if (current.rentalPriceBuckets) {
          return current.rentalPriceBuckets[0];
        }
      }
    }
    return {};
  }
});

Template.bundleVariantWidget.events({
  "click #bundle-add-to-cart": function (event, template) {
    let productId;
    let qtyField;
    let quantity;
    let currentVariant = ReactionProduct.selectedVariant();
    let currentProduct = ReactionProduct.selectedProduct();
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
            function (error, result) {
              if (error) {
                ReactionCore.Log.error("Failed to add to cart.", error);
                return error;
              } else {
                Meteor.call("productBundler/updateCartItems",
                      productId,
                      currentVariant._id,
                      Session.get("selectedBundleOptions")
                      );
              }
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
  }
});

Template.bundleVariantOptions.onCreated(function () {
  Tracker.autorun(() => {
    let selectedOptions = Session.get("selectedBundleOptions");
    this.subscribe("bundleReservationStatus", selectedOptions);
    this.subscribe("productTypeAndTitle");
  });
  this.subscribe("productTypeAndTitle");
});

Template.bundleVariantOptions.helpers({
  bundleOptions: function () {
    return this.bundleProducts;
  },
  displayLabel: function () {
    if (this.label) {
      return this.label;
    }
    let product = ReactionCore.Collections.Products.findOne(this.productId);
    if (product) {
      return product.productType || product.title;
    }
    return 'Option';
  },
  variantDisplay: function () {
    if (this.label) {
      return this.label;
    }
    let variantProduct = ReactionCore.Collections.Products.findOne(this.variantId);
    if (variantProduct) {
      return variantProduct.size + "-" + variantProductvariant.color;
    }
    return _id;
  }
});

Template.bundleVariantOptions.events({
  "change select.selectedProduct": function (event) {
    const index = event.target.dataset.index;
    const selectedVariant = event.target.value;
    let selectedBundleVariants = Session.get("selectedBundleOptions");
    selectedBundleVariants[index] = selectedVariant;
    Session.set("selectedBundleOptions", selectedBundleVariants);
  }
});
