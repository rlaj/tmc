/**
 * Router will require and route URLs to the high level sections of the site.
 * From there, each high level view will then determine based on +path+ which
 * subviews should be utilized to create the page. These high level views effectively
 * act as the "C" part of an MVC application
 */
define('router',['require','jquery','underscore','backbone'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone')
  ;

  var MasRouter = Backbone.Router.extend({

    routes: {
      'en_US(/)(index.html)': 'index',
      '(:app/)en_US/news/articles/*path': 'article',
      'en_US/news/:photos/*path': 'photo_gallery',
      'en_US/news/:gallery/*path': 'photo_gallery',
      'en_US/watch/live.html(?*queryString)': 'watch_live',
      'en_US/watch/(index.html)(?*queryString)': 'watch_index',
      'en_US/watch/*path(?*queryString)': 'watch_vod',
      'en_US/info/*path': 'static_page_info',
      'en_US/tournament/past_winners.html(?*queryString)': 'past_winners',
      'en_US/tournament/schedule.html(?*queryString)': 'schedule',
      ':app/en_US/schedule/*path': 'schedule',
      'en_US/tournament/*path': 'static_page_tourn',
      'en_US/patron/(index.html)': 'patron',
      '(:app/)en_US/scores/track/track.html': 'track',
      '(:app/)en_US/scores/track/*path': 'track_index',
      '(:app/)en_US/scores/about_leader_board.html': 'leaderboard_info',
      '(:app/)en_US/scores/par3contest/about_par3_contest.html': 'par3contest_info',
      'en_US/scores/par3contest/(index.html)': 'par3contest_leaderboard',
      'en_US/scores/stats/historical/*path': 'historic_stats',
      'en_US/scores/stats/*path': 'stats',
      'en_US/scores/(*path)': 'leaderboard',
      'en_US/players/player_list.html': 'players',
      'en_US/course/(index.html)': 'course',
      'en_US/course/*path': 'hole_detail',
      'en_US/players/pairings/(index.html)': 'tee_times',
      'en_US/players/player_*path': 'player_bio',
      ':app/en_US/players/*path': 'player_bio_webview',
      'en_US/players/invitees_*path': 'invitees',
      'en_US/tribute/*path': 'tribute',
      'en_US/shop/*path': 'shop',
      'en_US/feedback/*path': 'feedback',
      'en_US/search/(*path)': 'search',
      'MediaGuide:year(/)(index.html)': 'media_guide',
      '*path': 'error'
    },

    currentAppView: undefined,
    isFirstLoad: true,
    referrer: '',

    scroll_pages: {},
    scroll_stack: [],
    scroll_store_length: 2,
    no_scroll_modules: [
      'controllers/watch-live',
      'controllers/watch-vod'
    ],

    initialize: function() {
      this.logger = new eventsCore.util.Logger('MasRouter');

      var _this = this;
      $('body').on('click', 'a:not(a[data-bypass])', function(e) {
        // More robust URL handling: http://robdodson.me/exploring-the-backbone-router-and-history-api/
        // Get the anchor href and protcol
        var href = $(this).attr('href');
        var protocol = this.protocol + '//';

        // Ensure the protocol is not part of URL, meaning its relative.
        if(href &&
           // ignore any links that begin with http(s):// unless it contains .masters.com
           (href.slice(0, protocol.length) !== protocol || href.indexOf('.masters.com/') > -1) &&
            href.indexOf('javascript:') !== 0 && href.indexOf('#') !== 0 && href !== '') {

          // check for protocol again
          if(href.slice(0, protocol.length) === protocol) {
            var domain = href.indexOf('masters.com');
            domain += 11;
            href = href.slice(domain, href.length);
          }

          // Stop the default event to ensure the link will not cause a page
          // refresh.
          e.preventDefault();

          // If location had existing query params, check to see if they match any of
          // the defined list, keep/maintain them through page navigation
          if(document.location.search.length > 1) {
            var search = document.location.search;

            // params to keep through navigation
            var keys = ['ios', 'ipad', 'iphone', 'android', 'loglevel'];
            for(var i = 0, l = keys.length; i < l; i++) {
              var index = search.indexOf(keys[i]);
              if(index > -1) {
                var to = search.indexOf('&', index + 1);
                if(to === -1 && index > -1) {
                  to = search.length;
                }
                if(to > -1) {
                  if(index < 1) { index = 1; }
                  var query = search.substring(index, to);
                  href += (href.indexOf('?') > -1 ? '&' : '?') + query;
                }
              }
            }
          }

          _this.storeScrollPosition();

          // `Backbone.history.navigate` is sufficient for all Routers and will
          // trigger the correct events.  The Router's internal `navigate` method
          // calls this anyways.
          Backbone.history.navigate(href, true);
        } else

        // auto-prevent all links with just "#" from performing default behavior
        if(href === '#') {
          e.preventDefault();
        }
      });
    },

    index: function() {
      this.loadPage('/en_US/index.html', ['controllers/index']);
    },

    article: function(app, path) {
      var prefix = '';
      if(app !== null) {
        prefix = '/' + app;
      }
      this.loadPage(prefix + '/en_US/news/articles/' + path, ['controllers/article']);
    },

    watch_index: function(path, queryString) {
      this.loadPage('/en_US/watch/index.html', ['controllers/watch-index']);
    },

    watch_live: function(path, queryString) {
      this.loadPage('/en_US/watch/live.html', ['controllers/watch-live']);
    },

    watch_vod: function(path, queryString) {
      this.loadPage('/en_US/watch/' + path, ['controllers/watch-vod']);
    },

    static_page_info: function(path) {
      this.loadPage('/en_US/info/' + path, ['controllers/static-page']);
    },

    static_page_tourn: function(path) {
      if(path === null) {
        path = 'index.html';
      }
      this.loadPage('/en_US/tournament/' + path, ['controllers/static-page']);
    },

    patron: function() {
      this.loadPage('/en_US/patron/index.html', ['controllers/patron']);
    },

    past_winners: function() {
      this.loadPage('/en_US/tournament/past_winners.html', ['controllers/past-winners']);
    },

    schedule: function(app) {
      var prefix = '';
      if(app !== null) {
        prefix = '/' + app;
      }
      this.loadPage(prefix + '/en_US/tournament/schedule.html', ['controllers/schedule']);
    },
    leaderboard: function(path) {
      if(path === null) {
        path = 'index.html';
      }
      this.loadPage('/en_US/scores/' + path, ['controllers/leaderboard']);
    },
    leaderboard_info: function(app) {
      var prefix = '';
      if(app !== null) {
        prefix = '/' + app;
      }
      this.loadPage(prefix + '/en_US/scores/about_leader_board.html', ['controllers/static-page']);
    },
    par3contest_leaderboard: function() {
      this.loadPage('/en_US/scores/par3contest/index.html', ['controllers/par3contest']);
    },
    par3contest_info: function(app) {
      var prefix = '';
      if(app !== null) {
        prefix = '/' + app;
      }
      this.loadPage(prefix + '/en_US/scores/par3contest/about_par3_contest.html', ['controllers/static-page']);
    },

    track_index: function(app, path) {
      var prefix = '';
      if(app !== null) {
        prefix = '/' + app;
      }
      this.loadPage(prefix + '/en_US/scores/track/index.html', ['controllers/track-index']);
    },

    track: function(app, path) {
      var prefix = '';
      if(app !== null) {
        prefix = '/' + app;
      }
      this.loadPage(prefix + '/en_US/scores/track/track.html', ['controllers/track']);
    },

    players: function() {
      this.loadPage('/en_US/players/player_list.html', ['controllers/players']);
    },

    course: function() {
      this.loadPage('/en_US/course/index.html', ['controllers/course']);
    },

    hole_detail: function(path, queryString) {
      this.loadPage('/en_US/course/' + path, ['controllers/hole-detail']);
    },

    tee_times: function() {
      this.loadPage('/en_US/players/pairings/index.html', ['controllers/tee-times']);
    },
    photo_gallery: function(section, path) {
      // this.loadPage('/en_US/news/photos/gallery.mock.html', ['controllers/photo-gallery']);
      this.loadPage('/en_US/news/' + section + '/' + path, ['controllers/photo-gallery']);
    },

    invitees: function(path) {
      this.loadPage('/en_US/players/invitees_' + path, ['controllers/invitees']);
    },

    player_bio: function(path) {
      this.loadPage('/en_US/players/player_' + path, ['controllers/player-bio']);
    },

    player_bio_webview: function(app, path) {
      var prefix = '';
      if(app !== null) {
        prefix = '/' + app;
      }
      this.loadPage(prefix + '/en_US/players/player_bio.html', ['controllers/player-bio-webview']);
    },

    historic_stats: function(path) {
      if(path === null) {
        path = 'index.html';
      }
      this.loadPage('/en_US/scores/stats/historical/' + path, ['controllers/historic-stats']);
    },

    stats: function(path) {
      if(path === null) {
        path = 'index.html';
      }
      this.loadPage('/en_US/scores/stats/' + path, ['controllers/stats']);
    },

    tribute: function(path) {
      if(path === null) {
        path = 'index.html';
      }
      this.loadPage('/en_US/tribute/' + path, ['controllers/tribute']);
    },

    shop: function(path) {
      if(path === null) {
        path = 'index.html';
      }
      this.loadPage('/en_US/shop/' + path, ['controllers/static-page']);
    },

    feedback: function(path) {
      if(path === null) {
        path = 'index.html';
      }
      this.loadPage('/en_US/feedback/' + path, ['controllers/static-page']);
    },

    search: function(path) {
      this.loadPage('/en_US/search/index.html', ['controllers/search']);
    },

    media_guide: function(year) {
      if(year === null) {
        year = '2017';
      }
      this.loadPage('/MediaGuide' + year + '/index.html', ['controllers/static-page']);
    },

    error: function(path) {
      console.log('breaking on error, %o', path);
      this.loadPage('/404.html', ['controllers/static-page']);
    },

    /**
     * Allow dynamic loading of all controllers only when needed in order to avoid
     * loading all JS needed for all routes on first page load
     * @param  {String} path        URL path of content to load
     * @param  {Array} module_path Array of module paths needed to load the page
     */
    loadPage: function(path, module_path) {
      this.logger.out('loading %o with modules %o', path, module_path);
      this.loadContent(path)

      // if successfully loaded partial path, continue loading with defined controller
      .done(function(page) {
        require(module_path, function(Module) {
          this.currentAppView = new Module({
            html: page,
            path: path
          });

          // if after creating Module, the page is actually 404
          // call error route, return immediately
          if(this.currentAppView.is_404 && path !== '/404.html') {
            this.error(path);
            return;
          }

          // only render page if +continue_load+ remains +true+
          if(this.currentAppView.continue_load === true) {
            var scroll_position = this.scroll_pages[path] || 0;

            // supposed to scroll, but loading module that is in the no_scroll_modules list, reset to 0
            if(scroll_position > 0 && _.intersection(this.no_scroll_modules, module_path).length >= 1) {
              scroll_position = 0;
            }

            // pass scroll position on to the view to handle
            this.currentAppView.scroll_on_load = scroll_position;

            this.currentAppView.render();
          }
          this.isFirstLoad = false;
          this.last_referrer = document.location.pathname;

          // otherwise, immediately continue to load the path defined in
          // +continue_load+
          if(this.currentAppView.continue_load !== true) {
            this.navigate(this.currentAppView.continue_load, {trigger: true, replace: true});
          }
        }.bind(this));
      }.bind(this))

      // if failed to load partial path, render the 404 page instead
      .fail(function() {
        this.error(path);
      }.bind(this));
    },

    /**
     * Wrapper function for loadUrl that checks for firstLoad state
     * @param  {String} path Path of page to load
     * @return {Promise}      Returns jQuery ajax Promise
     */
    loadContent: function(path) {
      if(!this.isFirstLoad) {
        return this.loadUrl(path)
          .done(function() {
            if(this.currentAppView) {
              this.currentAppView.dispose(true);
            }
          }.bind(this));
      }

      var d = new $.Deferred();
      d.resolve();
      return d.promise();
    },

    /**
     * [loadUrl description]
     * @param  {String} url Path of page to load
     * @return {Promise}    Returns jQuery ajax Promise
     */
    loadUrl: function(_url) {
      var url = _url;

      url += (_url.search(/\?/) > -1 ? '&' : '?') + 'ajax=true';
      return $.ajax(url, {
        headers: {}
      });
    },

    storeScrollPosition: function() {
      var path = this.currentAppView.load_path || window.location.pathname;
      if(this.scroll_stack.length > this.scroll_store_length) {
        var key = this.scroll_stack.shift();
        delete this.scroll_pages[key];
      }

      this.scroll_pages[path] = document.body.scrollTop || $(document).scrollTop();
      this.scroll_stack.push(path);
    }

  });

  return MasRouter;
});

