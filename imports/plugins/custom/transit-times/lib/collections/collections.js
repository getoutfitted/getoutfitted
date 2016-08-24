import { Mongo } from 'meteor/mongo';
import * as Schemas from './schemas';

export const TransitTimesCache = new Mongo.Collection('TransitTimes');

TransitTimesCache.attachSchema(Schemas.TransitTimesCache);
