var stickyPricing = function() {
  let $variantWidget = $("#variantWidget");
  let $pricingAnchor = $("#description");
  let elementLeft = $variantWidget.offset().left + 8;
  let elementOuterWidth = $variantWidget.width() - 5;
  let elementOuterHeight = $variantWidget.outerHeight();
  let width = parseInt(elementOuterWidth, 10) + "px";
  let tabWidth = elementOuterWidth - 40;
  tabWidth = tabWidth + "px";
  let left = parseInt(elementLeft, 10) + "px";

  let adjustPosition = function () {
    let elementTop = $variantWidget.offset().top;
    let pricingWidgetHeight = $("#size_pane .row").height() > 250 ? 250 : $("#size_pane .row").height();
    let anchorTop = $pricingAnchor.offset().top - pricingWidgetHeight; //$("#size_pane .row").height()
    let scrollTop = $(window).scrollTop();
    if ((scrollTop + $("#date_selection_widget").outerHeight() + elementOuterHeight) > $("section.footer").offset().top &&
     (scrollTop > anchorTop && ($variantWidget.position().top - 75) < 0)) {
      var pos = $("section.footer").offset().top - (scrollTop + elementOuterHeight + $("#date_selection_widget").outerHeight() - 74)
      $variantWidget.css({
        top: pos + "px"
      })
    } else if((scrollTop > anchorTop && $variantWidget.css("position") !== "fixed") || (scrollTop > anchorTop && ($variantWidget.position().top - 73) < 0)) {
      $variantWidget.addClass("sticky");
      $variantWidget.css({
        "position": "fixed",
        "top": (pricingWidgetHeight - 4) + "px",
        "left": left,
        "width": width,
        "background": "#FFF",
        "margin-right": "-10px",
        "padding": "0px",
        "z-index": "1000"
      });
      $("#price_tab").css({
        "margin-left": "0",
        "margin-right": "0",
        "width": tabWidth
      });
      $("#price_tab span.right").css({
        "margin-right": "-10px"
      });
    } else if (scrollTop < anchorTop && $variantWidget.css("position") === "fixed") {
      $variantWidget.removeClass("sticky");
      $variantWidget.css({
        "position": "relative",
        "top": "",
        "left": "",
        "width": "",
        "background": "",
        "margin-right": "",
        "padding": "",
        "z-index": "1000"
      });
      $("#price_tab").css({
        "margin-left": "",
        "margin-right": "",
        "width": ""
      });
      $("#price_tab span.right").css({
        "margin-right": "10px"
      });
    }
  };
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
  }
});
