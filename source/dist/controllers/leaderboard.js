define('controllers/leaderboard',['require','jquery','underscore','baseview','utils/geoblock','views/landing-hero','utils/lb/lb-common','utils/lb/lb-window-size','views/lb/lb-body','views/lb/topmenubar','views/lb/lb-footer','views/lb/lb-playoff','utils/metrics','utils/pubsub','utils/scores'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      BaseView = require('baseview'),
      Geo = require('utils/geoblock'),
      LandingHero = require('views/landing-hero'),
      LBCommon = require('utils/lb/lb-common'),
      LBWin = require('utils/lb/lb-window-size'),
      LBBodyView = require('views/lb/lb-body'),
      LBMenuBar = require('views/lb/topmenubar'),
      LBFooterView = require('views/lb/lb-footer'),
      LBPlayoffView = require('views/lb/lb-playoff'),
      Metrics = require('utils/metrics'),
      PubSub = require('utils/pubsub'),
      Scores = require('utils/scores')
      ;

  // require('css!/mas/css/leaderboard_low.css');

  var LbView = BaseView.extend({
    events: {

    },

    geo_checked: false,

    processPageVars: function() {
      // assign prop values based on page vars
      if(this.jsonData.pageState === 'live') {
        this.props = {
          events: 'event44'
        };
      }
    },

    initialize: function(html) {
      BaseView.prototype.initialize.apply(this, arguments);

      this.logger = new eventsCore.util.Logger('LbView');
      this.logger.info('initialize');
    },

    onInitialization: function() {
      this.playoff_collection;

      $(window).on('resize.lb', _.bind(this.resize, this));

      // listener - create playoff view when status is changed - to playoff active
      // listen to PubSub that's triggered in scores-players.js for PlayoffStatus change
      this.listenTo(PubSub, 'change:playoffStatus', this.getPlayoffStatus);

      if(this.jsonData.pageState === 'live') {
        Geo.checkAction = this.geoAction.bind(this);
        this.lbmenubar = new LBMenuBar({
          el: this.$('#leaderboardLowFooter'),
          lbtype: this.setCurrentLB() // pass "trad" or "ou"
        });

        this.lbView = new LBBodyView({
          el: this.$('#leaderboardLow'),
          lbtype: this.setCurrentLB() // pass "trad" or "ou"
        });

        this.lbFooterView = new LBFooterView({
          el: this.$('#leaderboardFooterBase'),
          lbtype: this.setCurrentLB() // pass "trad" or "ou"
        });
      } else if(this.jsonData.pageState === 'stub') {
        this.hero = new LandingHero({el: this.$('.hero-wrap')});
      }
    },

    geoAction: function() {
      if(this.geo_checked) {
        return;
      }
      if(Geo.isLoaded()) {
        if(Geo.isBlocked()) {
          // Do something

        }
        this.geo_checked = true;
      }
    },

    onRender: function() {
      this.logger.info('onRender');
      BaseView.prototype.onRender.apply(this, arguments);

      if(this.jsonData.pageState === 'live') {
        // skeuomorphic view pole and bg placement
        this.resize();

        this.lbmenubar.render();
        this.lbView.render();
        this.lbFooterView.render();
        this.getPlayoffStatus();

        this.unveil(this.$('.hero-wrap .hero-content').find('img'));
      } else if(this.jsonData.pageState === 'stub') {
        this.unveil(this.hero.$('.imageWrapper img'));
      }
    },

    onDispose: function() {
      if(this.jsonData.pageState === 'live') {
        this.lbmenubar.dispose();
        this.lbView.dispose();
        this.lbFooterView.dispose();
        $(window).off('resize.lb');
        if(this.lbPlayoffView) {
          this.lbPlayoffView.dispose();
        }
      }
    },

    getPlayoffStatus: function() {
      if(!Scores.isDataLoaded()) {
        PubSub.off('scores:refresh', this.getPlayoffStatus, this)
          .once('scores:refresh', this.getPlayoffStatus, this);
        return;
      } else {
        if(Scores.collection.playoffExists) {
          // Put in the holes
          var startHole = Scores.collection.playoffStartHole;
          var progress = 8;

          var playoff_holes = [];
          for(var i = 0; i < progress; i++) {
            startHole = (startHole === '18' ? '10' : '18');
            playoff_holes.push(startHole);
          }

          this.lbPlayoffView = new LBPlayoffView({
            el: this.$('#playoffContainer'),
            collection: Scores.playoff_collection,
            startHole: startHole,
            progress: progress, // how many holes to create
            playoff_holes: playoff_holes
          }).render();
        }
      }
    },

    getMainLBCookie: function() {
      // check if the page is main LB (/scores/index.html) or popout LB (scorepopout.html)
      if(!this.isPopOut) {
        if($.cookie(LBCommon._lbCookieNames.mainLB) === LBCommon._lbTypeLookUp.trad) {
        // if(($.cookie(LBCommon._lbCookieNames.LBeverywhere) == LBCommon._lbTypeLookUp.ou) ||($.cookie(LBCommon._lbCookieNames.mainLB) == LBCommon._lbTypeLookUp.ou)) {
          LBCommon.setMainTradCookie();
        } else {
          LBCommon.setMainOuCookie();
        }
      } else {
        if($.cookie(LBCommon._lbCookieNames.mainLB) === LBCommon._lbTypeLookUp.ou) {
          LBCommon.setMainOuCookie();
        }
      }
    },

    setLBCookie: function() {
      this.getMainLBCookie();

       // if the window size is mobile portrait and below, set the cookie to Trad
       // so the trad view loads seamlessly rather than forceTrad
      if(LBWin.size() === LBWin.sizes.global) {
        LBCommon.setLbEverywhereTradCookie();
      }

      // if the mainLBCookie is set to OU, reset masterslbview cookie to OU so it doesn't overwrite to display Trad
      if((LBWin.size() === LBWin.sizes.desktop || LBWin.size() === LBWin.sizes.lgskeuomorphic || LBWin.size() === LBWin.sizes.smskeuomorphic)
      && ($.cookie(LBCommon._lbCookieNames.mainLB) === LBCommon._lbTypeLookUp.ou)) {
        LBCommon.setLbEverywhereOuCookie();
      }
    },

    setCurrentLB: function() {
      this.setLBCookie();
      if($.cookie(LBCommon._lbCookieNames.LBeverywhere) === LBCommon._lbTypeLookUp.trad || $.cookie(LBCommon._lbCookieNames.mainLB) === LBCommon._lbTypeLookUp.trad) {
        // set currentLeaderboard scope
        LBCommon.currentFavContent = LBCommon._lbTypeLookUp.tradFavPlayersContainer;
        LBCommon.currentLeaderboard = LBCommon._lbTypeLookUp.tradAllPlayersContainer;

        return LBCommon._lbTypeLookUp.trad;

        // deselect over/under leaderboard and label, mark traditional versions as selected
        // this.setViewSelector();
      } else {
        return LBCommon._lbTypeLookUp.ou;
      }
    },

    getInternetExplorerVersion: function() {
      var version = -1; // Return value assumes failure.
      if(navigator.appName === 'Microsoft Internet Explorer') {
        var userAgent = navigator.userAgent;
        var regex  = new RegExp('MSIE ([0-9]{1,}[\.0-9]{0,})');
        if(regex.exec(userAgent) !== null)
          version = parseFloat(RegExp.$1);
      }
      return version;
    },

    getWindowHeight: function() {
      var ieVersion = this.getInternetExplorerVersion();
      if(ieVersion === 7 || ieVersion === 8) {
        return document.documentElement.offsetHeight;
      } else {
        return window.innerHeight;
      }
    },

    resize: function() {
      // get height of window
      var w_height = this.getWindowHeight();
      var p_height = w_height;
      var diff = p_height - 550;
      if(diff > 100) {
        this.$('.leaderboardPole').css('height', diff + 'px');
      } else {
        this.$('.leaderboardPole').css('height', '100px');
      }
    }
  });

  return LbView;
});
