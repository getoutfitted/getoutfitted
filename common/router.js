advancedFulfillmentController = ShopAdminController.extend({
  onBeforeAction: function () {
    let advancedFulfillment = ReactionCore.Collections.Packages.findOne({
      name: 'reaction-advanced-fulfillment'
    });
    if (! advancedFulfillment.enabled) {
      this.render('notFound');
    } else {
      this.next();
    }
  }
});

Router.route('dashboard/advanced-fulfillment/shipping', {
  controller: advancedFulfillmentController,
  template: 'fulfillmentOrders',
  waitOn: function () {
    return this.subscribe('Orders');
  },
  data: function () {
    return {orders: ReactionCore.Collections.Orders.find()};
  }
});
Router.route('dashboard/advanced-fulfillment/shipping/:date', {
  controller: advancedFulfillmentController,
  template: 'fulfillmentOrders',
  waitOn: function () {
    return this.subscribe('Orders');
  },
  data: function () {
    let date = this.params.date;
    return {orders: ReactionCore.Collections.Orders.find()};
  },
  onBeforeAction: function () {
    let date = this.params.date;
    let validDate = moment(date, 'MM-DD-YYYY').isValid();
    if (validDate) {
      this.next();
    }  else {
      this.render('notFound');
    }
  }
});
