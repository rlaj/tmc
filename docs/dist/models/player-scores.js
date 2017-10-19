define('models/player-scores',['require','jquery','backbone','models/base-player'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      BasePlayer = require('models/base-player')
  ;

  var PlayerScores = Backbone.Model.extend({

    defaults: {

    },

    url: function() {
      return '/en_US/xml/gen/players/' + this.get('filename');
    },


    parse: function(response) {
      response.scores = response.scores.score;
      
      if((response.scores.position.trim() && response.scores.position !== 'DQ') || response.scores.total.trim()) {
        response.hasScores = true;
      }

      delete response.scores.score;
      return response;
    },







   
  });

  return PlayerScores;
})


;
