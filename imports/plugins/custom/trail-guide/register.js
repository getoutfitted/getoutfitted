ReactionCore.registerPackage({
  label: 'Trail Guide',
  name: 'trail-guide',
  icon: 'fa fa-map-signs',
  autoEnable: true,
  registry: [{
    route: '/dashboard/trail-guide',
    provides: 'dashboard',
    name: 'trailGuideDashboard',
    label: 'Trail Guide',
    description: 'Sort and Search GetOutfitted\'s Orders',
    container: 'getoutfitted',
    icon: 'fa fa-map-signs',
    template: 'trailGuideDashboard',
    workflow: 'coreWorkflow',
    priority: 3
  }, {
    route: '/dashboard/trail-guide/settings',
    provides: 'settings',
    label: 'Trail Guide Settings',
    name: 'trailGuideSettings',
    template: 'trailGuideSettings'
  }]
});
