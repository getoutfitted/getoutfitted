import { _ } from 'meteor/underscore';
import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { TransitTimesCache } from '../../lib/collections';
import { Packages } from '/lib/collections';
import { getShopId } from '/lib/api';
import { FedExApi } from './transitOptions/fedex';
import { UPS } from './transitOptions/ups';
import { dateHelper } from './transitOptions/dateHelpers';

export const TransitTimes = {
  FedExApi: FedExApi,
  date: dateHelper,
  UPS: UPS
};

TransitTimes._getSettings = function () {
  const tt = Packages.findOne({
    name: 'transit-times',
    shopId: getShopId()
  });
  if (!tt) {
    throw new Meteor.Error(500, 'TransitTimes package not found');
  }
  return tt.settings;
};

TransitTimes.getSelectedProvider = function () {
  const settings = TransitTimes._getSettings();
  return settings.selectedShippingProvider; // Changed from `selectedShipping`
};

TransitTimes.getDefaultTransitTime = function () {
  const settings = TransitTimes._getSettings();
  return settings.defaultTransitTime || 4;
};

TransitTimes.getLocalDeliveryPostalCodes = function () {
  const settings = TransitTimes._getSettings();
  return settings.localDeliveryPostalCodes || [];
};

TransitTimes.getAPIAuth = function (provider) {
  const settings = TransitTimes._getSettings();
  if (provider === 'ups') {
    return settings.ups;
  }
  if (provider === 'fedex') {
    return settings.fedex;
  }

  throw new Meteor.Error(404, `Shipping provider ${provider} not found or setup`);
};

// What is this doing?
TransitTimes.formatAddress = function (address) {
  let shippingAddress = {};
  shippingAddress.address1 = address.address1;
  if (address.address2) {
    shippingAddress.address2 = address.address2;
  }
  shippingAddress.city = address.city;
  shippingAddress.region = address.region;
  shippingAddress.postal = address.postal;
  shippingAddress.country = address.country;
  return shippingAddress;
};


TransitTimes.isLocalDelivery = function (postal) {
  check(postal, String);
  localPostalCodes = TransitTimes.getLocalDeliveryPostalCodes();
  return _.contains(localPostalCodes, postal);
};

/**
 * Calculates the time in transit for an order
 * Calculation is based on the destination of the order,
 * the shipping location and the provider used for shipping.
 * @param   {Object} shippingAddress a ReactionCommerce order shipping address
 * @returns {Number}       number of business days in transit
 */
TransitTimes.calculateTransitTime = function (shippingAddress) {
  const destinationPostal = shippingAddress.postal;
  const isLocalDelivery = TransitTimes.isLocalDelivery(destinationPostal);
  if (isLocalDelivery) {
    return 0; // TransitTimes.localDeliveryTime()
  }

  const defaultTransitTime = TransitTimes.getDefaultTransitTime();
  const shippingProvider = TransitTimes.getSelectedProvider();
  const transitTime = TransitTimesCache.findOne({
    postal: shippingAddress.postal
  });
  const formattedShippingAddress = TransitTimes.formatAddress(shippingAddress);

  if (shippingProvider === 'UPS') {
    if (transitTime) {
      return transitTime.upsTransitTime;
    }
    return UPS.getUPSTransitTime(formattedShippingAddress) || defaultTransitTime;
  }

  if (shippingProvider === 'Fedex') {
    if (transitTime) {
      return transitTime.fedexTransitTime;
    }
    return TransitTimes.FedExApi.getFedexTransitTime(formattedShippingAddress) || defaultTransitTime;
  }

  return defaultTransitTime;
};


TransitTimes.calculateTransitTimeByOrder = function (order) {
  const shippingAddress = order.shipping[0].address;
  return TransitTimes.calculateTransitTime(shippingAddress);
};

TransitTimes.calculateShippingDay = function (startTime, timeInTransit) {
  if (timeInTransit === 0) {
    return startTime;
  }

  let start = moment(startTime);
  let weekendArrivalDays = 0;
  if (start.isoWeekday() === 6) {
    weekendArrivalDays = weekendArrivalDays + 1;
  } else if (start.isoWeekday() === 7) {
    weekendArrivalDays = weekendArrivalDays + 2;
  }


  let shippingDay = moment(start).subtract(timeInTransit + weekendArrivalDays, 'days');
  if (shippingDay.isoWeekday() + timeInTransit >= 6) {
    return shippingDay.subtract(2, 'days').toDate();
  }
  return shippingDay.toDate();
};

TransitTimes.calculateShippingDayByOrder = function (order) {
  return TransitTimes.calculateShippingDay(
    order.startTime,
    TransitTimes.calculateTransitTimeByOrder(order)
  );
};

TransitTimes.calculateTotalShippingDays = function (startTime, timeInTransit) {
  check(startTime, Match.Optional(Date));
  check(timeInTransit, Number);
  if (timeInTransit === 0) {
    return 0;
  }

  let start = moment(startTime);
  let days = 0;
  if (start.isoWeekday() === 6) {
    days = days + 1;
  } else if (start.isoWeekday() === 7) {
    days = days + 2;
  }

  days = days + timeInTransit;
  let shippingDay = moment(start).subtract(days, 'days');
  if (shippingDay.isoWeekday() + timeInTransit >= 6) {
    days = days + 2;
  }
  return days;
};

TransitTimes.calculateTotalShippingDaysByOrder = function (order) {
  return TransitTimes.calculateTotalShippingDays(
    order.startTime,
    TransitTimes.calculateTransitTimeByOrder(order)
  );
};


// Calculates the day an order should return to the warehouse
TransitTimes.calculateReturnDay = function (endTime, timeInTransit) {
  check(endTime, Match.Optional(Date));
  check(timeInTransit, Number);

  if (timeInTransit === 0) {
    return endTime;
  }

  let end = moment(endTime);
  let weekendReturnDays = 0;
  if (end.isoWeekday() === 6) {
    weekendReturnDays = weekendReturnDays + 2;
  } else if (end.isoWeekday() === 7) {
    weekendReturnDays = weekendReturnDays + 1;
  }

  let dropoffDay = moment(end).add(weekendReturnDays, 'days');
  let returnDay = moment(end).add(timeInTransit + weekendReturnDays, 'days');
  if (dropoffDay.isoWeekday() + timeInTransit >= 6) {
    return returnDay.add(2, 'days').toDate();
  }
  return returnDay.toDate();
};

// Calculates the day an order should return to the warehouse
TransitTimes.calculateReturnDayByOrder = function (order) {
  return TransitTimes.calculateReturnDay(
    order.endTime,
    TransitTimes.calculateTransitTimeByOrder(order)
  );
};

// Calculates the day an order should return to the warehouse
TransitTimes.calculateTotalReturnDays = function (endTime, timeInTransit) {
  check(endTime, Match.Optional(Date));
  check(timeInTransit, Number);

  if (timeInTransit === 0) {
    return 0;
  }

  let end = moment(endTime);
  let days = 0;
  if (end.isoWeekday() === 6) {
    days = days + 2;
  } else if (end.isoWeekday() === 7) {
    days = days + 1;
  }

  let dropoffDay = moment(end).add(days, 'days');
  days = days + timeInTransit;
  if (dropoffDay.isoWeekday() + timeInTransit >= 6) {
    days = days + 2;
  }
  return days;
};

// Calculates the day an order should return to the warehouse
TransitTimes.calculateTotalReturnDaysByOrder = function (order) {
  return TransitTimes.calculateTotalReturnDays(
    order.endTime,
    TransitTimes.calculateTransitTimeByOrder(order)
  );
};
