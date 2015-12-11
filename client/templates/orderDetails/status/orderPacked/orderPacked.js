Template.orderPacked.helpers({
  shippingInfo: function () {
    let shippingInfo = this.shipping[0].address;
    let afShipping = {};
    afShipping.fullName = shippingInfo.fullname;
    afShipping.address1 = shippingInfo.address1;
    afShipping.address2 = shippingInfo.address2;
    afShipping.city = shippingInfo.city;
    afShipping.state = shippingInfo.region;
    afShipping.zipcode = shippingInfo.zipcode;

    return afShipping;
  }
});
