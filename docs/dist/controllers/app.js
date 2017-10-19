/**
 * AppView will handle all logic around the static PiP elements and the variable page content area
 * controlled by the Router
 */
define('controllers/app',['require','underscore','backbone','utils/common','views/mainmenu','views/site-alert','views/notifications','controllers/panel','controllers/leaderboard-everywhere','controllers/whats-new','utils/querystring','utils/browser','utils/pubsub'],function(require) {
  var _ = require('underscore'),
      Backbone = require('backbone'),
      Common = require('utils/common'),
      MainMenu = require('views/mainmenu'),
      SiteAlert = require('views/site-alert'),
      Notify = require('views/notifications'),
      PanelView = require('controllers/panel'),
      LeaderboardEverywhere = require('controllers/leaderboard-everywhere'),
      WhatsNew = require('controllers/whats-new'),
      Querystring = require('utils/querystring'),
      Browser = require('utils/browser'),
      PubSub = require('utils/pubsub')
      ;

  var AppView = Backbone.View.extend({
    el: '.outer-wrap',

    events: {

    },

    initialize: function(options) {
      if(options.router) {
        this.router = options.router;
      }

      eventsCore.start();
      Browser.performChecks();

      if(eventsCore.util.getUrlParam('loglevel') === 'all') {
        eventsCore.setLogLevel('all');
      }

      this.$app = this.$('#app-wrap');

      this.initThrottledResize();

      // load navigation view
      this.menu = new MainMenu(this.$app).render();

      // load site alerts
      this.alert = new SiteAlert({menu: this.menu}).render();

      // load notifications
      this.notifications = new Notify().render();

      // loadPanel
      Common.video_panel = new PanelView().render();

      this.leaderboardEverywhere = new LeaderboardEverywhere().render();
      this.whatsNew = new WhatsNew().render();

      this.listenTo(Backbone.history, 'route', this.updateNav);
    },

    onDispose: function() {
      PubSub.off('resize', undefined, this);
    },

    initThrottledResize: function() {
      PubSub.on('resize', _.throttle(function() {
        PubSub.trigger('throttle:resize');
      }, 200), this);
    },

    updateNav: function(data) {
      // after calculating path, trigger event in menu with calculated path
      this.menu.trigger('route:change');
      Common.video_panel.trigger('route:change');

      eventsCore.util.updateParams();
      Querystring.refresh();

      if(!data.isFirstLoad) {
        Common.referrer = data.last_referrer;
      }
    }

  });

  return AppView;
});

