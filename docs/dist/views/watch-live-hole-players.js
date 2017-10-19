define('views/watch-live-hole-players',['require','underscore','backbone','views/secondary-dropdown','views/player-card','utils/pubsub','utils/scores','utils/scores-video','utils/common'],function(require) {
  var _ = require('underscore'),
      Backbone = require('backbone'),
      SecondaryDropdown = require('views/secondary-dropdown'),
      PlayerCard = require('views/player-card'),
      PubSub = require('utils/pubsub'),
      Scores = require('utils/scores'),
      ScoresVideo = require('utils/scores-video'),
      Common = require('utils/common')
      ;

  var JST = {};
  JST.no_players =
    '<div class="noPlayersWrapper wrapperThird playerCard">' +
    ' <div class="image no_gradient">' +
    '   <img src="/images/now/trans_16x9.gif" border="0" alt="Legend"/>' +
    ' </div>' +
    '   <span class="noPlayersText">No players currently on hole.</span>' +
    '</div>';

  var SingleHoleView = Backbone.View.extend({
    el: 'content_tab',

    selected: false,

    initialize: function(opts) {
      this.hole_num = opts.hole_num;
      this.channel = opts.channelId;

      this.cardsMap = {};
      this.currentPlayers = [];

      this.listenTo(ScoresVideo, 'holeplayers:refresh', this.loadPlayers);
    },

    render: function() {
      this.loadPlayers();
      return this;
    },

    onDispose: function() {
      this.currentPlayers.forEach(function(id) {
        this.cardsMap[id].dispose();
        delete this.cardsMap[id];
      }.bind(this));
      this.cardsMap = {};
    },

    loadPlayers: function() {
      var hole_data = ScoresVideo.holeChannels[this.channel][this.hole_num];
      if(hole_data.players.length > 0) {
        this.$('.noPlayersWrapper').remove();

        // compare hole_data.players with this.currentPlayers to spot differences
        // first check any new players to be added
        var new_ids = _.difference(hole_data.players, this.currentPlayers);
        var l = new_ids.length;
        if(l > 0) {
          var html = [];
          for(var i=0; i<l; i++) {
            var id = new_ids[i];
            var new_card = new PlayerCard({
              model: Scores.collection.get(id),
              favorite: true,
              metrics_suffix: 'bio_live'
            }).render();
            new_card.$el.addClass('wrapperThird');
            // store id/card references
            this.currentPlayers.push(id);
            this.cardsMap[id] = new_card;
            html.push(new_card.$el);
          }
          this.$el.append(html);
          // trigger unveil event here because elements were not in DOM when rendered
          // which is when unveil was applied
          PubSub.trigger('lookup.unveil');
        }

        // then check to see if players need to be removed
        var old_ids = _.difference(this.currentPlayers, hole_data.players);
        l = old_ids.length;
        if(l > 0) {
          for(var i=0; i<l; i++) {
            var id = old_ids[i];
            this.cardsMap[id].dispose();
            var pos = this.currentPlayers.indexOf(id);
            this.currentPlayers.splice(pos, 1);
          }
        }
      } else {
        // hole players is empty, remove all current players
        for(var i=0,l=this.currentPlayers.length; i<l; i++) {
          var id = this.currentPlayers[i];
          this.cardsMap[id].dispose();
        }
        this.currentPlayers = [];
        this.$el.html(JST.no_players);
      }
    }
  });

  var LiveHolePlayersView = Backbone.View.extend({
    el: '#livePlayerContent',

    events: {},

    channelId: 'ac',

    initialize: function(opts) {
      if(opts && opts.channelId) {
        this.channelId = opts.channelId;
      }

      this.holeSelector = new SecondaryDropdown({
          el: this.$('#holeSelector'),
          callback: this.selectHole,
          callback_context: this
      });
      Common.collapseMenus([this.holeSelector]);

      this.hole_views = [];
    },

    render: function() {
      this.load();

      return this;
    },

    onDispose: function() {
      this.hole_views.forEach(function(view) {
        view.dispose();
      });
      this.holeSelector.dispose();
    },

    selectHole: function(href) {
      var type = href.substring(5);
      this.$('#info_'+type+'.hole, #tab_'+type+'.content_tab').addClass('selected').siblings('.selected').removeClass('selected');
      PubSub.trigger('lookup.unveil');
    },

    load: function() {
      var view = this;
      var channel_data = ScoresVideo.holeChannels[this.channelId];
      _.each(channel_data, function(hole, hole_num) {
        var hole_view = new SingleHoleView({
          el: view.$('#tab_hole'+hole_num),
          hole_num: hole_num,
          channelId: view.channelId
        }).render();
        view.hole_views.push(hole_view);
      });
    }
  });

  return LiveHolePlayersView;
});
