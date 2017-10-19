define('models/par3-playoff-player',['require','jquery','backbone'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone')
  ;

  var Par3PlayoffPlayer = Backbone.Model.extend({

    defaults: {
      id: '',
      name: '',
      score: '',
      status: '',
      total: ''
    },

    initialize: function() {
      this.logger = new eventsCore.util.Logger('Par3PlayoffPlayer Model');
      this.logger.debug('Initialize');

      // detect what's changed in the model
      this.on('change', function() {
        this.logger.debug(this.get('name') + ' changed :%o', this.changedAttributes());
      });
    },

    parse: function(response) {
      // response.sortOrder = parseInt(response.sortOrder);

      return response;
    }
  });

  return Par3PlayoffPlayer;
});


