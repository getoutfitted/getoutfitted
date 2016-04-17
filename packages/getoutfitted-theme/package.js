Package.describe({
  name: "getoutfitted:getoutfitted-theme",
  summary: "GetOutfitted Style Theme for Reaction Commerce",
  version: "0.1.0"
});

Package.onUse(function (api) {
  // The package is set to work with meteor 1.2 and above
  api.versionsFrom("METEOR@1.2.1");
  api.use("less");
  api.use("fortawesome:fontawesome@4.5.0");

  // Include core theme to get its base styles.
  // The styles from core-theme are imported into the main.less file.
  // @see main.less
  // (Optional, but recommended for a starting point)
  api.use("reactioncommerce:core-theme@2.0.0");

  // ---------------------------------------------------------------------------
  // Styles that will be imported into another file.
  // -- Theses file will imported into main.less, so they are included here,
  // -- before they are include the main.less file
  //
  // ** ADD YOUR CUSTOM STYLES HERE **
  api.addFiles("styles/variables.less", "client", {isImport: true});
  api.addFiles([
    "styles/_appstyles.less",
    "styles/base.less",

    // ----- Component Styles ----- //
    "styles/components/buttons.less",
    "styles/components/captions.less",
    "styles/components/colors.less",
    "styles/components/forms.less",
    "styles/components/hero.less",
    "styles/components/section.less",
    "styles/components/tiles.less",

    // ------ Header Styles ------ //
    "styles/header/header.less",
    "styles/header/navs.less",
    "styles/header/tagNav.less",

    // ----- Footer Styles ----- //
    "styles/footer/footer.less",

    // ----- Product Styles ----- //
    "styles/products/productDetail/productDetail.less",
    "styles/products/productDetail/images/productImageGallery.less",
    "styles/products/productDetail/variants/variantWidget/variantWidget.less",

    // ----- Calendar Styles ------ //
    "styles/calendar/calendar.less",

    // ----- Tags Styles ----- //
    "styles/tags/tags.less",

    // ----- Admin Styles ---- // TODO: Move to specific packages
    "styles/admin/rentalProducts/rentalProducts.less"
  ], "client", {isImport: true});


  // ---------------------------------------------------------------------------
  // Styles that stand on their own and are processed by Meteor using the proper
  // CSS preprocessor (LESS CSS in this case)
  api.addFiles("main.less", "client");

  // Public assets go at the bottom, should load last.
  // Images
  api.addAssets([
    "public/images/favicon.ico",
    "public/images/favicon.png",
    "public/images/logo-wordmark.png",
    "public/images/badge.png",
    // -------- Sketch Images -------- //
    "public/images/sketch/sketch1.jpg",
    "public/images/sketch/sketch2.jpg",
    "public/images/sketch/sketch3.jpg",
    // -------- Hero and Tile Hero Images -------- //
    "public/images/hero/models1.jpg",
    "public/images/hero/kayak-index.jpg",
    "public/images/hero/onesie-index.jpg",
    "public/images/hero/ski4.jpg",
    // -------- Logos / Press/ Brand Partners -------- //
    "public/images/logo/huffingtonpost.png",
    "public/images/logo/instyle.png",
    "public/images/logo/skimagazine.png",
    "public/images/logo/townandcountry.png",
    "public/images/logo/usatoday.png",
    "public/images/logo/yahootravel.png",
    "public/images/logo/opp-87.png"
  ], "client");
});
