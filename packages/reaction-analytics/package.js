Package.describe({
  summary: "Reaction Analytics - Integrate third-party analytics libraries",
  name: "reactioncommerce:reaction-analytics",
  version: "1.4.0",
  documentation: "README.md"
});

Package.on_use(function (api) {
  api.versionsFrom("METEOR@1.3");

  api.use("meteor-base");
  api.use("accounts-base", ["client", "server"], {weak: true});
  api.use("mongo");
  api.use("blaze-html-templates");
  api.use("session");
  api.use("tracker");
  api.use("logging");
  api.use("reload");
  api.use("random");
  api.use("ejson");
  api.use("spacebars");
  api.use("check");
  api.use("ecmascript");

  // meteor add-on packages

  api.use("less");
  api.use("browser-policy-content", "server");

  api.use("reactioncommerce:reaction-router@1.1.0");
  api.use("getoutfitted:getoutfitted-layout");
  api.use("reactioncommerce:core@0.13.0");

  api.addFiles([
    "common/globals.js",
    "common/collections.js",
    "common/hooks.js"
  ], ["client", "server"]);

  api.addFiles([
    "import/analytics.js",
    "client/collections.js",
    "client/globals.js",
    "client/startup.js",
    "client/templates/reactionAnalytics/reactionAnalytics.html",
    "client/templates/reactionAnalytics/reactionAnalytics.js"
  ], ["client"]);

  api.addFiles([
    "server/security/browserPolicy.js",
    "server/security/AnalyticsEvents.js",
    "server/publications.js",
    "server/register.js"
  ], ["server"]);

  api.export("analytics", ["client", "server"]);
});


// Package.describe({
//   name: 'okgrow:analytics',
//
//   summary: 'Complete Google Analytics, Mixpanel, KISSmetrics (and more) integration for ReactionCommerce',
//   documentation: 'README.md'
// });
//
// Package.onUse(function(api) {
//   api.versionsFrom('1.0.3.1');
//   api.use('mongo');
//   api.use('accounts-base', ['client', 'server'], {weak: true});
//   api.use('browser-policy-content', 'server', {weak: true});
//
//   api.addFiles([
//     'server/browser-policy.js',
//     'server/publications.js'
//   ], 'server');
//   api.addFiles([
//     'vendor/analytics.min.js',
//     'client/collections.js',
//     'client/meteor-analytics.js',
//   ], 'client');
//
//   api.export('analytics', ['client']);
// });
