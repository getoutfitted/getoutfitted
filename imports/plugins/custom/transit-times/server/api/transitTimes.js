import { _ } from 'meteor/underscore';
import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { TransitTimesCache } from '../../lib/collections';
import { Packages } from '/lib/collections';
import { getShopId } from '/lib/api';
import { FedExApi } from './transitOptions/fedex';
import { UPSAPI } from './transitOptions/ups';
import { dateHelper } from './transitOptions/dateHelpers';
import { Logger } from '/server/api';

function getSettings() {
  const tt = Packages.findOne({
    name: 'transit-times',
    shopId: getShopId()
  });
  if (!tt) {
    Logger.warn('TransitTimes package not found');
    return {};
  }
  return tt.settings;
}

formatAddress = function (address) {
  const shippingAddress = {};
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

// Note begin Transit for shipping will be shipping day end will be arrival day
// On returning begin should be return ship date and end should be returndate
function holidayCount(beginTransit, endTransit) {
  // check(shippingOrReturning, String);
  // check(useDate, Date);
  // check(shipDate, Date);
  const transitPack = Packages.findOne({
    name: 'transit-times',
    shopId: getShopId()
  });
  const beginDate = +beginTransit;
  const endDate = + endTransit;
  let holidays;
  let numberOfHolidaysWhileInTransit = 0;
  if (transitPack && transitPack.settings && transitPack.settings.shippingHolidays) {
    holidays = transitPack.settings.shippingHolidays.map(function (date) {
      return +date;
    });
    const holidaysDuringTransit = holidays.filter(function(holiday) {
      if (holiday >= beginTransit && holiday <= endTransit) {
        return holiday;
      }
    });
    numberOfHolidaysWhileInTransit = holidaysDuringTransit.length;
  }
  return numberOfHolidaysWhileInTransit;
}

export class Transit {
  constructor(order) {
    this.orderNumber = order.orderNumber;
    this.startTime = order.startTime;
    this.endTime = order.endTime;
    this.shipping = formatAddress(order.shipping[0].address);
    this.postal = order.shipping[0].address.postal;
    this.settings = getSettings();
    this.transitTime = this.calculateTransitTime();
    this.arriveBy = dateHelper.determineArrivalDate(this.startTime);
    this.shipmentDate = this.calculateShippingDay();
    if (order.endTime) {
      this.shipReturnBy = dateHelper.determineShipReturnByDate(this.endTime);
      this.returnDate = this.calculateReturnDay();
    }
  }

  getSelectedProvider() {
    return this.settings.selectedShippingProvider;
  }

  getAPIAuth() {
    if (this.settings.selectedShippingProvider) {
      let provider = this.settings.selectedShippingProvider;
      provider = provider.toLowerCase();
      return this.settings[provider];
    } else {
      Logger.warn('No Shipping Provided Selected');
      return;
    }
  }

  isLocalDelivery() {
    return _.contains(this.settings.localPostalCodes, this.postal);
  }

  TransitTimesCache() {
    const transitTime = TransitTimesCache.findOne({
      postal: this.postal
    });
    if (transitTime && this.settings.selectedShippingProvider) {
      const provider = this.settings.selectedShippingProvider.toLowerCase();
      this.transitTime = transitTime[provider + 'TransitTime'];
      Logger.info('TransitTimeCache found transitTime');
      return transitTime[provider + 'TransitTime'];
    } else {
      Logger.warn(`Transit Time for ${this.postal} is not in transtimescache` );
      return false;
    }
  }

  calculateTransitTime() {
    if (this.isLocalDelivery()) {
      this.transitTime = 0;
      return this.transitTime;
    }
    if (this.TransitTimesCache()) {
      return this.transitTime;
    }
    const shippingProvider = this.getSelectedProvider();
    if (shippingProvider) {
      if (shippingProvider === 'UPS') {
        return UPSAPI(this.shipping);
      }

      if (shippingProvider === 'Fedex') {
        this.transitTime = FedExApi(this.shipping);
      }
    }

    return this.transitTime;
  }

  calculateShippingDay() {
    if (this.transitTime === 0) {
      return this.arriveBy;
    }

    const start = moment(this.arriveBy);
    let weekendArrivalDays = 0;
    if (start.isoWeekday() === 6) {
      weekendArrivalDays = weekendArrivalDays + 1;
    } else if (start.isoWeekday() === 7) {
      weekendArrivalDays = weekendArrivalDays + 2;
    }


    let shippingDay = moment(start).subtract(this.transitTime  + weekendArrivalDays, 'days');
    if (shippingDay.isoWeekday() + this.transitTime  >= 6) {
      shippingDay.subtract(2, 'days');
    }
    const countOfHolidays = holidayCount(shippingDay.toDate(), this.startTime);
    if (countOfHolidays > 0) {
      Logger.info(`Order ${this.orderNumber} subtracted ${countOfHolidays} for holiday shipping`);
      shippingDay.subtract(countOfHolidays, 'days');
      shippingDay = moment(dateHelper.ifWeekendSetPreviousBizDay(shippingDay.toDate()));
    }
    return shippingDay.toDate();
  }

  calculateReturnDay() {
    if (this.transitTime === 0) {
      return this.shipReturnBy;
    }
    const end = moment(this.shipReturnBy);
    let weekendReturnDays = 0;
    if (end.isoWeekday() === 6) {
      weekendReturnDays = weekendReturnDays + 2;
    } else if (end.isoWeekday() === 7) {
      weekendReturnDays = weekendReturnDays + 1;
    }

    const dropoffDay = moment(end).add(weekendReturnDays, 'days');
    let returnDay = moment(end).add(this.transitTime + weekendReturnDays, 'days');
    if (dropoffDay.isoWeekday() + this.transitTime >= 6) {
      returnDay.add(2, 'days');
    }
    const countOfHolidays = holidayCount(this.endTime, returnDay.toDate());
    if (countOfHolidays > 0) {
      Logger.info(`Order ${this.orderNumber} added ${countOfHolidays} for holiday returning`);
      returnDay.add(countOfHolidays, 'days');
      returnDay = moment(dateHelper.ifWeekendSetNextBizDay(returnDay.toDate()));
    }
    return returnDay.toDate();
  }

  calculateTotalShippingDays() {
    if (this.transitTime === 0) {
      return 0;
    }

    const start = moment(this.startTime);
    let days = 0;
    if (start.isoWeekday() === 6) {
      days = days + 1;
    } else if (start.isoWeekday() === 7) {
      days = days + 2;
    }

    days = days + this.transitTime;
    const shippingDay = moment(start).subtract(days, 'days');
    if (shippingDay.isoWeekday() + this.transitTime >= 6) {
      days = days + 2;
    }
    return days;
  }

  calculateTotalReturnDays() {
    if (this.transitTime === 0) {
      return 0;
    }

    const end = moment(this.endTime);
    let days = 0;
    if (end.isoWeekday() === 6) {
      days = days + 2;
    } else if (end.isoWeekday() === 7) {
      days = days + 1;
    }

    const dropoffDay = moment(end).add(days, 'days');
    days = days + this.transitTime;
    if (dropoffDay.isoWeekday() + this.transitTime >= 6) {
      days = days + 2;
    }
    return days;
  }
}
