const $ = require("jquery");
// load modules
require("jquery-ui/sortable");
/**
 * productImageGallery helpers
 */

let Media = ReactionCore.Collections.Media;

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
  let shopId = ReactionProduct.selectedProduct().shopId || ReactionCore.getShopId();
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
    let metadata = {
      ownerId: userId,
      productId: productId,
      variantId: variantId,
      shopId: shopId,
      priority: count,
      toGrid: +toGrid // we need number
    };
    fileObj = new FS.File(file);
    fileObj.metadata = Object.assign(metadata, metaOptions);
    Media.insert(fileObj);
    return count++;
  });
}

function featuredUploadHandler (event) {
  return uploadHandler(event, {purpose: "featured"});
}

function widgetUploadHandler (event) {
  return uploadHandler(event, {purpose: "widget"});
}

function cartUploadHandler (event) {
  return uploadHandler(event, {purpose: "cart"});
}

function galleryUploadHandler (event) {
  return uploadHandler(event, {purpose: "gallery"});
}

/**
 * updateImagePriorities method
 */
function updateImagePriorities() {
  const sortedMedias = _.map($(".gallery").sortable("toArray", {
    attribute: "data-index"
  }), function (index) {
    return {
      mediaId: index
    };
  });
  return ReactionProductAPI.methods.updateMediaPriorities.call({ sortedMedias });
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

Template.productLeadImage.helpers({
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

Template.productLeadImage.events({
  "click .leadImage": (event) => {
    Session.set("selectedMediaId", event.currentTarget.dataset.index);
    Modal.show('carousel');
  }
});

Template.productWidgetImage.events({
  "click .widgetImage": (event) => {
    Session.set("selectedMediaId", event.currentTarget.dataset.index);
    Modal.show('carousel');
  }
});

Template.productWidgetImage.helpers({
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

/**
 *  Product Image Gallery
 */

Template.productImageGallery.helpers({
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

Template.productImageGallery.onRendered(function () {
  return this.autorun(function () {
    let $gallery;
    if (ReactionCore.hasAdminAccess()) {
      $gallery = $(".gallery");
      return $gallery.sortable({
        cursor: "move",
        opacity: 0.3,
        placeholder: "sortable",
        forcePlaceholderSize: true,
        update: function () {
          let variant;
          if (typeof variant !== "object") {
            variant = ReactionProduct.selectedVariant();
          }
          variant.medias = [];
          return updateImagePriorities();
        },
        start: function (event, ui) {
          ui.placeholder.html("Drop image to reorder");
          ui.placeholder.css("padding-top", "30px");
          ui.placeholder.css("border", "1px dashed #ccc");
          return ui.placeholder.css("border-radius", "6px");
        }
      });
    }
  });
});

/**
 * productImageGallery events
 */

Template.productImageGallery.events({
  "click .gallery > li": function (event) {
    event.stopImmediatePropagation();
    // This is a workaround for an issue with FF refiring mouseover when the contents change
    if (event.relatedTarget === null) {
      return undefined;
    }
    if (!ReactionCore.hasPermission("createProduct")) {
      let first = $("#leadImage > img");
      let target = $(event.currentTarget).find("img");
      if ($(target).data("index") !== first.data("index")) {
        $("#leadImage > img").fadeOut(400, function () {
          $(this).replaceWith(target.clone());
        });
      }
    }
    return undefined;
  },
  "click .remove-image": function () {
    let instance = this;
    if (this.image) {
      instance = this.image;
    }

    const mediaId = instance._id;
    ReactionProductAPI.methods.removeMedia.call({ mediaId }, error => {
      // Media doesn't return success result
      if (error) {
        Alerts.inline(error.reason, "warning", {
          autoHide: 10000
        });
      }
      return updateImagePriorities();
    });
  }
  // TODO: Add gallery dropzone handler
  // "dropped #galleryDropPane": uploadHandler
});

/**
 * imageUploader events
 */

Template.galleryImageUploader.events({
  "click #btn-upload": function () {
    return $("#files").click();
  },
  "change #files": galleryUploadHandler,
  "dropped #dropzone": galleryUploadHandler
});
Template.featuredImageUploader.events({
  // Featured Image Event Handling
  "click #btn-featured-upload": function () {
    return $("#featuredFiles").click();
  },
  "change #featuredFiles": featuredUploadHandler,
  "dropped #featuredDropzone": featuredUploadHandler
});
Template.widgetImageUploader.events({
  // Widget Image Event Handling
  "click #btn-widget-upload": function () {
    return $("#widgetFiles").click();
  },
  "change #widgetFiles": widgetUploadHandler,
  "dropped #widgetDropzone": widgetUploadHandler
});
Template.cartImageUploader.events({
  // Cart Image Event Handling
  "click #btn-cart-upload": function () {
    return $("#cartFiles").click();
  },
  "change #cartFiles": cartUploadHandler,
  "dropped #cartDropzone": cartUploadHandler
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

Template.productImageGallery.events({
  "click #img-upload": function () {
    return $("#files").click();
  },
  "load .img-responsive": function (event, template) {
    return Session.set("variantImgSrc", template.$(".img-responsive").attr(
      "src"));
  }
});

Template.carousel.helpers({
  media: function () {
    let mediaArray = [];
    let variant = ReactionProduct.selectedVariant();

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

Template.imageDetail.events({
  "click .img-responsive": function (event) {
    Session.set("selectedMediaId", event.currentTarget.dataset.index);
    Modal.show('carousel');
  }
});
