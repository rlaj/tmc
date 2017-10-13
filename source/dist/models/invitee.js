define('models/invitee',['require','jquery','backbone','models/base-player'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      BasePlayer = require('models/base-player')
      ;

  var Invitee = BasePlayer.extend({

    defaults: {
      'full_name': '',
      'last_name': '',
      'first_name': '',
      'country_long': '',
      'qualifications': '',
      'amateur': false,
      'firsttimer': false,
      'augusta': false,
      'pastChamps': false,
      'not_playing': false
    },

    initialize: function() {
      BasePlayer.prototype.initialize.apply(this, arguments);
    },

    parse: function(response) {
      return response;
    }


  });

  return Invitee;
});



