ReactionCore.Schemas.Cart = new SimpleSchema({
  sessionId: {
    type: String,
    autoValue: function () {
      return ReactionCore.sessionId;
    },
    optional: true,
    index: 1
  }
});
