import { Meteor } from 'meteor/meteor';
import { Logger } from '/server/api';
import { TransitTimesCache } from '../../lib/collections';
import { FedExApi } from './transitOptions/fedex';
import { UPSAPI } from './transitOptions/ups';

export const Scraper = {};
Scraper.scrapeUPSTransitTimes = function () {
  let addrs = TransitTimesCache.find({upsTransitTime: null}, {limit: 5000});
  let total = addrs.count();
  let count = 0;
  addrs.forEach(function (addr) {
    Meteor.setTimeout(() => {
      try {
        let tt = UPSAPI({address1: '', city: addr.city, region: addr.stateAbbr, postal: addr.postal, country: 'US'});
        TransitTimesCache.update({postal: addr.postal}, {$set: {upsTransitTime: tt}});
        count++;
        if (count % 100 === 0) {
          Logger.info('-------');
          Logger.info(`Import Number ${count} of ${total}`);
          Logger.info('-------');
        }
      } catch (e) {
        TransitTimesCache.update({postal: addr.postal}, {$set: {upsTransitTime: 7}});
      }
    }, 10);
  });
};

Scraper.scrapeFedExTransitTimes = function () {
  let addrs = TransitTimesCache.find({fedexTransitTime: null}, {limit: 5000});
  addrs.forEach(function (addr) {
    Meteor.setTimeout(() => {
      try {
        let tt = FedExApi({address1: '123 Anywhere St', city: addr.city, region: addr.stateAbbr, postal: addr.postal, country: 'US'});
        TransitTimesCache.update({postal: addr.postal}, {$set: {fedexTransitTime: tt}});
        ReactionCore.Log.info(`Transit time of ${tt} set for Fedex for zipcode ${addr.postal}`);
      } catch (e) {
        TransitTimesCache.update({postal: addr.postal}, {$set: {fedexTransitTime: 7}});
        Logger.info(`Error getting transit time for Fedex for zipcode ${addr.postal}`);
      }
    }, 100);
  });
};
