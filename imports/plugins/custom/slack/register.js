import { Reaction } from '/server/api';

Reaction.registerPackage({
  label: 'Slack',
  name: 'slack',
  icon: 'fa fa-slack',
  autoEnable: true,
  registry: [{
    route: '/dashboard/slack',
    provides: 'dashboard',
    name: 'slack',
    label: 'Slack',
    description: 'Slack Post a Message to Channel',
    container: 'getoutfitted',
    icon: 'fa fa-slack',
    template: 'slackDashboard',
    workflow: 'slackWorkflow',
    priority: 3
  }, {
    route: '/dashboard/slack/settings',
    provides: 'settings',
    label: 'Slack Settings',
    name: 'slackSettings',
    template: 'slackSettings'
  }],
  layout: [{
    workflow: "slackWorkflow",
    layout: "coreLayout",
    theme: "default",
    enabled: true,
    structure: {
      template: "slackDashboard",
      layoutHeader: "goLayoutHeader",
      layoutFooter: "goLayoutFooter",
      notFound: "goNotFound",
      dashboardControls: "dashboardControls",
      adminControlsFooter: "adminControlsFooter"
    }
  }, {
    workflow: "slackWorkflow",
    layout: "getoutfittedLayout",
    theme: "default",
    enabled: true,
    structure: {
      template: "slackDashboard",
      layoutHeader: "goLayoutHeader",
      layoutFooter: "goLayoutFooter",
      notFound: "goNotFound",
      dashboardControls: "dashboardControls",
      adminControlsFooter: "adminControlsFooter"
    }
  }]
});
