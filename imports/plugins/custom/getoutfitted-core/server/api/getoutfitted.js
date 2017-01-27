import { Meteor } from "meteor/meteor";
import { Reaction } from "/server/api";
import { Packages } from "/lib/collections";
import { GetOutfitted } from "/imports/plugins/custom/getoutfitted-core/lib/api";

export { GetOutfitted };

GetOutfitted.settings = {};

GetOutfitted.settings._getPackageSettings = function (packageName) {
  const pkg = Packages.findOne({
    name: packageName,
    shopId: Reaction.getShopId()
  });

  if (!pkg) {
    throw new Meteor.Error(500, `${packageName} not found`);
  }

  return pkg.settings;
};

GetOutfitted.settings.getTurnaroundTime = function () {
  const settings = GetOutfitted.settings._getPackageSettings("reaction-rental-products");
  if (settings) {
    return settings.turnaroundTime || 4;
  }
  return 4;
};
