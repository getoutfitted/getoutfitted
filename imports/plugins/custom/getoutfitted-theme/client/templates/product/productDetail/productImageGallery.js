import { $ } from "meteor/jquery";
import { Reaction } from "/client/api";
import { ReactionProduct } from "/lib/api";
import { Media } from "/lib/collections";
import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";
import { Modal } from "meteor/peppelg:bootstrap-3-modal";
import Sortable from "sortablejs";

/**
 * productImageGallery helpers
 */

/**
 * uploadHandler method
 */
function uploadHandler(event, metaOptions = {}) {
  // TODO: It would be cool to move this logic to common ValidatedMethod, but
  // I can't find a way to do this, because of browser's `FileList` collection
  // and it `Blob`s which is our event.target.files.
  // There is a way to do this: http://stackoverflow.com/a/24003932. but it's too
  // tricky
  let productId = ReactionProduct.selectedProductId();
  const variant = ReactionProduct.selectedVariant();
  if (typeof variant !== "object") {
    return Alerts.add("Please, create new Variant first.", "danger", {
      autoHide: true
    });
  }
  const variantId = variant._id;
  let shopId = ReactionProduct.selectedProduct().shopId || Reaction.getShopId();
  let userId = Meteor.userId();
  let count = Media.find({
    "metadata.variantId": variantId
  }).count();
  // TODO: we need to mark the first variant images somehow for productGrid.
  // But how do we know that this is the first, not second or other variant?
  // Question is open. For now if product has more than 1 top variant, everyone
  // will have a chance to be displayed
  const toGrid = variant.ancestors.length === 1;

  return FS.Utility.eachFile(event, function (file) {
    let fileObj;
    fileObj = new FS.File(file);
    let metadata = {
      ownerId: userId,
      productId: productId,
      variantId: variantId,
      shopId: shopId,
      priority: count,
      toGrid: +toGrid // we need number
    };
    fileObj.metadata = Object.assign(metadata, metaOptions);
    Media.insert(fileObj);
    return count++;
  });
}

function featuredUploadHandler(event) {
  return uploadHandler(event, {purpose: "featured"});
}

function widgetUploadHandler(event) {
  return uploadHandler(event, {purpose: "widget"});
}

function cartUploadHandler(event) {
  return uploadHandler(event, {purpose: "cart"});
}

function sizingGuideUploadHandler(event) {
  return uploadHandler(event, {purpose: "sizingGuide"});
}

function catalogUploadHandler(event) {
  return uploadHandler(event, {purpose: "catalog"});
}

function galleryUploadHandler(event) {
  return uploadHandler(event, {purpose: "gallery"});
}

/**
 * updateImagePriorities method
 */
function updateImagePriorities() {
  $(".gallery > .gallery-image")
    .toArray()
    .map((element, index) => {
      const mediaId = element.getAttribute("data-index");

      Media.update(mediaId, {
        $set: {
          "metadata.priority": index
        }
      });
    });
}

Template.registerHelper("imageWithPurpose", (purpose) => {
  let cartMedia;
  let variant = ReactionProduct.selectedVariant();

  if (variant) {
    cartMedia = Media.findOne({
      "metadata.variantId": variant._id,
      "metadata.purpose": purpose
    }, {
      sort: {
        "metadata.priority": 1
      }
    });
  }
  return cartMedia;
});

Template.goProductLeadImage.helpers({
  leadImage: function () {
    const variant = ReactionProduct.selectedVariant();
    let leadImage;

    if (variant) {
      leadImage = Media.findOne({
        "metadata.variantId": variant._id,
        "metadata.purpose": "featured"
      }, {
        sort: {
          "metadata.priority": 1
        }
      });
    }
    return leadImage;
  }
});

Template.goProductLeadImage.events({
  "click .leadImage": (event) => {
    Session.set("selectedMediaId", event.currentTarget.dataset.index);
    Modal.show("goCarousel");
  }
});

Template.goProductWidgetImage.events({
  "click .widgetImage": (event) => {
    Session.set("selectedMediaId", event.currentTarget.dataset.index);
    Modal.show("goCarousel");
  }
});

Template.goProductWidgetImage.helpers({
  widgetImage: function () {
    const variant = ReactionProduct.selectedVariant();
    let widgetImage;

    if (variant) {
      widgetImage = Media.findOne({
        "metadata.variantId": variant._id,
        "metadata.purpose": "widget"
      }, {
        sort: {
          "metadata.priority": 1
        }
      });
    }
    return widgetImage;
  }
});

Template.goProductSizingGuideImage.helpers({
  sizingGuideImage: function () {
    const product = ReactionProduct.selectedProduct();

    if (product) {
      return Media.findOne({
        "metadata.productId": product._id,
        "metadata.purpose": "sizingGuide"
      }, {
        sort: {
          "metadata.priority": 1
        }
      });
    }
    return false;
  }
});

/**
 *  Product Image Gallery
 */

Template.goProductImageGallery.helpers({
  media: function () {
    let mediaArray = [];
    let variant = ReactionProduct.selectedVariant();

    if (variant) {
      mediaArray = Media.find({
        "metadata.variantId": variant._id,
        "metadata.purpose": {$in: ["gallery", "featured", "widget"]}
      }, {
        sort: {
          "metadata.priority": 1
        }
      });
    }
    return mediaArray;
  },
  variant: function () {
    return ReactionProduct.selectedVariant();
  }
});

/**
 * productImageGallery onRendered
 */

Template.goProductImageGallery.onRendered(function () {
  this.autorun(function () {
    let $gallery;
    if (Reaction.hasAdminAccess()) {
      $gallery = $(".gallery")[0];

      this.sortable = Sortable.create($gallery, {
        group: "gallery",
        handle: ".gallery-image",
        onUpdate() {
          updateImagePriorities();
        }
      });
    }
  });
});
/**
 * productImageGallery events
 */

Template.goProductImageGallery.events({
  "click .remove-image": function () {
    const imageUrl =
      $(event.target)
      .closest(".gallery-image")
      .find("img")
      .attr("src");
    let instance = this;
    if (this.image) {
      instance = this.image;
    }

    Alerts.alert({
      title: "Remove Media?",
      type: "warning",
      showCancelButton: true,
      imageUrl,
      imageHeight: 150
    }, (isConfirm) => {
      if (isConfirm) {
        const mediaId = instance._id;

        Media.remove({ _id: mediaId }, (error) => {
          if (error) {
            Alerts.toast(error.reason, "warning", {
              autoHide: 10000
            });
          }

          updateImagePriorities();
        });
      }
    });
  }
  // TODO: Add gallery dropzone handler
  // "dropped #galleryDropPane": uploadHandler
});

/**
 * imageUploader events
 */

Template.goGalleryImageUploader.events({
  "click #btn-upload": function () {
    return $("#files").click();
  },
  "change #files": galleryUploadHandler,
  "dropped #dropzone": galleryUploadHandler
});
Template.goFeaturedImageUploader.events({
  // Featured Image Event Handling
  "click #btn-featured-upload": function () {
    return $("#featuredFiles").click();
  },
  "change #featuredFiles": featuredUploadHandler,
  "dropped #featuredDropzone": featuredUploadHandler
});
Template.goWidgetImageUploader.events({
  // Widget Image Event Handling
  "click #btn-widget-upload": function () {
    return $("#widgetFiles").click();
  },
  "change #widgetFiles": widgetUploadHandler,
  "dropped #widgetDropzone": widgetUploadHandler
});
Template.goCartImageUploader.events({
  // Cart Image Event Handling
  "click #btn-cart-upload": function () {
    return $("#cartFiles").click();
  },
  "change #cartFiles": cartUploadHandler,
  "dropped #cartDropzone": cartUploadHandler
});
Template.goSizingGuideImageUploader.events({
  // Cart Image Event Handling
  "click #btn-sizing-guide-upload": function () {
    return $("#sizingGuideFiles").click();
  },
  "change #sizingGuideFiles": sizingGuideUploadHandler,
  "dropped #sizingGuideDropzone": sizingGuideUploadHandler
});
Template.goCatalogImageUploader.events({
  // Cart Image Event Handling
  "click #btn-catalog-upload": function () {
    return $("#catalogFiles").click();
  },
  "change #catalogFiles": catalogUploadHandler,
  "dropped #catalogDropzone": catalogUploadHandler
});



Template.registerHelper("noImageWithPurpose", (purpose) => {
  let variant = ReactionProduct.selectedVariant();

  if (variant) {
    cartMedia = Media.findOne({
      "metadata.variantId": variant._id,
      "metadata.purpose": purpose
    }, {
      sort: {
        "metadata.priority": 1
      }
    });
  }
  return cartMedia ? "hidden" : "";
});

/**
 * productImageGallery events
 */

Template.goProductImageGallery.events({
  "click #img-upload": function () {
    return $("#files").click();
  },
  "load .img-responsive": function (event, template) {
    return Session.set("variantImgSrc", template.$(".img-responsive").attr(
      "src"));
  }
});

Template.goCarousel.helpers({
  media: function () {
    let mediaArray = [];
    const variant = ReactionProduct.selectedVariant();

    if (variant) {
      mediaArray = Media.find({
        "metadata.variantId": variant._id,
        "metadata.purpose": {$in: ["featured", "widget", "gallery"]}
      }, {
        sort: {
          "metadata.priority": 1
        }
      });
    }
    return mediaArray;
  },

  isActive: function (mediaId, index) {
    selectedMediaId = Session.get("selectedMediaId");
    if (selectedMediaId) {
      if (mediaId === selectedMediaId) {
        return "active";
      }
    } else if (index === 0) {
      return "active";
    }

    return "";
  }
});

Template.goImageDetail.events({
  "click .img-responsive": function (event) {
    Session.set("selectedMediaId", event.currentTarget.dataset.index);
    Modal.show("goCarousel");
  }
});
