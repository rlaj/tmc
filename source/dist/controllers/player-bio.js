define('controllers/player-bio',['require','jquery','backbone','baseview','settings','utils/title-selector','models/base-player','models/player-bio','models/player-scores','models/player-history','views/player-bio/current-stats','views/secondary-dropdown','views/player-bio/tab-bio','views/player-bio/tab-news','views/player-bio/tab-stats','views/scorecard','utils/scores-video','utils/geoblock','utils/favorites','jquery.dropdown_ext'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      BaseView = require('baseview'),
      Settings = require('settings'),
      TitleSelector = require('utils/title-selector'),
      BasePlayer = require('models/base-player'),
      PlayerBioModel = require('models/player-bio'),
      PlayerScoresModel = require('models/player-scores'),
      PlayerHistoryModel = require('models/player-history'),
      CurrentStatsView = require('views/player-bio/current-stats'),
      SecondaryDropdown = require('views/secondary-dropdown'),
      TabBioView = require('views/player-bio/tab-bio'),
      TabNewsView = require('views/player-bio/tab-news'),
      TabStatsView = require('views/player-bio/tab-stats'),
      ScorecardView = require('views/scorecard'),
      ScoresVideo = require('utils/scores-video'),
      Geo = require('utils/geoblock'),
      Favorites = require('utils/favorites')
      ;

  require('jquery.dropdown_ext');

  var PlayerBio = BaseView.extend({

    events: {
      'click .favorite': '_toggleFavorite'
    },

    defaults: {
      selectedTab: '#tab_news'
    },

    processPageVars: function() {
      this.playerId = this.jsonData.playerId;
      this.pageTitle = 'Player Detail';

      this.props = {
        prop24: this.playerId
      };
    },

    onInitialization: function() {
      this.refreshScoresDelay = 60000;
      this.dataFilesUrl = '/en_US/xml/gen/players/';

      Favorites.prefix = 'Players:Player Detail';

      this.titleSelector = new TitleSelector({
        el: this.$('#pageTitle'),
        max: 1,
        measure_key: ['Players', 'Player Detail'],
        metrics_suffix: 'bio_playermenu'
      });

      this.playerTabsDrowpdown = new SecondaryDropdown({
        el: this.$('#playerTabs'),
        metrics: 'Player Detail'
      });

      this.deferredFetches = this._loadDataFilesIntoModels();

      this.playerTabsDrowpdown.setCallback(function(tabId) {
        this._selectTab(tabId);
      }.bind(this));

      // only used for toggling favorite on player
      this.favPlayer = new BasePlayer({id: this.playerId});
      this._updateFavoriteStyle();
      this.listenTo(this.favPlayer, 'change:is_fave', this._updateFavoriteStyle);
    },

    onRender: function() {
      BaseView.prototype.onRender.apply(this, arguments);
      this.unveil(this.$('#welcome .playerImage img'));

      var that = this;

      // Select news tab by default
      this._selectTab(this.defaults.selectedTab);


      // Bio Model Fetched
      $.when(this.deferredFetches.bio).done(function() {
        // enable bio tab
        that.$('#playerTabs').show();
        that.$('a[href$=bio].disabled').removeClass('disabled');
      });

        // Scores Model Fetched
      $.when(this.deferredFetches.scores).done(function() {
        that._buildCurrentStats();

        if(that.playerScoresModel.get('hasScores')) {
          // enable track link
          that.$('.playerInfo a.track').show();

          // enable stats tab
          that.$('#playerTabs').show();
          that.$('a[href$=stats].disabled').removeClass('disabled');

          // that._buildScorecard();

         // Refetch scores every minute (refreshScoresDelay)
          that.timer = setInterval(function() {
            that.playerScoresModel.fetch();
          }, that.refreshScoresDelay);
        }
      });

      if(!Settings.Scores.pre) {
        this._buildScorecard();

        // Display 'Live' State
        ScoresVideo.init('playerbio', function() {
          ScoresVideo.assignFeaturedGroupPlayers();
          ScoresVideo.parsePlayersByChannel();
          this._checkLiveState();
        }.bind(this));
      } else {
        this._checkLiveState('offair');
      }
    },

    _selectTab: function(tabId) {
      this.$selectedTabContent && this.$selectedTabContent.hide();
      var $tabContent = this.$(tabId);
      $tabContent.show();

      if(this.tabStatsView) {
        // stop the listeners for the previously active pie view so that its charts
        // don't get unnecessarily replotted (and error out) when they're not on display
        this.tabStatsView.trigger('stopListenersForPieTabs');
      }

      switch(tabId) {
        case '#tab_bio':
          this._buildTabBioContent();
          break;
        case '#tab_stats':
          this._buildTabStatsContent();
          break;
        case '#tab_news':
          this._buildTabNewsContent();
          break;
        default:
      }

      this.$selectedTabContent = $tabContent;
    },

    _buildTabNewsContent: function() {
      if(!this.tabNewsView) {
        this.tabNewsView = new TabNewsView({playerId: this.playerId});
        this.tabNewsView.render();
        this.listenTo(this.tabNewsView, 'hasContent', function(bool) {
          if(bool) {
            this.$('#playerTabs a[href="#tab_news"]').removeClass('disabled').addClass('selected');
          } else {
            // this.$('#playerTabs a[href="#tab_news"]').removeClass('selected');
            // this.$('#playerTabs a[href="#tab_stats"]').addClass('selected');
            this.playerTabsDrowpdown.setOption(1) //select stats
            this._selectTab('#tab_stats');
          }
        });
      }
    },

    _buildTabStatsContent: function() {
      if(!this.tabStatsView) {
        // make sure scores and bio have been fetched before building the stats tab
        $.when(this.deferredFetches.scores, this.deferredFetches.bio).done(function() {
          if(this.playerScoresModel.get('hasScores')) {
          this.tabStatsView = new TabStatsView({scoresModel: this.playerScoresModel, bioModel: this.playerBioModel});
            this.tabStatsView.render();   
          } else {
              // this.$('#playerTabs a[href="#tab_stats"]').removeClass('selected');
              this.playerTabsDrowpdown.setOption(2); //select bio
              this._selectTab('#tab_bio');            
          }
        }.bind(this));
      } else {
        // rerender previously selected tab on tab stats
        this.tabStatsView.trigger('reactivateTab');
      }
    },

    _buildTabBioContent: function() {
      if(!this.tabBioView) {
        $.when(this.deferredFetches.bio, this.deferredFetches.history).done(function() {
          this.tabBioView = new TabBioView({
            playerBio: this.playerBioModel.attributes,
            playerHistory: this.playerHistoryModel.attributes
          });
          this.tabBioView.render();
        }.bind(this));
      }
    },

    _buildCurrentStats: function() {
      if(!Settings.Scores.pre) {
        this.currentStatsView = new CurrentStatsView({
          model: this.playerScoresModel
        });
        this.currentStatsView.render();
      }
    },

    _buildScorecard: function() {
      this.scorecardView = new ScorecardView({
        el: this.$('#playerScorecardSection'),
        playerId: this.playerId,
        refreshScoresDelay: this.refreshScoresDelay
      });
      this.scorecardView.render();
    },

    _loadDataFilesIntoModels: function() {
      var bioFetch = $.Deferred(),
          scoresFetch = $.Deferred(),
          historyFetch = $.Deferred();

      Backbone.ajax({
        dataType: 'json',
        url: this.dataFilesUrl + this.playerId + '.json',
        success: function(data) {
          // load bios
          this.playerBioModel = new PlayerBioModel({filename: data.files.bios});
          this.playerBioModel.fetch().success(function(data) { bioFetch.resolve(data);});

          // load scores
          this.playerScoresModel = new PlayerScoresModel({filename: data.files.scores});
          this.playerScoresModel.fetch().success(function(data) { scoresFetch.resolve(data);});

          // load history
          this.playerHistoryModel = new PlayerHistoryModel({filename: data.files.history});
          this.playerHistoryModel.fetch().success(function(data) { historyFetch.resolve(data);});
        }.bind(this)
      });

      return {
        bio: bioFetch,
        scores: scoresFetch,
        history: historyFetch
      };
    },

    _toggleFavorite: function(e) {
      this.favPlayer.trigger('toggleFavorite');
      return false;
    },

    _updateFavoriteStyle: function() {
      this.$('.favorite').toggleClass('selected', this.favPlayer.get('is_fave'));
    },

    _checkLiveState: function(offair) {
      var channelId = (offair === 'offair' ? -1 : ScoresVideo.isPlayerLive(this.playerId));
      if(channelId !== -1 && !Geo.isBlocked()) {
        this.$('.hero_promo').show()
          .end().find('.media_promo').show().find('a').attr('href','/en_US/watch/live.html?videoChannel='+ channelId +'&promo=live_bio');
      } else {
        this.$('.hero_promo, .media_promo').hide();
      }
    },

    onDispose: function() {
      clearInterval(this.timer);
      this.scorecardView && this.scorecardView.dispose();
      this.tabBioView && this.tabBioView.dispose();
      this.tabNewsView && this.tabNewsView.dispose();
      this.tabStatsView && this.tabStatsView.dispose();
      this.currentStatsView && this.currentStatsView.dispose();
      this.playerTabsDrowpdown && this.playerTabsDrowpdown.dispose();
    }
  });

  return PlayerBio;
});

