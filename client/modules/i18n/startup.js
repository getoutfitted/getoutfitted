import _ from "lodash";
import i18nextBrowserLanguageDetector from "i18next-browser-languagedetector";
import i18nextLocalStorageCache from "i18next-localstorage-cache";
import i18nextSprintfPostProcessor from "i18next-sprintf-postprocessor";
import i18nextJquery from "jquery-i18next";
import { Meteor } from "meteor/meteor";
import { Tracker } from "meteor/tracker";
import { Reaction } from "/client/api";
import { Shops, Translations } from "/lib/collections";
import * as Schemas from "/lib/collections/schemas";
import i18next, { packageNamespaces, getLabelsFor, getMessagesFor, i18nextDep } from "./main";

//
// setup options for i18nextBrowserLanguageDetector
// note: this isn't fully operational yet
// language is set by user currently
// progress toward detecting language
// should focus around i18nextBrowserLanguageDetector
//
const options = {
  // order and from where user language should be detected
  order: ["querystring", "cookie", "localStorage", "navigator", "htmlTag"],

  // keys or params to lookup language from
  lookupQuerystring: "lng",
  lookupCookie: "i18next",
  lookupLocalStorage: "i18nextLng",

  // cache user language on
  caches: ["localStorage", "cookie"],
  // optional htmlTag with lang attribute, the default is:
  htmlTag: document.documentElement
};


Meteor.startup(() => {
  // use tracker autorun to detect language changes
  // this only runs on initial page loaded
  // and when user.profile.lang updates
  Tracker.autorun(function () {
    if (Reaction.Subscriptions.Shops.ready() && Meteor.user()) {
      const shop = Shops.findOne(Reaction.getShopId());
      let language = "en";
      if (shop && shop.language) {
        language = shop.language;
      }
      if (Meteor.user() && Meteor.user().profile && Meteor.user().profile.lang) {
        language = Meteor.user().profile.lang;
      }
      //
      // subscribe to user + shop Translations
      //
      return Meteor.subscribe("Translations", language, () => {
        // fetch reaction translations
        const translations = Translations.find({}, {
          fields: {
            _id: 0
          }
        }).fetch();

        // map reduce translations into i18next formatting
        const resources = translations.reduce(function (x, y) {
          const ns = Object.keys(y.translation)[0];
          // first creating the structure, when add additional namespaces
          if (x[y.i18n]) {
            x[y.i18n][ns] = y.translation[ns];
          } else {
            x[y.i18n] = y.translation;
          }
          return x;
        }, {});

        //
        // initialize i18next
        //
        i18next
          .use(i18nextBrowserLanguageDetector)
          .use(i18nextLocalStorageCache)
          .use(i18nextSprintfPostProcessor)
          .use(i18nextJquery)
          .init({
            detection: options,
            debug: false,
            ns: packageNamespaces, // translation namespace for every package
            defaultNS: "core", // reaction "core" is the default namespace
            lng: language, // user session language
            fallbackLng: shop ? shop.language : null, // Shop language
            resources: resources
            // saveMissing: true,
            // missingKeyHandler: function (lng, ns, key, fallbackValue) {
            //   Meteor.call("i18n/addTranslation", lng, ns, key, fallbackValue);
            // }
          }, (err, t) => {
            // someday this should work
            // see: https://github.com/aldeed/meteor-simple-schema/issues/494
            for (const schema in _.omit(Schemas, "__esModule")) {
              if ({}.hasOwnProperty.call(Schemas, schema)) {
                const ss = Schemas[schema];
                ss.labels(getLabelsFor(ss, schema));
                ss.messages(getMessagesFor(ss, schema));
              }
            }

            i18nextDep.changed();

            // global first time init event finds and replaces
            // data-i18n attributes in html/template source.
            $elements = $("[data-i18n]").localize();

            // apply language direction to html
            if (t("languageDirection") === "rtl") {
              return $("html").addClass("rtl");
            }
            return $("html").removeClass("rtl");
          });
      }); // return
    }
  });

  //
  // init i18nextJquery
  //
  i18nextJquery.init(i18next, $, {
    tName: "t", // --> appends $.t = i18next.t
    i18nName: "i18n", // --> appends $.i18n = i18next
    handleName: "localize", // --> appends $(selector).localize(opts);
    selectorAttr: "data-i18n", // selector for translating elements
    targetAttr: "data-i18n-target", // element attribute to grab target element to translate (if diffrent then itself)
    parseDefaultValueFromContent: true // parses default values from content ele.val or ele.text
  });

  // global onRendered event finds and replaces
  // data-i18n attributes in html/template source.
  // uses methods from i18nextJquery
  Template.onRendered(function () {
    this.autorun((function () {
      return function () {
        i18nextDep.depend();
        $elements = $("[data-i18n]").localize();
      };
    })(this));
  });
});
