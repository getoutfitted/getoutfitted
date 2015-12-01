Router.route('/webhooks/orders/new', function () {
  this.response.statusCode = 200;
  this.response.end('success');
  // // const name = this.params.name;
  // // const query = this.request.query;
  ReactionCore.Log.info('New Order Webhook');
  ReactionCore.Log.info('Body: ', this.request.body);
  ReactionCore.Log.info('Headers: ', this.request.headers);
}, { where: 'server' });
