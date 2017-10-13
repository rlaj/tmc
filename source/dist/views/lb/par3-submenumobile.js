define('views/lb/par3-submenumobile',['require','jquery','underscore','backbone','utils/lb/lb-common','utils/pubsub','utils/metrics','collections/score-players'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      LBCommon = require('utils/lb/lb-common'),
      PubSub = require('utils/pubsub'),
      Metrics = require('utils/metrics'),
      ScorePlayers = require('collections/score-players')
      ;

  var JST = {};

  JST.playoff_viewSelector = _.template('<a href="#" data-view="playoff" id="viewPlayoffMedium" class="par3option">Playoff</a>');

  /**
   * The SubMenu view consists of all navigation links,
   * the search bar, and all footer links
   */
  var Par3SubMenuMobile = Backbone.View.extend({
    el: '.left_cell',

    events: {
      'click .selected_container': 'toggleOpen',
      'click .options a.selected': 'disableLink',
      'click .par3option.selected': 'disableLink',
      'click #viewPlayoffMedium.selected': 'disableLink',
      'click .options a:not(.selected)': 'selectOption',
      'click .par3option:not(.selected)': 'setPar3Option',
      'click #viewPlayoffMedium:not(.selected)': 'selectPlayoffOption'
    },

    defaults: {
      callback: function() {},
      callback_context: this,
      metrics: []
    },

    _lbLookUp: {
      0: 'all',
      1: 'closest'
    },

    open: false,
    selected: 0,

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Par3SubMenuMobile');

      this.options = _.extend({}, this.defaults, opts);
      this.currentLB = opts.lbtype;
      this.par3_collection = opts.collection;

      this.$html = $('html');

      this.$parent;
      this.$selected_option;
      this.$selected;
      this.selected;

      this.$round_selector = this.$('#roundSelector');
      this.$optionLink = this.$('.par3option');

      // Scores link
      this.$all_link = this.$("[data-view='all']");

      // Nearest to Hole link
      this.$closest_link = this.$("[data-view='closest']");
      this.$playoff_link = this.$('#viewPlayoffMedium');

      // highlight selected LB when page load
      this.getSelectedPar3Option();

      this.addPlayoffLink();

      // listener - add playoff link next to Nearest to Hole
      // listen to PubSub that's triggered in par3-players.js for change:par3PlayoffStatus change
      this.listenTo(PubSub, 'change:par3PlayoffStatus', this.addPlayoffLink);

      this.listenTo(this, 'select', this.setOption);
      this.listenTo(PubSub, 'forceScoresView:enabled', this.getSelectedPar3Option);

      // listen to PubSub that's triggered in par3-submenumobile.js to match highlighting link
      this.listenTo(PubSub, 'par3playoff:openPlayoff par3playoff:closePlayoff', this.setPlayoffLinks);

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
      this.$('.navWrapper #roundSelector').load('/en_US/includes/gen/nav_selector_currentRound_par3.ssi', function() {

      }.bind(this));
    },

    disableLink: function(e) {
      e.preventDefault();
    },

    getSelectedPar3Option: function(currentLB) {
      var link;
      this.$optionLink.removeClass('selected');

      if(currentLB !== undefined) {
        this.currentLB = currentLB;
      }

      this.$optionLink.removeClass('selected');
      switch(this.currentLB) {
        case 'all':
          link = this.$all_link;
        break;
        case 'closest':
          link = this.$closest_link;
        break;
      }
      link.addClass('selected');

      if(this.par3_collection.par3PlayoffExists && !LBCommon.isPar3PlayoffDisplayed()) {
        this.$playoff_link.removeClass('selected');
      }
    },

    setPar3Option: function(e) {
      var $t = $(e.currentTarget);
      var $tIndex = $t.index();

      this.$optionLink.removeClass('selected');
      $t.addClass('selected');

      Metrics.measureApp(Metrics.page_section, Metrics.page_title, $t.text());

      // set the cookie with new selected LB
      var newCurrentLB = this._lbLookUp[$tIndex];
      $.cookie(LBCommon._lbCookieNames.par3, newCurrentLB, { expires: 5, path: LBCommon.par3CookiePath });

      /** par3-body to listenTo par3:currentLB:update to switch LB body view
      * par3-topmenubar to select appropreate Search Box
      */
      PubSub.trigger('par3:currentLB:update', newCurrentLB);

      if(LBCommon.isPar3PlayoffDisplayed()) {
        LBCommon.setPar3ClosePlayoffCookie();
        this.setPlayoffLinks(newCurrentLB);

        // trigger event so lbsubmenumobile.js also update the link & hide playoff modal
        PubSub.trigger('par3playoff:mobileSubmenu:playoffUnselected', newCurrentLB);
      }
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
      Metrics.measureApp(Metrics.page_section, Metrics.page_title, 'Round Selector', toggleState);
    },

    /**
     * Click callback when option is selected from an open dropdown
     * @param  {Event} e Standard Event object from a click action
     */
    selectOption: function(e) {
      var $t = $(e.currentTarget);

      if($t.index() === this.selected) {
        e.preventDefault();
      }

      // close dropdown after selection without metrics call
      this.toggleOpenState(false);
    },

    addPlayoffLink: function(status) {
      if(this.par3_collection.par3PlayoffExists) {
        if(this.$playoff_link.length === 0) {
          var playoffLink = JST.playoff_viewSelector({});
          this.$closest_link.after(playoffLink);

          // re-assign elem here to avoid empty elem
          this.$playoff_link = this.$('#viewPlayoffMedium');
          this.setPlayoffLinks();
        }
      }
    },

    /**
     * playoff link - hilight selected links
     */
    setPlayoffLinks: function(newLB) {
      if(LBCommon.isPar3PlayoffDisplayed()) {
        this.$optionLink.removeClass('selected');
        this.$playoff_link.addClass('selected');
      } else {
        var passedLB;
        if(newLB !== undefined) {
          passedLB = (newLB === LBCommon._lbTypeLookUp.all ? this.$all_link : this.$closest_link);
        } else {
          passedLB = (this.currentLB === LBCommon._lbTypeLookUp.all ? this.$all_link : this.$closest_link);
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

      if($t.index() === 2) {
        // playoff
        LBCommon.clearPar3ClosePlayoffCookie();
        Metrics.measureApp(Metrics.page_section, Metrics.page_title, 'View Playoff');
        PubSub.trigger('par3playoff:mobileSubmenu:viewPlayoff');
      }
    }
  });

  return Par3SubMenuMobile;
});
