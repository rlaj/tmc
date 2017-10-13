define('views/lb/lbsubmenu',['require','jquery','underscore','backbone','utils/metrics','utils/lb/lb-common','utils/pubsub','utils/scores'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      Metrics = require('utils/metrics'),
      LBCommon = require('utils/lb/lb-common'),
      PubSub = require('utils/pubsub'),
      Scores = require('utils/scores')
      ;

  var JST = {};

  JST.playoff_viewSelector = _.template('<a href="#playoff" data-view="playoff" id="viewPlayoffMedium">Playoff</a>');

  /**
   * The LBSubMenu view consists of all navigation links within en_US/scores/ directory,
   * the player search field, and player filters
   */
  var LBSubMenu = Backbone.View.extend({
    el: '.footer_cell .view_selector',

    events: {
      'click .leaderboardoption.selected': 'disableLink',
      'click .leaderboardoption:not(.selected)': 'setLBOption',
      'click #viewPlayoffMedium.selected': 'disableLink',
      'click #viewPlayoffMedium:not(.selected)': 'selectPlayoffOption'
    },

    _lbLookUp: {
      1: 'ou',
      2: 'trad'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('LBSubMenu');
      this.logger.info('Initialize');

      this.$optionLink = this.$('.leaderboardoption');
      this.$ou_link = this.$('#viewOverunder');
      this.$trad_link = this.$('#viewTraditional');
      this.$playoff_link = this.$('#viewPlayoffMedium');

      this.currentLB = opts.lbtype; // "ou" or "trad"

      // highlight selected LB when page load
      this.getSelectedLBOption();

      this.addPlayoffLink();

      // update the selected LB view in the link
      this.listenTo(PubSub, 'forceTradView:enabled', this.resetCurrentLB);

      // listener - add playoff link next to Traditional
      // listen to PubSub that's triggered in scores-players.js for PlayoffStatus change
      this.listenTo(PubSub, 'change:playoffStatus', this.addPlayoffLink);

      // listen to PubSub that's triggered in lbsubmenumobile.js to match highlighting link
      this.listenTo(PubSub, 'playoff:openPlayoff playoff:closePlayoff playoff:mobileSubmenu:viewLeaders', this.setPlayoffLinks);

      // listener - window size
      // this.listenTo(PubSub, 'windowsize:lbLargeSkeuomorphic:enter windowsize:lbSmallSkeuomorphic:enter', this.enterSkeuomorphic);
    },

    render: function() {
    },

    getSelectedLBOption: function(currentLB) {
      var link;

      if(currentLB !== undefined) {
        this.currentLB = currentLB;
      }

      this.$optionLink.removeClass('selected');
      switch(this.currentLB) {
        case 'ou':
          link = this.$ou_link;
        break;
        case 'trad':
          link = this.$trad_link;
        break;
      }
        link.addClass('selected');

      if(!Scores.isDataLoaded()) {
        PubSub.once('scores:refresh', this.getSelectedLBOption, this);
        return;
      } else {
        if(Scores.collection.playoffExists && !LBCommon.isLBPlayoffDisplayed()) {
          this.$playoff_link.removeClass('selected');
        }
      }
    },

    disableLink: function(e) {
      e.preventDefault();
    },

    // switch LB selection - trigger event to tell lb-body & lb-footer & lbsubmenumobile (for playoff link update)
    setLBOption: function(e) {
      e.preventDefault();
      var $t = $(e.currentTarget);
      var $tIndex = $t.index();

      this.$optionLink.removeClass('selected');
      $t.addClass('selected');

      Metrics.measureApp(Metrics.page_section, $t.text());

      // set the cookie with new selected LB
      var newCurrentLB = this._lbLookUp[$tIndex];
      $.cookie(LBCommon._lbCookieNames.mainLB, newCurrentLB, { expires: 5, path: LBCommon.cookiePath });

      // lb-body to listenTo currentLB:update to switch LB body view
      // lb-footer to listen and update the footer concurrent round message show/hide
      PubSub.trigger('currentLB:update', newCurrentLB);

      if(LBCommon.isLBPlayoffDisplayed()) {
        LBCommon.setMainClosePlayoffCookie();
        this.setPlayoffLinks(newCurrentLB);

        // trigger event so lbsubmenumobile.js also update the link & hide playoff modal
        PubSub.trigger('playoff:lbsubmenu:playoffUnselected', newCurrentLB);
      }
    },

    // reset this.currentLB to be updated value
    resetCurrentLB: function(newLB) {
      this.currentLB = newLB;
      this.getSelectedLBOption(this.currentLB);
    },

    addPlayoffLink: function(status) {
      if(!Scores.isDataLoaded()) {
        PubSub.once('scores:refresh', this.addPlayoffLink, this);
        return;
      } else {
        if(Scores.collection.playoffExists) {
          if(this.$playoff_link.length === 0) {
            var playoffLink = JST.playoff_viewSelector({});
            this.$trad_link.after(playoffLink);

            // re-assign elem here to avoid empty elem
            this.$playoff_link = this.$('#viewPlayoffMedium');
            this.setPlayoffLinks();
          }
        }
      }
    },

    /**
     * playoff link - hilight selected links
     */
    setPlayoffLinks: function(newLB) {
      if(LBCommon.isLBPlayoffDisplayed()) {
        this.$ou_link.removeClass('selected');
        this.$trad_link.removeClass('selected');
        this.$playoff_link.addClass('selected');
      } else {
        var passedLB;
        if(newLB !== undefined) {
          passedLB = (newLB === LBCommon._lbTypeLookUp.trad ? this.$trad_link : this.$ou_link);
        } else {
          passedLB = (this.currentLB === LBCommon._lbTypeLookUp.trad ? this.$trad_link : this.$ou_link);
        }
        passedLB.addClass('selected');
        this.$playoff_link.removeClass('selected');
      }
    },

    /**
     * playoff link - set cookie and trigger event
     */
    selectPlayoffOption: function(e) {
      e.preventDefault();
      this.$optionLink.removeClass('selected');

      var $t = $(e.currentTarget);

      $t.addClass('selected');

      if($t.index() === 3) {
        // playoff
        LBCommon.clearMainClosePlayoffCookie();
        Metrics.measureApp(Metrics.page_section, 'View Playoff');
        PubSub.trigger('playoff:lbSubmenu:viewPlayoff');
      }
    },

    // for listener to call skeuomorphic view specific functions
    enterSkeuomorphic: function() {
      if(Scores.collection.playoffExists && !LBCommon.isLBPlayoffDisplayed()) {
        this.getSelectedLBOption();
      }
    }
  });

  return LBSubMenu;
});
