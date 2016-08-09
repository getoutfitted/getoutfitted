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
        template: "goProducts",
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
        layoutHeader: "goNavigationHeader",
        layoutFooter: "goLayoutFooter",
        notFound: "notFound",
        dashboardHeader: "",
        dashboardControls: "dashboardControls",
        dashboardHeaderControls: "",
        adminControlsFooter: "adminControlsFooter"
      }
    }, {
      template: "checkoutItemReview",
      label: "Review Cart",
      workflow: "coreCartWorkflow",
      container: "checkout-steps-main",
      namespace: "getoutfitted",
      audience: ["guest", "anonymous"],
      priority: 1,
      position: "1"
    }, {
      template: "checkoutLogin",
      label: "Login",
      workflow: "coreCartWorkflow",
      container: "checkout-steps-main",
      namespace: "getoutfitted",
      audience: ["guest", "anonymous"],
      priority: 2,
      position: "2"
    }, {
      template: "checkoutAddressBook",
      label: "Shipping Billing",
      workflow: "coreCartWorkflow",
      container: "checkout-steps-main",
      namespace: "getoutfitted",
      audience: ["guest", "anonymous"],
      priority: 3,
      position: "3"
    }, {
      template: "coreCheckoutShipping",
      label: "Shipping Options",
      workflow: "coreCartWorkflow",
      container: "checkout-steps-main",
      namespace: "getoutfitted",
      audience: ["guest", "anonymous"],
      priority: 4,
      position: "4"
    }, {
      template: "goCheckoutReview",
      label: "Review Payment",
      workflow: "coreCartWorkflow",
      container: "checkout-steps-side",
      namespace: "getoutfitted",
      audience: ["guest", "anonymous"],
      priority: 5,
      position: "5"
    }, {
      template: "checkoutPayment",
      label: "Complete",
      workflow: "coreCartWorkflow",
      container: "checkout-steps-side",
      namespace: "getoutfitted",
      audience: ["guest", "anonymous"],
      priority: 6,
      position: "6"
    }
  ]
});
