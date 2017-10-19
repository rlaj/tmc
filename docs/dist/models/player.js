define('models/player',['require','jquery','backbone','models/base-player'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      BasePlayer = require('models/base-player')
  ;

  var Player = BasePlayer.extend({

    defaults: {
      'full_name': '',
      'last_name': '',
      'first_name': '',
      'id': '',
      'country': '',
      'contry_long': '',
      'Amateur': '',
      'First': '',
      'Past': '',
      //TODO: reformat above attributes to the ones below in select.json
      'amateur': false,
      'past': false,
      'firsttimer': false
    },

    initialize: function() {
      BasePlayer.prototype.initialize.apply(this, arguments);
    },

    parse: function(response) {
      response.amateur = response.Amateur === "1" ? true : false;
      response.past = response.Past === "1" ? true : false;
      response.firsttimer = response.First === "1" ? true : false;
      delete response.Amateur;
      delete response.Past;
      delete response.First;
      return response;
    }




   
  });

  return Player;
})


;
