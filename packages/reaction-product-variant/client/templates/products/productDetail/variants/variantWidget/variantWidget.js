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
  showRentalLengthOptions: function () {
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
  bundleVariant: function () {
    const variants = ReactionCore.getVariants(this._id);
    if (variants) {
      return variants[0];
    }
    return "";
  }
});

Template.bundleVariantOptions.onCreated(function () {
  let bundleVariants = ReactionCore.Collections.Products.findOne({
    ancestors: {
      $size: 1
    }
  });
  // if (bundleVariants && bundleVariants.bundleProducts) {
  let defaultSelectedVariants = [];
  _.each(bundleVariants.bundleProducts, function (bundleOptions) {
    defaultSelectedVariants.push(bundleOptions.variantIds[0].variantId);
  });
  Session.setDefault("selectedBundleOptions", defaultSelectedVariants);
  Tracker.autorun(() => {
    let selectedOptions = Session.get("selectedBundleOptions");
    this.subscribe("bundleReservationStatus", selectedOptions);
  });
  // }
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
    return product.productType || product.title;
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
