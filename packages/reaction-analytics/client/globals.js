// ReactionAnalytics.track = function (event, properties) {
//   // Must have event to continue
//   if (event) {
//     if (typeof analytics === "object" && analytics.VERSION.length > 0) {
//       analytics.track(event, properties);
//     }
//
//     if (typeof mixpanel === "object" && mixpanel.length > 0) {
//       mixpanel.track(event, properties);
//     }
//
//     const analyticsEvent = Object.assign({action: event, eventType: "event"}, properties);
//
//     if (typeof ga === "function") {
//       ga("send", "event", analyticsEvent.category, analyticsEvent.action, analyticsEvent.label,
//         analyticsEvent.value);
//     }
//     console.log("analyticsEvent", analyticsEvent);
//     // return ReactionCore.Collections.AnalyticsEvents.insert(analyticsEvent);
//   }
//   return false;
// };
//
// ReactionAnalytics.page = function () {};
