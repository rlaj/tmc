define('controllers/par3contest',['require','jquery','underscore','baseview','utils/geoblock','views/landing-hero','utils/lb/lb-common','views/lb/par3-body','collections/par3-players','collections/par3-closest-players','collections/par3-leaders','collections/par3-playoff-players','views/lb/par3-playoff','utils/metrics','views/lb/par3-footer','views/lb/par3-topmenubar','utils/lb/par3-window-size','utils/pubsub'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      BaseView = require('baseview'),
      Geo = require('utils/geoblock'),
      LandingHero = require('views/landing-hero'),
      LBCommon = require('utils/lb/lb-common'),
      Par3BodyView = require('views/lb/par3-body'),
      Par3AllPlayers = require('collections/par3-players'),
      Par3ClosestPlayers = require('collections/par3-closest-players'),
      Par3LeadersPlayers = require('collections/par3-leaders'),
      Par3PlayoffPlayers = require('collections/par3-playoff-players'),
      Par3PlayoffView = require('views/lb/par3-playoff'),
      Metrics = require('utils/metrics'),
      Par3FooterView = require('views/lb/par3-footer'),
      Par3MenuBar = require('views/lb/par3-topmenubar'),
      Par3Win = require('utils/lb/par3-window-size'),
      PubSub = require('utils/pubsub')
      ;

  // require('css!/mas/css/leaderboard_low.css');

  var Par3View = BaseView.extend({
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
      this.pageTitle = 'Par 3 Contest';
    },

    initialize: function(html) {
      BaseView.prototype.initialize.apply(this, arguments);

      this.logger = new eventsCore.util.Logger('Par3View');
      this.logger.info('initialize');
      $(window).on('resize.par3', _.bind(this.resize, this));

      this.par3_collection;
      this.par3_playoff_collection;
      this.par3_closest_collection;
      this.leaders_collection;
      this._isPar3DataLoaded = false;
      this._isPar3ClosestDataLoaded = false;
      this.callback = function() {};
      this.interval = 30; // in seconds
      this.timeoutId;

      if(this.jsonData.pageState === 'live') {
        Geo.checkAction = this.geoAction.bind(this);
        this.loadCollections();
      } else if(this.jsonData.pageState === 'stub') {
        this.hero = new LandingHero({el: this.$('.hero-wrap')});
      }

      // listener - create playoff view when status is changed - to playoff active
      // listen to PubSub that's triggered in par3-players.js for PlayoffStatus change
      this.listenTo(PubSub, 'change:par3PlayoffStatus', this.getPar3PlayoffStatus);
    },

    onInitialization: function() {

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

        this.unveil(this.$('.hero-content img'));

        this.buildTopMenusAndCallPar3Body();

        this.getPar3PlayoffStatus();

        this.timeoutId = setInterval(this.loadCollections.bind(this), this.interval * 1000);
      }
    },

    onDispose: function() {
      // stop listening the collection created in the view
      if(this.jsonData.pageState === 'live') {
        this.leaders_collection.stopListening();
        this.par3menubar.dispose();
        this.par3BodyView.dispose();
        this.par3FooterView.dispose();
        $(window).off('resize.par3');
        clearInterval(this.timeoutId);
        if(this.par3PlayoffView) {
          this.par3PlayoffView.dispose();
        }
      }
    },

    /** load both Closest and Par3 Contest collections
     * in single function
     */
    loadCollections: function() {
      this.loadPar3ClosestCollection();
      this.loadPar3Collection();
    },

    // load Closst to Pin collection
    loadPar3ClosestCollection: function() {
      this.par3_closest_collection = Par3ClosestPlayers;

      this.par3_closest_collection.fetch({
        success: function() {
          this.callback(this.par3_closest_collection);
          // this.Playoff.check();
          this._isPar3ClosestDataLoaded = true;
          this.noClosestPlayers = false;
          console.log('checkPar3ClosestJson - this.par3_closest_collection:%o', this.par3_closest_collection);

          PubSub.trigger('par3closestscores:refresh');
        }.bind(this)
      });
    },

    // load Par 3 collection
    loadPar3Collection: function() {
      this.par3_collection = Par3AllPlayers;
      this.par3_playoff_collection = Par3PlayoffPlayers;

      this.par3_collection.fetch({
        success: function() {
          // this.callback(this.par3_collection);
          // this.Playoff.check();
          this._isPar3DataLoaded = true;
          console.log('checkPar3Json - this.collection:%o', this.par3_collection);
          console.log('checkPar3Json - this.par3_playoff_collection:%o', this.par3_playoff_collection);

          PubSub.trigger('par3scores:refresh');
        }.bind(this)
      });
    },

    buildTopMenusAndCallPar3Body: function() {
      if(!this._isPar3DataLoaded) {
          PubSub.once('par3scores:refresh', this.buildTopMenusAndCallPar3Body, this);
        return;
      } else {
        this.buildPar3Body();
      }
    },

    buildPar3Body: function() {
      if(!this._isPar3ClosestDataLoaded) {
          PubSub.once('par3closestscores:refresh', this.buildPar3Body, this);
        return;
      } else {
        this.leaders_collection = new Par3LeadersPlayers();
        this.par3menubar = new Par3MenuBar({
          el: this.$('#par3Footer'),
          lbtype: this.setCurrentPar3(), // pass "all" or "closest"

          // pass original par3_collection to child views so it can look up par3PlayoffExists flag
          par3_original_collection: this.par3_collection,
          par3_collection: this.par3_collection.clone(),
          par3_closest_collection: this.par3_closest_collection.clone()
        }).render();

        this.par3BodyView = new Par3BodyView({
          el: this.$('#par3'),
          lbtype: this.setCurrentPar3(), // pass "all" or "closest"
          par3_collection: this.par3_collection,
          par3_closest_collection: this.par3_closest_collection,
          leaders_collection: this.leaders_collection
        }).render();

        this.buildPar3Footer();
      }
    },

    buildPar3Footer: function() {
      this.par3FooterView = new Par3FooterView({
        el: this.$('#par3FooterBase'),
        lbtype: this.setCurrentPar3(), // pass "all" or "closest"
        par3_collection: this.par3_collection
      }).render();
    },

    getPar3PlayoffStatus: function() {
      if(!this._isPar3DataLoaded) {
          PubSub.once('par3scores:refresh', this.getPar3PlayoffStatus, this);
        return;
      } else {
        if(this.par3_collection.par3PlayoffExists) {
          // Put in the holes
          var startHole = this.par3_collection.par3PlayoffStartHole;
          var progress = 8;

          var playoff_holes = [];
          for(var i = 0; i < progress; i++) {
            startHole = (startHole === '8' ? '9' : '8');
            playoff_holes.push(startHole);
          }

          this.par3PlayoffView = new Par3PlayoffView({
            el: this.$('#playoffContainer'),
            collection: this.par3_playoff_collection,
            startHole: startHole,
            progress: progress, // how many holes to create
            playoff_holes: playoff_holes
          }).render();
        }
      }
    },

    /** Cookie set up begines here
    */
    getMainPar3Cookie: function() {
      // if cookie doesn't exists, set to All
      if($.cookie(LBCommon._lbCookieNames.par3) === LBCommon._lbTypeLookUp.closest) {
        LBCommon.setPar3ClosestCookie();
      } else {
        LBCommon.setPar3AllCookie();
      }
    },

    setCurrentPar3: function() {
      this.getMainPar3Cookie();
      if($.cookie(LBCommon._lbCookieNames.par3) === LBCommon._lbTypeLookUp.closest) {
        return LBCommon._lbTypeLookUp.closest;
      } else {
        return LBCommon._lbTypeLookUp.all;
      }
    },

    /** Skeuomorphic LB pole and BG set up begines here
    */
    getInternetExplorerVersion: function() {
      var version = -1; // Return value assumes failure.
      if(navigator.appName === 'Microsoft Internet Explorer') {
        var userAgent = navigator.userAgent;
        var regex  = new RegExp('MSIE ([0-9]{1,}[\.0-9]{0,})');
        if(regex.exec(userAgent) !== null)
          version = parseFloat( RegExp.$1 );
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
      //get height of window
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

  return Par3View;
});
