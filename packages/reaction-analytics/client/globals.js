ReactionAnalytics.track = function (analyticsEvent) {
  // do nothing if event has no value
  if (analyticsEvent.value) {
    if (typeof ga === "function") {
      ga("send", "event", analyticsEvent.category, analyticsEvent.action, analyticsEvent.label,
        analyticsEvent.value);
    }
    if (typeof mixpanel === "object" && mixpanel.length > 0) {
      mixpanel.track(analyticsEvent.action, {
        "Category": analyticsEvent.category,
        "Label": analyticsEvent.label,
        "Value": analyticsEvent.value
      });
    }
    if (typeof analytics === "object" && analytics.VERSION.length > 0) {
      analytics.track(analyticsEvent.action, {
        "Category": analyticsEvent.category,
        "Label": analyticsEvent.label,
        "Value": analyticsEvent.value
      });
    }
    console.log("ReactionCore analytics event", analyticsEvent);
    return ReactionCore.Collections.AnalyticsEvents.insert(analyticsEvent);
  }
};

ReactionAnalytics.page = function () {};
