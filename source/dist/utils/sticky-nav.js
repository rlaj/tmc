define('utils/sticky-nav',['require','backbone','jquery','utils/pubsub','utils/common','utils/window-size'],function(require) {
  var Backbone = require('backbone'),
      $ = require('jquery'),
      PubSub = require('utils/pubsub'),
      Common = require('utils/common'),
      Win = require('utils/window-size')
      ;

  var StickyNav = Backbone.View.extend({
    initialize: function() {
      this.active = false;
      this.stickied = false;
      this.$nav = this.$el.parent();
      this.$static_body = this.$nav.parent();
      this.nav_top;
      this.$doc = $(document);

      this.listenTo(PubSub, 'throttle:resize', this.resizeListener);
    },

    render: function() {
      this.static_margin = this.$nav.offset().top - this.$static_body.offset().top;
      this.resetTrigger();
      if (Win.size() !== Win.sizes.global) {
        this.active = true;
        this.initSticky();
      }

      return this;
    },

    onDispose: function() {
      this.disableSticky();
    },

    resetTrigger: function() {
      this.nav_top = this.$static_body.offset().top - Common.header_height + this.static_margin; // 50: nav height
    },

    resizeListener: function() {
      this.resetTrigger();
      if (this.active && Win.size() === Win.sizes.global) {
        this.active = false;
        this.stickied = false;

        this.disableSticky();
        this.$nav.removeClass('stickybar');
        this.$el.removeClass('open');
      } else if (!this.active && Win.size() !== Win.sizes.global) {
        this.active = true;
        this.initSticky();
      }
      this.scrollListener();
    },

    initSticky: function() {
      PubSub.on('scroll', this.scrollListener.bind(this), this);
    },

    disableSticky: function() {
      PubSub.off('scroll', this.scrollListener, this);
    },

    scrollListener: function() {
      var doc_scroll = this.$doc.scrollTop();
      if (doc_scroll > this.nav_top && !this.stickied) {
        this.$nav.addClass('stickybar');
        this.stickied = true;
        this.$el.removeClass('open');
      } else if (this.stickied && this.$nav.hasClass('stickybar') && doc_scroll <= this.nav_top) {
        this.$nav.removeClass('stickybar');
        this.stickied = false;
        this.$el.removeClass('open');
      }
    }

  });

  return StickyNav;
});
