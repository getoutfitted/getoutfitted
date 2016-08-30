import { check } from 'meteor/check';
import moment from 'moment';
import 'twix';


export const dateHelper = {};

dateHelper.isWeekend = function (date) {
  check(date, Date);
  return moment(date).isoWeekday() === 7 || moment(date).isoWeekday() === 6;
};

dateHelper.isSunday = function (date) {
  check(date, Date);
  return moment(date).isoWeekday() === 7;
};

dateHelper.isSaturday = function (date) {
  check(date, Date);
  return moment(date).isoWeekday() === 6;
};

// This feels a bit misleading as it returns the current day unless it's a weekend.
dateHelper.previousBusinessDay = function (date) {
  check(date, Date);
  if (this.isSunday(date)) {
    return moment(date).subtract(2, 'days');
  } else if (this.isSaturday(date)) {
    return moment(date).subtract(1, 'days');
  }
  return date;
};

// Name and return value don't really match here
dateHelper.nextBusinessDay = function (date) {
  check(date, Date);
  if (this.isSunday(date)) {
    return moment(date).add(1, 'days').toDate();
  } else if (this.isSaturday(date)) {
    return moment(date).add(2, 'days').toDate();
  }
  return date;
};

dateHelper.ifWeekendSetPreviousBizDay = function (date) {
  check(date, Date);
  if (dateHelper.isWeekend(date)) {
    date = dateHelper.previousBusinessDay(date);
  }
  return moment(date);
};

dateHelper.ifWeekendSetNextBizDay = function (date) {
  check(date, Date);
  if (dateHelper.isWeekend(date)) {
    date = dateHelper.nextBusinessDay(date);
  }
  return moment(date);
};

dateHelper.enoughBizDaysForTransit = function (startDate, endDate, transitTime) {
  check(startDate, Date);
  check(endDate, Date);
  check(transitTime, Number);
  let bizDays = 0;
  let range = moment(startDate).twix(endDate, {allDay: true});
  let iter = range.iterate('days');
  while (iter.hasNext()) {
    let dayOfTheWeek = iter.next().isoWeekday();
    if (dayOfTheWeek < 6) {
      bizDays++;
    }
  }
  return bizDays >= transitTime;
};

dateHelper.determineShipReturnByDate = function (endTime) {
  check(endTime, Date);
  let shipReturnBy = moment(endTime).add(1, 'day');
  shipReturnBy = dateHelper.ifWeekendSetNextBizDay(shipReturnBy.toDate());
  return shipReturnBy.toDate();
};

dateHelper.determineArrivalDate = function (startTime) {
  check(startTime, Date);
  let arrivalDate = moment(startTime).subtract(1, 'day');
  arrivalDate = dateHelper.ifWeekendSetPreviousBizDay(arrivalDate.toDate());
  return arrivalDate.toDate();
};

dateHelper.determineShipmentDate = function (arrivalDate, transitTime) {
  check(arrivalDate, Date);
  check(transitTime, Number);
  let shipmentDate = moment(arrivalDate).subtract(transitTime, 'days');
  let enoughTransitTime = false;
  while (enoughTransitTime === false) {
    enoughTransitTime = dateHelper.enoughBizDaysForTransit(shipmentDate.toDate(), arrivalDate, transitTime);
    shipmentDate = moment(shipmentDate).subtract(1, 'day');
  }
  shipmentDate = dateHelper.ifWeekendSetPreviousBizDay(shipmentDate.toDate());
  return shipmentDate.toDate();
};

dateHelper.determineReturnDate = function (shipReturnBy, transitTime) {
  check(shipReturnBy, Date);
  check(transitTime, Number);
  let returnDate = moment(shipReturnBy).add(transitTime, 'days');
  let enoughTransitTime = false;
  while (enoughTransitTime === false) {
    enoughTransitTime = dateHelper.enoughBizDaysForTransit(shipReturnBy, returnDate.toDate(), transitTime);
    returnDate = moment(returnDate).add(1, 'day');
  }
  returnDate = dateHelper.ifWeekendSetNextBizDay(returnDate.toDate());
  return returnDate.toDate();
};
