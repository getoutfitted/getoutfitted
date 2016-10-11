import { Packages } from "/lib/collections";
import $ from 'jquery';
import { Tracker } from 'meteor/tracker';
import { Reaction } from '/client/api';

Tracker.autorun(function () {
  Reaction.Router.watchPathChange();
  let widgetExists = $('.zopim').length > 0 ? true : false;
  const Zopim = Packages.findOne({
      name: 'reaction-zopim',
      shopId: Reaction.getShopId()
    });
  if (Zopim) {
    if (Zopim.enabled && !widgetExists && Zopim.settings && Zopim.settings.public && Zopim.settings.public.chatWidget) {
      $(document.head).append(Zopim.settings.public.chatWidget);
    } else if (Zopim.enabled && widgetExists) {
      $zopim.livechat.button.show();
    } else if (!Zopim.enabled && widgetExists) {
      $zopim.livechat.hideAll();
    }
  }
});
