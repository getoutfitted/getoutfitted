import { Reaction } from "/server/api";

Reaction.registerPackage({
  label: 'Klaviyo',
  name: 'reaction-klaviyo',
  icon: 'fa fa-envelope',
  autoEnable: true,
  registry: [{
    route: '/dashboard/klaviyo',
    provides: 'dashboard',
    name: 'klaviyo',
    label: 'Klaviyo',
    description: 'Klaviyo email campagin and tracking',
    container: 'getoutfitted',
    icon: 'fa fa-envelope',
    template: 'klaviyoDashboard',
    workflow: 'klaviyoWorkflow',
    priority: 3
  }, {
    route: '/dashboard/klaviyo/settings',
    provides: 'settings',
    label: 'Klaviyo Settings',
    name: 'klaviyoSettings',
    template: 'klaviyoSettings'
  }],
  layout: [{
      workflow: "klaviyoWorkflow",
      layout: "coreLayout",
      theme: "default",
      enabled: true,
      structure: {
        template: "klaviyoDashboard",
        layoutHeader: "goLayoutHeader",
        layoutFooter: "goLayoutFooter",
        notFound: "goNotFound",
        dashboardControls: "dashboardControls",
        adminControlsFooter: "adminControlsFooter"
      }
  }, {
      workflow: "klaviyoWorkflow",
      layout: "getoutfittedLayout",
      theme: "default",
      enabled: true,
      structure: {
        template: "klaviyoDashboard",
        layoutHeader: "goLayoutHeader",
        layoutFooter: "goLayoutFooter",
        notFound: "goNotFound",
        dashboardControls: "dashboardControls",
        adminControlsFooter: "adminControlsFooter"
      }
  }]
});
