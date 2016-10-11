import { $ } from "meteor/jquery";
import { ReactionProduct } from "/lib/api";
import { Cart, Products } from "/lib/collections";
import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";
import { InventoryVariants } from "/imports/plugins/custom/reaction-rental-products/lib/collections";
import _ from "lodash";
// import { Logger } from "/client/api";

function stickyWidget() {
  const bubbleTop = 75; // This must be set identically to the CSS bubble;
  const titleRibbonHeight = 200; // This is the desired height of the section that includes the title and vendor image.
  const $variantWidget = $("#variantWidget");
  const $pricingAnchor = $("#description");
  const width = parseInt($variantWidget.outerWidth(), 10) + "px";
  const left = parseInt($variantWidget.offset().left, 10) + "px";

  const verticalOffset = $variantWidget.outerHeight() - titleRibbonHeight + 141;
  if (verticalOffset > 115) {
    $variantWidget.css("margin-bottom", `-${verticalOffset}px`);
  }

  function adjustPosition() {
    const anchorTop = $pricingAnchor.offset().top - bubbleTop;
    const scrollTop = $(window).scrollTop();
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
  const product = ReactionProduct.selectedProduct();
  const variant = ReactionProduct.selectedVariant();
  // const props = ReactionAnalytics.getProductTrackingProps(product, variant);
  // ReactionAnalytics.trackEventWhenReady("Viewed Product", props);
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
    const cart = Cart.findOne({userId: Meteor.userId()});
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
                      It appears that the product you are browsing is not available for your selected rental dates.
                      <br /><br />Please <a href="/catalog">try another product</a>.`
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
    const cart = Cart.findOne({userId: Meteor.userId()});
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
  },
  filteredProductVariantTitle() {
    const current = ReactionProduct.selectedVariant();
    const productTitle = this.productTitle || Template.parentData().productTitle || this.title;
    const vendor = this.vendor || Template.parentData().vendor;
    const title = `${vendor}
                 ${productTitle}
                 ${current.gender}
                 ${current.color}
                 ${current.size}`;
    return title.replace(/(?:One|No)\s+(?:Color|Size|Option)/ig, "")
      .replace(/undefined/ig, "")
      .replace(/unisex/ig, "")
      .replace(/\s+/g, " ");
  }
});

Template.bundleVariantWidget.onRendered(function () {
  if (window.innerWidth > 767) {
    stickyWidget();
  }
  const product = ReactionProduct.selectedProduct();
  const variant = ReactionProduct.selectedVariant();
  // const props = ReactionAnalytics.getProductTrackingProps(product, variant);
  // ReactionAnalytics.trackEventWhenReady("Viewed Product", props);
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
    const variants = ReactionProduct.getVariants(this._id);
    if (variants) {
      return variants[0];
    }
    return "";
  },
  reservation: () => {
    const current = ReactionProduct.selectedVariant();
    const reservationLength = Session.get("reservationLength");
    const cart = Cart.findOne({userId: Meteor.userId()});

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
                      It appears that the product you are browsing is not available for your selected rental dates.
                      <br /><br />Please <a href="/catalog">try another product</a>.`
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
    const cart = Cart.findOne({userId: Meteor.userId()});
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

// Template.bundleVariantOptions.onCreated(function () {
//   Tracker.autorun(() => {
//     const selectedOptions = Session.get("selectedBundleOptions");
//     if (selectedOptions) {
//       this.subscribe("bundleReservationStatus", selectedOptions);
//     }
//   });
//   this.subscribe("productTypeAndTitle");
// });

Template.bundleVariantOptions.onRendered(function () {
  const cart = Cart.findOne({userId: Meteor.userId()});
  let start;
  let end;
  if (cart.startTime) {
    if (cart.startTime.getDate() <= 7) {
      start = moment(cart.startTime).startOf("month").subtract(10, "days").toDate();
    } else {
      start = moment(cart.startTime).startOf("month").subtract(6, "days").toDate();
    }
  } else {
    // start with today + 5
    start = moment().add(5, "days").toDate();
  }
  if (cart.endTime) {
    if (cart.endTime.getDate() >= 24) {
      end = moment(cart.endTime).endOf("month").add(10, "days").toDate();
    } else {
      end = moment(cart.endTime).endOf("month").add(6, "days").toDate();
    }
  } else {
    end = moment().add(1, "month").add(5, "days").toDate();
  }

  const selectedOptions = Session.get("selectedBundleOptions");
  const instance = this;
  if (selectedOptions) {
    // Subscribes to variantReservationStatus for each variant that is currently
    // a selected option. This returns
    selectedOptions.forEach(function (variantId) {
      const subExists = InventoryVariants.findOne({productId: variantId});
      if (!subExists) {
        // console.log(`subscribing to: ${variantId}`);
        instance.subscribe("variantReservationStatus", {start: start, end: end}, variantId);
      }
    });
  }
  // this.subscribe("bundleReservationStatus", selectedOptions);

  // XXX: Removed subscription to all products type and title as we now use this.label
  // Builds a flat array of all variantIds associated with this bundle
  // const componentVariantIds = this.data.bundleProducts.map(p => p.variantIds.map(v => v.variantId)).reduce((a, b) => a.concat(b), []);
  // this.subscribe("productTypeAndTitle", componentVariantIds);

  // Tracker.autorun(function () {
  //   console.log("selectedOptions", selectedOptions);
  //   console.log("inventoryVariants", _.countBy(_.map(InventoryVariants.find().fetch(), 'productId')));
  // });
});

Template.bundleVariantOptions.helpers({
  bundleOptions: function () {
    return this.bundleProducts;
  },
  displayLabel: function () {
    if (this.label) {
      return this.label;
    }
    // XXX: Removed in favor of always using this.label
    // Perhaps we can eliminate that publication now as well?
    // let product = Products.findOne(this.productId);
    // if (product) {
    //   return product.productType || product.title;
    // }
    return "Option";
  },
  variantDisplay: function () {
    if (this.label) {
      return this.label;
    }
    let variantProduct = Products.findOne(this.variantId);
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
