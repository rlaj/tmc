/**
 * This takes the place of the old jQuery plugin $.primaryDropdown. This subview
 * assumes an existing structure/container defined below, and attaches interactions
 * for opening/closing the dropdown, and selecting an option to do something with
 * the value stored in data-src.
 *
 * This is typically wrapped in a parent <div class="navWrapper">
 *
 * Usage includes date selector on Home and Watch landing pages, etc.
 *
 * <div class="filter">
 *   <div class="selected_container">
 *     <a href="#" class="selected_option">Selected Option 1</a>
 *   </div>
 *   <div class="options">
 *     <a href="#" class="option selected" data-src="value1">Selected Option 1</a>
 *     <a href="#" class="option" data-src="value2">Option 2</a>
 *     ...
 *   </div>
 * </div>
 */
define('views/primary-dropdown',['require','backbone','jquery','utils/metrics'],function(require) {
  var Backbone = require('backbone'),
      $ = require('jquery'),
      Metrics = require('utils/metrics')
  ;


  var PrimaryDropdown = Backbone.View.extend({
    el: '.filter',

    events: {
      'click .selected_container': 'toggleOpen',
      'click .options a': 'selectOption'
    },

    defaults: {
      callback: function() {},
      callback_context: this,
      metrics: []
    },

    open: false,
    selected: 0,

    initialize: function(opts) {
      this.options = _.extend({}, this.defaults, opts);

      // Set initial open/close state based on container
      if(this.$('.selected_container').hasClass('open')) {
        this.open = true;
      }

      // If no metrics option was passed, set defaults
      if(this.options.metrics.length === 0) {
        this.options.metrics = [Metrics.page_section, 'Day Picker'];
      }

      this.$parent = this.$el.parent();
      this.$selected_option = this.$('.selected_option');
      this.$selected = this.$('.options a.selected');
      this.selected = this.$selected.index() || 0;

      this.listenTo(this, 'select', this.setOption);
    },

    render: function() {

    },

    dispose: function() {
      Backbone.View.prototype.dispose.call(this, true);
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

    selectedVal: function() {
      return this.$('.options a.selected').data('src');
    },

    findBySrc: function(src) {
      return this.$('a[data-src="'+src+'"]');
    },

    setSelectedOption: function(content) {
      return this.$('.selected_option').html(content);
    },

    /**
     * Strictly performs open/close action on the dropdown
     */
    toggleOpenState: function(state) {
      if(state !== undefined) {
        this.open = state;
      } else {
        this.open = !this.open;
      }

      this.$el.toggleClass('open', this.open);
    },

    /**
     * Callback to open/close dropdown
     * Opens/closes dropdown, makes metric call
     */
    toggleOpen: function(e) {
      e.preventDefault();

      this.toggleOpenState();

      this.measureApp(this.open ? 'Open' : 'Close');
    },

    /**
     * Click callback when option is selected from an open dropdown
     * @param  {Event} e Standard Event object from a click action
     */
    selectOption: function(e) {
      e.preventDefault();

      var $t = $(e.currentTarget);
      if($t.index() !== this.selected) {
        this.options.callback.call(this.options.callback_context, $t.data('src'));
        this.trigger('select', $t.index());

        this.measureApp($t.html());
      }

      // close dropdown after selection without metrics call
      this.toggleOpenState(false);
    },

    /**
     * Perform actions needed when an option is determined to be
     * the selected option, whether from user interaction or as
     * the default option
     * @param {Number} index The 0-indexed position value of the selected option in the list
     */
    setOption: function(index) {
      this.selected = index;
      this.$selected = this.$('.options a:eq('+index+')');
      var sel_text = this.$selected.html();
      this.$selected_option.html(sel_text).toggleClass('toggle');

      this.$('.selected').removeClass('selected');
      this.$selected.addClass('selected');
    },

    measureApp: function() {
      var metrics_call = this.options.metrics.slice(0);
      for (var i = arguments.length - 1; i >= 0; i--) {
        metrics_call.push(arguments[i]);
      }
      Metrics.measureApp.apply(window, metrics_call);
    }

  });

  return PrimaryDropdown;
});
