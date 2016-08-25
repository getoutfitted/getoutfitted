import { Reaction } from '/server/api';

Reaction.registerPackage({
  label: 'GetOutfitted Product Bundles',
  name: 'product-bundles',
  icon: 'fa fa-medkit',
  autoEnable: false,
  registry: [{
    route: '/dashboard/product-bundles',
    provides: 'dashboard',
    name: 'productBundles',
    label: 'Getoutfitted Product Bundles ',
    description: 'Create bundled products',
    container: 'getoutfitted',
    icon: 'fa fa-medkit',
    template: 'productBundlesDashboard',
    workflow: 'productBundlesWorkflow',
    priority: 3
  }, {
    route: '/dashboard/productBundles/settings',
    provides: 'settings',
    label: 'GetOutfitted Product Bundles Settings',
    name: 'productBundlesSettings',
    template: 'productBundlesSettings'
  },
  {
    route: '/dashboard/productBundles/edit/:_id',
    name: 'productBundleEdit',
    template: 'productBundleEdit',
    workflow: 'editBundleWorkflow'
  }],
  layout: [{
    workflow: 'editBundleWorkflow',
    layout: 'coreLayout',
    theme: 'default',
    enabled: true,
    structure: {
      template: 'productBundleEdit',
      layoutHeader: 'layoutHeader',
      layoutFooter: '',
      notFound: 'notFound',
      dashboardHeader: '',
      dashboardControls: 'accountsDashboardControls',
      dashboardHeaderControls: '',
      adminControlsFooter: 'adminControlsFooter'
    }
  }, {
    workflow: "productBundlesWorkflow",
    layout: "coreLayout",
    theme: "default",
    enabled: true,
    structure: {
      template: "productBundlesDashboard",
      layoutHeader: "goLayoutHeader",
      layoutFooter: "goLayoutFooter",
      notFound: "goNotFound",
      dashboardControls: "dashboardControls",
      adminControlsFooter: "adminControlsFooter"
    }
  }, {
    workflow: "productBundlesWorkflow",
    layout: "getoutfittedLayout",
    theme: "default",
    enabled: true,
    structure: {
      template: "productBundlesDashboard",
      layoutHeader: "goLayoutHeader",
      layoutFooter: "goLayoutFooter",
      notFound: "goNotFound",
      dashboardControls: "dashboardControls",
      adminControlsFooter: "adminControlsFooter"
    }
  }]
});
