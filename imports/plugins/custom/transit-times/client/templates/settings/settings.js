import { Template } from 'meteor/templating';
import { Reaction } from '/client/api';
import { Packages } from '/lib/collections';
import { TransitTimesPackageConfig } from '../../../lib/collections/schemas';
import moment from 'moment';
import 'moment-timezone';
import './settings.html';

Template.transitTimesSettings.helpers({
  TransitTimesPackageConfig() {
    return TransitTimesPackageConfig;
  },
  packageData() {
    return Packages.findOne({
      name: 'transit-times',
      shopId: Reaction.getShopId()
    });
  },
  denverLocal() {
    return moment.tz.guess() === 'America/Denver';
  },
  displayDate() {
    return moment(this).format('MMMM Do, YYYY');
  },
  sortedHolidays() {
    const pg = Packages.findOne({
      name: 'transit-times',
      shopId: Reaction.getShopId()
    });
    if (pg && pg.settings && pg.settings.shippingHolidays) {
      return pg.settings.shippingHolidays.sort(function (date1, date2) {
        return +date1 - +date2;
      });
    }
    return [];
  }
});

AutoForm.hooks({
  'transit-times-update-form': {
    onSuccess: function (operation, result, template) {
      Alerts.removeSeen();
      return Alerts.add('Transit Times settings saved.', 'success', {
        autoHide: true
      });
    },
    onError: function (operation, error, template) {
      Alerts.removeSeen();
      return Alerts.add('Transit Times settings update failed. ' + error, 'danger');
    }
  }
});
