/**
 * productImageGallery helpers
 */

let Media = ReactionCore.Collections.Media;

/**
 * uploadHandler method
 */
function uploadHandler(event) {
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
    fileObj = new FS.File(file);
    fileObj.metadata = {
      ownerId: userId,
      productId: productId,
      variantId: variantId,
      shopId: shopId,
      priority: count,
      toGrid: +toGrid // we need number
    };
    Media.insert(fileObj);
    return count++;
  });
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

  const results = [];
  for (let image of sortedMedias) {
    results.push(Media.update(image.mediaId, {
      $set: {
        "metadata.priority": _.indexOf(sortedMedias, image)
      }
    }));
  }
  return results;
}

Template.productLeadImage.helpers({
  leadImage: function () {
    const variant = ReactionProduct.selectedVariant();
    let leadImage;

    if (variant) {
      leadImage = Media.findOne({
        "metadata.variantId": variant._id
      }, {
        sort: {
          "metadata.priority": 1
        }
      });
    }
    return leadImage;
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
        "metadata.variantId": variant._id
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
    if (!ReactionCore.hasPermission("createProduct")) {
      let first = $("#leadImage > li");
      let target = $(event.currentTarget);
      if ($(target).data("index") !== first.data("index")) {
        return $("#leadImage > li").fadeOut(400, function () {
          $(this).replaceWith(target.clone());
          return $(".gallery li:last-child").fadeIn(100);
        });
      }
    }
  },
  "click .remove-image": function () {
    this.remove();
    updateImagePriorities();
  },
  "dropped #galleryDropPane": uploadHandler
});

/**
 * imageUploader events
 */

Template.imageUploader.events({
  "click #btn-upload": function () {
    return $("#files").click();
  },
  "change #files": uploadHandler,
  "dropped #dropzone": uploadHandler
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
