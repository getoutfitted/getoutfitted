import { Reaction } from "/server/api";

Reaction.registerPackage({
  label: "GetOutfitted Core",
  name: "getoutfitted-core",
  icon: "fa fa-gear",
  autoEnable: true,
  layout: []
  // No need for this plugin to exist in dashboard
  // registry: [{
  //   provides: "dashboard",
  //   label: "GetOutfitted Core",
  //   description: "GetOutfitted Core Utilities",
  //   icon: "fa fa-gear",
  //   priority: 1,
  //   container: "getoutfitted"
  // }],
});
