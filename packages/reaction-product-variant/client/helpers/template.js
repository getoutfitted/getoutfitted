Template.registerHelper("fieldComponent", function () {
  if (ReactionCore.hasPermission("createProduct")) {
    return Template.productDetailEdit;
  }
  return Template.productDetailField;
});
