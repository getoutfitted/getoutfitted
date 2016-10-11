import { Meteor } from 'meteor/meteor';
import { Reaction } from '/server/api';
import { Packages } from '/lib/collections';

const _getSettings = function () {
  const tt = Packages.findOne({
    name: 'transit-times',
    shopId: Reaction.getShopId()
  });

  if (!tt) {
    throw new Meteor.Error(500, "TransitTimes package not found ");
  }

  return tt.settings;
};

export const getAPIAuth = function (provider) {
  const settings = _getSettings();
  if (provider === 'ups') {
    return settings.ups;
  }
  if (provider === 'fedex') {
    return settings.fedex;
  }

  throw new Meteor.Error(404, `Shipping provider ${provider} not found or setup`);
};
