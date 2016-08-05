import { ReactionProduct } from "/lib/api";
import { Meteor } from "meteor/meteor";
import { Tracker } from "meteor/tracker";
import { Template } from "meteor/templating";

/**
 * metaComponent helpers
 */

Template.metaComponent.helpers({
  buttonProps() {
    const currentData = Template.currentData();

    return {
      icon() {
        if (currentData.createNew) {
          return "plus";
        }

        return "times-circle";
      },
      onClick() {
        if (!currentData.createNew) {
          const productId = ReactionProduct.selectedProductId();
          Meteor.call("products/removeMetaFields", productId, currentData);
        }
      }
    };
  }
});

Template.metaComponent.events({
  "change input": function (event) {
    const productId = ReactionProduct.selectedProductId();
    const updateMeta = {
      key: $(event.currentTarget).parent().children(
        ".metafield-key-input").val(),
      value: $(event.currentTarget).parent().children(
        ".metafield-value-input").val()
    };
    if (this.key) {
      Meteor.call("products/updateMetaFields", productId, updateMeta,
        this);
      $(event.currentTarget).animate({
        backgroundColor: "#e2f2e2"
      }).animate({
        backgroundColor: "#fff"
      });
      return Tracker.flush();
    }

    if (updateMeta.value && !updateMeta.key) {
      $(event.currentTarget).parent().children(".metafield-key-input").val(
        "").focus();
    }
    if (updateMeta.key && updateMeta.value) {
      Meteor.call("products/updateMetaFields", productId, updateMeta);
      Tracker.flush();
      $(event.currentTarget).parent().children(".metafield-key-input").val(
        "").focus();
      return $(event.currentTarget).parent().children(
        ".metafield-value-input").val("");
    }
  }
});


/**
 * productMetaFieldForm events
 */

Template.productMetaFieldForm.events({
  "click .metafield-remove": function () {
    let productId;
    productId = ReactionProduct.selectedProductId();
    Meteor.call("products/removeMetaFields", productId, this);
  }
});

/**
 * goFeatureComponent helpers
 */

Template.goFeatureComponent.events({
  "change input": function (event) {
    const updateMeta = {
      key: $(event.currentTarget).parent().children(
        ".metafield-key-input").val(),
      value: $(event.currentTarget).parent().children(
        ".metafield-value-input").val()
    };
    if(this.featureKey && this.value) {
      this.key = this.featureKey;
      delete this.featureKey;
    }

    if (this.key) {
      const productId = ReactionProduct.selectedProductId();
      Meteor.call("products/updateMetaFields", productId, updateMeta, this);
      $(event.currentTarget).animate([
        {"backgroundColor": $(event.currentTarget).css('background-color')},
        {"backgroundColor": "#BBFFCC"}
      ], 1000);
      return Tracker.flush();
    }

    if (updateMeta.value && !updateMeta.key) {
      $(event.currentTarget).parent().children(".metafield-key-input").val(
        "").focus();
    }
    if (updateMeta.key && updateMeta.value) {
      const productId = ReactionProduct.selectedProductId();
      Meteor.call("products/updateMetaFields", productId, updateMeta);
      Tracker.flush();
      $(event.currentTarget).parent().children().last().val("").focus();
    }
  }
});

/**
 * goProductIncludedFieldForm
 */

Template.goProductIncludedFieldForm.helpers({
  features: function () {
    const featureKey = this.featureKey;
    return _.filter(this.metafields, function (metafield) {
      return metafield.key === featureKey;
    });
  }
});

Template.goProductIncludedFieldForm.events({
  "click .metafield-remove": function () {
    let productId;
    productId = ReactionProduct.selectedProductId();
    Meteor.call("products/removeMetaFields", productId, this);
  }
});

/**
 * goProductIncludedField
 */

Template.goProductIncludedField.helpers({
  features: function () {
    const featureKey = this.featureKey;
    return _.filter(this.metafields, function (metafield) {
      return metafield.key === featureKey;
    });
  }
});


/**
 * goProductFeatureFieldForm
 */
Template.goProductFeatureFieldForm.helpers({
  features: function () {
    const featureKey = this.featureKey;
    return _.filter(this.metafields, function (metafield) {
      return metafield.key === featureKey;
    });
  },
  canHaveMoreFeatures: function () {
    const featureKey = this.featureKey;
    const features =  _.filter(this.metafields, function (metafield) {
      return metafield.key === featureKey;
    });
    return features.length < 4;
  }
});

Template.goProductFeatureFieldForm.events({
  "click .metafield-remove": function () {
    let productId;
    productId = ReactionProduct.selectedProductId();
    Meteor.call("products/removeMetaFields", productId, this);
  }
});

/**
 * goProductFeatureField
 */

Template.goProductFeatureField.helpers({
  features: function () {
    const featureKey = this.featureKey;
    return _.filter(this.metafields, function (metafield) {
      return metafield.key === featureKey;
    });
  }
});

Template.goProductFeatureImageField.helpers({
  features: function () {
    const featureKey = this.featureKey;
    return _.filter(this.metafields, function (metafield) {
      return metafield.key === featureKey;
    });
  }
});
