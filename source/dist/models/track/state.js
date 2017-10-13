define('models/track/state',['require','backbone'],function(require) {
  var Backbone = require('backbone')
      ;

  var State = Backbone.Model.extend({
    defaults: {
      loaded: false,
      notified: false,

      view_fairway: true, // toggle to false when in Green view
      forced_green: false, // set whether we're forced into Green view via specific toggle

      selected_shot: undefined,

      open_shot_detail: undefined, // shot number that has open detail overlay
      open_shot_stack: undefined, // array of open shots

      stored_round: undefined,
      selected_round: -1,

      stored_hole: undefined,
      selected_hole: -1,

      hole_info: undefined,

      showing_playoff: false,
      live_mode: true,
      compare_mode: false,

      error_shown: false
    },

    initialize: function() {
      this.teepin = {};
      this.player_position = {
        primary: undefined,
        ghost: [],
        compare: []
      };

      this.total_players = 0;
      this.loaded_players = [];

      this.set('hole_info', {});
      this.set('open_shot_stack', []);

      this.on('change:view_fairway', this.triggerFairway);
    },

    reset: function() {
      this.player_position = {
        primary: undefined,
        ghost: [],
        compare: []
      };

      this.total_players = 0;
      this.loaded_players = [];

      this.set('hole_info', {});

      var shots = this.get('open_shot_stack');
      shots.forEach(function(shot) {
        shot.destroy();
      });
      this.set('open_shot_stack', []);
    },

    triggerFairway: function(model, value, options) {
      if(value) {
        this.trigger('view_fairway:enter');
      } else {
        this.trigger('view_fairway:exit');
      }
    },

    addToTotal: function(id) {
      if(!this.get('notified')) {
        this.total_players++;
      }
    }
  });

  return new State();
});

