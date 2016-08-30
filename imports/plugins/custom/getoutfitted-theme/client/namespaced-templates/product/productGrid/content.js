/**
 * gridContent helpers
 */

Template.gridContent.helpers({
  // Rewrite this to account for rentalPriceBuckets
  displayPrice: function () {
    if (this.price && this.price.range) {
      return this.price.range;
    }
    return "";
  }
});
