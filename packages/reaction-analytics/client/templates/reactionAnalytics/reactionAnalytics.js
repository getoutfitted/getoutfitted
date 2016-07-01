Template.reactionAnalyticsSettings.helpers({
  packageData() {
    return ReactionCore.Collections.Packages.findOne({
      name: "reaction-analytics"
    });
  }
});


AutoForm.hooks({
  "analytics-update-form": {
    onSuccess() {
      Alerts.removeType("analytics-not-configured");
      return Alerts.toast("Analytics settings saved.", "success");
    },
    onError(operation, error) {
      let msg = error.message || error.reason || "Unknown error";
      return Alerts.toast(`Analytics settings update failed: ${msg}`, "error");
    }
  }
});
