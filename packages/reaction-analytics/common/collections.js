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
    "settings.public.analyticsSettings.FacebookCustomAudiences.pixelId": {
      type: String,
      label: "Facebook PixelId",
      optional: true
    }
  }
]);
