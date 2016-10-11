function klaviyoEventCreator(user) {
  return {
    event: 'Test Event',
    properties: {
      'Cost': 45
    },
    customer_properties: {
      $email: user.emails[0].address
    }
  };
}

function klaviyoPersonCreator(user) {
  return {
    properties: {
      '$email': user.emails[0].address,
      'name': user.profile.name
    }
  };
}

beforeAll(function () {
  VelocityHelpers.exportGlobals();
});

describe('Klaviyo', function () {
  describe('trackEvent', function () {
    beforeEach(function () {
      spyOn(Meteor, 'call');
      Meteor.users.remove({});
      return ReactionCore.Collections.Packages.remove({});
    });

    it('should have a method named trackEvent', function () {
      expect(Object.keys(Klaviyo)).toContain('trackEvent');
    });

    it('should throw an error when passed anything but an object', function () {
      spyOn(Klaviyo, 'trackEvent').and.callThrough();
      expect(function () {
        Klaviyo.trackEvent('STRING');
      }).toThrow();
      expect(function () {
        Klaviyo.trackEvent(4);
      }).toThrow();
      expect(function () {
        Klaviyo.trackEvent(true);
      }).toThrow();
      expect(function () {
        Klaviyo.trackEvent(undefined);
      }).toThrow();
    });

    it('should throw an error if shop does not have klaviyo', function () {
      const klaviyoPackage = Factory.create('klaviyoPackage');
      const user = Factory.create('user');
      spyOn(ReactionCore, 'getShopId').and.returnValue(Random.id());
      const klaviyoEvent = klaviyoEventCreator(user);
      expect(function () {
        Klaviyo.trackEvent(klaviyoEvent);
      }).toThrowError('403 Access Denied, Klaviyo is not enabled for this shop.');
    });

    it('should throw an error if klaviyo is not enabled', function () {
      const klaviyoPackage = Factory.create('klaviyoPackage', {enabled: false});
      const user = Factory.create('user');
      spyOn(ReactionCore, 'getShopId').and.returnValue(klaviyoPackage.shopId);
      expect(klaviyoPackage.enabled).toBe(false);
      const klaviyoEvent = klaviyoEventCreator(user);
      expect(function () {
        Klaviyo.trackEvent(klaviyoEvent);
      }).toThrowError('403 Access Denied, Klaviyo is not enabled for this shop.');
    });

    it('should throw an error if event has no properties field', function () {
      let klaviyoPackage = Factory.create('klaviyoPackage', {
        'settings.api.publicKey': 'FakeKey',
        'settings.api.privateKey': 'FakeKey'
      });
      const user = Factory.create('user');
      spyOn(ReactionCore, 'getShopId').and.returnValue(klaviyoPackage.shopId);
      let event = klaviyoEventCreator(user);
      let eventWithOutProperties = _.omit(event, 'properties');
      expect(function () {
        Klaviyo.trackEvent(eventWithOutProperties);
      }).toThrowError('403 No Event or Properties were passed into Klaviyo object');
    });

    it('should throw an error if event has no properties', function () {
      let klaviyoPackage = Factory.create('klaviyoPackage', {
        'settings.api.publicKey': 'FakeKey',
        'settings.api.privateKey': 'FakeKey'
      });
      const user = Factory.create('user');
      spyOn(ReactionCore, 'getShopId').and.returnValue(klaviyoPackage.shopId);
      let event = klaviyoEventCreator(user);
      let eventWithOutProperties = _.omit(event.properties, 'Cost');
      expect(function () {
        Klaviyo.trackEvent(eventWithOutProperties);
      }).toThrowError('403 No Event or Properties were passed into Klaviyo object');
    });

    it('should throw an error if event has no event name', function () {
      let klaviyoPackage = Factory.create('klaviyoPackage', {
        'settings.api.publicKey': 'FakeKey',
        'settings.api.privateKey': 'FakeKey'
      });
      const user = Factory.create('user');
      spyOn(ReactionCore, 'getShopId').and.returnValue(klaviyoPackage.shopId);
      let event = klaviyoEventCreator(user);
      let eventWithOutEventName = _.omit(event, 'event');
      expect(function () {
        Klaviyo.trackEvent(eventWithOutEventName);
      }).toThrowError('403 No Event or Properties were passed into Klaviyo object');
    });

    it('should throw an error if api keys are not configurered', function () {
      let klaviyoPackage = Factory.create('klaviyoPackage');
      const user = Factory.create('user');
      let event = klaviyoEventCreator(user);
      spyOn(ReactionCore, 'getShopId').and.returnValue(klaviyoPackage.shopId);
      expect(function () {
        Klaviyo.trackEvent(event);
      }).toThrowError('403 Klaviyo API Keys are not configured');
    });

    it('should call klaviyo/logEvent when it meets all scenarios', function () {
      let klaviyoPackage = Factory.create('klaviyoPackage', {
        'settings.api.publicKey': 'FakeKey',
        'settings.api.privateKey': 'FakeKey'
      });
      const user = Factory.create('user');
      let eventWithAll = klaviyoEventCreator(user);
      spyOn(ReactionCore, 'getShopId').and.returnValue(klaviyoPackage.shopId);
      expect(Meteor.call).not.toHaveBeenCalled();
      Klaviyo.trackEvent(eventWithAll);
      expect(Meteor.call).toHaveBeenCalled();
    });
  });

  describe('trackPerson', function () {
    beforeEach(function () {
      spyOn(Meteor, 'call');
      Meteor.users.remove({});
      return ReactionCore.Collections.Packages.remove({});
    });

    it('should have a method named trackPerson', function () {
      expect(Object.keys(Klaviyo)).toContain('trackPerson');
    });

    it('should throw an error when passed anything but an object', function () {
      spyOn(Klaviyo, 'trackPerson').and.callThrough();
      expect(function () {
        Klaviyo.trackPerson('STRING');
      }).toThrow();
      expect(function () {
        Klaviyo.trackPerson(4);
      }).toThrow();
      expect(function () {
        Klaviyo.trackPerson(true);
      }).toThrow();
      expect(function () {
        Klaviyo.trackPerson(undefined);
      }).toThrow();
    });

    it('should throw an error if shop does not have klaviyo', function () {
      const klaviyoPackage = Factory.create('klaviyoPackage');
      const user = Factory.create('user');
      spyOn(ReactionCore, 'getShopId').and.returnValue(Random.id());
      const klaviyoEvent = klaviyoPersonCreator(user);
      expect(function () {
        Klaviyo.trackPerson(klaviyoEvent);
      }).toThrowError('403 Access Denied, Klaviyo is not enabled for this shop.');
    });

    it('should throw an error if klaviyo is not enabled', function () {
      const klaviyoPackage = Factory.create('klaviyoPackage', {enabled: false});
      const user = Factory.create('user');
      spyOn(ReactionCore, 'getShopId').and.returnValue(klaviyoPackage.shopId);
      expect(klaviyoPackage.enabled).toBe(false);
      const klaviyoEvent = klaviyoPersonCreator(user);
      expect(function () {
        Klaviyo.trackPerson(klaviyoEvent);
      }).toThrowError('403 Access Denied, Klaviyo is not enabled for this shop.');
    });

    it('should throw an error if Person has no properties', function () {
      let klaviyoPackage = Factory.create('klaviyoPackage', {
        'settings.api.publicKey': 'FakeKey',
        'settings.api.privateKey': 'FakeKey'
      });
      const user = Factory.create('user');
      spyOn(ReactionCore, 'getShopId').and.returnValue(klaviyoPackage.shopId);
      let person = klaviyoPersonCreator(user);
      let personWithOutProperties = _.omit(person.properties, ['$email', 'name']);
      expect(function () {
        Klaviyo.trackPerson(personWithOutProperties);
      }).toThrowError('403 No Properties were added to Klaviyo Object');
    });
    it('should call klaviyo/logEvent when it meets all scenarios', function () {
      let klaviyoPackage = Factory.create('klaviyoPackage', {
        'settings.api.publicKey': 'FakeKey',
        'settings.api.privateKey': 'FakeKey'
      });
      const user = Factory.create('user');
      let personWithAll = klaviyoPersonCreator(user);
      spyOn(ReactionCore, 'getShopId').and.returnValue(klaviyoPackage.shopId);
      expect(Meteor.call).not.toHaveBeenCalled();
      Klaviyo.trackPerson(personWithAll);
      expect(Meteor.call).toHaveBeenCalled();
    });
  });
});
