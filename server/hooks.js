// Router.onBeforeAction(function (req, res, next) {
//   let busboy = new Busboy({headers: req.headers});
//
//   Iron.Router.bodyParser.raw()
//   // sha1 content
//   let hash = crypto.createHash('sha256');
//   hash.update(req.body);
//   req.hasha = hash.digest('base64');
//   console.log("hash", req.hasha);
//
//   // get rawBody
//   req.rawBody = req.body.toString();
//   console.log("rawBody", req.rawBody);
//   this.next();
// }, {only: ['webhooks.orders.new']});
const shopifyOrders = ReactionCore.Collections.Packages.findOne({
  name: 'reaction-shopify-orders'
});
const sharedSecret = shopifyOrders.settings.shopify.sharedSecret;

Router.onBeforeAction(Iron.Router.bodyParser.json({verify: Meteor.bindEnvironment(function (req, res, buf, encoding) {
  req.headers['x-generated-signature'] = crypto.createHmac('sha256', sharedSecret).update(buf).digest('base64');
})}));

Router.route('/webhooks/orders/new', {
  where: 'server',
  name: 'webhooks.orders.new',
  action: function () {
    console.log('passedSig', this.request.headers['x-shopify-hmac-sha256']);
    console.log('generatedSig', this.request.headers['x-generated-signature']);
    // console.log('sig', crypto.createHmac('SHA256', sharedSecret).update(new Buffer(this.request.body, 'utf-8')).digest('base64'));
    this.response.statusCode = 200;
    this.response.end('success');
    // console.log(new Buffer('' + this.request.body, 'utf-8'));
    // // const name = this.params.name;
    // // const query = this.request.query;
    // ReactionCore.Log.info('New Order Webhook');


    // ReactionCore.Log.info('Data: ', this.request);
    // ReactionCore.Log.info('Body: ', this.request.body);
    // ReactionCore.Log.info('Headers: ', this.request.headers);
  }
});
