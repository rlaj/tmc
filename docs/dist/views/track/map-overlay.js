define('views/track/map-overlay',['require','underscore','utils/browser','backbone','utils/scores','utils/metrics','utils/pubsub','utils/track/track','jquery.mousewheel','jquery.jscrollpane'],function(require) {
  var _ = require('underscore'),
      Browser = require('utils/browser'),
      Backbone = require('backbone'),
      Scores = require('utils/scores'),
      Metrics = require('utils/metrics'),
      PubSub = require('utils/pubsub'),

      TrackUtils = require('utils/track/track')
      ;

  require('jquery.mousewheel');
  require('jquery.jscrollpane');

  var hole_name_template = '<div class="hole-name"><div class="hole-number">Hole No. <%= number %>,</div><div class="hole-flora"><%= plant %></div></div>',
      hole_stats_template = '<div class="hole-stats"><div class="parTxt"><label>Par</label><span id="holePar" class="data holePar"><%= par %></span></div>'
                          + '<div class="yardTxt"><label>Yards</label><span id="holeYds" class="data holeYds"><%= yds %></span></div></div>';

  var HOLE_PROGRESS = {
    'tee': 1,
    'fairway': 2,
    'green': 3,
    'finished': 4,
    'other': 5
  };

  var HoleDetails = Backbone.View.extend({
    name_template: _.template(hole_name_template),
    stats_template: _.template(hole_stats_template),

    initialize: function() {
      this.$el.attr('data-hole', this.model.id);

      this.$el.html(this.name_template(this.model.attributes))
          .append(this.stats_template(this.model.attributes));
    }
  });

  var player_template = _.template('<a href="<%= url %>">'
                                + '<img src="/images/players/2016/80x80/<%= player.id %>.jpg" alt="<%= player.full_name %>" /><div class="name"><%= player.display_name2 %></div>'
                                + '</a>');

  var PlayerView = Backbone.View.extend({
    className: 'player',
    template: player_template,

    initialize: function() {
      this.listenTo(this.model, 'change:is_fave', this.checkFavorite);
      this.listenTo(this.model, 'change:current_sort_order', this.checkLeader);
    },

    render: function() {
      this.checkFavorite();
      this.checkLeader();

      this.$el.html(this.template({
        player: this.model.attributes,
        url: this.getURL(this.model.id)
      }));

      return this;
    },

    onDispose: function() {

    },

    checkFavorite: function() {
      this.$el.toggleClass('has_favorite', this.model.get('is_fave'));
    },

    checkLeader: function() {
      this.$el.toggleClass('has_leader', this.model.get('current_sort_order') === 1);
    },

    getURL: function(id) {
      var url = '/en_US/scores/track/track.html?pid=' + id;
      if(Browser.app && Browser.apptype.android) {
        url = '/android' + url;
      }

      return url;
    }
  });

  var PlayerRow = Backbone.View.extend({
    player_views: {},

    initialize: function() {
      this.listenTo(PubSub, 'throttle:resize', this.reinitScroll);
    },

    render: function() {
      var players = [];
      console.log('[PlayerRow] for hole ' + this.model.id + ':');

      // sort players by tee order
      this.collection.sort(function(a, b) {
        return parseInt(a.get('tee_order'), 10) > parseInt(b.get('tee_order'), 10);
      });

      _.each(this.collection, function(player) {
        console.log('[Player] ' + player.get('full_name') + ' %o, thru: ' + player.get('thru') + ', lastHoleWithShot: ' + player.get('lastHoleWithShot') + ', holeProgress: ' + player.get('holeProgress'), player);
        this.player_views[player.id] = new PlayerView({ model: player }).render();
        players.push(this.player_views[player.id].$el);
      }.bind(this));

      // add no players message
      if(players.length === 0) {
        players = ['<div class="noplayers">No Players</div>'];
      }

      this.$('section.scroll-list').empty();
      this.reinitScroll();
      this.$('section.scroll-list').html(players);
      this.reinitScroll();

      return this;
    },

    onDispose: function() {
      _.each(this.player_views, function(view) {
        view.dispose();
      });
      this.player_views = {};
    },

    reinitScroll: function() {
      var jsp = this.$('.scroll-pane').data('jsp');
      if(jsp) {
        jsp.reinitialise();
      } else {
        this.$('.scroll-pane').jScrollPane();
      }
    }
  });

  var TrackMapOverlay = Backbone.View.extend({
    el: '.hole-info-wrap',

    events: {
      'click .close': 'triggerClose'
    },

    initialize: function(opts) {
      this.hole_details = new HoleDetails({
        el: this.$('.hole-info-row'),
        model: this.model
      });

      this.locatePlayersOnHole();
      this.listenTo(PubSub, 'scores:refresh', this.locatePlayersOnHole);
    },

    render: function() {
      this.$el.show();

      this.tee.reinitScroll();
      this.fairway.reinitScroll();
      this.green.reinitScroll();
    },

    onDispose: function() {
      if(this.tee) {
        this.tee.dispose(true);
        this.fairway.dispose(true);
        this.green.dispose(true);
      }
    },

    triggerClose: function() {
      this.close();

      TrackUtils.measure('Close Hole Detail');
      return false;
    },

    close: function() {
      this.$el.hide();
      this.stopListening();

      this.trigger('hole:close');
    },

    locatePlayersOnHole: function() {
      // get players on hole
      var hole = this.model.id;
      var players = Scores.collection.filter(function(player) {
        return player.getCurrentHole() === hole;
      });

      // divide by where they are on the hole
      _.each(['tee', 'fairway', 'green'], function(site) {
        var place = _.filter(players, function(player) {
          return player.get('holeProgress') === HOLE_PROGRESS[site];
        });

        if(this[site]) {
          this[site].collection = place;
          this[site].render();
        } else {
          this[site] = new PlayerRow({
            el: this.$('#' + site),
            collection: place,
            model: this.model
          }).render();
        }
      }.bind(this));
    }
  });

  return TrackMapOverlay;
});

