import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { PackageConfig } from '/lib/collections/schemas/registry';

TransitTimesAddress = new SimpleSchema({
  address1: {
    type: String,
    optional: true,
    label: 'Address1'
  },
  address2: {
    type: String,
    optional: true,
    label: 'Address2'
  },
  city: {
    type: String,
    optional: true,
    label: 'City'
  },
  state: {
    type: String,
    optional: true,
    label: 'State'
  },
  zipcode: {
    type: String,
    optional: true,
    label: 'Zipcode'
  },
  countryCode: {
    type: String,
    optional: true,
    label: 'Country Code (Two letter country code)'
  }
});

export const TransitTimesPackageConfig = new SimpleSchema([
  PackageConfig, {
    'settings.fedex.key': {
      type: String,
      label: 'Fedex API key',
      optional: true
    },
    'settings.fedex.password': {
      type: String,
      label: 'Fedex API password',
      optional: true
    },
    'settings.fedex.accountNumber': {
      type: String,
      label: 'Fedex API Account Number',
      optional: true
    },
    'settings.fedex.meterNumber': {
      type: String,
      label: 'Fedex API Meter Number',
      optional: true
    },
    'settings.fedex.liveApi': {
      type: Boolean,
      label: 'Use Live API? (uncheck for testing)',
      optional: true,
      defaultValue: false
    },
    'settings.ups.liveApi': {
      type: Boolean,
      label: 'Use Live API? (uncheck for testing)',
      optional: true,
      defaultValue: false
    },
    'settings.ups.accessKey': {
      type: String,
      label: 'UPS Access Key',
      optional: true
    },
    'settings.ups.username': {
      type: String,
      label: 'UPS Username',
      optional: true
    },
    'settings.ups.password': {
      type: String,
      label: 'UPS Password',
      optional: true
    },
    'settings.selectedShippingProvider': {
      type: String,
      label: 'Carrier to calculate transit time',
      optional: true,
      allowedValues: ['UPS', 'Fedex']
    },
    'settings.shippingAddress': {
      type: TransitTimesAddress,
      optional: true
    },
    'settings.defaultTransitTime': {
      type: Number,
      optional: true
    },
    'settings.localDeliveryPostalCodes': {
      type: [String],
      optional: true
    }
  }
]);
