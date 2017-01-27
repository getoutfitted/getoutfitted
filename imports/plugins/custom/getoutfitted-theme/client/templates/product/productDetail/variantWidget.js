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
  // const product = ReactionProduct.selectedProduct();
  // const variant = ReactionProduct.selectedVariant();
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

Template.bundleVariantWidget.onCreated(function () {
  const bundleVariants = Products.findOne({
    ancestors: {
      $size: 1
    }
  });
  const defaultSelectedVariants = [];
  this.autorun(function () {
    if (bundleVariants) {
      _.each(bundleVariants.bundleProducts, function (bundleOptions) {
        defaultSelectedVariants.push(bundleOptions.variantIds[0].variantId);
      });
      Session.set("selectedBundleOptions", defaultSelectedVariants);
    }
  });
});

Template.bundleVariantWidget.onRendered(function () {
  if (window.innerWidth > 767) {
    stickyWidget();
  }
  // const product = ReactionProduct.selectedProduct();
  // const variant = ReactionProduct.selectedVariant();
  // const props = ReactionAnalytics.getProductTrackingProps(product, variant);
  // ReactionAnalytics.trackEventWhenReady("Viewed Product", props);
});

Template.bundleVariantWidget.helpers({
  availableToBook() {
    return Session.get("goProductAvailable");
  },
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
  bundlePriceBucket() {
    const cart = Cart.findOne({userId: Meteor.userId()});
    const resLength = cart.rentalDays;
    const current = ReactionProduct.selectedVariant();
    if (!current || !current.rentalPriceBuckets) {
      throw new Meteor.Error("Current product error");
    }
    const priceBucket = current.rentalPriceBuckets.find(bucket => bucket.duration === resLength);
    if (!priceBucket) {
      throw new Meteor.Error("Price not found!");
    }
    return priceBucket;
  }
});

Template.bundleVariantOptions.onCreated(function () {
  const instance = this;
  instance.availability = new ReactiveVar();
});

Template.bundleVariantOptions.onRendered(function () {
  const cart = Cart.findOne({userId: Meteor.userId()});
  const current = ReactionProduct.selectedVariant();
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
        instance.subscribe("variantReservationStatus", {start: start, end: end}, variantId);
      }
    });
  }

  // Extract arrays of the componentIds
  variantIdsByComponent = this.data.bundleProducts.map(p => p.variantIds.map(v => v.variantId));

  // Builds a flat array of all variantIds associated with this bundle
  const componentVariantIds = variantIdsByComponent.reduce((ids, id) => ids.concat(id), []);

  // TODO: Reservation Request should take shipping time into account.
  let reservationRequest = {startTime: cart.startTime, endTime: cart.endTime};

  if (cart.shippingTime && cart.restockTime) {
    reservationRequest = {startTime: cart.shippingTime, endTime: cart.restockTime};
  }

  // Build object to hold variantIds + quantities that have already been added to cart. This allows us to take into account the number of items that are in the cart when showing availability.
  const cartItemReservations = cart.items
    .map(i => i.variants.selectedBundleOptions
    .map(b => b.variantId))
    .reduce((ids, id) => ids.concat(id), [])
    .reduce(function (ids, id) {
      if (ids[id]) {
        ids[id]++;
      } else {
        ids[id] = 1;
      }
      return ids;
    }, {});

  this.autorun(function () {
    Session.set("goCartItemReservations", cartItemReservations);
    Meteor.call("rentalProducts/bulkCheckInventoryAvailability", componentVariantIds, reservationRequest, function (error, result) {
      if (error) {
        Logger.warn("Error during rentalProducts/bulkCheckInventoryAvailability", error);
      } else {
        const selectedVariants = [];
        Session.set("goProductAvailable", true);
        instance.availability.set(result);
        variantIdsByComponent.forEach(function (component) {
          const defaultVariant = component.find(function (vId) {
            const numberInCart = cartItemReservations[vId] || 0;
            return (result[vId] - numberInCart) > 0;
          });
          if (defaultVariant) {
            selectedVariants.push(defaultVariant);
          } else {
            // bundle is not available because at least one component is sold out.
            Session.set("goProductAvailable", false);
          }
        });
        Session.set("selectedBundleOptions", selectedVariants);
      }
    });
  });
});

Template.bundleVariantOptions.helpers({
  bundleOptions: function () {
    return this.bundleProducts;
  },
  displayLabel: function () {
    if (this.label) {
      return this.label;
    }
    return "Option";
  },
  variantDisplay: function () {
    if (this.label) {
      return this.label;
    }
    const variantProduct = Products.findOne(this.variantId);
    if (variantProduct) {
      return variantProduct.size + "-" + variantProductvariant.color;
    }
    return _id;
  },
  hasOptions: function () {
    return this.variantIds.length > 1;
  },
  availabilityReady() {
    const instance = Template.instance();
    return instance.availability.get();
  },
  checkInventoryAvailability(variantId) {
    const instance = Template.instance();
    const cartItemReservations = Session.get("goCartItemReservations");
    const quantityInCart = cartItemReservations[variantId] || 0;
    const availability = instance.availability.get();
    return (availability[variantId] - quantityInCart) === 0 ? "disabled" : "";
  },
  inventoryAvailableCount(variantId) {
    const instance = Template.instance();
    const cartItemReservations = Session.get("goCartItemReservations");
    const quantityInCart = cartItemReservations[variantId] || 0;
    const availability = instance.availability.get();
    if (availability[variantId] - quantityInCart === 0) {
      return "Fully Booked!";
    }
    if (availability[variantId] - quantityInCart < 5) {
      return ` (${availability[variantId] - quantityInCart} left!)`;
    }
    return "";
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
