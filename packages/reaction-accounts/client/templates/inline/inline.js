function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}
/**
 * Inline login form for instance where guest login is needed.
 */

Template.loginInline.events({

  /**
   * Continue as guest.
   * @param  {Event} event - jQuery Event
   * @return {void}
   */
  "click .continue-guest": (event) => {
    event.preventDefault();
    if (Session.get("validEmail")) {
      Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "checkoutLogin");
    }
  },
  "keyup #guestEmail": (event) => {
    event.preventDefault();
    const email = event.target.value;
    const result = validateEmail(email);
    if (result) {
      Session.set("validEmail", result);
      const cart = ReactionCore.Collections.Cart.findOne({}, {fields: {_id: 1}});
      Meteor.call("checkout/addEmailToCart", cart._id, email);
    }
  }
});

Template.loginInline.helpers({
  emailRequired: function () {
    if (Session.get("validEmail")) {
      return "";
    }
    return "disabled";
  }
});
