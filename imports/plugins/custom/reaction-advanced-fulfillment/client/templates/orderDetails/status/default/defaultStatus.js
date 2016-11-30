import { Template } from "meteor/templating";
import { ReactiveDict } from "meteor/reactive-dict";

function findFulfillmentItem(order, itemId) {
  return order.advancedFulfillment.items.find(item => item._id === itemId);
}

Template.defaultStatus.onCreated(function () {
  const instance = this;
  const order = instance.data;
  instance.picking = new ReactiveDict();
  instance.autorun(() => {
    order.advancedFulfillment.items.forEach(function (item) {
      instance.picking.set(item._id, item.workflow.status === "picked");
    });
  });
  // const orderPickingStatus = {};
  // orderPickingStatus[`${order._id}-picking`] = data;
});

Template.defaultStatus.helpers({
  nonBundleItems() {
    const order = this;
    return order.items.filter(function (item) {
      const notBundleVariant = item.variants.functionalType !== "bundleVariant";
      const notBundleComponent = item.customerViewType !== "bundleComponent";
      return notBundleVariant && notBundleComponent;
    });
  },
  bundles() {
    const order = this;
    const index = {};
    const bundles = order.items.reduce(function (acc, item) {
      if (item.variants.functionalType === "bundleVariant") {
        if (index[item.productId]) {
          index[item.productId] += 1;
        } else {
          index[item.productId] = 1;
        }
        acc.push(Object.assign({index: index[item.productId]}, item));
      }
      return acc;
    }, []);
    return bundles;
  },
  itemsByBundle(bundle) {
    const order = this;
    itemsByBundle = order.items.filter(function (item) {
      itemMatches = item.bundleProductId === bundle.productId;
      indexMatches = item.bundleIndex === bundle.index;
      return itemMatches && indexMatches;
    });
    return itemsByBundle;
  },
  bundleIndex(bundle) {
    return bundle.index > 1 ? `#${bundle.index}` : "";
  },
  fulfillmentStatus(item) {
    const order = this;
    const fulfillmentItem = findFulfillmentItem(order, item._id);
    return fulfillmentItem.workflow.status;
  },
  isPicked: function (itemId) {
    const instance = Template.instance();
    // returns true if item picked
    if (instance.picking) {
      return instance.picking.get(itemId);
    }
    throw new Meteor.Error("picking status not established");
  }
});

Template.defaultStatus.events({
  "click .item-action": function (event) {
    event.preventDefault();
    const instance = Template.instance();
    const itemId = event.target.dataset.itemId;
    const orderId = event.target.dataset.orderId;
    const itemStatus = event.target.dataset.itemStatus;
    instance.picking.set(itemId, true);
    Meteor.call("advancedFulfillment/updateItemWorkflow", orderId, itemId, itemStatus);
  }
});
