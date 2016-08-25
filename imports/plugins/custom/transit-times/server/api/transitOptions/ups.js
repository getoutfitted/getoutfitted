// UPS = Npm.require('shipping-ups');
import upsAPI from 'shipping-ups';
import { Logger } from '/server/api';
import { Meteor } from 'meteor/meteor';
import { getAPIAuth } from './helpers';

export const UPS = {};

UPS.getUPSTransitTime = function (address) {
  check(address, {
    address1: String,
    address2: Match.Optional(String),
    fullName: Match.Optional(String),
    phone: Match.Optional(String),
    city: String,
    region: String,
    postal: String,
    country: String
  });
  const auth = getAPIAuth('ups');
  if (!auth) {
    return false;
  }

  let ups = new upsAPI({
    environment: 'sandbox', // or live
    username: auth.username,
    password: auth.password,
    access_key: auth.accessKey,
    imperial: true // set to false for metric
  });

  let data = {
    from: {
      city: 'Colorado Springs',
      state_code: 'CO',
      postal_code: '80903',
      country_code: 'US'
    },
    to: {
      city: address.city,
      state_code: address.region,
      postal_code: address.postal,
      country_code: 'US'
    },
    weight: 10, // set imperial to false for KGS
    total_packages: 1, // number of packages in shipment
    value: 9999.99 // Invoice value, set currency in options
  };

  let upsTimeInTransit = Meteor.wrapAsync(ups.time_in_transit);
  let results = upsTimeInTransit(data);

  if (results && results.TransitResponse && results.TransitResponse.ServiceSummary) {
    let groundInfo = _.find(results.TransitResponse.ServiceSummary, function (rates) {
      if (rates.Service && rates.Service.Description) {
        return rates.Service.Description === 'UPS Ground';
      }
    });
    let bizDays = groundInfo.EstimatedArrival.BusinessTransitDays;
    return parseInt(bizDays, 10);
  }

  // Back up if transit time fails
  Logger.warn('UPS Transit Time Not Calculated for ' + address);
  return false;
};

