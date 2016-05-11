ReactionCore.registerPackage({
  label: "Products",
  name: "reaction-product-variant",
  icon: "fa fa-cubes",
  autoEnable: true,
  registry: [{
    route: "/products/createProduct",
    name: "createProduct",
    label: "Add Product",
    icon: "fa fa-plus",
    template: "productDetail",
    provides: "shortcut",
    container: "addItem",
    priority: 1,
    permissions: [{
      label: "Create Product",
      permission: "createProduct"
    }]
  }, {
    route: "/product/:handle/:variantId?",
    name: "product",
    template: "productDetail",
    workflow: "coreProductWorkflow"
  }, {
    route: "/products/:handle/:variantId?",
    name: "productLegacy",
    template: "productDetail",
    workflow: "coreProductWorkflow"
  }, {
    route: "/tag/:slug?",
    name: "tag",
    template: "products",
    workflow: "coreProductWorkflow"
  }, {
    route: "/collections/:slug?",
    name: "collectionsLegacy",
    template: "products",
    workflow: "coreProductWorkflow"
  }, {
    route: "/catalog/:slug?",
    name: "catalog",
    template: "products",
    workflow: "coreProductWorkflow"
  }],
  layout: [{
    layout: "coreLayout",
    workflow: "coreProductWorkflow",
    collection: "Products",
    theme: "default",
    enabled: true,
    structure: {
      template: "productDetail",
      layoutHeader: "layoutHeader",
      layoutFooter: "layoutFooter",
      notFound: "productNotFound",
      dashboardHeader: "",
      dashboardControls: "dashboardControls",
      dashboardHeaderControls: "",
      adminControlsFooter: "adminControlsFooter"
    }
  }]
});
