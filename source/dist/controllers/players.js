define('controllers/players',['require','jquery','backbone','baseview','settings','collections/players','views/player-list','views/players-search','views/players-filter','utils/metrics'],function(require) {
    var $ = require('jquery'),
      Backbone = require('backbone'),
      BaseView = require('baseview'),
      Settings = require('settings'),
      Players = require('collections/players'),
      PlayerListView = require('views/player-list'),
      PlayersSearchView = require('views/players-search'),
      PlayersFilterView = require('views/players-filter'),
      Metrics = require('utils/metrics')
      ;

    // require('css!/mas/css/players')

    var PlayerList = BaseView.extend({
      onRender: function() {
        BaseView.prototype.onRender.apply(this, arguments);
        var that = this;
        Players.fetch({
          success: function(players) {
            that.collection = players.clone();

            that.playerListView = new PlayerListView({collection: that.collection});
            that.playerListView.render();

            that.playersSearchView = new PlayersSearchView({
              el: '.player_search_cell',
              collection: that.collection,
              searchKey: 'full_name',
              metrics: [Metrics.page_section]
            });
            that.playersSearchView.render();

            that.playersFilterView = new PlayersFilterView({
              el: '.player_filter_cell',
              collection: that.collection,
              favorites: Settings.showFavorites,
              on_course_players: false,
              metrics: [Metrics.page_section]
            });
            that.playersFilterView.render();

          },
          error: function(model, response, options) {
            console.error("Error fetching players in controller/players: " + response.toString());
          }
        });
      },

      onDispose: function (){
       this.playerListView && this.playerListView.dispose();
       this.playersSearchView && this.playersSearchView.dispose();
       this.playersFilterView && this.playersFilterView.dispose();
      },



    });

    return PlayerList;
});

