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
        template: "getoutfittedIndex",
        layoutHeader: "goLayoutHeader",
        layoutFooter: "goLayoutFooter",
        notFound: "goNotFound",
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
      workflow: "coreProductListWorkflow",
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
      // Checkout
    }, {
      layout: "getoutfittedLayout",
      workflow: "coreCartWorkflow",
      collection: "Cart",
      theme: "default",
      enabled: true,
      structure: {
        template: "goCartCheckout",
        layoutHeader: "goCheckoutHeader",
        layoutFooter: "goLayoutFooter",
        notFound: "notFound",
        dashboardHeader: "",
        dashboardControls: "dashboardControls",
        dashboardHeaderControls: "",
        adminControlsFooter: "adminControlsFooter"
      }
    }, {
      layout: "getoutfittedLayout",
      workflow: "coreCartCompletedWorkflow",
      collection: "Orders",
      theme: "default",
      enabled: true,
      structure: {
        template: "goCartCompleted",
        layoutHeader: "goCheckoutHeader",
        layoutFooter: "goLayoutFooter",
        notFound: "notFound",
        dashboardHeader: "",
        dashboardControls: "dashboardControls",
        dashboardHeaderControls: "",
        adminControlsFooter: "adminControlsFooter"
      }
    }, {
      layout: "getoutfittedLayout",
      workflow: "coreDashboardWorkflow",
      theme: "default",
      enabled: true,
      structure: {
        template: "dashboardPackages",
        layoutHeader: "goLayoutHeader",
        layoutFooter: "goLayoutFooter",
        notFound: "notFound",
        dashboardHeader: "dashboardHeader",
        dashboardControls: "dashboardControls",
        dashboardHeaderControls: "dashboardHeaderControls",
        adminControlsFooter: "adminControlsFooter"
      }
    }],
    registry: [{
      route: "/collections/:slug?",
      name: "collections",
      template: "products",
      workflow: "goProductListWorkflow"
    }]
});
