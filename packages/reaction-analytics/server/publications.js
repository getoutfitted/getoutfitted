Meteor.publish(null, function () {
  if (this.userId) {
    let self = this;
    let query = Meteor.users.find(
      {_id: this.userId},
      {fields: {
        "emails": 1,
        "services.facebook.email": 1,
        "services.google.email": 1,
        "services.github.email": 1 }});

    Mongo.Collection._publishCursor(query, self, "analyticsusers");
    return self.ready();
  }

  return this.ready();
});
