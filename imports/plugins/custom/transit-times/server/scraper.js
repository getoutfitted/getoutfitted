TransitTimes.scrapeUPSTransitTimes = function () {
  let addrs = ReactionCore.Collections.TransitTimes.find({upsTransitTime: null}, {limit: 5000});
  let total = addrs.count();
  let count = 0;
  addrs.forEach(function (addr) {
    Meteor.setTimeout(() => {
      try {
        let tt = TransitTimes.UPS.getUPSTransitTime({address1: '', city: addr.city, region: addr.stateAbbr, postal: addr.postal, country: 'US'});
        TransitTimes.update({postal: addr.postal}, {$set: {upsTransitTime: tt}});
        count++;
        if (count % 100 === 0) {
          ReactionCore.Log.info('-------');
          ReactionCore.Log.info(`Import Number ${count} of ${total}`);
          ReactionCore.Log.info('-------');
        }
      } catch (e) {
        TransitTimes.update({postal: addr.postal}, {$set: {upsTransitTime: 7}});
      }
    }, 10);
  });
};

TransitTimes.scrapeFedExTransitTimes = function () {
  let addrs = ReactionCore.Collections.TransitTimes.find({fedexTransitTime: null}, {limit: 5000});
  addrs.forEach(function (addr) {
    Meteor.setTimeout(() => {
      try {
        let tt = TransitTimes.FedExApi.getFedexTransitTime({address1: '123 Anywhere St', city: addr.city, region: addr.stateAbbr, postal: addr.postal, country: 'US'});
        TransitTimes.update({postal: addr.postal}, {$set: {fedexTransitTime: tt}});
        ReactionCore.Log.info(`Transit time of ${tt} set for Fedex for zipcode ${addr.postal}`);
      } catch (e) {
        TransitTimes.update({postal: addr.postal}, {$set: {fedexTransitTime: 7}});
        ReactionCore.Log.info(`Error getting transit time for Fedex for zipcode ${addr.postal}`);
      }
    }, 100);
  });
};
