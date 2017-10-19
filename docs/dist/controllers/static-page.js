define('controllers/static-page',['require','jquery','underscore','baseview','utils/browser','utils/video-player','utils/metrics','utils/common'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      BaseView = require('baseview'),
      Browser = require('utils/browser'),
      VideoPlayer = require('utils/video-player'),
      Metrics = require('utils/metrics'),
      Common = require('utils/common')
      ;

  var StaticPage = BaseView.extend({
    events: {
      'click .bodyVideo > a': 'videoPlayClick',
      'click .shop-promo-text a': 'metricsLinkClick',
      'click #milestones': 'openTimeline'
    },

    onInitialization: function() {
      BaseView.prototype.onInitialization.apply(this, arguments);
      this.listenTo(VideoPlayer, 'player:complete', this.onCompleteEvent);
      this.listenTo(VideoPlayer, 'player:play', this.onPlayEvent);
      this.listenTo(VideoPlayer, 'player:stop', this.onStopEvent);

      VideoPlayer.setSinglePlayerMode();

      if(Browser.app) {
        this.$el.addClass('lbwebview');
      }
    },

    processPageVars: function() {
      var pageDetails = this.jsonData.pageDetails;

      if(pageDetails && pageDetails.pageTitle !== undefined) {
        this.pageTitle = pageDetails.pageTitle;
      }
    },

    onRender: function() {
      BaseView.prototype.onRender.apply(this, arguments);
      this.unveilImages();
    },

    onDispose: function() {
      VideoPlayer.dispose();
    },

    videoPlayClick: function(ev) {
      var id = $(ev.target).closest('div[video-id]').attr('video-id');

      if(Browser.app) {
        if(Browser.apptype.ios) {
          Common.sendiOSMessage('video', id);
        } else if(Browser.apptype.android) {
          Common.sendAndroidMessage('video?id=' + id);
        }
      } else {
        // console.log("video: %o", this.jsonData.video );
        var video = _.find(this.jsonData.video, function(vid) {
          return vid.id === id;
        });
        VideoPlayer.loadVideo(video, id);
        Metrics.measureAppMediaLoad(Metrics.page_section, Metrics.video_action, video.title);
      }
    },

    onPlayEvent: function(data) {
      this.logger.info('onPlayEvent - data:%o', data);
    },

    onStopEvent: function(data) {
      this.logger.info('onStopEvent - data:%o', data);
    },

    onCompleteEvent: function(data) {
      this.logger.info('onCompleteEvent - data:%o', data);
    },

    unveilImages: function() {
        // unveil default photo/video images
      this.unveil(this.$('.containerPhoto, .containerVideo').find('img.srcpic'));
    },

    metricsLinkClick: function(e) {
      e.preventDefault();
      var url = e.currentTarget.href;

      Metrics.openExternal(url, 'newWindow');
      return false;
    },

    openTimeline: function(e) {
      return Common.openTimeline(e);
    }
  });

  return StaticPage;
});

