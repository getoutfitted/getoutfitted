import moment from "moment";
import "moment-timezone";

export const GetOutfitted = {};

GetOutfitted.adjustLocalToDenverTime = function (time) {
  const here = moment(time);
  const denver = here.clone().tz("America/Denver");
  denver.add(here.utcOffset() - denver.utcOffset(), "minutes");
  return denver.toDate();
};

GetOutfitted.adjustDenverToLocalTime = function (time) {
  const denver = moment(time).tz("America/Denver");
  const here = moment(time);
  here.add(denver.utcOffset() - here.utcOffset(), "minutes");
  return here.toDate();
};
