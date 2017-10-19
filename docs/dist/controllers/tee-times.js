define('controllers/tee-times',['require','jquery','underscore','backbone','baseview','models/pairings','views/pairings-content','views/secondary-dropdown','views/pairings-tab','views/players-search','views/players-filter','views/current-time','views/download-link','collections/players','settings','utils/pubsub','utils/metrics'],function(require) {
  	var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      BaseView = require('baseview'),
      Pairings = require('models/pairings'),
      PairingsContentView = require('views/pairings-content'),
      SecondaryDropdown = require('views/secondary-dropdown'),
      PairingsTabView = require('views/pairings-tab'),
      PlayersSearchView = require('views/players-search'),
      PlayersFilterView = require('views/players-filter'),
      CurrentTimeView = require('views/current-time'),
      DownloadLinkView = require('views/download-link'),
      Players = require('collections/players'),
      Settings = require('settings'),
      PubSub = require('utils/pubsub'),
      Metrics = require('utils/metrics')
      ;

    var TeeTimes = BaseView.extend({
      onInitialization:function() {
        BaseView.prototype.onInitialization.apply(this, arguments);

        if(this.jsonData.pageState === 'live') {
          this.currentTimeView = new CurrentTimeView({el: this.$('.currentTime')});
          this.downloadLinkView = new DownloadLinkView({el: this.$('.link')});
        }

        // Display split tee text if currently selected round has at least 1 group with split tee 
        this.listenTo(PubSub, 'pairings-round:hasSplitTee', function(bool) {
          var splitTeeText = bool ? '* Indicates 10th Tee start; all others are 1st Tee start' : '';
          this.$('#splitTee').html(splitTeeText);
        });

      },

    	onRender: function() {
        BaseView.prototype.onRender.apply(this, arguments);

        if(this.jsonData.pageState === 'live') {
          var that = this;
          var playersFetch = $.Deferred();
          var pairingsFetch = $.Deferred();

          this.currentTimeView.render();
          this.downloadLinkView.render();

          //Fetch all player models
          Players.fetch({
            success: function(players) {
              that.collection = players.clone();
              playersFetch.resolve();

              // Setup search
              that.playersSearchView = new PlayersSearchView({
                el: '.player_search_cell',
                collection: that.collection,
                searchKey: 'full_name',
                metrics: [Metrics.page_section]
              });

              that.playersSearchView.render();


              // Setup filter
              that.playersFilterView = new PlayersFilterView({
                el: '.player_filter_cell',
                collection: that.collection,
                on_course_players: false,
                metrics: [Metrics.page_section]
              });

              that.playersFilterView.render();


            },
            error: function(model, response, options) {
              console.error("Error fetching players in controller/tee-times: " + response.toString());
            }
          });


          // Fetch pairings
          new Pairings().fetch({
            success: function(pairings) {
              that.pairings = pairings;
              pairingsFetch.resolve();

              // Setup tab
              var tabOptions = that._setupTabOptions(pairings);
              that.pairingsTabView = new PairingsTabView(tabOptions);
              that.pairingsTabView.render();
              that.secondaryDropdown = new SecondaryDropdown({el: that.$('.tabs')});
              that.secondaryDropdown.setCallback(function (href){
                var eventName = href.replace('#','');
                that.downloadLinkView.trigger('show', eventName);

                if(eventName === 'withdrawn') {
                  this.$('.selectbox').hide(); //hide search and filter
                } else {
                  this.$('.selectbox').show(); //show search and filter
                  that.playersFilterView.trigger('filter', true);
                }
                that.pairingsContentView.trigger('show', eventName);

              }.bind(this));


              that.downloadLinkView.trigger('show', tabOptions.selected);

              // that.listenTo(that.pairingsTabView, 'all', function(eventName) {
              //   that.downloadLinkView.trigger('show', eventName);

              //   if(eventName === 'withdrawn') {
              //     this.$('.selectbox').hide(); //hide search and filter
              //   } else {
              //     this.$('.selectbox').show(); //show search and filter
              //     that.playersFilterView.trigger('filter', true);
              //   }
              //   that.pairingsContentView.trigger('show', eventName);

              // });


            },
            error: function(model, response, options) {
              console.error("Error fetching pairings in controller/tee-times: " + response.toString());
            },

          });


          // Setup main content after player and pairing models have been fetched successfully
          $.when(playersFetch, pairingsFetch).done(function() {
              that.pairingsContentView = new PairingsContentView({collection: that.collection, pairings: that.pairings});
              that.pairingsContentView.render();
          });
        }

    	},



      /**
       * Returns an options {Object} used to setup the pairings tab
       * @param {Object} pairings (required)
       */
      _setupTabOptions: function(pairings) {
        var tabOptions = {};
        var rounds = ['round1', 'round2', 'round3', 'round4'];

        // Enable Tabs for Available Rounds
        for(var i = 0; i < rounds.length; i++) {
          round = rounds[i];
          if(pairings.get(round) && pairings.get(round) !== 'none' && pairings.get(round).group.length > 0) {
            tabOptions[round] = true;
            tabOptions['selected'] = round; //select latest round by default
          } else {
            break;
          }
        }

         //override default selected round
        if(Settings.default_pairings_round) {
          tabOptions.selected = 'round' + Settings.default_pairings_round;
        }

        // Enable Withdrawn/Missed Cut Tab if available
        var playersArr = pairings.get('withdrawn')['player'];
        if(playersArr && playersArr.length > 0) {
          tabOptions['withdrawn'] = true;
        }

        return tabOptions;
      },


      onDispose: function (){
        if(this.jsonData.pageState === 'live') {
          this.currentTimeView && this.currentTimeView.dispose();
          this.downloadLinkView && this.downloadLinkView.dispose();
          this.playersSearchView && this.playersSearchView.dispose();
          this.playersFilterView && this.playersFilterView.dispose();
          this.pairingsTabView && this.pairingsTabView.dispose();
          this.pairingsContentView && this.pairingsContentView.dispose();
          this.secondaryDropdown && this.secondaryDropdown.dispose();
        }
      },

    });

    return TeeTimes;
});

