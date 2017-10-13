define('views/watch-live-fg-players',['require','backbone','underscore','views/player-card','utils/pubsub','utils/scores','utils/scores-video','collections/holes'],function(require) {
  var Backbone = require('backbone'),
      _ = require('underscore'),
      PlayerCard = require('views/player-card'),
      PubSub = require('utils/pubsub'),
      Scores = require('utils/scores'),
      ScoresVideo = require('utils/scores-video'),
      HoleInfo = require('collections/holes')
      ;

  var SingleGroupView = Backbone.View.extend({
    template: '<div class="holeWrapper"><div class="hole selected"></div></div>'
              + '<div class="players"></div>',

    className: 'groups',

    defaults: {
      id: '', // group id
      players: [] // array of player models
    },

    initialize: function(opts) {
      this.options = _.extend({}, this.defaults, opts);
      this.id = this.options.id;
      this.players = this.options.players;
      this.hole = 19;

      this.$el.html(this.template);
      this.$title = this.$('.holeWrapper .hole');
      this.$players = this.$('.players');

      this.wrapStyle = 'wrapperThird';
      if(this.players.length === 2) {
        this.wrapStyle = 'wrapperHalf';
        var wrap = $('<div class="content_tab selected twoplayers">');
        this.$players.append(wrap);
        this.$players = wrap;
      }

      // keep latest hole up to date as scores update
      HoleInfo.fetch({
        success: function() {
          this.findLatestHole();
          this.listenTo(PubSub, 'scores:refresh', this.findLatestHole);
        }.bind(this)
      });

      this.cards = [];
    },

    render: function() {
      this.players.forEach(function(player) {
        // build player card
        var pcard = new PlayerCard({
          model: player,
          favorite: true,
          metrics_suffix: 'bio_live'
        }).render();

        pcard.$el.addClass(this.wrapStyle);

        this.cards.push(pcard);
        this.$players.append(pcard.$el);
      }.bind(this));

      return this;
    },

    onDispose: function() {
      this.cards.forEach(function(card) {
        card.dispose();
      });
    },

    findLatestHole: function() {
      this.players.forEach(function(player) {
        // figure out which hole the last player in the group is on
        var curHole = Scores.Utilities.getHoleFromShot(player.get('lastHoleWithShot'));
        if(curHole < this.hole) {
          this.hole = curHole;
        }
      }.bind(this));

      this.updateHoleInformation();
    },

    updateHoleInformation: function() {
      if(this.hole < 0 || isNaN(this.hole) || this.hole === null) {
        this.hole = 1;
      } else if(this.hole > 18) {
        this.hole = 18;
      }

      var hole = HoleInfo.get(this.hole);
      var details = ['Hole ' + hole.get('number'), hole.get('plant'), 'Par ' + hole.get('par'), hole.get('yds') + ' Yards'];

      this.$title.html(details.join(' &nbsp;/&nbsp; '));
    }
  });

  var LiveFeaturedGroupPlayersView = Backbone.View.extend({
    el: '#livePlayerContent',

    initialize: function(opts) {
      if(opts && opts.channelId) {
        this.channelId = opts.channelId;
      }

      this.$container = this.$('#holePlayers').empty();

      this.groups = {}; // hash of player models in the group by group id
      this.groupIds = []; // array of current group ids
      this.group_views = {};

      this.listenTo(ScoresVideo, 'featuredplayers:refresh', this.load);
    },

    render: function() {
      if(!Scores.isDataLoaded()) {
        this.stopListening(ScoresVideo, 'featuredplayers:refresh', this.render);
        this.listenToOnce(ScoresVideo, 'featuredplayers:refresh', this.render);
        return;
      }

      this.load();

      return this;
    },

    onDispose: function() {
      this.removeGroupViews();
    },

    load: function() {
      // divide players into groups
      var channel = ScoresVideo.groupChannels[this.channelId];
      this.players = channel.players.slice(0);
      var old_groups = this.groupIds.slice(0);

      // reset group tracking objects
      this.groupIds = [];
      this.groups = {};
      for(var i = 0, l = this.players.length; i < l; i++) {
        var playerid = this.players[i];
        var player = Scores.collection.get(playerid);
        if(player !== undefined) {
          // store group id
          var curGroup = player.get('group');
          if(this.groups[curGroup] === undefined) {
            this.groups[curGroup] = [];
            this.groupIds.push(curGroup);
          }

          this.groups[curGroup].push(player);
        }
      }
      var to_remove = _.difference(old_groups, this.groupIds);
      var to_add = _.difference(this.groupIds, old_groups);

      this.addGroupViews(to_add);
      this.removeGroupViews(to_remove);
    },

    addGroupViews: function(to_add) {
      if(to_add === undefined) {
        to_add = this.groupIds;
      }

      // build view for each group
      for(var i = 0, l = to_add.length; i < l; i++) {
        var id = to_add[i];

        // only create new group view if it hadn't already been created before
        if(this.group_views[id] === undefined) {
          var view = new SingleGroupView({
            id: id,
            players: this.groups[id]
          }).render();

          this.group_views[id] = view;
          this.$container.append(view.$el);
        }
      }

      // only trigger unveil if we actually added something to the page
      if(to_add.length > 0) {
        PubSub.trigger('lookup.unveil');
      }
    },

    removeGroupViews: function(to_remove) {
      if(to_remove === undefined) {
        to_remove = this.groupIds;
      }
      for(var i = 0, l = to_remove.length; i < l; i++) {
        var id = to_remove[i];

        // remove groups no longer featured
        this.group_views[id].dispose();
        delete this.group_views[id];
      }
    }
  });

  return LiveFeaturedGroupPlayersView;
});

