define('views/track/map',['require','jquery','backbone','utils/pubsub','utils/favorites','utils/scores'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      PubSub = require('utils/pubsub'),

      Favorite = require('utils/favorites'),
      Scores = require('utils/scores')
      ;

  var TrackMap = Backbone.View.extend({
    el: '#holeContainer.tracker',

    events: {
      'click .holeMarker:not(.disabled) a': 'selectHole',
      'click .holeMarker.disabled': 'noOp'
    },

    fave_players: [],

    initialize: function() {
      this.markers = this.$('.holeMarker');

      // update favorite and leader positions when scores update
      this.listenTo(PubSub, 'scores:refresh', this.updatePositions);

      // update favorite positions when they've been changed
      this.listenTo(PubSub, 'favorite:add', this.updateFavoritesPositions);
      this.listenTo(PubSub, 'favorite:remove', this.updateFavoritesPositions);
    },

    render: function() {
      if(!Scores.isDataLoaded()) {
        // use this.render to avoid conflicting with persistent listener set in initialize
        this.stopListening(PubSub, 'scores:refresh', this.render)
          .listenToOnce(PubSub, 'scores:refresh', this.render);
      } else {
        this.updatePositions();
      }

      return this;
    },

    onDispose: function() {

    },

    updatePositions: function() {
      this.updateFavoritesPositions();
      this.updateLeaderPosition();
    },

    updateFavoritesPositions: function() {
      this.fave_players = Favorite.getPlayerIDs();

      this.markers.removeClass('has_favorite');
      for(var i = 0, l = this.fave_players.length; i < l; i++) {
        var fave = this.fave_players[i];
        var player = Scores.Utilities.findByID(fave);
        if(player) {
          var hole = player.getCurrentHole();

          if(hole !== null && !isNaN(hole)) {
            this.$('#hole' + hole).addClass('has_favorite');
          }
        }
      }
    },

    updateLeaderPosition: function() {
      this.markers.removeClass('has_leader');
      var player = Scores.collection.at(0);
      var hole = player.getCurrentHole();

      if(hole !== null && !isNaN(hole)) {
        this.$('#hole' + hole).addClass('has_leader');
      }
    },

    selectHole: function(e) {
      // fill in hole information
      var $this = $(e.currentTarget);
      var hole_num = $this.parent().attr('id').substring(4);
      hole_num = parseInt(hole_num, 10);

      this.trigger('hole:select', $this, hole_num);

      return false;
    },

    noOp: function() {
      return false;
    }
  });

  return TrackMap;
});

