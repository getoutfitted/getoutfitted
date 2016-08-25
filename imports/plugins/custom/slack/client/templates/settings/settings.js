import { Template } from 'meteor/templating';
import { Reaction } from '/client/api';
import { Packages } from '/lib/collections';
import { SlackPackageConfig } from '../../../lib/collections';

import './settings.html';

Template.slackSettings.helpers({
  SlackPackageConfig: function () {
    return SlackPackageConfig;
  },
  packageData: function () {
    return Packages.findOne({
      name: 'slack',
      shopId: Reaction.getShopId()
    });
  }
});

AutoForm.hooks({
  'slack-update-form': {
    onSuccess: function (operation, result, template) {
      Alerts.removeSeen();
      return Alerts.add('Slack settings saved.', 'success', {
        autoHide: true
      });
    },
    onError: function (operation, error, template) {
      Alerts.removeSeen();
      return Alerts.add('Slack settings update failed. ' + error, 'danger');
    }
  }
});
