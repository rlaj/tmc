define('collections/lb-playoff-players',['require','jquery','backbone','models/lb-playoff-player','collections/score-players'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      PlayoffPlayer = require('models/lb-playoff-player'),
      ScorePlayers = require('collections/score-players')
      ;

  var LBPlayoffPlayersList = Backbone.Collection.extend({
    model: PlayoffPlayer,

    initialize: function() {
      this.logger = new eventsCore.util.Logger('LBPlayoffPlayersList');
      this.logger.info('Initialize');

      this.createCollection();

      this.listenTo(ScorePlayers, 'refresh:playoffData', this.updateCollection);
    },

    createCollection: function(params) {
      this.reset(ScorePlayers.playoffPlayers);
      this.logger.info('Playoff Collection :%o', this);
    },

    updateCollection: function(data) {
      this.set(data);
      this.logger.info('playoff collection updated: %o', data);
    }
  });

  return new LBPlayoffPlayersList();
});
