import { Session } from "meteor/session";

Session.set("INDEX_OPTIONS", {
  template: "getoutfittedIndex",
  layoutHeader: "layoutHeader",
  layoutFooter: "layoutFooter",
  notFound: "notFound",
  dashboardControls: "dashboardControls",
  adminControlsFooter: "adminControlsFooter"
});
