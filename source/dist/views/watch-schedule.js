define('views/watch-schedule',['require','backbone','jquery','utils/metrics','views/primary-dropdown','utils/window-size','utils/pubsub'],function(require) {
  var Backbone = require('backbone'),
      $ = require('jquery'),
      Metrics = require('utils/metrics'),
      PrimaryDropdown = require('views/primary-dropdown'),
      Win = require('utils/window-size'),
      PubSub = require('utils/pubsub')
      ;

  var WatchScheduleDropdown = PrimaryDropdown.extend({
    initialize: function() {
      PrimaryDropdown.prototype.initialize.apply(this, arguments);

      this.setSelectedOption(this.$selected.html());

      this.$options = this.$('.option');
      this.option_length = this.$options.length;

      this.delegate('click', 'a.sched-control', _.bind(this.navigate, this));

      this.listenTo(PubSub, 'windowsize:global:enter', this.enterMobile);
      this.listenTo(PubSub, 'windowsize:global:exit', this.leaveMobile)
    },

    enterMobile: function() {
      // when entering mobile size, ensure dropdown is closed
      if(this.open) {
        this.toggleOpenState(false);
      }
    },

    leaveMobile: function() {

    },

    navigate: function(e) {
      e.preventDefault();

      if(Win.size() === Win.sizes.global) {
        var $this = $(e.currentTarget);
        var dir = $this.hasClass('sched-next') ? 1 : -1;

        // figure out which option is next or prev
        var new_index = this.selected + dir;
        if(dir > 0 && this.selected === this.option_length - 1) {
          new_index = 0;
        } else if(dir < 0 && this.selected === 0) {
          new_index = this.option_length - 1;
        }

        // metrics
        if(dir > 0) {
          Metrics.measureApp(Metrics.page_section,'Schedule','Next');
        } else {
          Metrics.measureApp(Metrics.page_section,'Schedule','Previous');
        }

        // set new_index as selected option
        this.setOption(new_index);

        // run callback
        this.options.callback.call(this.options.callback_context, this.$selected.data('src'));
      }
    },

    /** Overload default click handler with noop if at mobile size */
    toggleOpen: function() {
      if(Win.size() !== Win.sizes.global) {
        PrimaryDropdown.prototype.toggleOpen.apply(this, arguments);
      }
    },

    /** Overload default click handler with noop if at mobile size */
    selectOption: function() {
      if(Win.size() !== Win.sizes.global) {
        PrimaryDropdown.prototype.selectOption.apply(this, arguments);
      }
    }
  });

  var WatchSchedule = Backbone.View.extend({
    el: '#schedule',

    events: {
      'click .close': 'close',
      'click a.sched-control': 'navigate'
    },

    isOpen: false,
    select_active: false,

    states: {
      global: 0,
      desktop: 1
    },

    initialize: function(opts) {
      this.options = _.extend({}, opts);
      this.filter = new WatchScheduleDropdown({
        el: this.$('.filter'),
        callback: this.selectDay,
        callback_context: this
      });

      this.on('open', this.open, this);
      this.on('close', this.close, this);

      this.listenTo(PubSub, 'windowsize:global:enter', this.onResize);
      this.listenTo(PubSub, 'windowsize:global:exit', this.onResize);
    },

    render: function() {
      var defaultDay = this.filter.selectedVal();
      this.selectDay(defaultDay);

      return this;
    },

    onDispose: function() {
      this.filter.dispose();
    },

    open: function(type) {
      this.show();
      if(type !== 'auto') {
        Metrics.measureApp(Metrics.page_section,'Schedule','Open');
      }
    },

    close: function(type) {
      this.hide();
      if(type !== 'auto') {
        Metrics.measureApp(Metrics.page_section,'Schedule','Close');
      }
    },

    show: function() {
      if(Win.size() === Win.sizes.global) {
        this.moveTo(this.states.global);
      } else {
        this.options.$filler.show();
      }

      this.trigger('show');

      this.$el.show();
      this.isOpen = true;
    },

    hide: function() {
      if(Win.size() === Win.sizes.global) {
        this.moveTo(this.states.desktop);

      } else {
        this.options.$filler.hide();
      }

      this.trigger('hide');

      this.$el.hide();
      this.isOpen = false;
    },

    moveTo: function(state) {
      if(state === this.states.global) {
        // move schedule div outside section.channels
        var parent = this.$el.parent();
        this.$el.detach();
        parent.before(this.$el);
      } else if (state === this.states.desktop) {
        // move schedule div outside section.channels
        var channelsWrapper = this.$el.siblings('.channelsWrapper');
        this.$el.detach();
        channelsWrapper.prepend(this.$el);
      }
    },

    onResize: function() {
      if(this.isOpen) {
        if(Win.size() === Win.sizes.global) {
          this.moveTo(this.states.global);
          this.options.$filler.hide();
        } else {
          this.moveTo(this.states.desktop);
          this.options.$filler.show();
        }
      }
    },

    selectDay: function(date) {
      this.$('.content_tab.active').removeClass('active');
      this.$('#tab_' + date).addClass('active');
    }
  });

  return WatchSchedule;
});
