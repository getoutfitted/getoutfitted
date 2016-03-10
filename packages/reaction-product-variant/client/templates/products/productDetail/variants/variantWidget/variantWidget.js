function stickyPricing() {
  const bubbleTop = 75;// + "px";
  let $variantWidget = $("#variantWidget");
  let $pricingAnchor = $("#description");
  let width = parseInt($variantWidget.outerWidth(), 10) + "px";
  let left = parseInt($variantWidget.offset().left, 10) + "px";

  function adjustPosition() {
    let anchorTop = $pricingAnchor.offset().top - bubbleTop;
    let scrollTop = $(window).scrollTop();
    if (scrollTop > anchorTop && $variantWidget.css("position") !== "fixed" || scrollTop > anchorTop && $variantWidget.position().top - bubbleTop < 0) {
      $variantWidget.addClass("sticky");
      $variantWidget.css({
        left: left,
        width: width
      });
    } else if (scrollTop < anchorTop && $variantWidget.css("position") === "fixed") {
      $variantWidget.removeClass("sticky");
      $variantWidget.css({
        left: "0",
        width: "auto"
      });
    }
  }

  $(window).scroll(adjustPosition);
  adjustPosition();
}

Template.variantWidget.onRendered(function () {
  stickyPricing();
});

Template.variantWidget.helpers({
  actualPrice: function () {
    const current = ReactionProduct.selectedVariant();
    if (typeof current === "object") {
      const childVariants = ReactionProduct.getVariants(current._id);
      if (childVariants.length === 0) {
        return current.price;
      }
      return ReactionProduct.getProductPriceRange();
    }
    return undefined;
  }
});
