import analytics from "../import/analytics";

// Inspired by and borrows liberally from okgrow:analytics
// This file in particular is a fork of meteor-analytics.js
// which is released under the MIT license
// https://github.com/okgrow/analytics/blob/master/client/meteor-analytics.js

// analytics.js might not have loaded it's integrations by the time we start
// tracking events, page views and identifies.
// So we can use these *WhenReady() functions to cause the action to be
// deferred until all the intgrations are ready.
ReactionAnalytics.trackEventWhenReady = function () {
  const _args = arguments;
  analytics.ready(function () {analytics.track.apply(this, _args);});
};

ReactionAnalytics.trackPageWhenReady = function () {
  const _args = arguments;
  analytics.ready(function () {analytics.page.apply(this, _args);});
};

ReactionAnalytics.debouncedTrackpageWhenReady = _.debounce(ReactionAnalytics.trackPageWhenReady, 300, true);
// const debouncedTrackpageWhenReady = _.debounce(trackPageWhenReady, 300, true);

ReactionAnalytics.identifyWhenReady = function () {
  const _args = arguments;
  analytics.ready(function () {analytics.identify.apply(this, _args);});
};

/*
* getUserEmail()
* Figure out the user's correct email address. This helps the differing keys
* in the database when using oAuth login.
*/
function getUserEmail() {
  if (Meteor.userId()) {
    const user = AnalyticsUsers.findOne({_id: Meteor.userId()}, {
      fields: {
        "emails": 1,
        "services.facebook.email": 1,
        "services.google.email": 1,
        "services.github.email": 1
      }
    });

    if (user && user.emails) {
      if (user.emails[0]) {
        return user.emails[0].address;
      }

      return null;
    } else if (user && user.services) {
      const services = user.services;
      if (services.facebook) {
        return services.facebook.email;
      } else if (services.github) {
        return services.github.email;
      } else if (services.google) {
        return services.google.email;
      }

      return null;
    }
  }
  return null;
}

let initialized;
function trackLogins() {
  // don't run the first time, but we need to access Meteor.userId()
  // so that it's reactive
  Meteor.userId();
  if (initialized) {
    // when Meteor.userId() changes this will run
    if (Meteor.userId()) {
      // TODO I think it's not guaranteed that userEmail has been set because
      // the 'analyticsusers' publication might not be ready yet.
      ReactionAnalytics.identifyWhenReady(Meteor.userId(), {email: userEmail});
      ReactionAnalytics.trackEventWhenReady("Signed in");
    } else {
      ReactionAnalytics.trackEventWhenReady("Signed out");
    }
  }
  initialized = true;
}

function initReactionRouter() {
  if (ReactionRouter) {
    // something context & context.context don't exist, see: #93
    ReactionRouter.triggers.enter([function (context) {
      let page = {};

      if (context.path) {
        page.path = context.path;
      }
      if (context.context && context.context.title) {
        page.title = context.context.title;
      }

      page.url = window.location.origin + page.path;

      if (context.route && context.route.name) {
        page.name = context.route.name;
      } else {
        page.name = page.path;
      }
      if (context.context && context.context.querystring) {
        page.search = "?" + context.context.querystring;
      } else {
        page.search = "";
      }
      if (ReactionRouter.lastRoutePath) {
        page.referrer = window.location.origin + ReactionRouter.lastRoutePath;
      } else {
        page.referrer = document.referrer;
      }
      ReactionRouter.lastRoutePath = page.path;

      ReactionAnalytics.debouncedTrackpageWhenReady(page.name, page);
    }]);
  }
}

let userEmail;

Meteor.startup(function () {
  Session.set("analyticsInitialized", false);
  Tracker.autorun(function () {
    if (!Session.get("analyticsInitialized")) {
      let coreAnalytics = ReactionCore.Collections.Packages.findOne({
        name: "reaction-analytics"
      });

      if (coreAnalytics &&
          coreAnalytics.enabled &&
          coreAnalytics.settings &&
          coreAnalytics.settings.public &&
          coreAnalytics.settings.public.analyticsSettings) {
        // if coreAnalytics is enabled and has keys

        let settings = coreAnalytics.settings.public.analyticsSettings;
        initReactionRouter();
        analytics.initialize(settings);
        Session.set("analyticsInitialized", true);
        console.log("ReactionAnalytics Initialized");
      } else {
        console.log("Reaction Analytics loading...");
      }
    }
  });

  if (Package["accounts-base"]) {
    Tracker.autorun(function () {
      userEmail = getUserEmail();
    });
    Tracker.autorun(trackLogins);
  }

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
      analytics.track(event, properties);
    });
  });
});
