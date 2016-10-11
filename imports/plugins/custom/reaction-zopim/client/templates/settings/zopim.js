import { Template } from "meteor/templating";
import { Reaction } from "/client/api";
import { Packages } from "/lib/collections";
import { ZopimPackageConfig } from "../../../lib/collections/schemas";

import './zopim.html';

Template.zopimSettings.helpers({
  ZopimPackageConfig() {
    return ZopimPackageConfig;
  },
  packageData() {
    return Packages.findOne({
      name: 'reaction-zopim',
      shopId: Reaction.getShopId()
    });
  }
});

AutoForm.hooks({
  'zopim-update-form': {
    onSuccess(operation, result, template) {
      Alerts.removeSeen();
      return Alerts.add('Zopim settings saved.', 'success', {
        autoHide: true
      });
    },
    onError(operation, error, template) {
      Alerts.removeSeen();
      return Alerts.add('Zopim settings update failed. ' + error, 'danger');
    }
  }
});

