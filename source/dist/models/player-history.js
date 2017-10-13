define('models/player-history',['require','jquery','backbone','models/base-player'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      BasePlayer = require('models/base-player')
  ;

  var PlayerHistory = Backbone.Model.extend({

    defaults: {

    },

    url: function() {
      return '/en_US/xml/gen/players/' + this.get('filename');
      // return 'http://www-cdt.masters.com/en_US/xml/gen/players/history/25804.json';
    },


    parse: function(response) {
      if(response.history) {
        response.history = response.history.results;
        delete response.history.results;
      }
      return response;
    },



  });

  return PlayerHistory;
})


;
