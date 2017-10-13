define('views/lb/par3-body',['require','jquery','backbone','underscore','utils/browser','utils/pubsub','utils/metrics','views/lb/par3-all-players','views/lb/par3-leaders-players','views/lb/par3-closest-players','utils/lb/par3-window-size','utils/lb/par3-left-offset','utils/lb/lb-common','text!templates/lb/par3-blank-all-player-row.html!strip','text!templates/lb/par3-blank-closest-player-row.html!strip'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      _ = require('underscore'),
      Browser = require('utils/browser'),
      PubSub = require('utils/pubsub'),
      Metrics = require('utils/metrics'),
      Par3AllPlayersView = require('views/lb/par3-all-players'),
      Par3LeadersView = require('views/lb/par3-leaders-players'),
      Par3ClosestPlayersView = require('views/lb/par3-closest-players'),
      Par3Win = require('utils/lb/par3-window-size'),
      Par3LeftOffset = require('utils/lb/par3-left-offset'),
      LBCommon = require('utils/lb/lb-common'),
      par3PlayerRowEmptyTemplate = require('text!templates/lb/par3-blank-all-player-row.html!strip'),
      closestPlayerEmptyRowTemplate = require('text!templates/lb/par3-blank-closest-player-row.html!strip')
      ;

  var JST = {};

  JST.no_results_found = _.template(
    '<div class="noplayers">No Results Found</div>'
  );

  var Par3IndexView = Backbone.View.extend({

    par3PlayerRowEmptyTemplate: _.template(par3PlayerRowEmptyTemplate),
    closestPlayerRowEmptyTemplate: _.template(closestPlayerEmptyRowTemplate),

    el: '#par3',

    events: {
      'click #playoffFade': 'triggerClosePlayoff'
    },

    initialize: function(opts) {
      this.showFav = true;
      this.searchMode = false;
      this.minRows = 10;
      this.closestMinRows = 9;
      this.logger = new eventsCore.util.Logger('Par3IndexView');
      this.logger.info('Initialize');

      this.currentLB = opts.lbtype; // "all" or "closest"

      this.$playoffFade = this.$('#playoffFade');

      this.par3_collection = opts.par3_collection;
      this.par3_closest_collection = opts.par3_closest_collection;
      this.leaders_collection = opts.leaders_collection;

      // store dom elements
      this.$closest = this.$('#par3Nearest');
      this.$closestTableData = this.$('#closestTableData');
      this.$leaders = this.$('#par3LeadersTable');
      this.$allPlayers = this.$('#par3AllPlayers');
      this.$allPlayersTableData = this.$('#par3TableData');

      /**
       * Updates All Players when par3_collection is modified by a search action
       * @param {Boolean} searchMode (optional) if modified by a search action
       */
      this.listenTo(PubSub, 'par3-topmenubar:par3_all_collection:modified', function(searchMode) {
        this.searchMode = searchMode;
        this.fillInAllPlayersWithEmptyRows();
      });

      /**
       * Updates Nearest to Hole responsive view when closest_collection is modified by a search action
       * @param {Boolean} searchMode (optional) if modified by a search action
       */
      this.listenTo(PubSub, 'par3-topmenubar:par3_closest_collection:modified', function(searchMode) {
        this.searchMode = searchMode;
        this.fillInClosestWithEmptyRows();
      });

      this.listenTo(PubSub, 'par3:currentLB:update', this.resetCurrentPar3);

      // listener - playoff fade to show/hide
      // listen to PubSub that's triggered in par3-players.js for PlayoffStatus change
      this.listenTo(PubSub, 'change:par3PlayoffStatus', function() {
        if(LBCommon.isPar3PlayoffDisplayed()) {
          this.togglePlayoffFade('show');
          this.toggleLBViews('hide');
        } else {
          this.togglePlayoffFade('hide');
          this.toggleLBViews('show');
        }
      });

      // listen to PubSub that's triggered in par3-footer.js for openPlayoff
      this.listenTo(PubSub, 'par3playoff:openPlayoff par3playoff:mobileSubmenu:viewPlayoff', function() {
        this.togglePlayoffFade('show');
        this.toggleLBViews('hide');
      });

      // listen to PubSub that's triggered in par3-playoff.js for closeButton click
      this.listenTo(PubSub, 'par3playoff:closePlayoff par3playoff:mobileSubmenu:playoffUnselected', function() {
        this.togglePlayoffFade('hide');
        this.toggleLBViews('show');
      });

      // listener - window size
      this.listenTo(PubSub, 'windowsize:lbLargeSkeuomorphic:enter windowsize:lbSmallSkeuomorphic:enter', this.enterSkeuomorphic);
      this.listenTo(PubSub, 'windowsize:lbGlobal:enter', this.enterGlobal);
    },

    render: function() {
      if(Par3Win.size() === Par3Win.sizes.lgskeuomorphic || Par3Win.size() === Par3Win.sizes.smskeuomorphic) {
        Par3LeftOffset.init(this);
      }
      this.buildPar3ClosestViews();
      this.buildPar3LBViews();
      this.showSelectedView(this.currentLB);

      // show Fade if playoff is set to show
      if(this.par3_collection.par3PlayoffExists && LBCommon.isPar3PlayoffDisplayed()) {
        // this.togglePlayoffFade('show');

        // for some reason, fade won't show unless force to display using css display:block
        this.$playoffFade.css('display', 'block');
        this.toggleLBViews('hide');
      } else {
        this.toggleLBViews('show');
      }
      return this;
    },

    onDispose: function() {
      // stop listening the collection created in the view
      this.leaders_collection.stopListening();
      this.par3ClosestPlayersView.dispose();
      this.par3LeadersView.dispose();
      this.par3AllPlayersView.dispose();
    },

    buildPar3ClosestViews: function() {
      this.par3ClosestPlayersView = new Par3ClosestPlayersView({
        el: this.$closest,
        collection: this.par3_closest_collection
      }).render();
    },

    /**
     * build both Leaders and All Players views
     * in single function
     */
    buildPar3LBViews: function() {
      this.par3LeadersView = new Par3LeadersView({
        el: this.$leaders,
        collection: this.leaders_collection,
        closest_collection: this.par3_closest_collection
      }).render();

      this.par3AllPlayersView = new Par3AllPlayersView({
        el: this.$allPlayers,
        collection: this.par3_collection
      }).render();
    },

    /** for mobile view, show selected LB view
    * either All Players or Nearest to Hole
    */
    showSelectedView: function(currentLB) {
      // LeaderBoard.Common.destroyStickyNav();
      this.$('.contentTable').removeClass('selected');
      var wrapper = this.$('.contentTable.' + this.currentLB);
      wrapper.addClass('selected');
      // LeaderBoard.Common.stickyNav(this.$('.headerRow'));
    },

    /** view selector changed - listener par3:currenLB:update
    * reset this.currentLB to be updated value
    */
    resetCurrentPar3: function(newLB) {
      // reset currentLB
      this.currentLB = newLB;

      // clear searchField if prev.currentLB is closest
      this.triggerClearSearch();

      this.showSelectedView(this.currentLB);
      this.drawEmptyRows();
    },

    drawEmptyRows: function() {
      // on responsive view, if searchMode is still on, draw empty rows if necessary
      if((this.searchMode) && (Par3Win.size() !== Par3Win.sizes.smskeuomorphic && Par3Win.size() !== Par3Win.sizes.lgskeuomorphic)) {
        if(this.currentLB === LBCommon._lbTypeLookUp.all) {
          this.fillInAllPlayersWithEmptyRows();
        } else if(this.currentLB === LBCommon._lbTypeLookUp.closest) {
          this.fillInClosestWithEmptyRows();
        }
      }
    },

    /*
     * Create empty rows to fill in All Players Table so that there are
     * at least 10 (this.minRows) rows displaying.
     */
    fillInAllPlayersWithEmptyRows: function() {
      this.$('.playerRow.searchEmptyRow').remove();
      this.$('.noplayers').remove();

      var nCurrentRows = this.par3_collection.where({show: true}).length;

      if(nCurrentRows < this.minRows) {
        var nEmptyRowsToCreate = this.minRows - nCurrentRows;
        var empty_rows_html = '';

        // if there are no results, create a row for 'no results' message
        if(nCurrentRows === 0) {
          nEmptyRowsToCreate--;
          empty_rows_html += JST.no_results_found({});
        }

        // create empty player rows
        for(var i = 0; i < nEmptyRowsToCreate; i++) {
          empty_rows_html += this.createEmptyAllPlayersRow();
        }

        this.$allPlayersTableData.append(empty_rows_html);
      }
      this.showTopTables();
      LBCommon.addBottomBorders(this.$allPlayersTableData);
    },

    /*
     * Create empty rows to fill in All Players Table so that there are
     * at least 10 (this.minRows) rows displaying.
     */
    fillInClosestWithEmptyRows: function() {
      this.$('.playerRow.searchEmptyRow').remove();
      this.$('.noplayers').remove();

      var nCurrentRows = this.par3_closest_collection.where({show: true}).length;

      if(nCurrentRows < this.closestMinRows) {
        var nEmptyRowsToCreate = this.closestMinRows - nCurrentRows;
        var empty_rows_html = '';

        // if there are no results, create a row for 'no results' message
        if(nCurrentRows === 0) {
          nEmptyRowsToCreate--;
          empty_rows_html += JST.no_results_found({});
        }

        // create empty player rows
        for(var i = 0; i < nEmptyRowsToCreate; i++) {
          empty_rows_html += this.createEmptyClosestPlayersRow();
        }

        this.$closestTableData.append(empty_rows_html);
      }
      this.showTopTables();
      LBCommon.addBottomBorders(this.$closestTableData);
    },

    showTopTables: function(currentLB) {
      if(!this.searchMode) {
        this.$closest.removeClass('hide').addClass('tabletShow');
        this.$leaders.removeClass('hide').addClass('tabletShow');
      } else if((Par3Win.size() !== Par3Win.sizes.smskeuomorphic && Par3Win.size() !== Par3Win.sizes.lgskeuomorphic) && (LBCommon._lbTypeLookUp.closest)) {
        this.$leaders.removeClass('tabletShow').addClass('hide');
      } else {
        this.$closest.removeClass('tabletShow').addClass('hide');
        this.$leaders.removeClass('tabletShow').addClass('hide');
      }
    },

    createEmptyAllPlayersRow: function() {
      return this.par3PlayerRowEmptyTemplate({});
    },

    createEmptyClosestPlayersRow: function() {
      return this.closestPlayerRowEmptyTemplate({});
    },

    triggerClearSearch: function() {
      if(this.currentLB === LBCommon._lbTypeLookUp.closest) {
        PubSub.trigger('par3-body:clearSarch');
      }
    },

    /** when Playoff is displayed,
    * toggle LB Views (Scores & Nearest to Hole) to show/hide
    */
    toggleLBViews: function(state) {
      if(Par3Win.size() !== Par3Win.sizes.lgskeuomorphic || Par3Win.size() !== Par3Win.sizes.smskeuomorphic) {
        switch(state) {
          case 'hide':
            this.$('.contentTable').removeClass('selected');
            break;
          case 'show':
          default:
            var wrapper = this.$('.contentTable.' + this.currentLB);
            wrapper.addClass('selected');
            break;
        }
      }
    },

    togglePlayoffFade: function(state) {
      switch(state) {
        case 'show':
          if(Browser.ie8) {
            this.$playoffFade.show();
          } else {
            this.$playoffFade.fadeIn();
          }
          break;
        case 'hide':
        default:
          if(Browser.ie8) {
            this.$playoffFade.hide();
          } else {
            this.$playoffFade.fadeOut();
          }
          break;
      }
    },

    triggerClosePlayoff: function(round) {
      LBCommon.setPar3ClosePlayoffCookie();
      Metrics.measureApp(Metrics.page_section, Metrics.page_title, 'Hide Playoff');
      PubSub.trigger('par3playoff:closePlayoff');
    },

    // for listener to call skeuomorphic view specific functions
    enterSkeuomorphic: function() {
      this.triggerClearSearch();
      Par3LeftOffset.init(this);
      this.$('.headerWrapper').removeClass('stickybar');
      this.showTopTables();

      if(this.par3_collection.par3PlayoffExists && LBCommon.isPar3PlayoffDisplayed()) {
        this.togglePlayoffFade('show');
      } else {
        this.togglePlayoffFade('hide');
      }
    },

    enterGlobal: function() {
      /** if currentLB === closest && searchMode is true on Skeuomorphic,
      * switch currentLB to all so it can still display
      * All Players search results
      */
      if(this.searchMode && this.currentLB === LBCommon._lbTypeLookUp.closest) {
        this.forceScoresView();
      }
      PubSub.trigger('lookup.unveil');
      Par3LeftOffset.destroyLeftOffset(this);
    },

    /** force Scores view when window change from skeuomorphic views to responsive table view
    * force loading Scores view on windowsize change when
    * SearchMode is true && currentLB === closest so it can still display the scores search results
    */
    forceScoresView: function() {
      LBCommon.setPar3AllCookie();
      this.currentLB = LBCommon._lbTypeLookUp.all;
      this.showSelectedView(this.currentLB);
      this.drawEmptyRows();

      // trigger event to to highlight traditional link (lbsubmenu) & select proper footer content (lb-footer)
      PubSub.trigger('forceScoresView:enabled', this.currentLB);
      // Metrics.measureApp(Metrics.page_section, 'Scores');
    }

  });
  return Par3IndexView;
});
