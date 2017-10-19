define('controllers/watch-vod',['require','jquery','underscore','backbone','baseview','utils/metrics','utils/pubsub','utils/browser','utils/window-size','utils/common','utils/video-player','utils/scroll-to-fade','views/related-videos','views/related-next-video'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      BaseView = require('baseview'),
      Metrics = require('utils/metrics'),
      PubSub = require('utils/pubsub'),
      Browser = require('utils/browser'),
      Win = require('utils/window-size'),
      Common = require('utils/common'),
      VideoPlayer = require('utils/video-player'),
      ScrollFade = require('utils/scroll-to-fade'),
      RelatedVideos = require('views/related-videos'),
      RelatedNextVideo = require('views/related-next-video')
      ;


  var WatchVodView = BaseView.extend({
    events: {
      'click .media_promo a': 'mediaPromoClick'
    },

    initialize: function(html) {
      BaseView.prototype.initialize.apply(this, [html]);

      Browser.checkMobileTabletDevice();
      Metrics.video_action = 'VOD';

      this.next_video = new RelatedNextVideo({
        el: this.$('#nextVideo')
      });

      this.listenTo(PubSub, 'panel:open', this.onPanelOpen);
      this.listenTo(PubSub, 'panel:close', this.onPanelClose);
      this.listenTo(PubSub, 'panel:exit', this.onPanelExit);

      this.logger = new eventsCore.util.Logger('WatchVodView');
      this.logger.info('initialize - link:%o mobile:%o', this.$('#welcome').find('.media_promo a'), Browser.mobiledevice);
    },

    processPageVars: function() {
      var pageDetails = this.jsonData.pageDetails;

            // encodeURIComponent the following values
      var encodeKeys = ['pageId', 'pageTitle2', 'pageAbstr'];
      for(var i = encodeKeys.length - 1; i >= 0; i--) {
        var k = encodeKeys[i];

        pageDetails[k] = encodeURIComponent(pageDetails[k]);
      }

      // assign prop values based on page vars
      var metrics = this.jsonData.metrics;
      this.props = {
        prop4: 'Video',
        prop17: 'VOD' + ':' + metrics.prop33,
        prop21: metrics.prop21,
        prop33: metrics.prop33
      };

      this.related_id = this.jsonData.related_id;
      this.video = this.jsonData.video[0];

      // force all VOD page titles to be [contentType]:VOD Detail
      this.pageTitle = this.video.contentType + ':VOD Detail';

      if(this.video.contentType === 'leaderboard') {
        _.extend(this.props, {
          prop35: metrics.prop35,
          prop22: metrics.prop22
        });
      } else if(this.video.contentType === 'shot_highlight') {
        _.extend(this.props, {
          prop43: metrics.prop43,
          prop22: metrics.prop22
        });
      }
    },

    onRender: function() {
      this.logger.info('onRender - hero:%o', this.hero);

      if(this.hero) {
        this.hero.titleSelector = {
          height: 50
        };

        this.hero.render();
        this.hero.scrollFade = new ScrollFade().render();
      }
      this.logger.info('onRender - title:%o', this.hero.titleSelector);

      this.listenTo(VideoPlayer, 'player:complete', this.onCompleteEvent);
      this.listenTo(VideoPlayer, 'player:play', this.onPlayEvent);
      this.listenTo(VideoPlayer, 'player:stop', this.onStopEvent);
      this.listenTo(VideoPlayer, 'player:controls', this.onControlsEvent);

      this.loadRelatedContent();

            // Re-enable auto-play
      if(Common.internalRef()) {
        var id = this.$('.heroVideo').find('div.media_promo').attr('video-id');
        this.playHeroVideo(id);
      }

      if(!Browser.mobiledevice) {
                // this.mediaPromoClick();
      }
    },

    onDispose: function() {
      VideoPlayer.dispose();
      if(this.recommended) {
        this.recommended.dispose();
      }
    },

    mediaPromoClick: function(ev) {
      var id = $(ev.target).closest('div[video-id]').attr('video-id');
      this.playHeroVideo(id);

      Metrics.measureVideoPlayer(Metrics.page_section, Metrics.video_action, 'Push to start');
    },

    playHeroVideo: function(id) {
      VideoPlayer.setSinglePlayerMode();
      var video = _.find(this.jsonData.video, function(vid) {
        return vid.id === id;
      });

      //force allowing panel button if vod video
      video['panelButton'] = 'video_vod';
      this.logger.info('playHeroVideo - id:%o video:%o', id, video);

      if(video) {
        PubSub.trigger('throttle:resize');
        PubSub.trigger('video:playPanel', [video], video.id, {
          vod: true
        });
      }
      else {
        this.logger.info('mediaPromoClick - video not defined:%o', this.video);
      }

      //VideoPlayer.loadVideo(video, id);
      this.$('.heroVideo').has('div[id="wrapper_' + id + '"]').addClass('dim');
    },

    onPlayEvent: function(data) {
      this.logger.info('onPlayEvent - data:%o', data);

      this.next_video.trigger('hide');
    },

    onCompleteEvent: function(data) {
      this.logger.info('onCompleteEvent - data:%o', data);

      // check if the video that just completed is actually the heroVideo
      if(data.id && Common.video_panel[data.id].state() === 'heroVideo') {
        // check if not in mobile size
        if(Win.size() !== Win.sizes.global) {
          // if so, reset the hero so the next video banner will be visible
          PubSub.trigger('video:resetHero');
        }

        // show next banner only if completed video was in the hero
        this.next_video.trigger('show');
        this.next_video.trigger('played');
      }

      // only reset VOD if floated VOD is the same as the main VOD on the page
      var panel = data.id && Common.video_panel[data.id];
      if(panel && panel.state() === 'floatVideo' && panel.channelId() === this.video.id) {
        PubSub.trigger('video:resetVod');

        // show next banner only if on same video page as completed float video
        this.next_video.trigger('show');
        this.next_video.trigger('played');
      }
    },

    onStopEvent: function(data) {
      this.logger.info('onStopEvent - data:%o', data);

      this.$('.heroVideo').has('div[id="wrapper_' + data.id + '"]').removeClass('dim');
    },

    onControlsEvent: function(data) {
      this.logger.info('onControlsEvent - data:%o', data);
    },

    onPanelOpen: function(panel, adjust) {
      if(panel.videoVod && panel.videoData.id === this.video.id) {
        this.logger.info('onPanelOpen - adjust:%o', adjust);
        if(adjust) {
          /*
          // make hero half height
          var $wrapper = this.hero.$('.imageWrapper');
          var $img = $wrapper.find('img');
          $wrapper.css('height', $img.height() / 2);
          this.hero.$el.addClass('half-height');
          this.hero.$welcome.addClass('dim panel');
          */

          // redirect user to watch landing page
          Backbone.history.navigate('/en_US/watch/index.html', { trigger: true });
        }
      }
    },

    onPanelClose: function(panel) {
      if(panel.videoVod && panel.videoData.id === this.video.id) {
        var $wrapper = this.hero.$('.imageWrapper');
        $wrapper.css('height', '');
        this.hero.$el.removeClass('half-height');
        this.hero.$welcome.removeClass('panel');
      }
    },

    onPanelExit: function(panel) {
      if(panel.videoVod && panel.videoData.id === this.video.id) {
        this.onPanelClose(panel);

        this.hero.$welcome.removeClass('dim');
      }
    },

    loadRelatedContent: function() {
      if(this.related_id && this.related_id !== '') {
                // assume the first (and only) object in video array is the VOD in question
        var contentType = this.video.contentType;
        var related_type = 'vod';
        if(contentType === 'leaderboard') {
          related_type = 'highlight';
        } else if(contentType === 'shot_highlight') {
          related_type = 'shot_highlight';
        } else if(contentType === 'replay') {
          related_type = 'replay';
        }
        this.recommended = new RelatedVideos({
          el: this.$('section.body'),
          type: related_type,
          video: this.video,
          related_id: this.related_id
        }).render();

        this.listenTo(this.recommended, 'nextvideo', this.setNextVideo);
      } else {
                // hide Recommended Content area
        this.$('#recHeader, #recContent').hide();
      }
    },

    setNextVideo: function(video) {
      this.next_video.setVideo(video);
    }

  });


  return WatchVodView;
});

