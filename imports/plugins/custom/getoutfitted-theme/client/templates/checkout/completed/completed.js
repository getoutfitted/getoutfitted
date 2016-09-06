import { Orders } from "/lib/collections";
import { Session } from "meteor/session";
import { Reaction, i18next } from "/client/api";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";

function filteredProductVariantTitle(variant) {
  const title = `${variant.vendor}
               ${variant.productTitle}
               ${variant.gender}
               ${variant.color}
               ${variant.size}`;
  return title.replace(/(?:One|No)\s+(?:Color|Size|Option)/ig, "")
    .replace(/undefined/ig, "")
    .replace(/unisex/ig, "")
    .replace(/\s+/g, " ");
}

function getProductTrackingProps(product, variant) {
  if (!product || !variant) {
    return {};
  }
  const props = {
    "id": variant._id,
    "sku": variant.sku,
    "Product Sku": variant.sku,
    "Product Title": variant.productTitle,
    "Product Vendor": product.vendor,
    "Product Gender": variant.gender,
    "Product Color": variant.color,
    "Product Size": variant.size,
    "Product Type": product.productType,
    "category": product.productType,
    "Variant Title": filteredProductVariantTitle(variant),
    "name": filteredProductVariantTitle(variant),
    "Product Price": variant.price,
    "price": variant.price, // TODO: This should check selected dates/reservation length
    "Product Weight": variant.weight,
    "Variant Total Inventory": variant.inventoryQuantity,
    "Variant Ancestors": variant.ancestors
  };

  props[variant.optionTitle] = variant.title;
  props["Available Rental Lengths"] = _.pluck(variant.rentalPriceBuckets, "duration");
  props["Available Prices"] = _.pluck(variant.rentalPriceBuckets, "price");
  props["Price Buckets"] = variant.rentalPriceBuckets;
  props["Is Bundle Component"] = product.customerViewType === "bundleComponent";
  return props;
}

function getOrderTrackingProps(order) {
  if (!order) {
    return {};
  }

  const props = {
    "id": order._id,
    "orderId": order._id,
    "createdAt": order.createdAt,
    "total": order.billing[0].invoice.total,
    "shipping": order.billing[0].invoice.shipping,
    "subtotal": order.billing[0].invoice.subtotal,
    "taxes": order.billing[0].invoice.taxes,
    "discount": order.billing[0].invoice.discounts,
    "currency": "USD",
    "email": order.email,
    "Billing Payment Processor": order.billing[0].paymentMethod.processor,
    "Billing Payment Method": order.billing[0].paymentMethod.method,
    "Billing Postal Code": order.billing[0].address.postal,
    "Billing City": order.billing[0].address.city,
    "Billing Region": order.billing[0].address.region,
    "Billing Country": order.billing[0].address.country,
    "Shipping Method Name": order.shipping[0].shipmentMethod.name,
    "Shipping Method Label": order.shipping[0].shipmentMethod.label,
    "Shipping Method Rate": order.shipping[0].shipmentMethod.rate,
    "Shipping Postal Code": order.shipping[0].address.postal,
    "Shipping City": order.shipping[0].address.city,
    "Shipping Region": order.shipping[0].address.region,
    "Shipping Country": order.shipping[0].address.country,
    "Reservation Start": order.startTime,
    "Reservation End": order.endTime,
    "Reservation Length": order.rentalDays,
    "Scheduled Shipment Date": order.advancedFulfillment.shipmentDate,
    "Scheduled Return Date": order.advancedFulfillment.returnDate,
    "Carrier Transit Time": order.advancedFulfillment.transitTime,
    "Order Number": order.orderNumber,
    "products": []
  };
  props.products = _.map(order.items, function (item) {
    return getProductTrackingProps(item, item.variants);
  });
  return props;
}
/**
 * cartCompleted helpers
 *
 * if order status = new translate submitted message
 */
Template.cartCompleted.helpers({
  orderCompleted: function () {
    const id =  Reaction.Router.getQueryParam("_id");
    if (id) {
      const ccoSub = Meteor.subscribe("CompletedCartOrder", Meteor.userId(), id);
      if (ccoSub.ready()) {
        // XXX: GETOUTFITTED MOD - add checkout completed event tracking
        if (typeof analytics === "object") {
          order = Orders.findOne({userId: Meteor.userId(), cartId: id});
          if (order.tracked) {
            console.log("Order previously tracked");
          } else {
            console.log("order", order);
            analytics.track("Completed Order", getOrderTrackingProps(order));
          }
        }
        return true;
      }
    }
    return false;
  },
  order: function () {
    return Orders.findOne({
      userId: Meteor.userId(),
      cartId: Reaction.Router.getQueryParam("_id")
    });
  },
  orderStatus: function () {
    if (this.workflow.status === "new") {
      return i18next.t("cartCompleted.submitted");
    }
    return this.workflow.status;
  },
  userOrders: function () {
    if (Meteor.user()) {
      return Orders.find({
        userId: Meteor.userId(),
        cartId: this._id
      });
    }
    return {};
  }
});

/**
 * cartCompleted events
 *
 * adds email to order
 */
Template.cartCompleted.events({
  "click #update-order": function () {
    let templateInstance = Template.instance();
    const email = templateInstance.find("input[name=email]").value;
    check(email, String);
    const cartId = Reaction.Router.getQueryParam("_id");
    return Meteor.call("orders/addOrderEmail", cartId, email);
  }
});

/**
 * cartCompleted onCreated
 *
 * when the order is completed we need to destroy and recreate
 * the subscription to get the new cart
 */
Template.cartCompleted.onCreated(function () {
  let sessionId = Session.get("sessionId");
  let userId = Meteor.userId();
  let cartSub = Reaction.Subscriptions.Cart = Meteor.subscribe("Cart", sessionId, userId);
  cartSub.stop();
  Reaction.Subscriptions.Cart = Meteor.subscribe("Cart", sessionId, userId);
});


Template.cartCompleted.onRendered(function () {
  // ReactionAnalytics.trackEventWhenReady("Completed Checkout Step", {
  //   "step": 6,
  //   "Step Name": "Payment Information"
  // });
});
