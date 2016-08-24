import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const TransitTimesCache = new SimpleSchema({
  postal: {
    type: String,
    index: 1
  },
  city: {
    type: String,
    optional: true
  },
  state: {
    type: String,
    optional: true
  },
  stateAbbr: {
    type: String,
    optional: true
  },
  county: {
    type: String,
    optional: true
  },
  latitude: {
    type: Number,
    optional: true,
    decimal: true
  },
  longitude: {
    type: Number,
    optional: true,
    decimal: true
  },
  upsTransitTime: {
    type: Number,
    optional: true
  },
  fedexTransitTime: {
    type: Number,
    optional: true
  }
});
