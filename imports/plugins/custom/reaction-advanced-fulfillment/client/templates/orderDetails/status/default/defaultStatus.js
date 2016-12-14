import { Template } from "meteor/templating";
import { ReactiveDict } from "meteor/reactive-dict";

Template.defaultStatus.onCreated(function () {
  const instance = this;
  const order = instance.data;
  instance.picking = new ReactiveDict();
  instance.returning = new ReactiveDict();
  instance.autorun(() => {
    order.advancedFulfillment.items.forEach(function (item) {
      if (item) {
        instance.picking.set(item._id, item.workflow.status === "picked");
        instance.returning.set(item._id, item.workflow.status === "shipped");
      }
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
    if (item) {
      const fulfillmentItem = order.advancedFulfillment.items.find(
        i => i._id === item._id
      );
      return fulfillmentItem.workflow.status;
    }
    return "";
  },
  workflowHasAction() {
    const order = this;
    const status = order.advancedFulfillment.workflow.status;
    const workflowsWithAction = [
      "orderPicking",
      "orderReturned"
    ];
    // don't show picking buttons unless we're supposed to be picking
    if (workflowsWithAction.indexOf(status) === -1) {
      return false;
    }
    return true;
  },
  isPicked: function (itemId) {
    const instance = Template.instance();
    const order = this;
    const status = order.advancedFulfillment.workflow.status;
    if (status !== "orderPicking") {
      return true;
    }
    // returns true if item picked
    if (instance.picking) {
      return instance.picking.get(itemId);
    }
    throw new Meteor.Error("picking status not established");
  },
  isReturning: function (itemId) {
    const instance = Template.instance();
    const order = this;
    const status = order.advancedFulfillment.workflow.status;
    if (status !== "orderReturned") {
      return false;
    }
    // returns true if item picked
    if (instance.returning) {
      return instance.returning.get(itemId);
    }
    throw new Meteor.Error("picking status not established");
  }
});

Template.defaultStatus.events({
  "click .item-action": function (event) {
    const instance = Template.instance();
    const itemId = event.target.dataset.itemId;
    const orderId = event.target.dataset.orderId;
    const itemStatus = event.target.dataset.itemStatus;
    instance.picking.set(itemId, true);
    Meteor.call("advancedFulfillment/updateItemWorkflow", orderId, itemId, itemStatus);
  },
  "click .item-returned": function (event) {
    const instance = Template.instance();
    const itemId = event.currentTarget.dataset.itemId;
    const orderId = event.currentTarget.dataset.orderId;
    instance.returning.set(itemId, false);
    Meteor.call("advancedFulfillment/updateItemWorkflow", orderId, itemId, "shipped");
  },
  "click .item-issue": function (event) {
    const instance = Template.instance();
    const itemId = event.currentTarget.dataset.itemId;
    const orderId = event.currentTarget.dataset.orderId;
    const issue = event.target.dataset.issue;
    instance.returning.set(itemId, false);
    Meteor.call("advancedFulfillment/itemIssue", orderId, itemId, issue);
  }
});
