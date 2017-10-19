define('views/track/stat-bar',['require','backbone','utils/scores','models/track/state','utils/track/constants','utils/track/track','collections/track/players'],function(require) {
  var Backbone = require('backbone'),
      Scores = require('utils/scores'),

      State = require('models/track/state'),
      Constants = require('utils/track/constants'),
      TrackUtils = require('utils/track/track'),
      Players = require('collections/track/players')
      ;

  var template = '<div class="player"><div class="number"></div><div class="shot-info distance"></div><div class="shot-info topin"></div></div>';

  var PlayerView = Backbone.View.extend({
    className: 'player',

    template: template,

    unavailable: false,

    initialize: function() {
      this.$el.attr('data-id', this.model.id);
    },

    render: function() {
      this.$el.empty();
      if(this.className === 'primary') {
        this.$el.append('<div class="title">Comparing Shot</div>');
      }
      this.$el.append(this.template);
      this.updateShotStat();

      return this;
    },

    // update shot information given a container and player object
    updateShotStat: function() {
      var cur_shot;
      var diff_shot = false;
      switch(this.model.get('state')) {
        case Constants.STATE.COMPARE:
          if(this.model.get('current_hole') && parseInt(this.model.get('current_hole').id, 10) === State.get('selected_hole') && State.get('selected_shot'))  {
            var shots = this.model.get('current_hole').shots;
            var primary_shot = State.get('selected_shot').get('number'),
                pos = primary_shot;

            // if primary player is on the tee, show first shot for compare player
            if(pos === 0 && shots.length > 0) {
              pos = 1;
              diff_shot = shots[0].get('number') !== 0;
            } else

            // else if shot number is higher than player's last shot, show last shot
            if(shots.length < pos) {
              pos = shots.length;
              diff_shot = true;
            }
            cur_shot = shots[pos - 1];
          }
          break;
        case Constants.STATE.PRIMARY:
          cur_shot = State.get('selected_shot');
          break;
        default:
          break;
      }

      if(diff_shot) {
        this.$el.addClass('fadeback');
      } else {
        this.$el.removeClass('fadeback');
      }

      if(cur_shot === undefined) {
        this.$el.addClass('unavailable')
          .find('.distance').html('Player has not<br/>played this hole');
        this.unavailable = true;

        return;
      } else if(cur_shot.get('number') === 0) {
        this.$el.addClass('unavailable')
          .find('.distance').html('Group is on tee');
        this.unavailable = true;

        return;
      } else {
        this.$el.removeClass('unavailable');
        this.unavailable = false;
      }

      // populate shot number
      this.$('.number').html(cur_shot.get('number'));

      // figure out distance in proper units
      var distance_container = this.$('.distance').removeClass('penalty');
      var span = $('<span>');
      distance_container.html(span);
      TrackUtils.setShotDistance(span, cur_shot);

      // figure out topin in proper units, or list the score
      var topin_container = this.$('.topin').removeClass('score');
      span = $('<span>');
      topin_container.html(span);
      TrackUtils.setShotToPin(span, cur_shot);
    }
  })

  var PlayerStatBar = Backbone.View.extend({
    el: '#statBar',

    visible: false,

    initialize: function() {
      this.primary = this.$('.primary');
      this.secondary = this.$('.secondary');

      this.views = {};

      this.listenTo(State, 'statbar:set', this.render);
      this.listenTo(State, 'statbar:add', this.add);
      this.listenTo(State, 'statbar:remove', this.remove);
      // this.listenTo(State, 'statbar:show', this.show);
      // this.listenTo(State, 'statbar:hide', this.hide);
      this.listenTo(State, 'statbar:update', this.update);
    },

    render: function() {
      var primary_player = Players.getPlayer();
      this.prim = new PlayerView({
        model: primary_player,
        className: 'primary'
      }).render();
      this.$('.primary').replaceWith(this.prim.$el);
      primary_player.statbar = this.prim;

      return this;
    },

    onDispose: function() {
      if(this.prim) {
        this.prim.dispose(true);
      }
      _.each(this.views, function(view) {
        // delete reference from Player model
        delete view.model.statbar;
        view.dispose();
      });
      this.views = {};
    },

    // show: function() {
    //   this.$el.addClass('visible');
    //   this.visible = true;
    // },

    // hide: function() {
    //   this.$el.removeClass('visible');
    //   this.visible = false;
    // },

    add: function(id) {
      if(!this.prim) {
        this.render();
      }
      // this.show();

      // remove any existing views before adding new one
      this.remove(id);

      var player = Players.get(id);
      var view = new PlayerView({
        model: player,
        className: 'comparison'
      }).render();

      this.secondary.append(view.$el);
      player.statbar = view;
      this.views[id] = view;
    },

    remove: function(id) {
      if(this.views[id]) {
        this.views[id].dispose();
        delete this.views[id].model.statbar;
        delete this.views[id];
      }

      // if(!State.get('compare_mode')) {
      //   this.hide();
      // }
    },

    update: function(id) {
      var player = Players.get(id);
      if(id && player.statbar) {
        player.statbar.updateShotStat();

        if(id === State.player_position.primary) {
          // if primary player, update compare player shot stats as well
          var compare_players = State.player_position.compare;
          for(var i=0,l=compare_players.length;i<l;i++) {
            var view = this.views[compare_players[i]];
            var comp = Players.get(compare_players[i]);
            var comp_hole = comp.get('current_hole');

            // if view exists and
            // compare player has a hole and it doesn't match the current hole
            // or compare player doesn't have the hole and he's not marked unavailable yet
            if(view &&
               ((comp_hole && player.get('current_hole').id !== comp_hole.id) ||
                (comp_hole === undefined && !view.unavailable))
              ) {
              view.updateShotStat();
            }
          }
        }
      }
    }
  });

  return PlayerStatBar;
});
