define('models/lb-playoff-player',['require','jquery','backbone'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone')
  ;

  var PlayoffPlayer = Backbone.Model.extend({

    defaults: {
      id: '',
      display_name: '',
      score: '',
      status: '',
      active: '',
      video: '',
      total: ''
    },

    initialize: function() {
      this.logger = new eventsCore.util.Logger('PlayoffPlayer Model');
      this.logger.debug('Initialize');

      // detect what's changed in the model
      this.on('change', function() {
        this.logger.debug(this.get('display_name') + ' changed :%o', this.changedAttributes());
      });
    },

    parse: function(response) {
      // response.sortOrder = parseInt(response.sortOrder);

      return response;
    }
  });

  return PlayoffPlayer;
});


