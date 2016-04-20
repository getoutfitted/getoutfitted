import $ from "jquery";
import "bootstrap-datepicker";

Template.rentalLengthOptions.events({
  "change input[name='reservationLength']:radio": function (event) {
    Session.set("reservationLength", parseInt(event.currentTarget.value, 10));
    $("#rental-start").datepicker("update");
  }
});
