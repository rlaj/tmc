/**
 * This takes the place of the old jQuery plugin $.secondaryDropdown. This subview
 * assumes an existing structure/container defined below, and attaches interactions
 * for opening/closing the dropdown, and selecting the filter type defined by the
 * href attribute
 *
 * This is typically wrapped in a parent <div class="tabWrapper">
 *
 * <div class="tabs">
 *   <a href="#tab_all" class="selected">All</a>
 *   <a href="#tab_type1">Type 1</a>
 *   ...
 * </div>
 */
define('views/secondary-dropdown',['require','backbone','jquery','underscore','utils/metrics','utils/window-size'],function(require) {
  var Backbone = require('backbone'),
      $ = require('jquery'),
      _ = require('underscore'),
      Metrics = require('utils/metrics'),
      Win = require('utils/window-size')
      ;

  var SecondaryDropdown = Backbone.View.extend({
    el: '.tabs',

    events: {
      'click a.selected': 'toggleOpen',
      'click a:not(.selected):not(.disabled)': 'selectOption',
      'click a': 'noOp'
    },

    defaults: {
      max_size: '',
      callback: function() {},
      callback_context: this,
      metrics: ''
    },

    open: false,
    selected: 0,

    initialize: function(opts) {
      this.options = _.extend({}, this.defaults, opts);

      // If no metrics option was passed, set defaults
      if(this.options.metrics !== null && this.options.metrics.length === 0) {
        this.options.metrics = 'View';
      }

      // if metrics was passed a null value, compact (remove falsy values) from metrics array
      this.options.metrics = _.compact([Metrics.page_section, this.options.metrics]);


      this.$parent = this.$el.parent();
      this.$selected = this.$('.selected');
      this.selected = this.$selected.index();
    },

    /**
     * Dynamically set the proper callback method for what happens after
     * an option is selected
     * @param {Function} func  Function that should be invoked
     * @param {Objet} _this Function context to bind to the invoked Function
     */
    setCallback: function(func, _this) {
      this.options.callback = func;
      if(_this !== undefined) {
        this.options.callback_context = _this;
      }
    },

    findByType: function(type) {
      return this.$('a[href^="#tab_' + type + '"]');
    },

    findIndexByType: function(type) {
      var el = this.findByType(type);
      var i = el.index();
      if(this.open) {
        i -= 1;
      }
      return i;
    },

    noOp: function(e) {
      e.preventDefault();
    },

    toggleOpenState: function(state) {
      var copy;

      if(state !== undefined) {
        this.open = state;
      } else {
        this.open = !this.open;
      }
      this.$el.toggleClass('open', this.open);

      if(this.open) {
        copy = this.$selected.clone().addClass('clone');
        this.$el.prepend(copy);
      } else {
        this.$('.clone').remove();
      }
    },

    /**
     * Callback to open/close dropdown
     * Opens/closes dropdown, makes metric call
     */
    toggleOpen: function(e) {
      if(this.check_size()) {
        this.toggleOpenState();
        this.measureApp('Tab', this.open ? 'Open' : 'Close');
      }
    },

    /**
     * Click callback when option is selected from an open dropdown
     * or from the horizontal list
     * @param  {Event} e Standard Event object from a click action
     */
    selectOption: function(e) {
      var $t = $(e.currentTarget);
      this.$selected = $t;
      this.selected = $t.index();
      if(this.open) {
        // account for extra 'cloned' element at the beginning
        this.selected -= 1;
      }
      this.setOption();
      this.measureApp(this.getSelectedMeasureText());

      if(this.check_size()) {
        this.toggleOpenState(false);
      }

      this.options.callback.call(this.options.callback_context, this.$selected.attr('href'));
    },

    getSelectedMeasureText: function() {
      return this.$selected.text();
    },

    setOption: function(index) {
      if(index !== undefined) {
        this.selected = index;
      }
      if(isNaN(this.selected) || this.selected < 0) {
        this.selected = 0;
      }
      this.$selected = this.$('a:not(.clone)').eq(this.selected);

      this.$('.selected').removeClass('selected');
      this.$selected.addClass('selected');
    },

    /**
     * Checks the size at which this View becomes a dropdown or is a
     * text list based on a global setting or a +max_size+ option
     */
    check_size: function() {
      if(this.options.max_size === '' || this.options.max_size === Win.sizes.global) {
        return Win.size() === Win.sizes.global;
      } else if(this.options.max_size === Win.sizes.tablet) {
        return Win.size() !== Win.sizes.desktop;
      }
      return true;
    },

    measureApp: function() {
      var metricsCall = this.options.metrics.slice(0);
      for(var i = 0; i < arguments.length; i++) {
        metricsCall.push(arguments[i]);
      }
      Metrics.measureApp.apply(window, metricsCall);
    }
  });

  return SecondaryDropdown;
});

