define('collections/track/players',['require','backbone','models/track/state','utils/window-size','utils/track/constants'],function(require) {
  var Backbone = require('backbone'),
      // Player = require('models/track/player'),
      State = require('models/track/state'),
      Win = require('utils/window-size'),
      Constants = require('utils/track/constants')
      ;

  var Players = Backbone.Collection.extend({
    // model: Player,

    initialize: function() {
      this.on('refresh', this.refresh);
    },

    refresh: function() {
      if(this.length > 0) {
        var primary_refresh = this.get(State.player_position.primary).refresh();

        // NOTE: Ignore window size here because if resized down from desktop to mobile
        // while having a compare player, not refreshing the compare players causes issues

        // NOTE: Wait until primary player's data is updated before fetch companion players
        // because primary player determines round/hole information, that potentially
        // makes any companion player draws invalid
        primary_refresh.done(function() {
          // trigger refresh in all active players
          // var types = ['compare','ghost'];
          // if(Track.compare_mode) {
            var types = ['compare'];
          // }
          for(var k=0,m=types.length;k<m;k++) {
            var type = types[k];
            for(var i=0,l=State.player_position[type].length;i<l;i++) {
              var pid = State.player_position[type][i];
              this.get(pid).refresh();
            }
          }
        }.bind(this));
      }
    },

    // given a type and optional position, return the relevant Track.Player object
    // default behavior if no parameters passed is to return primary tracking player
    // +type+ : one of the STATE constants
    // +pos+ (optional) : position 1 or 2 in type
    getPlayer: function(type, pos) {
      var player = false;
      switch(type) {
        case (Constants.STATE.COMPARE) :
          player = this.get(State.player_position.compare[pos - 1]);
          break;
        case (Constants.STATE.GHOST) :
          player = this.get(State.player_position.ghost[pos - 1]);
          break;
        case (Constants.STATE.PRIMARY) :
        default :
          player = this.get(State.player_position.primary);
      }

      return player;
    }
  });

  return new Players();
});
