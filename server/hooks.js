const shopifyOrders = ReactionCore.Collections.Packages.findOne({
  name: 'reaction-shopify-orders'
});
const sharedSecret = shopifyOrders.settings.shopify.sharedSecret;

Router.onBeforeAction(Iron.Router.bodyParser.json({verify: Meteor.bindEnvironment(function (req, res, buf) {
  req.headers['x-generated-signature'] = crypto.createHmac('sha256', sharedSecret).update(buf).digest('base64');
})}), {only: ['webhooks.orders.new', 'webhooks.fulfillments.new']});

Router.route('/webhooks/fulfillments/new', {
  where: 'server',
  name: 'webhooks.fulfillments.new',
  action: function () {
    const attachedSignature = this.request.headers['x-shopify-hmac-sha256'];
    const generatedSignature = this.request.headers['x-generated-signature'];
    const shopifyOrdersPackage = ReactionCore.Collections.Packages.findOne({
      name: 'reaction-shopify-orders'
    });
    const shopname = shopifyOrdersPackage.settings.shopify.shopname;
    const key = shopifyOrdersPackage.settings.shopify.key;
    const password = shopifyOrdersPackage.settings.shopify.password;

    if (attachedSignature === generatedSignature) {
      this.response.statusCode = 200;
      this.response.end('Success');
      let shopifyOrderNumber;
      // Get shopify order number from shopify API
      try {
        shopifyOrderNumber = HTTP.get('https://' + shopname + '.myshopify.com/admin/orders/' + this.request.body.order_id + '.json', {
          auth: key + ':' + password
        }).data.order_number;
      } catch (e) {
        ReactionCore.Log.error('Error in webhooks.fulfillments.new determining shopifyOrderNumber ' + e);
        return false;
      }

      Meteor.call('shopifyOrders/newFulfillment', this.request.body, shopifyOrderNumber);
      ReactionCore.Log.info('Shopify New Fulfillment Webhook successfully processed NEW Order: #', shopifyOrderNumber);
      // TODO: add notification for CSR and Ops
    } else {
      this.response.statusCode = 403;
      this.response.end('Forbidden');
      ReactionCore.Log.warn('Shopify New Fulfillment Webhook failed - invalid signature: ',
        this.request.headers['x-forwarded-for'],
        this.request.headers['x-forwarded-host'],
        this.request.headers['x-shopify-hmac-sha256'],
        this.request.headers['x-generated-signature']);
    }
  }
});

Router.route('/webhooks/orders/new', {
  where: 'server',
  name: 'webhooks.orders.new',
  action: function () {
    const attachedSignature = this.request.headers['x-shopify-hmac-sha256'];
    const generatedSignature = this.request.headers['x-generated-signature'];

    if (attachedSignature === generatedSignature) {
      this.response.statusCode = 200;
      this.response.end('Success');
      Meteor.call('shopifyOrders/newOrder', this.request.body);
      ReactionCore.Log.info('Shopify Orders Webhook successfully processed NEW Order: #', this.request.body.order_number);
      // TODO: add notification for CSR and Ops
    } else {
      this.response.statusCode = 403;
      this.response.end('Forbidden');
      ReactionCore.Log.info('Shopify New Orders Webhook failed - invalid signature: ',
        this.request.headers['x-forwarded-for'],
        this.request.headers['x-forwarded-host'],
        this.request.headers['x-shopify-hmac-sha256'],
        this.request.headers['x-generated-signature']);
    }
  }
});
