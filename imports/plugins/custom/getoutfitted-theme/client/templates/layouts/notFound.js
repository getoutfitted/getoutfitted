Template.notFound.onCreated(function () {
  document.getElementsByTagName("head")[0].insertAdjacentHTML("beforeend", "<meta name='prerender-status-code' content='404'>");
  // todo report not found source
});

Template.productNotFound.onCreated(function () {
  document.getElementsByTagName("head")[0].insertAdjacentHTML("beforeend", "<meta name='prerender-status-code' content='404'>");
  // todo report not found source
});
