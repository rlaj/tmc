define('views/lb/lb-body',['require','jquery','utils/browser','utils/metrics','utils/pubsub','views/lb/lb-base','utils/lb/lb-left-offset','utils/lb/lb-common','utils/lb/lb-window-size','views/lb/trad','views/lb/ou','utils/scores'],function(require) {
  var $ = require('jquery'),
      Browser = require('utils/browser'),
      Metrics = require('utils/metrics'),
      PubSub = require('utils/pubsub'),
      LBBaseView = require('views/lb/lb-base'),
      LBLeftOffset = require('utils/lb/lb-left-offset'),
      LBCommon = require('utils/lb/lb-common'),
      LBWin = require('utils/lb/lb-window-size'),
      TradView = require('views/lb/trad'),
      OUView = require('views/lb/ou'),
      Scores = require('utils/scores')
      ;

  var LBIndexView = LBBaseView.extend({

    el: '#leaderboardLow',

    events: {
      'click #playoffFade': 'triggerClosePlayoff'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('LBIndexView');
      this.logger.info('Initialize');

      this.currentLB = opts.lbtype; // "trad" or "ou"

      this.$playoffFade = this.$('#playoffFade');

      // listener - events fired by lbsubmenu when view selector is clicked
      this.listenTo(PubSub, 'currentLB:update', this.resetCurrentLB);

      // listener - playoff fade to show/hide
      // listen to PubSub that's triggered in scores-players.js for PlayoffStatus change
      this.listenTo(PubSub, 'change:playoffStatus', function() {
        if(LBCommon.isLBPlayoffDisplayed()) {
          this.togglePlayoffFade('show');
          this.toggleLBViews('hide');
        } else {
          this.togglePlayoffFade('hide');
          this.toggleLBViews('show');
        }
      });

      // listen to PubSub that's triggered in lb-footer.js for openPlayoff
      this.listenTo(PubSub, 'playoff:openPlayoff playoff:lbSubmenu:viewPlayoff playoff:mobileSubmenu:viewPlayoff', function() {
        this.togglePlayoffFade('show');
        this.toggleLBViews('hide');
      });

      // listen to PubSub that's triggered in lb-playoff.js for closeButton click
      this.listenTo(PubSub, 'playoff:closePlayoff playoff:lbsubmenu:playoffUnselected playoff:mobileSubmenu:viewLeaders', function() {
        this.togglePlayoffFade('hide');
        this.toggleLBViews('show');
      });

      // listener - window size
      this.listenTo(PubSub, 'windowsize:lbLargeSkeuomorphic:enter windowsize:lbSmallSkeuomorphic:enter', this.enterSkeuomorphic);
      this.listenTo(PubSub, 'windowsize:lbDesktop:enter', this.enterDesktop);
      this.listenTo(PubSub, 'windowsize:lbTablet:enter', this.enterTablet);
      this.listenTo(PubSub, 'windowsize:lbMobileLandscape:enter', this.enterMobileLandscape);
      this.listenTo(PubSub, 'windowsize:lbGlobal:enter', this.enterGlobal);
    },

    onRender: function() {
      this.drawLeaderboard();

      // make sure to check if playoffExists with isLBPlayoffDisplayed to display playoff overlay
      if(LBCommon.isLBPlayoffDisplayed() && Scores.collection.playoffExists) {
        this.togglePlayoffFade('show');
        this.toggleLBViews('hide');
      } else {
        this.togglePlayoffFade('hide');
        this.toggleLBViews('show');
      }

      return this;
    },

    onDispose: function() {
      this.tradplayerlist.dispose();
      this.ouplayerlist.dispose();
    },

    drawLeaderboard: function() {
      if(!Scores.isDataLoaded()) {
        PubSub.off('scores:refresh', this.drawLeaderboard, this)
          .once('scores:refresh', this.drawLeaderboard, this);
        return;
      } else {
        this.buildOULB();
        this.buildTradLB();
        this.showSelectedView(this.currentLB);

        // show Fade if playoff is set to show
        if(Scores.collection.playoffExists && LBCommon.isLBPlayoffDisplayed()) {
          // this.togglePlayoffFade('show');

          // for some reason, fade won't show unless force to display using css display:block
          this.$playoffFade.css('display', 'block');
          this.toggleLBViews('hide');
        } else {
          this.toggleLBViews('show');
        }
      }
    },

    buildTradLB: function() {
      this.tradplayerlist = new TradView({el: this.$('#traditional')}).render();
    },

    buildOULB: function() {
      this.ouplayerlist = new OUView({el: this.$('#overunder')}).render();
    },

    // view selector changed - listener currenLB:update
    // reset this.currentLB to be updated value
    resetCurrentLB: function(newLB) {
      this.currentLB = newLB;
      this.showSelectedView(this.currentLB);

      // when LB view is switched b/w OU and Trad,
      // redraw the bottom border
      var container = newLB + 'AllPlayersContainer';
      this.addBottomBorders(container);
      PubSub.trigger('lookup.unveil');
    },

    /** when Playoff is displayed,
    * toggle LB Views (OU & Trad) to show/hide
    */
    toggleLBViews: function(state) {
      if(LBWin.size() !== LBWin.sizes.lgskeuomorphic || LBWin.size() !== LBWin.sizes.smskeuomorphic) {
        switch(state) {
          case 'hide':
            this.$('.content').addClass('hidden');
            break;
          case 'show':
          default:
            this.$('.content').removeClass('hidden');
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
      LBCommon.setMainClosePlayoffCookie();
      Metrics.measureApp(Metrics.page_section, 'Hide Playoff');
      PubSub.trigger('playoff:closePlayoff');
    },

    // for listener to call skeuomorphic view specific functions
    enterSkeuomorphic: function() {
      LBLeftOffset.init(this);
      if(Scores.collection.playoffExists && LBCommon.isLBPlayoffDisplayed()) {
        this.togglePlayoffFade('show');
      } else {
        this.togglePlayoffFade('hide');
      }
    },

    enterDesktop: function() {
      PubSub.trigger('lookup.unveil');
      LBLeftOffset.destroyLeftOffset(this);
    },

    enterGlobal: function() {
      this.forceTradView();
      LBLeftOffset.destroyLeftOffset(this);
    },

    // force Trad view when window change from larger window size to less than tablet
    // force loading Trad view on load and custom events on lbGlobal and lbTablet
    forceTradView: function() {
      LBCommon.setMainTradCookie();
      this.currentLB = LBCommon._lbTypeLookUp.trad;
      this.showSelectedView(this.currentLB);

      // trigger event to to highlight traditional link (lbsubmenu) & select proper footer content (lb-footer)
      PubSub.trigger('forceTradView:enabled', this.currentLB);
      Metrics.measureApp(Metrics.page_section, 'Traditional');
    }

  });
  return LBIndexView;
});
