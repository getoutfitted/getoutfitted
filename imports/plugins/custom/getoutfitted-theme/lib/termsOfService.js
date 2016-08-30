import { SimpleSchema } from "meteor/aldeed:simple-schema";
import { Cart } from "/lib/collections";

const TermsOfServiceAgreement = new SimpleSchema({
  customerAgreedToTermsOfService: {
    type: Boolean,
    defaultValue: false,
    label: "Customer has agreed to Terms"
  },
  dateCustomerAgreedToTermsOfService: {
    type: Date,
    optional: true,
    label: "Date Customer Agreed to Terms"
  }
});

Cart.attachSchema(TermsOfServiceAgreement);
