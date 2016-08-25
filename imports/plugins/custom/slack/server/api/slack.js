import { check } from 'meteor/check'
import { Reaction, Logger } from '/server/api';
import { Packages } from '/lib/collections';
import { _ } from 'meteor/underscore';
import { HTTP } from 'meteor/http';

export const Slack = {};

Slack.PostMessage = function (options, attachments) {
  check(options, Object);
  check(attachments, Match.Optional([Object]))
  if (options.channel && options.text) {
    const slackPackage = Packages.findOne({
      name: 'slack',
      shopId: Reaction.getShopId()
    });
    if (slackPackage && slackPackage.enabled) {
      if (slackPackage.settings && slackPackage.settings.api && slackPackage.settings.api.token) {
        _.extend(options, {
          token: slackPackage.settings.api.token,
        });
        if (attachments) {
          _.extend(options, {attachments: JSON.stringify(attachments)});
        }
        try {
          HTTP.call('POST',
            'https://slack.com/api/chat.postMessage',
            {
              params: options,
            });
          Logger.info(`Slack message posted to ${options.channel}`);
        } catch (err) {
          Logger.error('Error in making call to Slack API' + err);
        }
      } else {
        Logger.error('Slack is missing it\'s API Token');
      }
    } else {
      Logger.error('Slack package is not enabled.');
    }
  } else {
    Logger.error('Channel or Text is missing, and preventing Slack Package.');
  }
}
