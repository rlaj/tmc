/**
 * LandingView sets up the body content area used only by the Home and Watch
 * landing pages with a full height hero space at the top, and an infinite
 * scroll content area below
 */
define('views/landing-body',['require','backbone','jquery','utils/common','settings','utils/pubsub','utils/sticky-nav','views/content-list','views/primary-dropdown','views/secondary-dropdown','jquery.dropdown_ext'],function(require) {
  var Backbone = require('backbone'),
      $ = require('jquery'),
      Common = require('utils/common'),
      Settings = require('settings'),
      PubSub = require('utils/pubsub'),
      StickyNav = require('utils/sticky-nav'),
      ContentList = require('views/content-list'),
      PrimaryDropdown = require('views/primary-dropdown'),
      SecondaryDropdown = require('views/secondary-dropdown')
      ;

  require('jquery.dropdown_ext');

  var LandingView = Backbone.View.extend({
    el: 'section.body',

    events: {},

    options: {
      content_list: {}
    },

    scroll_timeoutId: undefined,

    initialize: function() {
      // hide Favorite filter if scores have begun (just in case), or showFavorites has been set
      if(!Settings.Scores.pre || Settings.showFavorites) {
        this.$('#mediaSelector').find('a[href$="favorite"]').css('display', '');
      }

      this.$daySelector = new PrimaryDropdown({el: this.$('#daySelector')});
      this.$mediaSelector = new SecondaryDropdown({el: this.$('#mediaSelector')});

      // pull possible data files dynamically to allow for dynamic addition of days
      this.content_src_ary = this.$daySelector.$('.option').map(function() {
        return $(this).data('src');
      }).toArray();
      this.content_src_ary.shift();

      this.listenTo(PubSub, 'throttle:resize', this.resizeCallback);
    },

    render: function() {
      this.stickyNav = new StickyNav({
        el: this.$daySelector.el
      }).render();

      this.setupContentList();

      this.onRender();
      return this;
    },

    onDispose: function() {
      this.$daySelector.dispose();
      this.$mediaSelector.dispose();
      this.stickyNav.dispose();
      this.list.dispose();
      clearTimeout(this.scroll_timeoutId);
    },

    resizeCallback: function() {
      Common.collapseMenus([this.$daySelector, this.$mediaSelector]);
    },

    setupContentList: function() {
      this.list = new ContentList(this.options.content_list);

      this.defineContentListOverrides();

      // date selector
      this.$daySelector.setCallback(this.list.selectDate, this.list);

      // content type selector
      this.$mediaSelector.setCallback(function(href) {
        var type = href.substring(5);
        this.list.selectType(type);

        if(this.options.media_dropdown_callback && typeof this.options.media_dropdown_callback === 'function') {
          this.options.media_dropdown_callback.call(this, type);
        }
      }, this);
    },

    defineContentListOverrides: function() {},

    buildDayContent: function(content, container) {}
  });

  return LandingView;
});
