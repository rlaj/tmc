define('views/lb/par3-topmenubar',['require','jquery','backbone','utils/lb/lb-common','utils/metrics','views/lb/par3-submenu','views/lb/par3-submenumobile','utils/pubsub','views/players-search','views/players-search','utils/metrics'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      LBCommon = require('utils/lb/lb-common'),
      Metrics = require('utils/metrics'),
      Par3SubMenu = require('views/lb/par3-submenu'),
      Par3SubMenuMobile = require('views/lb/par3-submenumobile'),
      PubSub = require('utils/pubsub'),
      PlayersSearchView = require('views/players-search'),
      ClosestPlayersSearchView = require('views/players-search'),
      Metrics = require('utils/metrics')
      ;

  var Par3MenuBar = Backbone.View.extend({
    el: '#par3Footer',

    events: {
      // 'click .menu-link': 'toggle'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Par3MenuBar');
      this.logger.info('Initialize');

      this.currentLB = opts.lbtype; // "all" or "closest"

      // pass original par3_collection to child views so it can look up par3PlayoffExists flag
      this.par3_original_collection = opts.par3_original_collection;
      this.par3_collection = opts.par3_collection;
      this.par3_closest_collection = opts.par3_closest_collection;

      this.$searchBoxes = this.$('.player_search_cell');
      this.$all_search = this.$('.player_search_cell.all');
      this.$closest_search = this.$('.player_search_cell.closest');

      // skeuomorphic top bar menu - Par3 | Over Under | Trad
      this.Par3SubMenu = new Par3SubMenu({
        el: this.$('.footer_cell .view_selector')
      });

      // menus for responsive views
      this.Par3SubMenuMobile = new Par3SubMenuMobile({
        el: this.$('.left_cell'),
        lbtype: this.currentLB,
        collection: this.par3_original_collection
      });

      this.listenTo(PubSub, 'par3:currentLB:update', this.resetCurrentPar3);
      this.listenTo(PubSub, 'forceScoresView:enabled', this.showSelectedPar3Search);

      // listen to PubSub that's triggered in par3-footer.js for openPlayoff and playoff links
      this.listenTo(PubSub, 'par3playoff:openPlayoff par3playoff:mobileSubmenu:viewPlayoff', function() {
        this.toggleSearchBoxes('hide');
      });

      // listen to PubSub that's triggered in par3-playoff.js for closeButton click
      this.listenTo(PubSub, 'par3playoff:closePlayoff par3playoff:mobileSubmenu:playoffUnselected', function() {
        this.toggleSearchBoxes('show');
      });
    },

    buildPlayersSearchView: function() {
      this.playersSearchView = new PlayersSearchView({
        el: this.$all_search,
        collection: this.par3_collection,
        searchKey: 'full_name',
        metrics: [Metrics.page_section, Metrics.page_title]
      });
      this.playersSearchView.render();

      // Broadcast that search or filter had been performed
      // on par3_collection models
      this.listenTo(this.par3_collection, 'modified', function(action, opts) {
        var searchMode = (action === 'search' && opts !== '') ? true : false;
        PubSub.trigger('par3-topmenubar:par3_all_collection:modified', searchMode);
      });

      // listener - Search box and Player filter to show/hide for responsive views
      // listen to PubSub that's triggered in par3-players.js for change:par3PlayoffStatus change
      this.listenTo(PubSub, 'change:par3PlayoffStatus', function() {
        this._toggleSearchBoxes();
      });
    },

    buildClosestPlayersSearchView: function() {
      this.closestPlayersSearchView = new ClosestPlayersSearchView({
        el: this.$closest_search,
        collection: this.par3_closest_collection,
        searchKey: 'full_name',
        metrics: [Metrics.page_section, Metrics.page_title]
      });
      this.closestPlayersSearchView.render();

      // Broadcast that search or filter had been performed
      // on par3_collection models
      this.listenTo(this.par3_closest_collection, 'modified', function(action, opts) {
        var searchMode = (action === 'search' && opts !== '') ? true : false;
        PubSub.trigger('par3-topmenubar:par3_closest_collection:modified', searchMode);
      });

      // listener - Search box and Player filter to show/hide for responsive views
      // listen to PubSub that's triggered in par3-players.js for PlayoffStatus change
      this.listenTo(PubSub, 'change:par3PlayoffStatus', function() {
        this._toggleSearchBoxes();
      });

      this.showSelectedPar3Search();
    },

    showSelectedPar3Search: function(currentLB) {
      var searchBox;

      if(currentLB !== undefined) {
        this.currentLB = currentLB;
      }

      this.$searchBoxes.removeClass('selected');
      switch(this.currentLB) {
        case 'all':
          searchBox = this.$all_search;
        break;
        case 'closest':
          searchBox = this.$closest_search;
        break;
      }
      if(searchBox !== undefined) {
        searchBox.addClass('selected');
      }
    },

    /** view selector changed - listener par3:currenLB:update
    * reset this.currentLB to be updated value
    */
    resetCurrentPar3: function(newLB) {
      this.currentLB = newLB;
      this.showSelectedPar3Search(this.currentLB);
    },

    render: function() {
      this.Par3SubMenu.render();
      this.Par3SubMenuMobile.render();
      this.buildPlayersSearchView();
      this.buildClosestPlayersSearchView();

      this.$all_search_field = this.$all_search.find('#lbSearch');
      this.$closest_search_field = this.$closest_search.find('#lbSearch');

      if(this.par3_original_collection.par3PlayoffExists && LBCommon.isPar3PlayoffDisplayed()) {
        this.toggleSearchBoxes('hide');
      }
      return this;
    },

    onDispose: function() {
      this.Par3SubMenu.dispose();
      this.Par3SubMenuMobile.dispose();
      this.playersSearchView.dispose();
      this.buildClosestPlayersSearchView();
    },

    toggleSearchBoxes: function(state) {
      switch(state) {
        case 'hide':
          this.$all_search_field.addClass('hidden');
          this.$closest_search_field.addClass('hidden');
          break;
        case 'show':
        default:
          this.$all_search_field.removeClass('hidden');
          this.$closest_search_field.removeClass('hidden');
          break;
      }
    },

    _toggleSearchBoxes: function() {
      if(LBCommon.isPar3PlayoffDisplayed()) {
        this.toggleSearchBoxes('hide');
      } else {
        this.toggleSearchBoxes('show');
      }
    }

  });

  return Par3MenuBar;
});
