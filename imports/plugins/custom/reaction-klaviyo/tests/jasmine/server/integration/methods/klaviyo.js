beforeAll(function () {
  VelocityHelpers.exportGlobals();
});

describe('Klaviyo Methods', function () {
  describe('Klaviyo/logEvent', function () {
    beforeEach(function () {

    });
    it('make an HTTP request', function () {
      spyOn(HTTP, 'get');
      Meteor.call('klaviyo/logEvent', 'STRINGDATE');
      expect(HTTP.get).toHaveBeenCalled();
    });

    it('should throw an error if not passed a string', function () {
      spyOn(HTTP, 'get');
      expect(function () {
        Meteor.call('klaviyo/logEvent', true);
      }).toThrow();
      expect(function () {
        Meteor.call('klaviyo/logEvent', {});
      }).toThrow();
      expect(function () {
        Meteor.call('klaviyo/logEvent', 4);
      }).toThrow();
      expect(function () {
        Meteor.call('klaviyo/logEvent', undefined);
      }).toThrow();
      expect(HTTP.get).not.toHaveBeenCalled();
    });

    xit('should log the callback error', function() {
      let event = {test: 'TestEvent'};
      let stringEvent = JSON.stringify(event);
      let data = Base64.encode(stringEvent);
      spyOn(ReactionCore.Log, 'warn');
      stubMethod(HTTP.get, {}, {content: '0'});
      Meteor.call('klaviyo/logEvent', data);
      expect(ReactionCore.Log.warn).toHaveBeenCalled()
    });
  });
});
