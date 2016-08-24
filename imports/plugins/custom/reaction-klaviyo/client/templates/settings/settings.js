import { Template } from 'meteor/templating';
import { Packages } from '/lib/collections';
import { Reaction } from '/client/api';
import { KlaviyoPackageConfig } from '../../../lib/collections';

import './settings.html';

Template.klaviyoSettings.helpers({
  KlaviyoPackageConfig() {
    return KlaviyoPackageConfig;
  },
  packageData: function () {
    return Packages.findOne({
      name: 'reaction-klaviyo',
      shopId: Reaction.getShopId()
    });
  }
});

AutoForm.hooks({
  'klaviyo-update-form': {
    onSuccess: function (operation, result, template) {
      Alerts.removeSeen();
      return Alerts.add('Klaviyo settings saved.', 'success', {
        autoHide: true
      });
    },
    onError: function (operation, error, template) {
      Alerts.removeSeen();
      return Alerts.add('Klaviyo settings update failed. ' + error, 'danger');
    }
  }
});
