Template.termsOfService.helpers({

});

Template.termsOfService.events({
  'click #termsOfService': function (event) {
    let hasAgreed = event.target.checked;
    Session.set('hasAgreed', hasAgreed);
  }
});
