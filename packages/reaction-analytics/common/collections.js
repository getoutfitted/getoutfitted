/*
 *  AnalyticsEvents Collection
 *  Store the Analytics Events in a Collection
 */


// ReactionCore.Schemas.AnalyticsEvents = new SimpleSchema({
//   eventType: {
//     type: String
//   },
//   category: {
//     type: String,
//     optional: true
//   },
//   action: {
//     type: String,
//     optional: true
//   },
//   label: {
//     type: String,
//     optional: true
//   },
//   value: {
//     type: String,
//     optional: true
//   },
//   user: {
//     type: Object,
//     optional: true
//   },
//   'user.id': {
//     type: String,
//     regEx: SimpleSchema.RegEx.Id,
//     optional: true,
//     autoValue: function() {
//       return Meteor.userId()
//     }
//   },
//   'user.isAnonymous': {
//     type: Boolean,
//     optional: true,
//     autoValue: function() {
//       return Roles.userIsInRole(Meteor.user(), 'anonymous', ReactionCore.getShopId())
//     }
//   },
//   shopId: {
//     type: String,
//     regEx: SimpleSchema.RegEx.Id,
//     autoValue: ReactionCore.shopIdAutoValue,
//     label: "AnalyticsEvents shopId"
//   },
//   createdAt: {
//     type: Date,
//     autoValue: function() {
//       return new Date
//     }
//   },
//   // Any additional data
//   data: {
//     type: Object,
//     blackbox: true,
//     optional: true
//   }
// })
//
// ReactionCore.Collections.AnalyticsEvents = new Mongo.Collection('AnalyticsEvents');
//
// ReactionCore.Collections.AnalyticsEvents.attachSchema(ReactionCore.Schemas.AnalyticsEvents);


/*
 *   Analytics
 *   api_key: "UA-XXXXX-X" (this is your tracking ID)
 */

ReactionCore.Schemas.ReactionAnalyticsPackageConfig = new SimpleSchema([
  ReactionCore.Schemas.PackageConfig, {
    "settings.public.analyticsSettings.GoogleAnalytics.trackingId": {
      type: String,
      label: "Tracking Id",
      optional: true
    },
    "settings.public.analyticsSettings.Amplitude.apiKey": {
      type: String,
      label: "Amplitude API Key",
      optional: true
    },
    "settings.public.analyticsSettings.Chartbeat.uid": {
      type: String,
      label: "Chartbeat UID",
      optional: true
    },
    "settings.public.analyticsSettings.comScore.c2": {
      type: String,
      label: "Comscore C2",
      optional: true
    },
    "settings.public.analyticsSettings.HubSpot.portalId": {
      type: String,
      label: "HubSpot Portal Id",
      optional: true
    },
    "settings.public.analyticsSettings.Intercom.appId": {
      type: String,
      label: "Intercom App Id",
      optional: true
    },
    "settings.public.analyticsSettings.KeenIO.projectId": {
      type: String,
      label: "KeenIO Project Id",
      optional: true
    },
    "settings.public.analyticsSettings.KeenIO.writeKey": {
      type: String,
      label: "KeenIO writeKey",
      optional: true
    },
    "settings.public.analyticsSettings.KISSmetrics.apiKey": {
      type: String,
      label: "KISSmetrics API Key",
      optional: true
    },
    "settings.public.analyticsSettings.Mixpanel.token": {
      type: String,
      label: "Mixpanel Token",
      optional: true
    },
    "settings.public.analyticsSettings.Mixpanel.people": {
      type: Boolean,
      label: "Mixpanel People",
      optional: true
    },
    "settings.public.analyticsSettings.Quantcast.pCode": {
      type: String,
      label: "Quantcast pCode",
      optional: true
    },
    "settings.public.analyticsSettings.Segmentio.apiKey": {
      type: String,
      label: "Segment.io API Key",
      optional: true
    },
  }
]);
