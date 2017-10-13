define('models/par3-closest-player',['require','jquery','backbone','models/base-player'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      BasePlayer = require('models/base-player')
  ;

  var Par3ClosestPlayer = BasePlayer.extend({

    defaults: {
      hole: '',
      distance: '',
      id: '',
      sort_order: '',
      full_name: '',
      last_name: ''
    },

    // use sort_order as a unique identifier as there could be same players showing up in the Closest to Hole table
    idAttribute: 'sort_order',

    initialize: function() {
      this.logger = new eventsCore.util.Logger('Par3ClosestPlayer Model');
      this.logger.debug('Initialize');

      // detect what's changed in the model
      this.on('change', function() {
        this.logger.debug(this.get('full_name') + ' changed :%o', this.changedAttributes());
      });
    }
  });

  return Par3ClosestPlayer;
});


