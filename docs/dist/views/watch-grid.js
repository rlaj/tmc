define('views/watch-grid',['require','jquery','backbone','text!templates/watch-grid-item.html!strip','utils/pubsub','utils/channel-controller'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      gridItem = require('text!templates/watch-grid-item.html!strip'),
      PubSub = require('utils/pubsub'),
      ChannelController = require('utils/channel-controller')
  ;

  var WatchGridItem = Backbone.View.extend({
    tagName: 'div',
    class: 'channel',

    events: {
      'click a.radio': 'launchRadio'
    },

    template: _.template(gridItem),
    link_template: '<a href="/en_US/watch/live.html?videoChannel=<%= id %>">',

    initialize: function(opts) {
      this.options = _.extend({}, opts);
      this.link_template = _.template(this.options.link_template);

      this.count = opts.count;
      this.liveClass = 'offair';
      this.statusText = 'Off Air';
      if(this.model.get('live')) {
        this.liveClass = 'live';
        this.statusText = 'Live';
        if(this.model.id === 'radio') {
          this.statusText = 'On Air';
        }
      }

      this.klass = '';
      if(this.count < 3) {
        this.klass += ' top';
      }
      if(this.count%3 === 2) {
        this.klass += ' right';
      }
    },

    render: function() {
      var html = this.template({
        obj: this.model.attributes,
        klass: this.klass,
        link: this.link_template({id: this.model.id}),
        liveClass: this.liveClass,
        statusText: this.statusText
      });

      this.setElement(html);

      return this;
    },

    launchRadio: function(e) {
      e.preventDefault();
      PubSub.trigger('radio:launch');
    }
  });

  var WatchGrid = Backbone.View.extend({
    el: '#grid_schedule',

    initialize: function(opts) {
      this.options = _.extend({}, opts);

      this.on('desktop:show', this.unveilImages, this);
      this.on('refresh', this.refresh, this);
    },

    render: function() {
      this.populateGrid();
    },

    onDispose: function() {
      this.cards.forEach(function(card) {
        card.dispose();
      });
    },

    refresh: function() {
      this.populateGrid();
    },

    unveilImages: function() {
      this.clearUnveil();

      var imgs = this.$('img');
      this.unveil(imgs);
    },

    populateGrid: function() {
      var objs = this.populateItems();

      // update carousel channels
      this.$el.html(objs);
      this.unveilImages();
    },

    populateItems: function() {
      this.cards = [];
      var html = [];
      ChannelController.collection.forEach(function(channel, index, collection) {
        var item = new WatchGridItem({model: channel, count: index, link_template: this.options.link_template});
        this.cards.push(item.render());
        html.push(item.$el);
      }.bind(this));

      return html;
    }
  });

  return WatchGrid;
});
