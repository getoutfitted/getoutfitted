import { Reaction } from "/server/api";

Reaction.registerPackage({
  label: "GetOutfitted Theme",
  name: "getoutfitted-theme",
  icon: "fa fa-television",
  autoEnable: true,
  layout: [
    {
      layout: "getoutfittedLayout",
      workflow: "coreWorkflow",
      theme: "default",
      enabled: true,
      structure: {
        template: "products",
        layoutHeader: "goLayoutHeader",
        layoutFooter: "goLayoutFooter",
        notFound: "goProductNotFound",
        dashboardControls: "dashboardControls",
        adminControlsFooter: "adminControlsFooter"
      }
    },
    {
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
        dashboardControls: "productDetailDashboardControls",
        dashboardHeaderControls: "",
        adminControlsFooter: "adminControlsFooter"
      }
    },
    {
      layout: "getoutfittedLayout",
      workflow: "coreProductWorkflow",
      collection: "Products",
      theme: "default",
      enabled: true,
      structure: {
        template: "goProducts",
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
      workflow: "coreCartWorkflow",
      collection: "Cart",
      theme: "default",
      enabled: true,
      structure: {
        template: "cartCheckout",
        layoutHeader: "checkoutHeader",
        layoutFooter: "",
        notFound: "notFound",
        dashboardHeader: "",
        dashboardControls: "dashboardControls",
        dashboardHeaderControls: "",
        adminControlsFooter: "adminControlsFooter"
      }
    }
  ]
});
