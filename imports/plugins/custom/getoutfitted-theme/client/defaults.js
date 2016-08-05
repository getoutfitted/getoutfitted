import { Session } from "meteor/session";

// DEFAULT_WORKFLOW = "coreWorkflow";

Session.set("DEFAULT_LAYOUT", "getoutfittedLayout");

Session.set("INDEX_OPTIONS", {
  template: "getoutfittedIndex",
  layoutHeader: "goLayoutHeader",
  layoutFooter: "goLayoutFooter",
  notFound: "goNotFound",
  dashboardControls: "dashboardControls",
  adminControlsFooter: "adminControlsFooter"
});
