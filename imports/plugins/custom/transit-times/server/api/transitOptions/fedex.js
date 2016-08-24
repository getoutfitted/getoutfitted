import Fedex from 'shipping-fedex';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { getAPIAuth } from './helpers';

export const FedExApi = {
  getFedexTransitTime(address) {
    check(address, {
      address1: String,
      address2: Match.Optional(String),
      fullName: Match.Optional(String),
      phone: Match.Optional(String),
      city: String,
      region: String,
      postal: String,
      country: String
    });
    const auth = getAPIAuth('fedex');
    if (!auth) {
      return false;
    }

    let fedexTimeTable = {
      'ONE_DAY': 1,
      'TWO_DAYS': 2,
      'THREE_DAYS': 3,
      'FOUR_DAYS': 4,
      'FIVE_DAYS': 5,
      'SIX_DAYS': 6,
      'SEVEN_DAYS': 7,
      'EIGHT_DAYS': 8,
      'NINE_DAYS': 9,
      'TEN_DAYS': 10,
      'ELEVEN_DAYS': 11,
      'TWELVE_DAYS': 12,
      'THIRTEEN_DAYS': 13,
      'FOURTEEN_DAYS': 14,
      'FIFTEEN_DAYS': 15,
      'SIXTEEN_DAYS': 16,
      'SEVENTEEN_DAYS': 17,
      'EIGHTEEN_DAYS': 18,
      'NINETEEN_DAYS': 19,
      'TWENTY_DAYS': 20
    };

    let fedex = new Fedex({
      'environment': auth.liveApi ? 'live' : 'sandbox',
      'key': auth.key,
      'password': auth.password,
      'account_number': auth.accountNumber,
      'meter_number': auth.meterNumber,
      'imperial': true
    });

    let shipment = {
      ReturnTransitAndCommit: true,
      CarrierCodes: ['FDXE', 'FDXG'],
      RequestedShipment: {
        DropoffType: 'REGULAR_PICKUP',
        ServiceType: 'FEDEX_GROUND', // GROUND_HOME_DELIVERY
        PackagingType: 'YOUR_PACKAGING',
        Shipper: {
          Contact: {
            PersonName: 'Shipper Person',
            CompanyName: 'GetOutfitted',
            PhoneNumber: '5555555555'
          },
          Address: {
            StreetLines: [
              '103 Main St'
            ],
            City: 'Dillon',
            StateOrProvinceCode: 'CO',
            PostalCode: '80435',
            CountryCode: 'US'
          }
        },
        Recipient: {
          Contact: {
            PersonName: address.fullName,
            CompanyName: 'Place',
            PhoneNumber: address.phone
          },
          Address: {
            StreetLines: [
              address.address1,
              address.address2
            ],
            City: address.city,
            StateOrProvinceCode: address.region,
            PostalCode: address.postal,
            CountryCode: address.country,
            Residential: false // Or true
          }
        },
        ShippingChargesPayment: {
          PaymentType: 'SENDER',
          Payor: {
            ResponsibleParty: {
              AccountNumber: fedex.options.account_number
            }
          }
        },
        PackageCount: '1',
        RequestedPackageLineItems: {
          SequenceNumber: 1,
          GroupPackageCount: 1,
          Weight: {
            Units: 'LB',
            Value: '7.0'
          },
          Dimensions: {
            Length: 24,
            Width: 14,
            Height: 6,
            Units: 'IN'
          }
        }
      }
    };

    let fedexRatesSync = Meteor.wrapAsync(fedex.rates);

    let rates = fedexRatesSync(shipment);
    if (!rates.RateReplyDetails) {
      return false;
    }
    let groundRate = rates.RateReplyDetails[0];
    return fedexTimeTable[groundRate.TransitTime];
  }
};
