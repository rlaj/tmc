define('views/player-list',['require','backbone','utils/pubsub','views/player-card'],function(require) {
  var Backbone = require('backbone'),
      PubSub = require('utils/pubsub'),
      PlayerCardView = require('views/player-card')
      ;

  var PlayerList = Backbone.View.extend({
    el: '.playerList',

    defaults: {
    },

    initialize: function(opts) {
      this.playerCardsMap = {};

      // trigger 'unveil' event everytime search or filter is performed
      this.listenTo(this.collection, 'modified', function() {
        PubSub.trigger('lookup.unveil');
      });

    },

    render: function() {
      this.buildPlayerList();
      return this;
    },

    buildPlayerList: function() {
      var that = this;
      var fragment = document.createDocumentFragment();
      if(Object.keys(this.playerCardsMap).length === 0) {  //First time building player list
        this.collection.forEach(function(player) {
          var playerCardView = new PlayerCardView({
            model: player,
            id: 'p_' + player.get('id'),

            scores: false,

            favorite: true,
            country: true,
            bio_link: true,

            show_amateur_status: true,
            show_favorite_tip: true,

            metrics_suffix: 'bio_players',
            item: true
          });
          var view = playerCardView.render();
          fragment.appendChild(view.el);
          that.playerCardsMap[player.id] = view;

          that.listenTo(player, 'change:show', that._updatePlayerView);
        });
      }

      this.$el.append(fragment);

      // PlayerCardView render method already attaches .unveil method
      // to the card itself, so just need to trigger unveil event
      // after attaching to DOM
      PubSub.trigger('lookup.unveil');

    },


    _updatePlayerView: function(player) {
      var $el = this.playerCardsMap[player.id].$el;
      $el.toggle(player.get('show'));
    },

    onDispose: function() {
      for (var key in this.playerCardsMap) {
        if(this.playerCardsMap.hasOwnProperty(key)) {
          this.playerCardsMap[key].dispose();
        }
      }
    }

  });

  return PlayerList;
})

;
