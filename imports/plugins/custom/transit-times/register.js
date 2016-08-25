import { Reaction } from '/server/api';
Reaction.registerPackage({
  label: 'Transit Time Calculator',
  name: 'transit-times',
  icon: 'fa fa-calculator',
  autoEnable: true,
  settings: {},
  registry: [{
    route: '/dashboard/transit-times',
    provides: 'dashboard',
    name: 'transitTimes',
    label: 'Getoutfitted Transit Time Calculator ',
    description: 'Calculate transit times from UPS or FedEx',
    container: 'getoutfitted',
    icon: 'fa fa-calculator',
    template: 'transitTimesDashboard',
    workflow: 'transitTimesWorkflow',
    priority: 3
  }, {
    route: '/dashboard/transit-times/settings',
    provides: 'settings',
    label: 'GetOutfitted Transit Time Settings',
    name: 'transitTimesSettings',
    template: 'transitTimesSettings'
  }],
  layout: [{
    workflow: 'transitTimesWorkflow',
    layout: 'coreLayout',
    theme: 'default',
    enabled: true,
    structure: {
      template: 'transitTimesDashboard',
      layoutHeader: 'goLayoutHeader',
      layoutFooter: 'goLayoutFooter',
      notFound: 'goNotFound',
      dashboardControls: 'dashboardControls',
      adminControlsFooter: 'adminControlsFooter'
    }
  }, {
    workflow: 'transitTimesWorkflow',
    layout: 'getoutfittedLayout',
    theme: 'default',
    enabled: true,
    structure: {
      template: 'transitTimesDashboard',
      layoutHeader: 'goLayoutHeader',
      layoutFooter: 'goLayoutFooter',
      notFound: 'goNotFound',
      dashboardControls: 'dashboardControls',
      adminControlsFooter: 'adminControlsFooter'
    }
  }]
});
