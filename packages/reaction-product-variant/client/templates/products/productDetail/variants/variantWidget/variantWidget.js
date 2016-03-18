function stickyWidget() {
  const bubbleTop = 75; // This must be set identically to the CSS bubble;
  let $variantWidget = $("#variantWidget");
  let $pricingAnchor = $("#description");
  let width = parseInt($variantWidget.outerWidth(), 10) + "px";
  let left = parseInt($variantWidget.offset().left, 10) + "px";

  function adjustPosition() {
    let anchorTop = $pricingAnchor.offset().top - bubbleTop;
    let scrollTop = $(window).scrollTop();
    if (scrollTop > anchorTop && $variantWidget.css("position") !== "fixed" ||
    scrollTop > anchorTop && scrollTop > bubbleTop && $variantWidget.css("position") !== "fixed") {
      $variantWidget.addClass("sticky");
      $variantWidget.css({
        left: left,
        width: width
      });
      $("#variantWidget").prepend($("#leadImageContainer").clone().hide(0, function () {
        $("#leadImageContainer").slideDown(100);
      }));
    } else if ($variantWidget.css("position") === "fixed") {
      if (scrollTop < 2 * bubbleTop) {
        $variantWidget.removeClass("sticky");
        $variantWidget.css({
          left: "",
          width: ""
        });
        $("#variantWidget #leadImageContainer").remove();
      }
    }
  }

  $(window).scroll(adjustPosition);
  adjustPosition();
}

Template.variantWidget.onRendered(function () {
  if(window.innerWidth > 767) {
    stickyWidget();
  }
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
