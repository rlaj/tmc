define('controllers/invitees',['require','jquery','backbone','baseview','collections/invitees','views/invitees-content','views/players-search','views/players-filter','utils/metrics'],function(require) {
    var $ = require('jquery'),
      Backbone = require('backbone'),
      BaseView = require('baseview'),
      Invitees = require('collections/invitees'),
      InviteesContentView = require('views/invitees-content'),
      PlayersSearchView = require('views/players-search'),
      PlayersFilterView = require('views/players-filter'),
      Metrics = require('utils/metrics')
      ;


    var PlayerList = BaseView.extend({
      onInitialization:function() {
        BaseView.prototype.onInitialization.apply(this, arguments);
      },

      processPageVars: function() {
        Invitees.url = this.jsonData.urlData;
        this.pastChampionsNotPlaying = this.jsonData.pastChampionsNotPlaying;
        this.qualificationsList = this.jsonData.qualificationsList;
      },

      onRender: function() {
        BaseView.prototype.onRender.apply(this, arguments);
        var that = this;

        Invitees.fetch({
          success: function(players) {
            that.collection = players;
            that.inviteesContentView = new InviteesContentView({
              collection: that.collection, 
              pastChampionsNotPlaying: that.pastChampionsNotPlaying,
              qualificationsList: that.qualificationsList});
            that.inviteesContentView.render();

            that.playersSearchView = new PlayersSearchView({
              el: '.player_search_cell', 
              collection: that.collection, 
              searchKey: 'full_name',
              metrics: [Metrics.page_section, Metrics.page_title]
            });
            that.playersSearchView.render();

            that.playersFilterView = new PlayersFilterView({
              el: '.player_filter_cell', 
              collection: that.collection, 
              favorites: false,
              on_course_players: false,
              american_players: false,
              international_players: false,
              metrics: [Metrics.page_section, Metrics.page_title]
            });
            that.playersFilterView.render();


          },
          error: function(model, response, options) {
             console.error("Error fetching invitees in controller/invitees: " + response.toString());
          }
        });        



      },

      onDispose: function (){ 
        this.inviteesContentView && this.inviteesContentView.dispose();
        this.playersSearchView && this.playersSearchView.dispose();
        this.playersFilterView && this.playersFilterView.dispose();
      },



    });

    return PlayerList;
});

