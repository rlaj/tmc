define('utils/lb/par3-sticky-nav',['require','backbone','jquery','utils/common','utils/lb/par3-window-size','utils/pubsub'],function(require) {
  var Backbone = require('backbone'),
      $ = require('jquery'),
      Common = require('utils/common'),
      Par3Win = require('utils/lb/par3-window-size'),
      PubSub = require('utils/pubsub')
      ;

  var StickyNav = Backbone.View.extend({
    initialize: function() {
      this.active = false;
      this._laststickybarpos;
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
      if (Par3Win.size() !== Par3Win.sizes.smskeuomorphic && Par3Win.size() !== Par3Win.sizes.lgskeuomorphic) {
        this.stickied = true;
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
      if(this.nav_top < 0) {
        this.nav_top = 0;
      }
      // this.nav_top = this.$nav.offset().top - Common.header_height; // 50: nav height
    },

    resizeListener: function() {
      this.resetTrigger();
      if (this.active && Par3Win.size() === Par3Win.sizes.smskeuomorphic && Par3Win.size() === Par3Win.sizes.lgskeuomorphic) {
        this.active = false;
        this.stickied = false;

        this.disableSticky();
        this.$nav.removeClass('stickybar');
        // this.$el.removeClass('open');
      } else if (!this.active && Par3Win.size() !== Par3Win.sizes.smskeuomorphic && Par3Win.size() !== Par3Win.sizes.lgskeuomorphic) {
        this.active = true;
        this.stickied = true;
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
      // if we haven't scrolled yet, reset nav_top (due to image loading delays)
      if(this._laststickybarpos === undefined) {
        this.resetTrigger();
        this._laststickybarpos = this.nav_top;
      }
      // if we've scrolled past our observation point, add stickybar class
      if(doc_scroll > this.nav_top) {
        this.$nav.addClass('stickybar');
        this.stickied = true;
        // this.$el.removeClass('open');
      } else if (this.$nav.hasClass('stickybar') && doc_scroll <= this.nav_top) {
        this.$nav.removeClass('stickybar');
        this.stickied = false;
        this.resetTrigger();
        // this.$el.removeClass('open');
      }
    }

  });

  return StickyNav;
});
