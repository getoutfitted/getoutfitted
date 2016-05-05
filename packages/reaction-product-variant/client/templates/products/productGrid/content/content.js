/**
 * gridContent helpers
 */

Template.gridContent.helpers({
  displayPrice: function () {
    console.log(this);
    if (this.price && this.price.range) {
      return this.price.range;
    }
  }
});
