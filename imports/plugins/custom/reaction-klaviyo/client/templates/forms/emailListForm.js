import { Template } from 'meteor/templating';
import { ReactionProduct } from '/lib/api';
import { Klaviyo } from '../../../lib/api';

import './emailListForm.html';

Template.emailListForm.helpers({
  productHasEmailListid() {
    return this.emailListId;
  }
});


Template.emailListForm.events({
  "submit .subscribeToEmailList": function (event) {
    event.preventDefault();
    const email = event.target.subscribeEmail.value;
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (emailRegex.test(email)) {
      const productId = ReactionProduct.selectedProductId();
      Klaviyo.addUserToList(productId, email);
      event.target.subscribeEmail.value = "";
      Alerts.removeSeen();
      Alerts.inline(`${email} was successfully subscribed.`,
        "success",
        {
          autoHide: 3000,
          placement: "emailSubscriptions"
        });
    } else {
      Alerts.removeSeen();
      Alerts.inline(`${email} is not a valid email. Please enter a valid email to subscribe.`,
        "danger",
        {
          autoHide: 3000,
          placement: "emailSubscriptions"
      });
    }
  }
});
