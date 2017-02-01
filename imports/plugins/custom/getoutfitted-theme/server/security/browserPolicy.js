import url from "url";
import { Meteor } from "meteor/meteor";
import { BrowserPolicy } from "meteor/browser-policy-common";

/*
 * set browser policies
 */

 // get current hostname of app
const { hostname } = url.parse(Meteor.absoluteUrl());

BrowserPolicy.content.allowOriginForAll("https://d2wpxyz1up89r3.cloudfront.net");
BrowserPolicy.content.allowFrameOrigin("www.youtube.com");

// allow frames to connect to host (Safari fails without this)
BrowserPolicy.content.allowFrameOrigin(`${hostname}`);

// Analytics
BrowserPolicy.content.allowOriginForAll("www.fullstory.com");
BrowserPolicy.content.allowOriginForAll("r.fullstory.com");
