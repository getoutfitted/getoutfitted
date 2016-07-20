import { Session } from "meteor/session";

DEFAULT_LAYOUT = "getoutfittedLayout";
DEFAULT_WORKFLOW = "coreWorkflow";

Session.set("INDEX_OPTIONS", {
  template: "getoutfittedIndex",
  layoutHeader: "getoutfittedLayoutHeader",
  layoutFooter: "getoutfittedLayoutFooter",
  notFound: "notFound",
  dashboardControls: "dashboardControls",
  adminControlsFooter: "adminControlsFooter"
});
