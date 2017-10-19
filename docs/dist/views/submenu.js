define('views/submenu',['require','jquery','backbone','settings','views/menusearch','utils/window-size','utils/browser','utils/pubsub','utils/geoblock'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Settings = require('settings'),
      MenuSearch = require('views/menusearch'),
      Win = require('utils/window-size'),
      Browser = require('utils/browser'),
      PubSub = require('utils/pubsub'),
      Geo = require('utils/geoblock')
      ;

  /**
   * The SubMenu view consists of all navigation links,
   * the search bar, and all footer links
   */
  var SubMenu = Backbone.View.extend({
    el: 'section.nav-wrap',

    events: {
      'submit form#ksearch': 'searchForm'
    },

    initialize: function($app, $mainmenu) {
      this.$lb_li = this.$('#leaderboard');
      this.$players_li = this.$('#players');
      this.$watch_link = this.$('#watch a');

      this.$shiftPageContainers = this.$el.add($mainmenu).add($app);
      this.$html = $('html');
      this.$submenu = this.$('#submenu');

      this.search = new MenuSearch();

      // reset 'left' property when exiting small screen state
      this.listenTo(PubSub, 'windowsize:global:exit', this.autoclose);

      // listen for live video status update events to run setLiveState
      this.listenTo(PubSub, 'livevideo:update', this.setLiveState);

      this.on('route:change', this.updateNavHighlight);

      // self-render upon creation of new SubMenu instance
      this.render();
    },

    render: function() {
      this.setLiveState();
      this.determineLinks();
    },

    searchForm: function(e) {
      e.preventDefault();

      // get form info, query value
      var form = $(e.currentTarget);
      var query = form.find('#words').val();
      var path = form.attr('action');

      // "submit" form via pushState
      Backbone.history.navigate(path + '?query=' + query, true);

      // close submenu immediately
      this.close(true);

      // clear search field
      form.find('#words').val('');
    },

    /**
     * Using Settings values, determine which set of links should appear
     * in the menu for Leader Board (vs Par 3) and Players (vs Invitees).
     * Get proper link text from <script> tags embedded on page
     */
    determineLinks: function() {
      var lb_li = this.$('#menu_option_lb')
      if(Settings.leaderboardPar3) {
        lb_li = this.$('#menu_option_par3');
      }
      this.$lb_li.html(lb_li.html());

      var players_li = this.$('#menu_option_players');
      if(!Settings.playersListNav) {
        players_li = this.$('#menu_option_invitees');
      }
      this.$players_li.html(players_li.html());
    },

    updateNavHighlight: function(path) {
      // clear existing seleced states
      this.$('li > a.selected').removeClass('selected');
      // find path in nav bar and submenu, mark matched link as selected
      this.$('ul li > a[href$="' + path + '"]').addClass('selected');
    },

    /**
     * Open menu, whether slide out all links in mobile view or just the submenu
     * when at larger sizes. Only concerned with the menu itself, should trigger
     * an Event for things like the video issue
     */
    open: function() {
      console.log('[submenu.js] running open, windowsize: ' + Win.size());

      if(Win.size() === Win.sizes.global) {
        this.$html.addClass('js-nav');
        if(Browser.oldIE) {
          // address fixed background position laying over top of open menu
          // this selector can't be cached because it will change from page to page
          // if it is, then an event listener will be needed to update the cached object
          // whenever a new page loads
          $('section.page-wrap').css('z-index', -1);
          // IE8/9 don't support css3 animations, use jQuery to animate instead
          // IE9 does understand css3 transform, reset transforms in css to 0
          this.$shiftPageContainers.animate({
            left: "+=280"
          }, 500, function() {
            this.$html.addClass('active');
          }.bind(this));
        }
      } else {
        this.$submenu.addClass('active');
        if (Browser.ie) {
          var wel = $('#welcome');
          if(wel.hasClass('hasVideo') && wel.hasClass('heroVideo')) {
            // pause and hide video
            wel.find('.videoPlayerWrapper object').hide();
          }
        }
      }
    },

    /**
     * Close menu, whether slide in all links in mobile view or just the submenu
     * when at larger sizes. Only concerned with the menu itself, should trigger
     * an Event for things like the video issue
     */
    close: function(force) {
      console.log('[submenu.js] running close, windowsize: ' + Win.size());

      this.$submenu.removeClass('active');
      // upon navigation, remove transition to avoid content loading in while menu is sliding back into place
      if(Win.size() === Win.sizes.global) {
        if(!Browser.oldIE) {
          if(force) {
            this.$html.addClass('js-navigate');
            setTimeout(function() {
              this.$html.removeClass('js-navigate');
            }.bind(this), 500);
          }
          this.$html.removeClass('js-nav');
        } else {
          if(force) {
            $('section.page-wrap').css('z-index', '');
            this.$html.removeClass('active js-nav');
          } else {
            this.$shiftPageContainers.animate({
              left: "-=280"
            }, 500, function() {
              $('section.page-wrap').css('z-index', '');
              this.$html.removeClass('active js-nav');
            }.bind(this));
          }
        }
      } else {
        this.$html.removeClass('js-nav');
        if (Browser.ie) {
          var wel = $('#welcome');
          if(wel.hasClass('hasVideo') && wel.hasClass('heroVideo')) {
            // resume and show video
            wel.find('.videoPlayerWrapper object').show();
          }
        }
      }
    },

    autoclose: function() {
      if (Browser.oldIE) {
        this.$html.removeClass('active js-nav');
        this.$shiftPageContainers.css('left', '');
      }
    },

    setLiveState: function() {
      var $live = this.$watch_link.find('.live');
      var isOnAir = $live.length > 0;
      if(typeof live_video !== 'undefined' && live_video) {
        if(!isOnAir){
          this.$watch_link.append('<span class="live">Live</span>');
        }
      } else {
        if(isOnAir) {
          $live.remove();
        }
      }

    }
  });

  return SubMenu;
});
