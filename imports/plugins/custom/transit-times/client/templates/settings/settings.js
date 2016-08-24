import { Template } from 'meteor/templating';
import { Reaction } from '/client/api';
import { Packages } from '/lib/collections';
import { TransitTimesPackageConfig } from '../../../lib/collections/schemas';

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
