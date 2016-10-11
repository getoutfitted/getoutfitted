import { Reaction } from '/server/api';

Reaction.registerPackage({
  label: 'Zopim',
  name: 'reaction-zopim',
  icon: 'fa fa-comment',
  autoEnable: true,
  registry: [
    {
      provides: 'dashboard',
      route: '/dashboard/zopim',
      name: 'Zopim',
      label: 'Zopim',
      description: 'Provide Customer Chat Interface',
      icon: 'fa fa-comment',
      priority: 2,
      container: 'getoutfitted',
      template: 'dashboardZopim',
      workflow: 'zopimWorkflow'
    },
    {
      label: 'Zopim Settings',
      route: '/dashboard/zopim/settings',
      provides: 'settings',
      name: 'zopimSettings',
      template: 'zopimSettings'
    }
  ],
  layout: [{
    workflow: "zopimWorkflow",
    layout: "coreLayout",
    theme: "default",
    enabled: true,
    structure: {
      template: "dashboardZopim",
      layoutHeader: "goLayoutHeader",
      layoutFooter: "goLayoutFooter",
      notFound: "goNotFound",
      dashboardControls: "dashboardControls",
      adminControlsFooter: "adminControlsFooter"
      }
  }, {
    workflow: "zopimWorkflow",
    layout: "getoutfittedLayout",
    theme: "default",
    enabled: true,
    structure: {
      template: "dashboardZopim",
      layoutHeader: "goLayoutHeader",
      layoutFooter: "goLayoutFooter",
      notFound: "goNotFound",
      dashboardControls: "dashboardControls",
      adminControlsFooter: "adminControlsFooter"
    }
  }]
});
