define('views/mainmenu',['require','backbone','views/submenu','views/sponsors','utils/metrics','utils/pubsub','settings'],function(require) {
  var Backbone = require('backbone'),
      SubMenu = require('views/submenu'),
      Sponsors = require('views/sponsors'),
      Metrics = require('utils/metrics'),
      PubSub = require('utils/pubsub'),
      Settings = require('settings')
      ;

  /**
   * The MainNav view consists of the base menu items (not including menu links),
   * the buttons that trigger the submenu, leader board, and rotating sponsor logos
   */
  var MainNav = Backbone.View.extend({
    el: '#top',

    active: false,
    visible: true,

    events: {
      'click .menu-link': 'toggle',
      'click .leaderboardEverywhereIcon': 'toggleLeaderboardEverywhere'
    },

    initialize: function($app) {
      this.$menuIcon = this.$('.menu-link');
      this.$app = $app;
      this.subMenu = new SubMenu($app, this.$el);
      this.sponsors = new Sponsors();

      this.listenTo(PubSub, 'windowsize:global:exit', this.autoclose);
      this.listenTo(PubSub, 'windowsize:global:enter', this.autoclose);
      this.listenTo(PubSub, 'leaderboardEverywhere:open', this.openLeaderboardEverywhere);
      this.listenTo(PubSub, 'leaderboardEverywhere:close', this.closeLeaderboardEverywhere);

      // just pass this through to the submenu
      this.on('route:change', this.updatePath);

      // autoclose the menu when the route changes
      this.on('route:change', this.autoclose);

      //show leaderboard everywhere icon when scoring has begun
      if(!Settings.Scores.pre) {
        this.$('.leaderboardEverywhereIcon').removeClass('hidden');
      }
    },

    render: function() {
      // render sponsors, begin rotation
      this.sponsors.render();

      return this;
    },

    toggle: function(e) {
      e.preventDefault();
      if(!this.active) {
        console.log('[mainmenu.js] triggering open');
        this.open();
        Metrics.measureApp('Home', 'Open');
      } else {
        console.log('[mainmenu.js] triggering close');
        this.close();
        Metrics.measureApp('Home', 'Close');
      }
    },

    /**
     * Update style of menu icon when opening, run subMenu.open, add listeners
     * in case user touches anywhere in app body area
     */
    open: function() {
      console.log('[mainmenu.js] running open');
      this.$menuIcon.addClass('active');
      this.subMenu.open();

      // auto-close menu if user touches or clicks in main content area
      this.$app.on('touchstart click.nav', this.close.bind(this));
      this.$el.on('touchstart click.nav', function(e) {
        if(!$(e.target).hasClass('menu-link') && $(e.target).closest('.menu-link').length === 0) {
          this.close();
        }
      }.bind(this));

      this.active = true;
    },

    /**
     * Update style of menu icon when closing, run subMenu.close, remove listeners
     * added in case user touches anywhere in app body area
     * @param  {Boolean} force Whether the menu should be forced close immediately
     * instead of being allowed to animate closed
     */
    close: function(force) {
      console.log('[mainmenu.js] running close');
      this.$menuIcon.removeClass('active');
      this.subMenu.close(force);

      this.$app.off('touchstart click.nav');
      this.$el.off('touchstart click.nav');

      this.active = false;

      return false;
    },

    autoclose: function() {
      if(this.active) {
        this.close(true);
      }
    },

    updatePath: function() {
      var path = location.pathname.substring(0);

      // assign main nav paths to highlight when on certain subpages
      if(path.indexOf('/watch/') !== -1) {
        path = '/en_US/watch/index.html';
      }
      if(path.indexOf('/par3contest/') !== -1 || path.indexOf('/scores/index.html') !== -1) {
        if(!Settings.leaderboardPar3) {
          path = '/en_US/scores/index.html';
        } else {
          path = '/en_US/scores/par3contest/index.html';
        }
      }
      if(path.indexOf('/scores/track/') !== -1) {
        path = '/en_US/scores/track/index.html';
      }
      if(path.indexOf('/players/') !== -1 && path.indexOf('/pairings/') === -1) {
        if(Settings.playersListNav) {
          /* during */
          path = '/en_US/players/player_list.html';
        } else {
          /* pre */
          path = '/en_US/players/invitees_2017.html';
        }
      }
      if(path.indexOf('/course/') !== -1) {
        path = '/en_US/course/index.html';
      }
      if(path.indexOf('/tournament/') !== -1 && path.indexOf('/schedule.html') === -1) {
        path = '/en_US/tournament/index.html';
      }
      if(path.indexOf('/patron/') !== -1 && location.search.indexOf('ticketing') !== -1) {
        path = '/en_US/patron/index.html?page=ticketing';
      }

      this.subMenu.trigger('route:change', path);
    },

    toggleLeaderboardEverywhere: function() {
      if(!this.$('.leaderboardEverywhereIcon').hasClass('active')) {
        PubSub.trigger('leaderboardEverywhere:open');
        Metrics.trackS({
          prop56: 'LB Panel On',
          eVar56: 'LB Panel On'
        });
        Metrics.measureApp('Leader Board Everywhere', 'LB Panel On');
      } else {
        PubSub.trigger('leaderboardEverywhere:close');
        Metrics.trackS({
          prop56: 'LB Panel Off',
          eVar56: 'LB Panel Off'
        });
        Metrics.measureApp('Leader Board Everywhere', 'LB Panel Off');
      }
    },

    openLeaderboardEverywhere: function() {
      this.$('.leaderboardEverywhereIcon').addClass('active');
    },
    closeLeaderboardEverywhere: function() {
      this.$('.leaderboardEverywhereIcon').removeClass('active');
    }

  });

  return MainNav;
});

