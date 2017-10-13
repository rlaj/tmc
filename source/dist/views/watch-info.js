define('views/watch-info',['require','backbone','jquery','utils/metrics'],function(require) {
  var Backbone = require('backbone'),
      $ = require('jquery'),
      Metrics = require('utils/metrics')
      ;

  var WatchInfo = Backbone.View.extend({
    el: '#infoContainer',

    events: {
      'click a.info': 'close'
    },

    isOpen: false,

    initialize: function(opts) {
      this.options = _.extend({}, opts);

      this.on('open', this.open, this);
      this.on('hide', this.hide, this);
      this.on('refresh', this.refresh, this);
    },

    onDispose: function() {
      this.card = undefined;
    },

    open: function(card) {
      this.card = card;
      if(!this.isOpen) {
        this.measureOpen();
        this.show();
      } else {
        this.close();
      }
    },

    close: function() {
      this.measureClose();

      this.hide();
    },

    measureOpen: function() {
      Metrics.measureApp(Metrics.page_section,'Channel Info',this.card.model.get('name'),'Open');
    },

    measureClose: function() {
      Metrics.measureApp(Metrics.page_section,'Channel Info',this.card.model.get('name'),'Close');
    },

    show: function() {
      this.card.$('a.info').addClass('open');
      this.card.$el.addClass('info-open');

      var clone = this.card.$('.infoWrapper').clone();
      this.$el.show();
      var container = this.$('.container').html(clone.html());
      this.unveil(container.find('img'));
      this.options.$filler.show();

      this.isOpen = true;
    },

    hide: function() {
      if(this.card) {
        this.card.$('a.info').removeClass('open');
        this.card.$el.removeClass('info-open');
      }

      this.$el.hide();
      this.clearUnveil();
      this.$('.container').empty();
      this.options.$filler.hide();

      this.isOpen = false;
    },

    refresh: function() {
      this.show();
    }
  });

  return WatchInfo;
});
