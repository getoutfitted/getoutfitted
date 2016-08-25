import { SimpleSchema } from "meteor/aldeed:simple-schema";
import { PackageConfig } from "/lib/collections/schemas/registry";

export const ZopimPackageConfig = new SimpleSchema([
  PackageConfig, {
    'settings.public': {
      type: Object,
      optional: true
    },
    'settings.public.chatWidget': {
      type: String,
      label: 'Live Chat Widget URL',
      min: 50,
      optional: true
    }
  }
]);

