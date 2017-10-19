/**
 * BaseView is the base class for all page views that used to behave as
 * an individual page. This allows for page tracking, and page specific
 * variables to be set.
 */
define('baseview',['require','jquery','backbone','utils/metrics','utils/browser','views/base-hero','utils/social','settings','utils/favorites','eventsCore','unveil'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Metrics = require('utils/metrics'),
      Browser = require('utils/browser'),
      BaseHero = require('views/base-hero'),
      Share = require('utils/social'),
      Settings = require('settings'),
      Favorites = require('utils/favorites')
      ;

  require('eventsCore');
  require('unveil');

  var BaseView = Backbone.View.extend({
    tagName: 'section',
    id: 'app-wrap',
    className: 'app-wrap',

    props: {},
    pageTitle: '',
    event_title: Settings.tournament_year + ' Masters Tournament',

    init_load: false,
    continue_load: true, // meant for page redirects so we don't continue rendering
    scroll_on_load: 0, // vertical position to scroll page on initial load, default of 0 (top)

    is_404: false,
    load_path: '',

    initialize: function(options) {
      // clear existing Metrics page_* values before we do anything on new page
      Metrics.resetPageValues();

      var html = options.html;
      this.load_path = options.path;

      this.$html = this.$el.append(html);

      // if nothing passed, initial page load
      // so reset this.el to the existing #app-wrap element
      if(!html) {
        this.setElement('#app-wrap');
        this.init_load = true;
      }

      // parse any and all inline JSON data
      this.consumePageVars();

      // check if firstload page is 404 (and not loading 404 page)
      // if so, store state, return immediately
      if(this.jsonData.pageState === '404' && this.load_path !== '/404.html') {
        this.is_404 = true;
        return;
      }

      // reset Favorites metric prefix
      Favorites.prefix = '';

      // don't make object available until we've determined the page didn't result
      // in a 404 return
      this.logger = new eventsCore.util.Logger('BaseView');

      // run method to process page vars defined on the page
      this.processPageVars();

      // change page title
      if(Backbone.history._usePushState) {
        this.updatePageTitle();
      }

      // then update page metrics values
      Metrics.setPageMetrics(this.pageTitle);

      // set default prefix for Favorite actions
      Favorites.get();

      this.onInitialization();
    },

    render: function() {
      this.onBeforeRender();

      if(!this.init_load) {
        $('#app-wrap').replaceWith(this.$el);
      }

      this.loadBasicShare();

      this.onRender();

      // Don't track page views if a webview
      if(!Browser.app) {
        Metrics.trackPageView(this.props);
      }

      // scroll to top??
      setTimeout(function() {
        window.scrollTo(0, this.scroll_on_load);
      }.bind(this), 100);

      return this;
    },

    dispose: function() {
      if(this.hero) {
        this.hero.dispose();
      }

      Backbone.View.prototype.dispose.apply(this, arguments);
    },

    consumePageVars: function() {
      var $json;
      if(!this.init_load) {
        $json = this.$html.find('.page_vars');
      } else {
        $json = this.$('.page_vars');
      }

      this.jsonData = {
        pageDetails: {},
        metrics: {}
      };
      var that = this;
      $json.each(function() {
        $.extend(that.jsonData, JSON.parse(this.innerHTML));
      });
    },

    processPageVars: function() {},

    loadBasicShare: function() {
      var path = location.pathname.substring(0);

      // share if share link exists in articleInfo or title-bar
      var share = this.$('section.hero-wrap, section.page-wrap').find('.title-bar, .actions, .articleInfo').find('.share');
      if(share.length > 0 && !Browser.app) {
        var url = path;
        var title = this.jsonData.pageDetails && this.jsonData.pageDetails.pageTitle || Metrics.page_title;
        Share.loadSocialOverlay(share, url, Metrics.page_section, Metrics.page_title, title);
      } else if(Browser.app) {
        if(Browser.apptype.ios) {
          share.on('click', function(e) {
            Metrics.appShare(e);
          });
        }
      }
    },

    updatePageTitle: function() {
      if(this.jsonData.documentTitle) {
        document.title = this.jsonData.documentTitle + ' - ' + this.event_title;

        window.history.replaceState({}, document.title);
      }
    },

    /**
     * These are used to specify any custom controller needed method calls
     * during the initialize and render methods
     */
    onInitialization: function() {
      this.hero = new BaseHero({el: this.$('.hero-wrap')});
    },
    onBeforeRender: function() {},
    onRender: function() {
      if(this.hero) {
        this.hero.render();
      }
    }
  });

  return BaseView;
});

