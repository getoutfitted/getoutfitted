Factory.define('klaviyoPackage', ReactionCore.Collections.Packages, {
  _id: Random.id(),
  name: 'reaction-klaviyo',
  shopId: Random.id(),
  icon: 'fa fa-email',
  enabled: true
});
