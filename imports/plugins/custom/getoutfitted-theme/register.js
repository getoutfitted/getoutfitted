import { Reaction } from "/server/api";

Reaction.registerPackage({
  label: "GetOutfitted Theme",
  name: "getoutfitted-theme",
  icon: "fa fa-television",
  autoEnable: true,
  registry: [
    {
      route: "/collections/:slug?",
      name: "collections",
      template: "products",
      workflow: "coreProductWorkflow"
    }, {
      route: "/cart",
      name: "cart",
      template: "cart",
      workflow: "coreWorkflow"
    }
  ],
  layout: [{
    template: "goCheckoutShippingAddress",
    label: "Shipping Address",
    workflow: "goCartWorkflow",
    container: "checkout-steps-main",
    audience: ["guest", "anonymous"],
    priority: 1,
    position: "1"
  }, {
    template: "goCheckoutBillingAddress",
    label: "Billing Address",
    workflow: "goCartWorkflow",
    container: "checkout-steps-main",
    audience: ["guest", "anonymous"],
    priority: 2,
    position: "2"
  }, {
    template: "goCheckoutTermsOfService",
    label: "Terms of Service",
    workflow: "goCartWorkflow",
    container: "checkout-steps-side",
    audience: ["guest", "anonymous"],
    priority: 3,
    position: "3"
  }, {
    template: "goCheckoutPayment",
    label: "Payment",
    workflow: "goCartWorkflow",
    container: "checkout-steps-side",
    audience: ["guest", "anonymous"],
    priority: 4,
    position: "4"
  }]
});
