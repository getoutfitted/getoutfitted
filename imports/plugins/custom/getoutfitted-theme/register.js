import { Reaction } from "/server/api";

Reaction.registerPackage({
  label: "GetOutfitted Theme",
  name: "getoutfitted-theme",
  icon: "fa fa-television",
  autoEnable: true,
  layout: [{
    layout: "getoutfittedLayout",
    workflow: "coreProductWorkflow",
    collection: "Products",
    theme: "default",
    enabled: true,
    structure: {
      template: "goProductDetail",
      layoutHeader: "goLayoutHeader",
      layoutFooter: "goLayoutFooter",
      notFound: "goProductNotFound",
      dashboardHeader: "",
      dashboardControls: "dashboardControls",
      dashboardHeaderControls: "",
      adminControlsFooter: "adminControlsFooter"
    }
  },
  {
    layout: "getoutfittedLayout",
    workflow: "coreWorkflow",
    theme: "default",
    enabled: true,
    structure: {
      template: "goProducts",
      layoutHeader: "getoutfittedLayoutHeader",
      layoutFooter: "getoutfittedLayoutFooter",
      notFound: "getoutfittedProductNotFound",
      dashboardHeader: "",
      dashboardControls: "dashboardControls",
      dashboardHeaderControls: "",
      adminControlsFooter: "adminControlsFooter"
    }
  }]
});
