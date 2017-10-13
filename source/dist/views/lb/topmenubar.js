define('views/lb/topmenubar',['require','jquery','backbone','utils/lb/lb-common','views/lb/lbsubmenu','views/lb/lbsubmenumobile','views/lb/lb-topmenu-roundnum','utils/pubsub','utils/scores','views/players-search','views/players-filter','utils/metrics'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      LBCommon = require('utils/lb/lb-common'),
      LBSubMenu = require('views/lb/lbsubmenu'),
      LBSubMenuMobile = require('views/lb/lbsubmenumobile'),
      LBRoundNum = require('views/lb/lb-topmenu-roundnum'),
      PubSub = require('utils/pubsub'),
      Scores = require('utils/scores'),
      PlayersSearchView = require('views/players-search'),
      PlayersFilterView = require('views/players-filter'),
      Metrics = require('utils/metrics')
      ;

  /**
   * The LBMenuBar is consist of Round Number display for skeuomorphic views,
   * a dropdown menu for resposive views, and Player Filter & Search
   */
  var LBMenuBar = Backbone.View.extend({
    el: '#leaderboardLowFooter',

    events: {
      // 'click .menu-link': 'toggle'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('LBMenuBar');
      this.logger.info('Initialize');

      this.currentLB = opts.lbtype; // "trad" or "ou"

      this.$lbSearchBox;
      this.$playerSelector;

      // skeuomorphic top bar menu - Par3 | Over Under | Trad
      this.LBSubMenu = new LBSubMenu({
        el: this.$('.footer_cell .view_selector'),
        lbtype: this.currentLB
      });

      // menus for responsive views
      this.LBSubMenuMobile = new LBSubMenuMobile({
        el: this.$('.navWrapper#roundSelectorContainer'),
        lbtype: this.currentLB
      });

      this.LBRoundNum = new LBRoundNum({
        el: this.$('.currentRound')
      });

      // listen to PubSub that's triggered in lb-footer.js for openPlayoff and playoff links
      this.listenTo(PubSub, 'playoff:openPlayoff playoff:lbSubmenu:viewPlayoff playoff:mobileSubmenu:viewPlayoff', function() {
        this.toggleSearchBox_playerFilter('hide');
      });

      // listen to PubSub that's triggered in lb-playoff.js for closeButton click
      this.listenTo(PubSub, 'playoff:closePlayoff playoff:lbsubmenu:playoffUnselected playoff:mobileSubmenu:viewLeaders', function() {
        this.toggleSearchBox_playerFilter('show');
      });
    },

    buildPlayersSearchAndFilterViews: function() {
      if(!Scores.isDataLoaded()) {
        PubSub.once('scores:refresh', this.buildPlayersSearchAndFilterViews, this);
        return;
      } else {
        var scores_collection = Scores.collection.clone();
        this.playersSearchView = new PlayersSearchView({
          el: '.player_search_cell',
          collection: scores_collection,
          searchKey: 'full_name',
          metrics: [Metrics.page_section]
        });
        this.playersSearchView.render();

        this.playersFilterView = new PlayersFilterView({
          el: '.player_filter_cell',
          collection: scores_collection,
          favorites: false,
          metrics: [Metrics.page_section]
        });
        this.playersFilterView.render();

        this.$lbSearchBox = this.$('#lbSearch');
        this.$playerSelector = this.$('#playerSelector');

        // Broadcast that search or filter had been performed
        // on scores_collection models
        // searchMode true only when search is performed.
        // Filter still needs to show appropreate favorite players
        this.listenTo(scores_collection, 'modified', function(action, opts) {
          var searchMode = (action === 'search' && opts !== '') ? true : false;
          PubSub.trigger(LBCommon.lbFormat.MAIN + ':scores_collection:modified', searchMode);
        });

        // listener - Search box and Player filter to show/hide for responsive views
        // listen to PubSub that's triggered in scores-players.js for PlayoffStatus change
        this.listenTo(PubSub, 'change:playoffStatus', function() {
          this._toggleSearchBox_playerFilter();
        });

        //Reapply filter on score refresh when selected filter option is 'On Course Players'
        this.listenTo(PubSub, 'scores:refresh', function() {
          if(this.playersFilterView.selected === 'active') {
            this.playersFilterView.trigger('filter', true);
          }
        });
      }
    },

    render: function() {
      this.LBSubMenu.render();
      this.LBSubMenuMobile.render();
      this.LBRoundNum.render();
      this.buildPlayersSearchAndFilterViews();
      return this;
    },

    onDispose: function() {
      this.LBSubMenu.dispose();
      this.LBSubMenuMobile.dispose();
      this.LBRoundNum.dispose();
      this.playersSearchView.dispose();
      this.playersFilterView.dispose();
    },

    toggleSearchBox_playerFilter: function(state) {
      switch(state) {
        case 'hide':
          this.$lbSearchBox.addClass('hidden');
          this.$playerSelector.addClass('hidden');
          break;
        case 'show':
        default:
          this.$lbSearchBox.removeClass('hidden');
          this.$playerSelector.removeClass('hidden');
          break;
      }
    },

    _toggleSearchBox_playerFilter: function() {
      if(LBCommon.isLBPlayoffDisplayed()) {
        this.toggleSearchBox_playerFilter('hide');
      } else {
        this.toggleSearchBox_playerFilter('show');
      }
    }

  });

  return LBMenuBar;
});
