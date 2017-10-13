define('views/track/live-video',['require','backbone','utils/metrics','utils/pubsub','utils/channel-controller','utils/common','utils/geoblock','settings','collections/track/players','utils/track/track'],function(require) {
  var Backbone = require('backbone'),
      Metrics = require('utils/metrics'),
      PubSub = require('utils/pubsub'),
      ChannelController = require('utils/channel-controller'),
      Common = require('utils/common'),
      Geo = require('utils/geoblock'),
      Settings = require('settings'),

      Players = require('collections/track/players'),
      TrackUtils = require('utils/track/track')
      ;

  var TrackLiveVideo = Backbone.View.extend({
    el: '.video',

    events: {
      'click': 'toggle'
    },

    video_open: false,

    initialize: function() {
      this.listenTo(PubSub, 'livevideo:reset', this.update);

      this.listenTo(PubSub, 'panel:open', this.setPanelOpen);
      this.listenTo(PubSub, 'panel:exit', this.setPanelClosed);

      this.on('panel:open', this.showOption);
      this.on('panel:closed', this.hideOption);

      if(this.checkPanelIsLiveVideo()) {
        this.video_open = true;
        this.showOption();
      }

      if(ChannelController.collection) {
        this.update();
      }
    },

    render: function() {

    },

    onDispose: function() {

    },

    checkPanelIsLiveVideo: function() {
      var panel = Common.video_panel;
      return Common.video_panel_float &&
        ((panel.panel1.state() === 'floatVideo' && !panel.panel1.videoVod) ||
         (panel.panel2.state() === 'floatVideo' && !panel.panel2.videoVod));
    },

    setPanelOpen: function(panel) {
      if(!panel.videoVod) {
        this.video_open = true;
        this.trigger('panel:open');
      }
    },

    setPanelClosed: function(panel) {
      if(!panel.videoVod) {
        this.video_open = false;
        this.trigger('panel:closed');
      }
    },

    toggle: function() {
      // TODO
      if(this.video_open) {
        this.hide();
        Metrics.trackS({
          prop57: 'Live Panel Off',
          eVar57: 'Live Panel Off'
        });
        TrackUtils.measure('Live', 'Live Panel Off');
      } else {
        this.show();
        Metrics.trackS({
          prop57: 'Live Panel On',
          eVar57: 'Live Panel On'
        });
        TrackUtils.measure('Live', 'Live Panel On');
      }
    },

    show: function() {
      // open live video panel
      this.video = ChannelController.getVideoObject(this.channel.id);
      if(this.video) {
        PubSub.trigger('video:playPanel', [this.video], this.channel.id, {
          floated: true
        });

        this.showOption();
        this.video_open = true;
      }
    },

    hide: function() {
      // close panel
      PubSub.trigger('video:exitPanel');

      this.hideOption();
      this.video_open = false;
    },

    showOption: function() {
      this.$el.addClass('selected');
    },

    hideOption: function() {
      this.$el.removeClass('selected');
    },

    update: function() {
      this.channel = this.getDefaultChannel();
      this.updateChannel();
    },

    getDefaultChannel: function() {
      var player = Players.getPlayer();
      if(player) {
        var has_live = (player.get('score_data') !== undefined) ? player.get('score_data').get('live') : "0";
        var channelObj = "";

        if (!Geo.isBlocked()) {
          if (has_live !== "0" && ChannelController.checkChannelStatus(has_live)) {
            channelObj = ChannelController.getChannel(has_live);
          } else if(ChannelController.checkChannelStatus(Settings.default_broadcast_channel)) {
            channelObj = ChannelController.getChannel(Settings.default_broadcast_channel);
          }
        }

        if(channelObj !== '') {
          Metrics.trackS({
            prop30: channelObj.get('name')
          });
        }

        return channelObj;
      }
      return '';
    },

    updateChannel: function() {
      var onair = this.channel !== '';

      if (onair) {
        this.$el.addClass('active');
        this.$el.find('.title').html(this.channel.get('name'));
      } else {
        this.$el.removeClass('active');
        this.$el.find('.title').html('Live Video');
      }
    }
  });

  return TrackLiveVideo;
});

