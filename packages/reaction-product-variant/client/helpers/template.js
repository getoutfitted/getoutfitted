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
