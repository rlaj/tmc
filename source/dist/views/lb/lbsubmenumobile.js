define('views/lb/lbsubmenumobile',['require','jquery','underscore','backbone','settings','utils/window-size','utils/lb/lb-common','utils/pubsub','utils/metrics','utils/scores','collections/score-players'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      Settings = require('settings'),
      Win = require('utils/window-size'),
      LBCommon = require('utils/lb/lb-common'),
      PubSub = require('utils/pubsub'),
      Metrics = require('utils/metrics'),
      Scores = require('utils/scores'),
      ScorePlayers = require('collections/score-players')
      ;

  var JST = {};

  JST.playoff_viewSelector = _.template(
    '<div id="playoffViewSelector">' +
    '   <a href="#" data-view="leaders" id="leadersLink">LEADERS</a>' +
    '   <a href="#" data-view="playoff" id="playoffLink">PLAYOFF</a>' +
    '</div>'
    );

  /**
   * The SubMenu view consists of all navigation links,
   * the search bar, and all footer links
   */
  var LBSubMenuMobile = Backbone.View.extend({
    el: '.navWrapper#roundSelectorContainer',

    events: {
      'click .selected_container': 'toggleOpen',
      'click .options a.selected': 'disableLink',
      'click .options a:not(.selected)': 'selectOption',
      'click #playoffViewSelector a.selected': 'disableLink',
      'click #playoffViewSelector a:not(.selected)': 'selectPlayoffOption'
    },

    defaults: {
      metrics: []
    },

    open: false,
    selected: 0,

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('LBMobileSubMenu');

      this.$html = $('html');

      this.$parent = this.$el;
      this.$round_selector = this.$('#roundSelector');
      this.$selected_option = this.$('.selected_option');
      this.$selected = this.$('.options a.selected');
      this.$playoff_container = this.$('#playoffViewSelector');
      this.$playoff_link = this.$('#playoffLink');
      this.$leaders_link = this.$('#leadersLink');

      this.currentLB = opts.lbtype; // "ou" or "trad"

      this.addPlayoffLink();

      // listener - add playoff link next to Traditional
      // listen to PubSub that's triggered in scores-players.js for PlayoffStatus change
      this.listenTo(PubSub, 'change:playoffStatus', this.addPlayoffLink);

      // listen to PubSub that's triggered in lbsubmenu.js for unselecting Playoff link
      this.listenTo(PubSub, 'playoff:openPlayoff playoff:closePlayoff playoff:lbsubmenu:playoffUnselected', this.setPlayoffLinks);

      // currentRound number is changed in the feed, re-load the round selector
      this.listenTo(ScorePlayers, 'change:currentRound', this.loadRoundSelector);
    },

    render: function() {
      this.loadRoundSelector();
      return this;
    },

    dispose: function() {
      Backbone.View.prototype.dispose.call(this, true);
    },

    loadRoundSelector: function() {
      this.$round_selector.load('/en_US/includes/gen/nav_selector_currentRound_leaderboard.ssi', function() {
        // enables Round Selector dropdown that's are loaded for responsive views
        // this.activateRoundSelectorDropdown();
      }.bind(this));
    },

    /**
     * Strictly performs open/close action on the dropdown
     */
    toggleOpenState: function(state) {
      if(state !== undefined) {
        this.open = state;
      } else {
        this.open = !this.open;
      }

      this.$round_selector.toggleClass('open', this.open);
    },

    /**
     * Callback to open/close dropdown
     * Opens/closes dropdown, makes metric call
     */
    toggleOpen: function() {
      this.toggleOpenState();
      var toggleState = this.open ? 'Open' : 'Close';
      Metrics.measureApp(Metrics.page_section, 'Round Selector', toggleState);
    },

    /**
     * Click callback when option is selected from an open dropdown
     * @param  {Event} e Standard Event object from a click action
     */
    selectOption: function(e) {
      var $t = $(e.currentTarget);
      var linkText = $t.data('src').toLowerCase();

      if(linkText === 'par3') {
        // document.location.href=$t.attr('href');
        // return
      }

      // TODO: revisit this when developping  Concurrent round - may not need this section
      if($t.index() !== this.selected) {
        if(typeof callback === 'function') {
          callback.call(this.options.callback_context, $t.data('src'));
          Metrics.measureApp(Metrics.page_section, 'Round Selector', linkText);
        }
        this.trigger('select', $t.index());
      }

      // close dropdown after selection without metrics call
      this.toggleOpenState(false);
    },

    addPlayoffLink: function(status) {
      if(!Scores.isDataLoaded()) {
        PubSub.once('scores:refresh', this.addPlayoffLink, this);
        return;
      } else {
        if(Scores.collection.playoffExists) {
          if(this.$playoff_container.length === 0) {
            var playoffLink = JST.playoff_viewSelector({});
            this.$round_selector.after(playoffLink);

            // re-assign elem here to avoid empty elem
            this.$playoff_container = this.$('#playoffViewSelector');
            this.$playoff_link = this.$playoff_container.find('#playoffLink');
            this.$leaders_link = this.$playoff_container.find('#leadersLink');
            this.setPlayoffLinks();
          }
        }
      }
    },

    disableLink: function(e) {
      e.preventDefault();
    },

    /**
     * playoff link - hilight selected links
     */
    setPlayoffLinks: function() {
      if(LBCommon.isLBPlayoffDisplayed()) {
        this.$leaders_link.removeClass('selected');
        this.$playoff_link.addClass('selected');
      } else {
        this.$playoff_link.removeClass('selected');
        this.$leaders_link.addClass('selected');
      }
    },

    /**
     * Click callback when option is selected from an open dropdown
     * @param  {Event} e Standard Event object from a click action
     */
    selectPlayoffOption: function(e) {
      e.preventDefault();
      this.$playoff_container.find('a').removeClass('selected');

      var $t = $(e.currentTarget);

      $t.addClass('selected');

      switch($t.index()) {
        case 1:
          // playoff
          LBCommon.clearMainClosePlayoffCookie();
          Metrics.measureApp(Metrics.page_section, 'View Playoff');
          PubSub.trigger('playoff:mobileSubmenu:viewPlayoff');
          break;
        case 0:
          // leaders
          // LeaderBoard.Common.resetLastStickyBarPosition();
          LBCommon.setMainClosePlayoffCookie();
          Metrics.measureApp(Metrics.page_section, 'View Leaders', 'Traditional View');

          // event trigger for lbsubmenu.js to match highlighting traditional link & hide playoff modal
          PubSub.trigger('playoff:mobileSubmenu:viewLeaders', LBCommon._lbTypeLookUp.trad);
          break;
      }
    }
  });

  return LBSubMenuMobile;
});
