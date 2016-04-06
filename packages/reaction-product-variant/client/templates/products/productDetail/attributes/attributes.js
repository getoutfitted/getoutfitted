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
 * metaComponent helpers
 */

Template.metaComponent.events({
  "change input": function (event) {
    const updateMeta = {
      key: $(event.currentTarget).parent().children(
        ".metafield-key-input").val(),
      value: $(event.currentTarget).parent().children(
        ".metafield-value-input").val()
    };
    if (this.key) {
      const productId = ReactionProduct.selectedProductId();
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
      const productId = ReactionProduct.selectedProductId();
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
 * featureComponent helpers
 */

Template.featureComponent.events({
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
      const productId = ReactionProduct.selectedProductId();
      Meteor.call("products/updateMetaFields", productId, updateMeta);
      Tracker.flush();
      $(event.currentTarget).parent().children().last().val("").focus();
    }
  }
});

/**
 * productIncludedFieldForm
 */

Template.productIncludedFieldForm.helpers({
  features: function () {
    const featureKey = this.featureKey;
    return _.filter(this.metafields, function (metafield) {
      return metafield.key === featureKey;
    });
  }
});

Template.productIncludedFieldForm.events({
  "click .metafield-remove": function () {
    let productId;
    productId = ReactionProduct.selectedProductId();
    Meteor.call("products/removeMetaFields", productId, this);
  }
});

/**
 * productIncludedField
 */

Template.productIncludedField.helpers({
  features: function () {
    const featureKey = this.featureKey;
    return _.filter(this.metafields, function (metafield) {
      return metafield.key === featureKey;
    });
  }
});


/**
 * productFeatureFieldForm
 */
Template.productFeatureFieldForm.helpers({
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

Template.productFeatureFieldForm.events({
  "click .metafield-remove": function () {
    let productId;
    productId = ReactionProduct.selectedProductId();
    Meteor.call("products/removeMetaFields", productId, this);
  }
});

/**
 * productFeatureField
 */

Template.productFeatureField.helpers({
  features: function () {
    const featureKey = this.featureKey;
    return _.filter(this.metafields, function (metafield) {
      return metafield.key === featureKey;
    });
  }
});

Template.productFeatureImageField.helpers({
  features: function () {
    const featureKey = this.featureKey;
    return _.filter(this.metafields, function (metafield) {
      return metafield.key === featureKey;
    });
  }
});
