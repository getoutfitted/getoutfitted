import { Reaction } from '/server/api';

Reaction.registerPackage({
  label: 'Import Products from CSV',
  name: 'reaction-product-importer',
  icon: 'fa fa-cloud-upload',
  autoEnable: false,
  settings: {
    customFields: {
      topProduct: [],
      midVariant: [],
      variant: []
    }
  },
  registry: [
    {
      provides: 'dashboard',
      label: 'Product Importer',
      description: 'Import Products into Reaction from CSV',
      route: '/dashboard/product-importer',
      icon: 'fa fa-cloud-upload',
      container: 'getoutfitted',
      template: 'dashboardProductImporter',
      name: 'dashboardProductImporter',
      workflow: 'productImporterWorkflow',
      priority: 2
    }, {
      provides: 'settings',
      label: 'Product Importer Settings',
      route: '/dashboard/product-importer/settings',
      name: 'settingsProductImporter',
      template: 'settingsProductImporter'
    }
  ],
  layout: [{
    workflow: 'productImporterWorkflow',
    layout: 'coreLayout',
    theme: 'default',
    enabled: true,
    structure: {
      template: 'dashboardProductImporter',
      layoutHeader: 'goLayoutHeader',
      layoutFooter: 'goLayoutFooter',
      notFound: 'goNotFound',
      dashboardControls: 'dashboardControls',
      adminControlsFooter: 'adminControlsFooter'
      }
  }, {
    workflow: 'productImporterWorkflow',
    layout: 'getoutfittedLayout',
    theme: 'default',
    enabled: true,
    structure: {
      template: 'dashboardProductImporter',
      layoutHeader: 'goLayoutHeader',
      layoutFooter: 'goLayoutFooter',
      notFound: 'goNotFound',
      dashboardControls: 'dashboardControls',
      adminControlsFooter: 'adminControlsFooter'
    }
  }]
});
