const shopifyOrders = ReactionCore.Collections.Packages.findOne({
  name: 'reaction-shopify-orders'
});
const sharedSecret = shopifyOrders.settings.shopify.sharedSecret;

Router.onBeforeAction(Iron.Router.bodyParser.json({verify: Meteor.bindEnvironment(function (req, res, buf) {
  req.headers['x-generated-signature'] = crypto.createHmac('sha256', sharedSecret).update(buf).digest('base64');
})}));

Router.route('/webhooks/orders/new', {
  where: 'server',
  name: 'webhooks.orders.new',
  action: function () {
    const attachedSignature = this.request.headers['x-shopify-hmac-sha256'];
    const generatedSignature = this.request.headers['x-generated-signature'];
    // console.log('passedSig', this.request.headers['x-shopify-hmac-sha256']);
    // console.log('generatedSig', this.request.headers['x-generated-signature']);
    if (attachedSignature === generatedSignature) {
      this.response.statusCode = 200;
      this.response.end('Success');
      // Update Orders
    } else {
      this.response.statusCode = 403;
      this.response.end('Forbidden');
    }

    ReactionCore.Log.info('Order Id: ', this.request.body.order_number);
  }
});
