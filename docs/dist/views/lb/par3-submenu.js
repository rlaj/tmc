define('views/lb/par3-submenu',['require','jquery','backbone','utils/lb/lb-common'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      LBCommon = require('utils/lb/lb-common')
      ;

  /**
   * The LBSubMenu view consists of all navigation links within en_US/scores/ directory,
   * the player search field, and player filters
   */
  var Par3SubMenu = Backbone.View.extend({
    el: '.footer_cell .view_selector',

    events: {
      'click .leaderboardoption.selected': 'disableLink',
      'click .leaderboardoption:not(.selected)': 'setLBOption'
    },

    _lbLookUp: {
      1: 'ou',
      2: 'trad'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Par3SubMenu');
      this.logger.info('Initialize');
    },

    render: function() {
    },

    disableLink: function(e) {
      e.preventDefault();
    },

    // switch LB selection - trigger event to tell lb-body & lb-footer
    setLBOption: function(e) {
      var $t = $(e.currentTarget);
      var $tIndex = $t.index();
      var newCurrentLB;

      if($tIndex !== 0) {
        newCurrentLB = this._lbLookUp[$tIndex];
        $.cookie(LBCommon._lbCookieNames.mainLB, newCurrentLB, { expires: 5, path: LBCommon.cookiePath });
      } else {
        e.preventDefault();
      }
    }
  });

  return Par3SubMenu;
});
