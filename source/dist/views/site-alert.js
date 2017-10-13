define('views/site-alert',['require','backbone','jquery','utils/pubsub','utils/common'],function(require) {
  var Backbone = require('backbone'),
      $ = require('jquery'),
      PubSub = require('utils/pubsub'),
      Common = require('utils/common')
      ;

  var SiteAlert = Backbone.View.extend({
    id: 'alert',
    className: 'alert_bar',

    on: false,

    // path: '/en_US/xml/man/alerts.json',
    path: '/en_US/xml/gen/alerts.json',

    interval: 60, // seconds
    height: 40,

    initialize: function(opts) {
      this.options = _.extend({}, opts);
      setInterval(this.render.bind(this), this.interval * 1000);

      Common.alert = this;
    },

    render: function() {
      var alert = this;
      $.getJSON(this.path, function(data) {
        if(data.active && !alert.on) {
          alert.create(data);
        } else if(!data.active && alert.on) {
          alert.dispose();
        } else if(data.active && alert.on) {
          alert.update(data);
        }
      });

      return this;
    },

    create: function(data) {
      this.on = true;
      this.update(data, this.$el);
      this.options.menu.$el.after(this.$el);

      this.height = this.$el.outerHeight();
      $('html').addClass('alert');

      PubSub.trigger('throttle:resize');

      this.listenTo(PubSub, 'throttle:resize', function() {
        this.height = this.$el.outerHeight();

        // explicitly trigger in case alert text wraps
        PubSub.trigger('hero:resize');
      });
    },

    onDispose: function() {
      this.on = false;
      $('html').removeClass('alert');

      PubSub.trigger('throttle:resize');
    },

    update: function(data, div) {
      if(div === undefined) {
        div = this.$el;
      }
      var html = data.text;
      if(data.link !== '') {
        html += ' &nbsp; <a href="' + data.link + '">Read More</a>';
      }
      div.html(html);
    }

  });

  return SiteAlert;
});

