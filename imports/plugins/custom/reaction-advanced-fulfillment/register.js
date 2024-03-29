import { Reaction } from "/server/api";

Reaction.registerPackage({
  label: "Advanced Fulfillment",
  name: "reaction-advanced-fulfillment",
  icon: "fa fa-barcode",
  autoEnable: true,
  settings: {
    shipstation: false
  },
  registry: [{
    route: "/dashboard/advanced-fulfillment",
    provides: "dashboard",
    name: "advancedFulfillment",
    label: "Backpack",
    description: "Getoutfitted\'s backoffice tool for packing and shipping orders",
    container: "getoutfitted",
    icon: "fa fa-barcode",
    template: "fulfillmentOrders",
    workflow: "afWorkflow",
    priority: 2
  }, {
    route: "/dashboard/advanced-fulfillment/settings",
    provides: "settings",
    label: "Advanced Fulfillment Settings",
    name: "advancedFulfillmentSettings",
    template: "advancedFulfillmentSettings"
  }, {
    route: "/dashboard/advanced-fulfillment/picker",
    name: "advancedFulfillment.picker",
    template: "advancedFulfillment.picker.search",
    workflow: "afWorkflow"
  }, {
    route: "/dashboard/advanced-fulfillment/shipping",
    name: "allShipping",
    template: "fulfillmentOrders",
    workflow: "afWorkflow"
  }, {
    route: "/dashboard/advanced-fulfillment/shipping/:date",
    name: "dateShipping",
    template: "fulfillmentOrders",
    workflow: "afWorkflow"
  }, {
    route: "/dashboard/advanced-fulfillment/order/:_id",
    name: "orderDetails",
    template: "orderDetails",
    workflow: "afWorkflow"
  }, {
    route: "/dashboard/advanced-fulfillment/orders/status/:status",
    name: "orderByStatus",
    template: "fulfillmentOrders",
    workflow: "afWorkflow"
  }, {
    route: "/dashboard/advanced-fulfillment/local-deliveries",
    name: "allLocalDeliveries",
    template: "fulfillmentOrders",
    workflow: "afWorkflow"
  }, {
    route: "/dashboard/advanced-fulfillment/local-deliveries/:date",
    name: "dateLocalDelivery",
    template: "fulfillmentOrders",
    workflow: "afWorkflow"
  }, {
    route: "/dashboard/advanced-fulfillment/order-queue",
    name: "orderQueue",
    template: "orderQueue",
    workflow: "afWorkflow"
  }, {
    route: "/dashboard/advanced-fulfillment/order/pdf/:_id",
    name: "advancedFulfillmentPDF",
    template: "advancedFulfillmentPDF",
    workflow: "afPrint"
  }, {
    route: "/dashboard/advanced-fulfillment/order/local-delivery-label-pdf/:_id",
    name: "localDeliveryLabelPDF",
    template: "localDeliveryLabelPDF",
    workflow: "afPrint"
  }, {
    route: "/dashboard/advanced-fulfillment/orders/pdf/date/:date",
    name: "orders.printAllForDate",
    template: "advancedFulfillmentOrdersPrint",
    workflow: "afPrint"
  }, {
    route: "/dashboard/advanced-fulfillment/orders/pdf/selected",
    name: "orders.printSelected",
    template: "advancedFulfillmentPDF",
    workflow: "afPrint"
  }, {
    route: "/dashboard/advanced-fulfillment/returns",
    name: "returns",
    template: "returnOrders",
    workflow: "afWorkflow"
  }, {
    route: "/dashboard/advanced-fulfillment/returns/:date",
    name: "dateReturning",
    template: "returnOrders",
    workflow: "afWorkflow"
  }, {
    route: "/dashboard/advanced-fulfillment/missing",
    name: "missing",
    template: "missingDamaged",
    workflow: "afWorkflow"
  }, {
    route: "/dashboard/advanced-fulfillment/damaged",
    name: "damaged",
    template: "missingDamaged",
    workflow: "afWorkflow"
  }, {
    route: "/dashboard/advanced-fulfillment/search",
    name: "searchOrders",
    template: "searchOrders",
    workflow: "afWorkflow"
  }, {
    route: "/dashboard/advanced-fulfillment/update-order/:_id",
    name: "updateOrder",
    template: "updateOrder",
    workflow: "afWorkflow"
  }, {
    route: "/dashboard/advanced-fulfillment/update-order/:orderId/:itemId",
    name: "updateOrderItem",
    template: "updateOrderItem",
    workflow: "afWorkflow"
  }], // , {
  //   route: "/dashboard/advanced-fulfillment/customer-service/impossible-dates",
  //   name: "impossibleDates",
  //   template: "impossibleDates",
  //   workflow: "afWorkflow"
  // }, {
  //   route: "/dashboard/advanced-fulfillment/customer-service/missing-rental-dates",
  //   name: "missingRentalDates",
  //   template: "missingRentalDates",
  //   workflow: "afWorkflow"
  // }, {
  //   route: "/dashboard/advanced-fulfillment/customer-service/missing-item-details",
  //   name: "missingItemDetails",
  //   template: "missingItemDetails",
  //   workflow: "afWorkflow"
  // }, {
  //   route: "/dashboard/advanced-fulfillment/customer-service/missing-bundle-colors",
  //   name: "missingBundleColors",
  //   template: "missingBundleColors",
  //   workflow: "afWorkflow"
  // }, {
  //   route: "/dashboard/advanced-fulfillment/customer-service/non-warehouse-orders",
  //   name: "nonWarehouseOrders",
  //   template: "nonWarehouseOrders",
  //   workflow: "afWorkflow"
  // }],

  layout: [{
    workflow: "afWorkflow",
    layout: "getoutfittedLayout",
    theme: "default",
    enabled: true,
    structure: {
      template: "fulfillmentOrders",
      layoutHeader: "afNavbar",
      layoutFooter: "",
      notFound: "notFound",
      dashboardHeader: "",
      dashboardControls: "accountsDashboardControls",
      dashboardHeaderControls: "",
      adminControlsFooter: "adminControlsFooter"
    }
  }, {
    workflow: "afWorkflow",
    layout: "coreLayout",
    theme: "default",
    enabled: true,
    structure: {
      template: "fulfillmentOrders",
      layoutHeader: "afNavbar",
      layoutFooter: "",
      notFound: "notFound",
      dashboardHeader: "",
      dashboardControls: "accountsDashboardControls",
      dashboardHeaderControls: "",
      adminControlsFooter: "adminControlsFooter"
    }
  }, {
    workflow: "afPrint",
    layout: "getoutfittedLayout",
    theme: "default",
    enabled: true,
    structure: {
      template: "advancedFulfillmentPDF",
      layoutHeader: "",
      layoutFooter: "",
      notFound: "advancedFulfillmentPDF",
      dashboardHeader: "",
      dashboardControls: "",
      dashboardHeaderControls: "",
      adminControlsFooter: ""
    }
  }, {
    workflow: "afPrint",
    layout: "coreLayout",
    theme: "default",
    enabled: true,
    structure: {
      template: "advancedFulfillmentPDF",
      layoutHeader: "",
      layoutFooter: "",
      notFound: "advancedFulfillmentPDF",
      dashboardHeader: "",
      dashboardControls: "",
      dashboardHeaderControls: "",
      adminControlsFooter: ""
    }
  }]
});
