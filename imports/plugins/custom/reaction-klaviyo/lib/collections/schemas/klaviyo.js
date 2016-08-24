import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { PackageConfig } from '/lib/collections/schemas/registry';

export const KlaviyoPackageConfig = new SimpleSchema([
  PackageConfig, {
    'settings.api.publicKey': {
      type: String,
      label: 'Klaviyo Public Key',
      optional: true
    },
    'settings.api.privateKey': {
      type: String,
      label: 'Klaviyo Private API Key',
      optional: true
    }
  }
]);
