Template.registerHelper("fieldComponent", function () {
  if (ReactionCore.hasPermission("createProduct")) {
    return Template.productDetailEdit;
  }
  return Template.productDetailField;
});

Template.registerHelper("handleize", (str) => {
  let handle = str.toLowerCase();
  return handle.replace(/(\W+)/g, "-");
});

Template.registerHelper("displayTimeUnit", (timeUnit) => {
  if (timeUnit) {
    return timeUnit.slice(0, -1);
  }
  return "";
});

Template.registerHelper("startReservationHuman", () => {
  let cart = ReactionCore.Collections.Cart.findOne();
  if (cart && cart.startTime) {
    return moment(cart.startTime).format("ddd M/DD");
  }
  return "";
});

Template.registerHelper("endReservationHuman", () => {
  let cart = ReactionCore.Collections.Cart.findOne();
  if (cart && cart.endTime) {
    return moment(cart.endTime).format("ddd M/DD");
  }
  return "";
});
