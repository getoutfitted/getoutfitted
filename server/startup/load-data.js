import { Shops, Products, Shipping, Tags } from "/lib/collections";
import { Hooks, Logger, Reaction } from "/server/api";
import { Fixture } from "/server/api/core/import";

export default function () {
  /**
   * Hook to setup core additional imports during Reaction init (shops process first)
   */
  Hooks.Events.add("onCoreInit", () => {
    Logger.info("Load default data from /private/data/");

    try {
      if (!Shops.findOne()) {
        Reaction.Import.process(Assets.getText("data/Shops.json"), ["name"], Reaction.Import.shop);
        // ensure Shops are loaded first.
        Reaction.Import.flush(Shops);
      }
      Logger.info("Shop exists, Skipping shop data import.");
    } catch (error) {
      Logger.info("Bypassing loading Shop default data");
    }

    try {
      if (!Shipping.findOne()) {
        Fixture.process(Assets.getText("data/Shipping.json"), ["name"], Reaction.Import.shipping);
      } else {
        Logger.info("Shipping exists, Skipping shipping data import.");
      }
    } catch (error) {
      Logger.info("Bypassing loading Shipping default data.");
    }

    try {
      if (!Products.findOne()) {
        Fixture.process(Assets.getText("data/Products.json"), ["title"], Reaction.Import.load);
      } else {
        Logger.info("Product exists, Skipping product data import.");
      }
    } catch (error) {
      Logger.info("Bypassing loading Products default data.");
    }

    try {
      if (!Tags.findOne()) {
        Fixture.process(Assets.getText("data/Tags.json"), ["name"], Reaction.Import.load);
      } else {
        Logger.info("Tag exists, Skipping tag data import.");
      }
    } catch (error) {
      Logger.info("Bypassing loading Tags default data.");
    }
    //
    // these will flush and import with the rest of the imports from core init.
    // but Bulk.find.upsert() = false
    //
    Fixture.flush();
  });
}
