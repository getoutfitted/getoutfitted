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
import { GetOutfitted } from "/imports/plugins/custom/getoutfitted-core/server/api";

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

function holidayCount(beginTransit, endTransit) {
  const transitPack = Packages.findOne({
    name: 'transit-times',
    shopId: getShopId()
  });
  let numberOfHolidaysWhileInTransit = 0;
  if (transitPack && transitPack.settings && transitPack.settings.shippingHolidays) {
    const holidays = transitPack.settings.shippingHolidays;

    holidays.forEach(function (holiday) {
      if (+holiday >= +beginTransit && +holiday <= +endTransit) {
        numberOfHolidaysWhileInTransit++;
      }
    });
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
      this.restockDay = this.calculateRestockDay();
    }
  }
  getStartTime() {
    return this.startTime;
  }

  getEndTime() {
    return this.endTime;
  }

  getSelectedProvider() {
    return this.settings.selectedShippingProvider;
  }

  getArriveBy() {
    return this.arriveBy;
  }

  getShipReturnBy() {
    return this.shipReturnBy;
  }

  getShipmentDate() {
    return this.shipmentDate;
  }

  getReturnDate() {
    return this.returnDate;
  }

  getAPIAuth() {
    if (this.settings.selectedShippingProvider) {
      let provider = this.settings.selectedShippingProvider;
      provider = provider.toLowerCase();
      return this.settings[provider];
    }
    Logger.warn('No Shipping Provided Selected');
    return false;
  }

  isLocalDelivery() {
    if (this.settings && this.settings.localDeliveryPostalCodes) {
      return this.settings.localDeliveryPostalCodes.indexOf(this.postal) !== -1;
    }
    return false;
  }

  // TODO: Not sure why this is uppercase - should refactor to camelcase.
  TransitTimesCache() {
    const transitTime = TransitTimesCache.findOne({
      postal: this.postal
    });
    if (transitTime) {
      let provider = "ups";
      if (this.settings && this.settings.selectedShippingProvider) {
        provider = this.settings.selectedShippingProvider.toLowerCase();
      }

      this.transitTime = transitTime[provider + 'TransitTime'];
      return transitTime[provider + 'TransitTime'];
    }
    // XXX: what happens when we return false here?
    Logger.warn(`Transit Time for ${this.postal} is not in transtimescache`);
    // Should hit API instead of returning false.
    return false;
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

    const holidays = holidayCount(moment(start).subtract(weekendArrivalDays + this.transitTime, "days").toDate(), this.arriveBy);
    weekendArrivalDays += holidays;
    const shippingDay = moment(start).subtract(this.transitTime + weekendArrivalDays, "days");
    if (shippingDay.isoWeekday() + this.transitTime >= 6) {
      shippingDay.subtract(2, "days");
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

    weekendReturnDays += holidayCount(this.shipReturnBy, moment(end).add(weekendReturnDays + this.transitTime, "days").toDate());
    const returnDay = moment(end).add(this.transitTime + weekendReturnDays, "days");
    const weekday = returnDay.isoWeekday();
    if (weekday + this.transitTime >= 6) {
      // Bunch of weird edge cases here, math doesn't work out for returns the same
      // as it does for shipping. If isoWeekday is 5 (Fri) or 4 (Thu) and transit time is 2,3, or 4
      // we don't overlap a weekend.
      if (weekday < 4 || weekday > 5 || weekday <= this.transitTime) {
        returnDay.add(2, "days");
      }
    }
    return returnDay.toDate();
  }

  // Item is available for shipping the day after Restock Day
  calculateRestockDay() {
    const returnDay = this.returnDate;
    const turnaroundTime = GetOutfitted.settings.getTurnaroundTime();
    return moment(returnDay).add(turnaroundTime, "days").toDate();
  }

  calculateTotalShippingDays() {
    if (this.transitTime === 0) {
      return 1;
    }

    const start = moment(this.arriveBy);
    let days = 0;
    if (start.isoWeekday() === 6) {
      days = days + 1;
    } else if (start.isoWeekday() === 7) {
      days = days + 2;
    }

    days = days + this.transitTime;
    const holidays = holidayCount(moment(start).subtract(days, "days").toDate(), this.arriveBy);
    days += holidays;

    const shippingDay = moment(start).subtract(days, "days");
    if (shippingDay.isoWeekday() + this.transitTime >= 6) {
      days = days + 2;
    }
    return days + 1;
  }

  calculateTotalReturnDays() {
    if (this.transitTime === 0) {
      return 1;
    }

    const end = moment(this.shipReturnBy);
    let days = 0;
    if (end.isoWeekday() === 6) {
      days = days + 2;
    } else if (end.isoWeekday() === 7) {
      days = days + 1;
    }

    days += this.transitTime;
    const holidays = holidayCount(this.shipReturnBy, moment(end).add(days, "days").toDate());
    days += holidays;

    const weekday = end.isoWeekday();
    if (weekday + this.transitTime >= 6) {
      // Bunch of weird edge cases here, math doesn't work out for returns the same
      // as it does for shipping. If isoWeekday is 5 (Fri) or 4 (Thu) and transit time is 2,3, or 4
      // we don't overlap a weekend.
      if (weekday < 4 || weekday > 5 || weekday <= this.transitTime) {
        days += 2;
      }
    }
    return days + 1;
  }
}
