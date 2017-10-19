define('utils/title-selector',['require','backbone','utils/common','utils/pubsub','utils/title-list'],function(require) {
  var Backbone = require('backbone'),
      Common = require('utils/common'),
      PubSub = require('utils/pubsub'),
      TitleList = require('utils/title-list')
      ;

  var TitleSelector = Backbone.View.extend({
    el: '#pageTitle',

    events: {},

    height: 0,

    initialize: function(opts) {
      this.listenTo(PubSub, 'windowsize:global:exit', this.setHeight);
      this.listenTo(PubSub, 'windowsize:global:enter', this.setHeight);

      var title_options = _.extend({}, opts, {el: this.$('#pageSelector')});
      this.multicol = new TitleList(title_options);

      this.listenTo(this.multicol, 'list:open', this.triggerOpen);
      this.listenTo(this.multicol, 'list:close', this.triggerClose);
    },

    render: function() {
      this.setHeight();
    },

    onDispose: function() {

    },

    setHeight: function() {
      this.height = this.$el.outerHeight();
    },

    setNav: function(nav) {
      this.multicol.setNav(nav);
    },

    triggerOpen: function() {
      this.trigger('list:open');
    },

    triggerClose: function() {
      this.trigger('list:close');
    }
  });

  return TitleSelector;
});
