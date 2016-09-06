import { Meteor } from 'meteor/meteor';
import JsonRoutes from 'meteor/simple:json-routes';
import { Packages } from '/lib/collections';
import { getShopId } from '/lib/api';
import { Logger } from '/server/api';

function verifyPreSharedKey(key, service) {
  const af = Packages.findOne({
    name: 'reaction-advanced-fulfillment',
    shopId: getShopId()
  });
  if (af && af.settings && af.settings[service].enabled) {
    return key === af.settings[service].preSharedKey;
  }

  Logger.error('Error verifying preSharedKey because AfterShip preshared key not found. ');
  return false;
}

JsonRoutes.add("post", "/dashboard/advanced-fullfillment/webhooks/aftership/post", function (req, res, next) {

  let keyMatches =  verifyPreSharedKey(req.query.key, 'aftership');
  if (keyMatches) {
    Logger.info('Successfully Authenticated Aftership Key.');
    Meteor.call('aftership/processHook', req.body);
    return JsonRoutes.sendResult(res, {code: 200});
  }
  return JsonRoutes.sendResult(res, {code: 403});
});

