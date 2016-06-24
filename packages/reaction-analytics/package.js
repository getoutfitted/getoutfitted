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

  api.export("ReactionAnalytics", ["client", "server"]);
});
