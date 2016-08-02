import { Session } from "meteor/session";

DEFAULT_LAYOUT = "getoutfittedLayout";
// DEFAULT_WORKFLOW = "coreWorkflow";

Session.set("INDEX_OPTIONS", {
  template: "getoutfittedIndex",
  layoutHeader: "goLayoutHeader",
  layoutFooter: "goLayoutFooter",
  notFound: "goNotFound",
  dashboardControls: "dashboardControls",
  adminControlsFooter: "adminControlsFooter"
});
