import { Template } from "meteor/templating";
Template.faqPanel.events({
  "click .liveChatShow": function () {
    $zopim.livechat.badge.show();
  }
});
