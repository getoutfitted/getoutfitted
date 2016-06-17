Meteor.startup(function () {
  Tracker.autorun(function () {
    let coreAnalytics;
    let googleAnalytics;
    let mixpanel;
    let segmentio;

    coreAnalytics = ReactionCore.Collections.Packages.findOne({
      name: "reaction-analytics"
    });

    if (!coreAnalytics || !coreAnalytics.enabled) {
      Alerts.removeType("analytics-not-configured");
      return;
    }

    segmentio = coreAnalytics.settings.public.segmentio;
    googleAnalytics = coreAnalytics.settings.public.googleAnalytics;
    mixpanel = coreAnalytics.settings.public.mixpanel;

    if (segmentio.enabled) {
      if (segmentio.api_key) {
        analytics.load(coreAnalytics.settings.public.segmentio.api_key);
        return;
      } else if (!segmentio.api_key && Roles.userIsInRole(Meteor.user(), "admin")) {
        _.defer(function () {
          return Alerts.toast(
            `Segment Write Key is not configured.
            <a href="/dashboard/settings/reaction-analytics">Configure now</a>
            or <a href="/dashboard">disable the Analytics package</a>.`,
            "danger", {
              html: true,
              sticky: true
            });
        });
      }
    }
    if (googleAnalytics.enabled) {
      if (googleAnalytics.api_key) {
        ga("create", coreAnalytics.settings.public.googleAnalytics.api_key, "auto");
      } else if (!googleAnalytics.api_key && Roles.userIsInRole(Meteor.user(), "admin")) {
        _.defer(function () {
          return Alerts.toast(
            `Google Analytics Property is not configured.
            <a href="/dashboard/settings/reaction-analytics">Configure now</a>
            or <a href="/dashboard">disable the Analytics package</a>.`,
            "error", {
              type: "analytics-not-configured",
              html: true,
              sticky: true
            });
        });
      }
    }
    if (mixpanel.enabled) {
      if (mixpanel.api_key) {
        mixpanel.init(coreAnalytics.settings.public.mixpanel.api_key);
      } else if (!mixpanel.api_key && Roles.userIsInRole(Meteor.user(), "admin")) {
        _.defer(function () {
          return Alerts.toast(
            `Mixpanel token is not configured.
            <a href="/dashboard/settings/reaction-analytics">Configure now</a> or
            <a href="/dashboard">disable the Analytics package</a>.`,
            "error", {
              type: "analytics-not-configured",
              html: true,
              sticky: true
            });
        });
      }
    }
    if (!Roles.userIsInRole(Meteor.user(), "admin")) {
      Alerts.removeType("analytics-not-configured");
    }
  });

  $(document.body).click(function (e) {
    let $targets = $(e.target).closest("*[data-event-action]");
    $targets = $targets.parents("*[data-event-action]").add($targets);

    $targets.each(function (index, element) {
      const $element = $(element);
      const event = $element.data("event-action");
      const data = $element.data();

      let properties = Object.keys(data).reduce(
        function (props, attr) {
          // if the data value is defined and starts with "event"
          if (data[attr] && attr.indexOf("event") === 0) {
            // don't save the event action, we'll pass that separately
            if (attr !== "eventAction") {
              // create a new property that is the `data-event`
              // strip "event" and lowercase the result;
              const prop = attr.replace("event", "").toLowerCase();
              // add new property to props object.
              props[prop] = data[attr];
            }
          }
          return props;
        }, {});

      // call ReactionAnalytics
      ReactionAnalytics.track(event, properties);
    });
  });
});
