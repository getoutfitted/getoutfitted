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
    "styles/base.less"
  ], "client", {isImport: true});


  // ---------------------------------------------------------------------------
  // Styles that stand on their own and are processed by Meteor using the proper
  // CSS preprocessor (LESS CSS in this case)
  api.addFiles("main.less", "client");
  
  // Public assets go at the bottom, should load last.
  // Images
  api.addAssets([
    'public/images/favicon.ico',
    'public/images/favicon.png',
    'public/images/logo-wordmark.png'
  ], 'client');
});
