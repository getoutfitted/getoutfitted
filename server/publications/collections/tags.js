import { Tags } from "/lib/collections";
import { Reaction } from "/server/api";

/**
 * tags
 */
Meteor.publish("Tags", function () {
  const shopId = Reaction.getShopId();
  if (!shopId) {
    return this.ready();
  }
  return Tags.find({
    shopId: shopId
  });
});

/**
 * tags
 */
Meteor.publish("TagByRoute", function (slug) {
  check(slug, Match.Maybe(String));
  const shopId = Reaction.getShopId();
  if (!shopId || !slug) {
    return this.ready();
  }

  return Tags.find({
    shopId: shopId,
    slug: slug
  });
});
