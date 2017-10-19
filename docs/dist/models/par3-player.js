define('models/par3-player',['require','jquery','backbone','models/base-player'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      BasePlayer = require('models/base-player')
  ;

  var Par3Player = BasePlayer.extend({

    defaults: {
      id: '',
      name: '',
      pos: '',
      sort_order: '',
      first_name: '',
      last_name: '',
      thru: '',
      today: '',
      total: ''
    },

    // use name as a unique identifier as not every player has a player id
    idAttribute: 'name',

    initialize: function() {
      this.logger = new eventsCore.util.Logger('Par3Player Model');
      this.logger.debug('Initialize');

      // detect what's changed in the model
      this.on('change', function() {
        this.logger.debug(this.get('name') + ' changed :%o', this.changedAttributes());
      });

      BasePlayer.prototype.initialize.apply(this, arguments);

      /**  override base-player.js setFullName()
      */
      this.setFullName(this.get('first_name'), this.get('last_name'));
    },

    parse: function(response) {
      response.current_sort_order = parseInt(response.sort_order);

      return response;
    }
  });

  return Par3Player;
});


