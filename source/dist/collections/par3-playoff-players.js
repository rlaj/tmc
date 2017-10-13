define('collections/par3-playoff-players',['require','jquery','backbone','models/par3-playoff-player','collections/par3-players'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Par3PlayoffPlayer = require('models/par3-playoff-player'),
      Par3Players = require('collections/par3-players')
      ;

  var Par3PlayoffPlayersList = Backbone.Collection.extend({
    model: Par3PlayoffPlayer,

    initialize: function() {
      this.logger = new eventsCore.util.Logger('Par3PlayoffPlayersList');
      this.logger.info('Initialize');

      this.createCollection();

      this.listenTo(Par3Players, 'refresh:par3PlayoffData', this.updateCollection);
    },

    createCollection: function(params) {
      this.reset(Par3Players.par3PlayoffPlayers);
      this.logger.info('Par3 Playoff Collection :%o', this);
    },

    updateCollection: function(data) {
      this.set(data);
      this.logger.info('par3 playoff collection updated: %o', data);
    }
  });

  return new Par3PlayoffPlayersList();
});
