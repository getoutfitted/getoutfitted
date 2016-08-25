import { SimpleSchema } from "meteor/aldeed:simple-schema";
import { PackageConfig } from "/lib/collections/schemas/registry";

export const SlackPackageConfig = new SimpleSchema([
  PackageConfig, {
    'settings.api.token': {
      type: String,
      label: 'Slack App Token',
      optional: true
    }
  }
]);
