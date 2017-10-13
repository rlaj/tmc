define('views/notifications',['require','backbone','jquery','underscore','utils/metrics','text!templates/notifications.html!strip','jquery.cookie'],function(require) {
  var Backbone = require('backbone'),
      $ = require('jquery'),
      _ = require('underscore'),
      Metrics = require('utils/metrics'),
      notificationTemplate = require('text!templates/notifications.html!strip')
      ;

  require('jquery.cookie');

  var Notifications = Backbone.View.extend({
    el: '#notifications',

    currentID: '',
    dismiss: false,

    // path: '/en_US/xml/man/notifications.json',

    path: '/en_US/xml/gen/notifications.json',

    interval: 15, // seconds - pull notifications

    template: _.template(notificationTemplate),


    events: {
      'click .close': 'close'
    },

    initialize: function(opts) {
      this.options = _.extend({
        metrics_name: 'Notifications'
      }, opts);
    },

    onDispose: function() {
      this.$el.addClass('hide');
    },

    render: function() {
      // wait 2s before starting first lookup
      setTimeout(function() {
        this.refreshNotify();
        var intervalTime = this.interval * 1000;
        setInterval(this.refreshNotify.bind(this), intervalTime);
      }.bind(this), 2000);

      return this;
    },

    refreshNotify: function() {
      var notifications = this;

      $.getJSON(this.path, function(data) {
        notifications.currentID = data.id;
        var cookieID = $.cookie('notifyID');

        if(data.active) {
          if(data.id !== cookieID) {
            if(!notifications.timer) {
              notifications.create(data);
            }
          } else {
            notifications.dismissNotify();
          }
        } else {
          notifications.dismissNotify();
        }
      });
    },

    create: function(data) {
      this.dismiss = false;
      this.update(data);
      this.$el.removeClass('hide').addClass('visible');
      this.hideNotify();
    },

    update: function(data) {
      var html = '';

      html = this.template({
        title: data.title,
        content: data.content,
        channel: data.channel,
        link_title: data.link_title,
        link_type: data.link_type
      });

      if(data.url && data.url !== '') {
        html = '<a href="' + data.url + '?promo=notification">' + html + '</a>';
      }

      this.$('.message').html(html);
    },

    close: function(e) {
      e.preventDefault();
      this.closeNotify();

      Metrics.measureApp(this.options.metrics_name, 'Close Notification');
    },

    dismissNotify: function() {
      if(!this.dismiss) {
        this.dismiss = true;
        clearTimeout(this.timeoutID);

        // remove visible class (and thus, direction)
        this.$el.removeClass('visible');

        // wait briefly before attaching close class to trigger that animation
        setTimeout(function() {
          this.$el.addClass('close');
        }.bind(this), 25);

        // after close animation has completed, hide notification altogether
        // the timeout here must match the CSS animation duration + the brief
        // wait before the close animation is begun
        setTimeout(function() {
          this.$el.removeClass().addClass('hide');
        }.bind(this), 500 + 25);
      }
    },

    closeNotify: function() {
      this.dismissNotify();
      this.timer = false;

      // set cookie here
      $.cookie('notifyID', this.currentID, {path: '/en_US/', expires: 365});
    },

    hideNotify: function() {
      this.timer = true;
      this.timeoutID = setTimeout(function() {
        this.closeNotify();
      }.bind(this), 60000);
    }

  });

  return Notifications;
});

