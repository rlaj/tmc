define('utils/lb/lb-common',['require','utils/pubsub','jquery','underscore'],function(require) {
  var PubSub = require('utils/pubsub'),
      $ = require('jquery'),
      _ = require('underscore')
      ;

  var lbCommon = {
    lbFormat: {
      MAIN: 'main',
      EVERYWHERE: 'everywhere'
    },

    lbShowPlayerFlag: {
      MAIN: 'show',
      EVERYWHERE: 'showLBEverywherePlayer'
    },

    _lbTypeLookUp: {
      ou: 'ou', // mainLB Over|Under
      trad: 'trad', // mainLB Trad

      all: 'all', // par3 all players cookie for Par3LB mobile view
      closest: 'closest', // par3 nearest to pin players cookie for Par3LB mobile view

      tradFavPlayersContainer: '#leaderBoardPlayersTraditionalFavContent',
      tradAllPlayersContainer: '#leaderBoardPlayersTraditionalContent',

      ouFavPlayersContainer: '#leaderBoardPlayersFavContent',
      ouAllPlayersContainer: '#leaderBoardPlayersContent'
    },

    _lbCookieNames: {
      mainLB: 'mainLBCookie',
      LBeverywhere: 'lbEverywhereCookie',
      LBEverywherePanelSize: 'LBEverywherePanelSize',
      LBEverywherePanelPosition: 'LBEverywherePanelPosition',
      par3: 'Par3Cookie',
      closeLBPlayoff: 'closeLBPlayoff',
      closePar3Playoff: 'closePlayoff'
    },

    _lbEdgeClassNameLookUp: {
      W: 'withdrawn',
      D: 'disqualified',
      C: 'missedcut'
    },

    cookiePath: '/en_US/',
    par3CookiePath: '/en_US/',

    init: function() {

    },

    getEdgeClassName: function(code) {
      return this._lbEdgeClassNameLookUp[code];
    },

    getTrackURL: function(player) {
      return '/en_US/scores/track/track.html?pid=' + player.id + '&promo=track_lb';
    },

    getPlayerBioURL: function(player) {
      return '/en_US/players/player_' + player.id + '.html';
    },

    getTooltipTitleForPlayerName: function(lbFormat) {
      return (lbFormat === this.lbFormat.EVERYWHERE ? 'Player Bio' : 'Scorecard')
    },

    comparePos: function(a, b) {
      var newA = a.get('current_sort_order');
      var newB = b.get('current_sort_order');
      return newA < newB ? -1 : 1;
    },

    compareToday: function(a, b) {
      var num1, num2;
      var nan1 = nan2 = false;
      if(a.get('status') === 'C' || a.get('status') === 'D' || a.get('status') === 'W') {
        num1 = 10000000000000000000;
        nan1 = true;
      }
      else if(a.get('today') === '') {
        num1 = a.get('teetime').valueOf();
        num1 = Date.parse('1/1/00 ' + num1);
        nan1 = true;
      }
      else {
        num1 = a.get('today') === 'E' ? '0' : parseInt(a.get('today'));
      }

      if(b.get('status') === 'C' || b.get('status') === 'D' || b.get('status') === 'W') {
        num2 = 10000000000000000000;
        nan2 = true;
      }
      else if (b.get('today') === '') {
        //num2 = 1000;
        num2 = b.get('teetime').valueOf();
        num2 = Date.parse('1/1/00 ' + num2);
        nan2 = true;
      }
      else {
        num2 = b.get('today') === 'E' ? '0' : parseInt(b.get('today'));
      }

      if(num1 === num2) {
        var val = this.comparePos(a, b);
        return val;
      }

      if(nan1 && !nan2)
        return 1;
      else if(nan2 && !nan1)
        return -1;

      return num1 < num2 ? -1 : 1;
    },

    compareThru: function(a, b) {
      var num1, num2;
      num1 = processValue(a);
      num2 = processValue(b);

      if(num1 === num2) {
        var val = this.comparePos(a, b);
        return val;
      }
      return num1 < num2 ? 1 : -1;

      // helper function to process comparison value
      function processValue(p) {
        var num;
        if(p.get('thru') === '') {
          num = 0;
          if($.trim(p.get('pos')) === '') { num -= 500; }
        } else if(p.get('thru').indexOf('F') > -1) {
          num = 18;
        } else {
          num = parseInt(p.get('thru'), 10);
        }
        return num;
      }
    },

    // used for total sorting for trad
    getFormattedTotalScore: function(player) {
      var total_klass = '';
      var totalScore = player.total;
      var i = 4;
      while(i > 0) {
        var score = player['r' + i].split('|')[1];

        // console.log(score);
        if(score !== '') {
          total_klass = player.total >= 72 * i ? 'over' : 'under';
          break;
        }
        i--;
      }
      return total_klass;
    },

    // cookie set up
    // for main LB - /en_US/scores/index.html
    setMainOuCookie: function() {
      $.cookie(this._lbCookieNames.mainLB, this._lbTypeLookUp.ou, { expires: 5, path: this.cookiePath });
    },

    setMainTradCookie: function() {
      $.cookie(this._lbCookieNames.mainLB, this._lbTypeLookUp.trad, { expires: 5, path: this.cookiePath });
    },

    setMainClosePlayoffCookie: function() {
      $.cookie(this._lbCookieNames.closeLBPlayoff, 'true', { expires: 5, path: this.cookiePath});
    },

    clearMainClosePlayoffCookie: function() {
      $.cookie(this._lbCookieNames.closeLBPlayoff, null, { path: this.cookiePath});
    },

    setPar3ClosePlayoffCookie: function() {
      $.cookie(this._lbCookieNames.closePar3Playoff, 'true', { expires: 5, path: this.par3CookiePath});
    },

    clearPar3ClosePlayoffCookie: function() {
      $.cookie(this._lbCookieNames.closePar3Playoff, null, { path: this.par3CookiePath});
    },

    // for 2nd cookie if we need any - currently not used
    setLbEverywhereOuCookie: function() {
      $.cookie(this._lbCookieNames.LBeverywhere, this._lbTypeLookUp.ou, { expires: 5, path: this.cookiePath });
    },

    setLbEverywhereTradCookie: function() {
      $.cookie(this._lbCookieNames.LBeverywhere, this._lbTypeLookUp.trad, { expires: 5, path: this.cookiePath });
    },

    // for Par3 LB - /en_US/scores/par3contest/index.html
    setPar3AllCookie: function() {
      $.cookie(this._lbCookieNames.par3, this._lbTypeLookUp.all, { expires: 5, path: this.par3CookiePath });
    },

    setPar3ClosestCookie: function() {
      $.cookie(this._lbCookieNames.par3, this._lbTypeLookUp.closest, { expires: 5, path: this.par3CookiePath });
    },

    setLBEverywherePanelSize: function(width, height) {
      $.cookie(this._lbCookieNames.LBEverywherePanelSize, JSON.stringify({width: width, height: height}) , { expires: 5, path: this.cookiePath });
    },

    //Returns {width: nWidth, height: nHeight}
    getLBEverywherePanelSize: function() {
      var jsonStr = $.cookie(this._lbCookieNames.LBEverywherePanelSize);
      return (jsonStr ? $.parseJSON(jsonStr) : null);
    },

    setLBEverywherePanelPosition: function(top, left) {
      $.cookie(this._lbCookieNames.LBEverywherePanelPosition, JSON.stringify({top: top, left: left}) , { expires: 5, path: this.cookiePath });
    },

    //Returns {top: nTop, left: nLeft}
    getLBEverywherePanelPosition: function() {
      var jsonStr = $.cookie(this._lbCookieNames.LBEverywherePanelPosition);
      return (jsonStr ? $.parseJSON(jsonStr) : null);
    },

    /** check if main LB Playoff Modal is
    * set to visible and flag t/f
    */
    isLBPlayoffDisplayed: function() {
      // when Playoff is first created or first time LG is loaded or playoff card not closed, closeLBPlayoff cookie is undefined
      // in case closeLBPlayoff === undefined, combine isLBPlayoffDisplayed with Scores.collection.playoffExists check to
      // ensure to display playoff overlay and modal only when playoff exists on load
      if($.cookie(this._lbCookieNames.closeLBPlayoff) !== 'true' || $.cookie(this._lbCookieNames.closeLBPlayoff) === null || $.cookie(this._lbCookieNames.closeLBPlayoff) === undefined) {
        return true;
      } else {
        return false;
      }
    },

    isPar3PlayoffDisplayed: function() {
      if($.cookie(this._lbCookieNames.closePar3Playoff) !== 'true' || $.cookie(this._lbCookieNames.closePar3Playoff) === null || $.cookie(this._lbCookieNames.closePar3Playoff) === undefined) {
        return true;
      } else {
        return false;
      }
    },

    // useful functions
    findInArrayByPid: function(arr, pid) {
      // returns array obj in passed array of obj
      var obj = _.find(arr, function(o) { return o.pid === pid; });
      return obj;
    },

    findIndexInArrayByPid: function(arr, pid) {
      // returns array index of matching pid
      var obj = _.findIndex(arr, function(o) { return o.pid === pid; });
      return obj;
    },

    /**
     * Show/hide $rowEl based on 'show' flag
     * @param {jQueryObject} $rowEl (required)
     * @param {boolean} show (required)
     */
    togglePlayerRowDisplay: function($rowEl, show) {
      $rowEl.toggleClass('hidden', !show);

      // Append a filler div for every hidden player row so that css
      // for alternating background color on odd/even rows would still work.
      // Issue is nth-of-type(even) counts all rows of the same type and there's no
      // way to exclude/filter out hidden rows.
      if(show) {
        $rowEl.next('.playerRowFiller').remove();
      } else {
        $rowEl.after('<div class="playerRowFiller"></div>');
      }
    },

    /** Par3 Contest LB related addBottomBorders()
    * Tournament LB related addBottomBorders() is in lb-base.js due to
    * additional lookups to determin which LB views is selected
    */
    addBottomBorders: function(container) { //add darker bottom border to every 3rd row
      var $targetElement = container;
      this.removeBottomBorders($targetElement);
      var rows = $targetElement.find('.playerRow').not('.hidden');
      for(var i = 0, l = rows.length; i < l; i += 3) {
        rows[i].className += ' triplebottomborder tripleheight';
      }
      if(l > 0) {
        rows[l-1].className += ' lastrow';
      }
    },

    /** Par3 Contest LB related removeBottomBorders()
    * Tournament LB related removeBottomBorders() is in lb-base.js due to
    * additional lookups to determin which LB views is selected
    */
    removeBottomBorders: function(container) {
      var $targetElement = container;
      $targetElement.find('.playerRow').filter('.lastrow').removeClass('lastrow').end()
        .filter('.triplebottomborder').removeClass('triplebottomborder').removeClass('tripleheight');
    },

    // set values used to check if row is in view
    isInView: function(pane) {
      var $divViewPort = pane;
      var areaHeight = $divViewPort.height();
      this.areaTop = $divViewPort.position().top;
      this.areaOffsetHeight = areaHeight + this.areaTop;
    },

    // given a row, check if it's in view for animation purposes
    checkIfInView: function(row) {
      if(row.hasClass('hidden')) {
        return false;
      }
      var top = row.offset().top;
      var height = row.height();
      if((top <= this.areaOffsetHeight) && (top + height >= this.areaTop)) {
        return true;
      }

      return false;
    }

  };

  return lbCommon;
});
