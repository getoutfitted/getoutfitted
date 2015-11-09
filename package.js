Package.describe({
  summary: 'Shopify orders are pulled into Reaction',
  name: 'getoutfitted:reaction-shopify-orders',
  version: '0.1.0',
  git: 'https://github.com/getoutfitted/reaction-shopify-orders'
});

Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.2');
  api.use('meteor-platform');
  api.use('less');
  api.use('http');
  api.use('underscore');
  api.use('reactioncommerce:core@0.9.4');
  api.use('reactioncommerce:reaction-accounts@1.5.2');
  api.use('iron:router@1.0.12');
  api.use('momentjs:moment@2.10.6');
  api.use('momentjs:twix@0.7.2');
  api.use('standard-minifiers');
  api.use('dburles:factory@0.3.10');
  api.use('reactioncommerce:reaction-factories');
});


Package.onTest(function (api) {
  api.use('sanjo:jasmine@0.20.2');
  api.use('underscore');
  api.use('dburles:factory@0.3.10');
  api.use('velocity:html-reporter@0.9.0');
  api.use('velocity:console-reporter@0.1.3');
  api.use('velocity:helpers');
  api.use('reactioncommerce:reaction-factories');

  api.use('reactioncommerce:core@0.9.4');
  api.use('reactioncommerce:bootstrap-theme');
  api.use('getoutfitted:reaction-shopify-orders');

  api.addFiles('tests/jasmine/server/integration/methods.js', 'server');
  api.addFiles('tests/jasmine/server/integration/hooks.js', 'server');
});
