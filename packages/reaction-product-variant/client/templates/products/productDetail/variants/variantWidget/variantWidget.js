const $ = require("jquery");
// load modules
require("jquery-ui");
function stickyWidget() {
  const bubbleTop = 75; // This must be set identically to the CSS bubble;
  let $variantWidget = $("#variantWidget");
  let $pricingAnchor = $("#description");
  let width = parseInt($variantWidget.outerWidth(), 10) + "px";
  let left = parseInt($variantWidget.offset().left, 10) + "px";

  let verticalOffset = $variantWidget.outerHeight() - 250;
  if (verticalOffset > 115) {
    $variantWidget.css("margin-bottom", `-${verticalOffset}px`);
  }

  function adjustPosition() {
    let anchorTop = $pricingAnchor.offset().top - bubbleTop;
    let scrollTop = $(window).scrollTop();
    if (anchorTop === -20) {
      // Catch image not loaded yet.
    } else if (scrollTop > anchorTop && $variantWidget.css("position") !== "fixed" ||
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
  if (window.innerWidth > 767) {
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
    const cart = ReactionCore.Collections.Cart.findOne({userId: Meteor.userId()});
    let defaultReservationLength;
    if (typeof current === "object") {
      const childVariants = ReactionProduct.getVariants(current._id);
      if (childVariants.length === 0 && current.functionalType === "rentalVariant") {
        let selectedReservation = _.find(current.rentalPriceBuckets, function (priceBucket) {
          return priceBucket.duration === reservationLength + 1;
        });
        if (selectedReservation) {
          Session.set("compatibleReservationAvailable", {available: true, reason: "Available"});
          return selectedReservation;
        }
        // Setup default reservation length from current product default price bucket.
        if (current.rentalPriceBuckets && current.rentalPriceBuckets[0]) {
          defaultReservationLength = current.rentalPriceBuckets[0].duration - 1;
        }

        // Determine if product can be added to current cart/reservation.
        if (cart && cart.startTime && cart.endTime) {
          if (cart.items && cart.items.length > 0) {
            Session.set("compatibleReservationAvailable", {
              available: false,
              reason: `<strong>Oh no!</strong><br />
                      We apologize for the inconvinience! Currently we can't rent camping products and demo products at the same time right now.
                      <br /><br />Please either finish checking out with your current reservation and come back and book your demo
                      equipment separately or remove any items currently in your cart to book this item now.`
            });
            return {};
          }
          // reservation length is different than selected dates
          Session.set("reservationLength", defaultReservationLength);
          Meteor.call("rentalProducts/setRentalPeriod", cart._id, cart.startTime, moment(cart.startTime).add(defaultReservationLength, "days").toDate());
          Session.set("compatibleReservationAvailable", {available: true, reason: "Available"});
          return current.rentalPriceBuckets[0];
        } else if (cart && !cart.startTime && !cart.endTime) {
          if (defaultReservationLength) {
            Session.set("reservationLength", defaultReservationLength);
            Session.set("compatibleReservationAvailable", {available: true, reason: "Available"});
            return current.rentalPriceBuckets[0];
          }
        }

        if (current.rentalPriceBuckets) {
          return current.rentalPriceBuckets[0];
        }
      }
    }
    return {};
  },
  availableToBook: function () {
    const cart = ReactionCore.Collections.Cart.findOne({userId: Meteor.userId()});
    const compatibleReservationAvailable = Session.get("compatibleReservationAvailable");
    if (compatibleReservationAvailable) {
      return compatibleReservationAvailable.available || !cart.items || cart.items && cart.items.length === 0;
    }
    return true;
  },
  unavailableReason: function () {
    compatibleReservationAvailable = Session.get("compatibleReservationAvailable");
    if (compatibleReservationAvailable) {
      return compatibleReservationAvailable.reason;
    }
    return "";
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
    const cart = ReactionCore.Collections.Cart.findOne({userId: Meteor.userId()});

    if (typeof current === "object" && reservationLength) {
      const childVariants = ReactionProduct.getVariants(current._id);
      if (childVariants.length === 0 && current.functionalType === "bundleVariant") {
        let selectedReservation = _.find(current.rentalPriceBuckets, function (priceBucket) {
          return priceBucket.duration === reservationLength + 1;
        });
        if (selectedReservation) {
          Session.set("compatibleReservationAvailable", {available: true, reason: "Available"});
          return selectedReservation;
        }

        // Setup default reservation length from current product default price bucket.
        if (current.rentalPriceBuckets && current.rentalPriceBuckets[0]) {
          defaultReservationLength = current.rentalPriceBuckets[0].duration - 1;
        }

        // Determine if product can be added to current cart/reservation.
        if (cart && cart.startTime && cart.endTime) {
          if (cart.items && cart.items.length > 0) {
            Session.set("compatibleReservationAvailable", {
              available: false,
              reason: `<strong>Oh no!</strong><br />
                      We apologize for the inconvinience! Currently we can't rent camping products and demo products at the same time right now.
                      <br /><br />Please either finish checking out with your current reservation and come back and book your camping
                      equipment separately or remove any items currently in your cart to book this item now.`
            });
            return {};
          }
          // reservation length is different than selected dates
          Session.set("reservationLength", defaultReservationLength);
          Meteor.call("rentalProducts/setRentalPeriod", cart._id, cart.startTime, moment(cart.startTime).add(defaultReservationLength, "days").toDate());
          Session.set("compatibleReservationAvailable", {available: true, reason: "Available"});
          return current.rentalPriceBuckets[0];
        } else if (cart && !cart.startTime && !cart.endTime) {
          if (current.rentalPriceBuckets && current.rentalPriceBuckets[0]) {
            Session.set("reservationLength", current.rentalPriceBuckets[0].duration - 1);
            Session.set("compatibleReservationAvailable", {available: true, reason: "Available"});
            return current.rentalPriceBuckets[0];
          }
        }
        if (current.rentalPriceBuckets) {
          return current.rentalPriceBuckets[0];
        }
      }
    }
    return {};
  },
  availableToBook: function () {
    const cart = ReactionCore.Collections.Cart.findOne({userId: Meteor.userId()});
    const compatibleReservationAvailable = Session.get("compatibleReservationAvailable");
    if (compatibleReservationAvailable) {
      return compatibleReservationAvailable.available || !cart.items || cart.items && cart.items.length === 0;
    }
    return true;
  },
  unavailableReason: function () {
    compatibleReservationAvailable = Session.get("compatibleReservationAvailable");
    if (compatibleReservationAvailable) {
      return compatibleReservationAvailable.reason;
    }
    return "";
  }
});

Template.bundleVariantWidget.events({
  "click #bundle-add-to-cart": function (event, template) {
    let productId;
    let qtyField;
    let quantity;
    let currentVariant = ReactionProduct.selectedVariant();
    let currentProduct = ReactionProduct.selectedProduct();
    let cart = ReactionCore.Collections.Cart.findOne({userId: Meteor.userId() });
    if (!cart.startTime) {
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
            function (error, result) {
              if (error) {
                ReactionCore.Log.error("Failed to add to cart.", error);
                return error;
              }
              Meteor.call("productBundler/updateCartItems",
                productId,
                currentVariant._id,
                Session.get("selectedBundleOptions")
              );
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
    if (selectedOptions) {
      this.subscribe("bundleReservationStatus", selectedOptions);
    }
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
    return "Option";
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
  },
  hasOptions: function () {
    return this.variantIds.length > 1;
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

Template.bundleVariantDefaults.helpers({
  defaultOptions: function () {
    let defaultOptions = _.reduce(this.bundleProducts, function (bundles, bundle) {
      let id = bundle.variantIds[0].variantId;
      if (bundle.variantIds.length === 1) {
        if (bundles[id]) {
          bundles[id]["quantity"] += 1;
        } else {
          bundles[id] = {
            quantity: 1,
            title: `${bundle.label}`,
            option: `${bundle.variantIds[0].label}`
          };
        }
      }
      return bundles;
    }, {});

    return _.map(defaultOptions, function (val) {
      return val;
    });
  },
  moreThanOne: function (qty) {
    return qty > 1;
  }
});
