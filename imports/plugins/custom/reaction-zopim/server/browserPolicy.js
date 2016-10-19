import { BrowserPolicy } from "meteor/browser-policy-common";
import { Meteor } from  "meteor/meteor";

BrowserPolicy.content.allowOriginForAll("wss://*.zopim.com");
BrowserPolicy.content.allowOriginForAll("http://v2.zopim.com/");
BrowserPolicy.content.allowOriginForAll("https://v2.zopim.com/");
BrowserPolicy.content.allowOriginForAll("https://v2.zopim.io/");
BrowserPolicy.content.allowOriginForAll("http://v2.zopim.io/");
BrowserPolicy.content.allowImageOrigin("https://v2assets.zopim.io");
