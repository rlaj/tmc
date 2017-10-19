define('controllers/watch-live',['require','jquery','underscore','backbone','baseview','utils/metrics','utils/browser','utils/common','utils/pubsub','utils/title-selector','collections/holes','utils/favorites','utils/geoblock','utils/video-player','utils/scroll-to-fade','utils/channel-controller','utils/scores-video','views/related-videos','views/watch-live-hole-players','views/watch-live-fg-players'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      BaseView = require('baseview'),
      Metrics = require('utils/metrics'),
      Browser = require('utils/browser'),
      Common = require('utils/common'),
      PubSub = require('utils/pubsub'),
      TitleSelector = require('utils/title-selector'),
      HoleInfo = require('collections/holes'),
      Favorites = require('utils/favorites'),
      Geo = require('utils/geoblock'),

      VideoPlayer = require('utils/video-player'),
      ScrollFade = require('utils/scroll-to-fade'),
      ChannelController = require('utils/channel-controller'),
      ScoresVideo = require('utils/scores-video'),
      RelatedVideos = require('views/related-videos'),
      LiveHolePlayersView = require('views/watch-live-hole-players'),
      LiveFeaturedGroupPlayersView = require('views/watch-live-fg-players')
      ;

  var WatchLiveView = BaseView.extend({
    events: {
      'click .media_promo a': 'mediaPromoClick'
    },
    cid: 'watchLiveView',

    related_id: 'live',

    geo_checked: false,

    initialize: function(html) {
      if(Geo.isLoaded()) {
        if(Geo.isBlocked()) {
          this.geoAction();
        }
      } else {
        Geo.checkAction = this.geoAction.bind(this);
      }

      BaseView.prototype.initialize.apply(this, [html]);

      Browser.checkMobileTabletDevice();

      this.logger = new eventsCore.util.Logger('WatchLiveView');
      Metrics.video_action = 'Live';

      // this.logger.info('initialize - link:%o mobile:%o', this.$('#welcome').find('.media_promo a'), Browser.mobiledevice);

      this.listenTo(PubSub, 'panel:open', this.onPanelOpen);
      this.listenTo(PubSub, 'panel:close', this.onPanelClose);
      this.listenTo(PubSub, 'panel:exit', this.onPanelExit);
      this.listenTo(PubSub, 'panel:live:disable', this.disableLiveVideo);

      // if improper channel code, redirect back to watch landing page
      this.channel = eventsCore.util.getUrlParam('videoChannel');
      if(this.channel === null) {
        this.continue_load = '/en_US/watch/index.html';
        return;
      }

      this.hero.$welcome.find('div.media_promo').attr('video-id', this.channel);

      this.cardsMap = {};
      this.playersByHole = {};

      this.loadPlayerSSI();
      this.updateChannelList();
      this.refreshChannels();

      if(this.channel_object) {
        this.processLoad();
      }

      // start listeners
      this.listenTo(PubSub, 'livevideo:reset', this.updateChannelList);
      this.listenTo(PubSub, 'livevideo:reset', this.refreshChannels);

      HoleInfo.fetch();
    },

    processPageVars: function() {
      // assign prop values based on page vars
      var ch = ChannelController.getChannel(eventsCore.util.getUrlParam('videoChannel'));
      var name = eventsCore.util.getUrlParam('videoChannel');
      if(ch) {
        name = ch.get('name');
      }
      this.props = {
        prop30: name
      };
    },

    onRender: function() {
      if(this.hero) {
        this.hero.titleSelector = new TitleSelector({
          el: this.$('#pageTitle'),
          max: 1,
          measure_key: ['Watch', 'Live', 'Channel Change']
        });

        // temporarily hiding old title selector until new one working
        // this.$('#pageTitle').hide();

        this.hero.render();
        this.hero.scrollFade = new ScrollFade().render();
      }

      // this.logger.info('onRender - title:%o', this.hero.titleSelector);

      this.listenTo(VideoPlayer, 'player:complete', this.onCompleteEvent);
      this.listenTo(VideoPlayer, 'player:play', this.onPlayEvent);
      this.listenTo(VideoPlayer, 'player:stop', this.onStopEvent);

      if(Common.internalRef()) {
        // NOTE: Don't think we need to hide this from mobile devices anymore as the
        // ECP player shows its own play button before video will start playing
        // if(!Browser.mobiledevice) {
          var id = this.$('.heroVideo').find('div.media_promo').attr('video-id');
          this.playHeroVideo(id);
        // } else {
        //   PubSub.trigger('video:resetHero');
        // }
      }
    },

    onDispose: function() {
      if(this.recommended) {
        this.recommended.dispose();
      }
      if(this.playerView) {
        this.playerView.dispose();
      }
    },

    geoAction: function() {
      if(this.geo_checked) {
        return;
      }
      if(Geo.isLoaded()) {
        if(Geo.isBlocked()) {
          this.continue_load = '/en_US/watch/index.html';
        }

        this.geo_checked = true;
      }
    },

    processLoad: function() {
      var img = this.hero.$welcome.find('.imageWrapper img');
      var imgpath = this.channel_object.get('imagePath');
      img.attr({
        'data-lower': imgpath,
        'data-medium': imgpath,
        'data-high': imgpath
      });
      this.unveil(img);

      if(!ChannelController.checkChannelStatus(this.channel)) {
        this.continue_load = '/en_US/watch/index.html';
      }

      Favorites.prefix = Metrics.page_section + ':' + this.channel_object.get('name');
    },

    mediaPromoClick: function(ev) {
      var id = $(ev.target).closest('div[video-id]').attr('video-id');

      // this.logger.info('mediaPromoClick - channels:%o video:%o', ChannelController.collection, this.video);
      this.playHeroVideo(id);

      Metrics.measureVideoPlayer(Metrics.page_section, Metrics.video_action, 'Push to start');
    },

    playHeroVideo: function(id) {
      if(ChannelController.collection.length === 0 || !this.video) {
        this.updateChannelList();
        this.refreshChannels();
      }

      this.hero.$welcome.has('div[video-id="' + id + '"]').addClass('dim');

      // stop listening for channel refreshes, hide title selector since it'll be covered by panel
      this.stopListening(PubSub, 'livevideo:reset', this.updateChannelList);
      this.hero.titleSelector.$el.css('visibility', 'hidden');

      if(this.video) {
        PubSub.trigger('throttle:resize');
        PubSub.trigger('video:playPanel', [this.video], this.channel);
      }      else {
        this.logger.info('mediaPromoClick - video not defined:%o', this.video);
      }
    },

    onPlayEvent: function(data) {
      // this.logger.info('onPlayEvent - data:%o', data);
      // stop listener
      this.stopListening(PubSub, 'livevideo:reset', this.updateChannelList);
    },

    onCompleteEvent: function(data) {
      // this.logger.info('onCompleteEvent - data:%o', data);

      this.hero.$welcome.has('div[id="' + data.id + '"]')
                .find('.related_banner')
                .show()
                .addClass('visible');
    },

    onStopEvent: function(data) {
      // this.logger.info('onStopEvent - data:%o', data);

      this.hero.$welcome.has('div[id="wrapper_' + data.id + '"]').removeClass('dim');
    },

    onPanelOpen: function(panel, adjust) {
      if(adjust && panel.videoData && panel.videoData.id === this.channel) {
        /*
        // make hero half height
        var $wrapper = this.hero.$('.imageWrapper');
        var $img = $wrapper.find('img');
        $wrapper.css('height', $img.height() / 2);
        this.hero.$el.addClass('half-height');
        this.hero.$welcome.addClass('dim panel');

        // update channels when user minimizes to panel
        this.updateChannelList();

        // start listener
        this.listenTo(PubSub, 'livevideo:reset', this.updateChannelList);

        // make title selector visible
        this.hero.titleSelector.$el.css('visibility', 'visible');

        // attach resizing listeners
        this.listenTo(PubSub, 'ratio:resize', this.halfHeightResize);
        */

        // redirect user to watch landing page
        Backbone.history.navigate('/en_US/watch/index.html', { trigger: true });
      }
    },

    onPanelClose: function(panel) {
      if(panel.videoData && panel.videoData.id === this.channel) {
        var $wrapper = this.hero.$('.imageWrapper');
        $wrapper.css('height', '');
        this.hero.$el.removeClass('half-height');
        this.hero.$welcome.removeClass('panel');

        this.stopListening(PubSub, 'ratio:resize', this.halfHeightResize);

        // stop listening for channel refreshes, hide title selector since it'll be covered by panel
        this.stopListening(PubSub, 'livevideo:reset', this.updateChannelList);
        this.hero.titleSelector.$el.css('visibility', 'hidden');
      }
    },

    onPanelExit: function(panel) {
      if(panel.videoData && panel.videoData.id === this.channel) {
        this.onPanelClose(panel);

        this.hero.$welcome.removeClass('dim');

        // update channels when user minimizes to panel
        this.updateChannelList();

        // start listener
        this.listenTo(PubSub, 'livevideo:reset', this.updateChannelList);

        // make title selector visible
        this.hero.titleSelector.$el.css('visibility', 'visible');
      }
    },

    halfHeightResize: function(el, w, h) {
      // var h = $(el).height();
      this.hero.$('.imageWrapper').css('height', h / 2);
    },

    loadPlayerSSI: function() {
      if(_.indexOf(['ac', '1516', 'fg1', 'fg2'], this.channel) > -1) {
        this.refreshPlayers();
        this.listenTo(PubSub, 'scores:refresh', this.refreshPlayers);

        this.$('#livePlayerContent').load('/en_US/includes/man/watch/live_players_' + this.channel + '.ssi', function(html) {
          if(this.channel.indexOf('fg') === -1) {
            this.playerView = new LiveHolePlayersView({
              el: this.$('#livePlayerContent'),
              channelId: this.channel
            }).render();
          } else {
            this.playerView = new LiveFeaturedGroupPlayersView({
              el: this.$('#livePlayerContent'),
              channelId: this.channel
            }).render();
          }
        }.bind(this));
      }
    },

    updateChannelList: function() {
      // update channel selector
      var page = this.$('#pageSelector');
      var list = page.find('.option_wrapper ul');
      var list_html = [];
      ChannelController.collection.forEach(function(channel, index, collection) {
        var channel_html = '';
        if(channel.get('live')) {
          channel_html = $('<a href="/en_US/watch/live.html?videoChannel=' + channel.get('channelId') + '&changer">' + channel.get('name') + '</a>');
        }

        var klass = '';
        if(channel.get('channelId') === this.channel) {
          var sel_channel = $('<a href="#">' + channel.get('name') + '</a>');

          klass = 'selected';
          var sel = page.find('.selector');
          if(sel.find('a').hasClass('open')) {
            sel_channel.addClass('open');
          }
          sel.html(sel_channel);
        }

        if(channel.get('live') && channel.get('channelId') !== 'radio') {
          list_html.push($('<li class="' + klass + '"></li>').append(channel_html));
        }
      }.bind(this));

      // if all channels off air
      if(list_html.length === 0) {
        list_html = ['<li class="disabled">All Channels Off Air</li>'];
      }
      list.html(list_html);
    },

    refreshChannels: function() {
      if(this.channel.indexOf('fg') > -1) {
        ScoresVideo.assignFeaturedGroupPlayers();
      }

      // set up video object
      this.channel_object = ChannelController.getChannel(this.channel);

      if(this.channel_object) {
        // this.logger.info('refreshChannels - channel:%o obj:%o', this.channel, this.channel_object);

        this.video = ChannelController.getVideoObject(this.channel);
      }

      // check if video is on air
      var onair = ChannelController.checkChannelStatus(this.channel);
      if(onair) {
        this.enableLiveVideo();
      }
      // disabled state handled via event from panel 'panel:live:disable'

      // if on same channel and video is in panel, or video not activated
      if(!onair && (this.hero.$welcome.hasClass('panel') || !this.hero.$welcome.hasClass('dim'))) {
        this.disableLiveVideo();
      }

      // examine related content
      // TODO: Does this need to update as players pass through the channel??
      if(this.channel_object && this.related_url !== this.channel_object.get('relatedContent')) {
        this.related_url = this.channel_object.get('relatedContent');
        this.loadRelatedContent();
      }
    },

    enableLiveVideo: function() {
      if(!this.hero.$welcome.hasClass('hasVideo')) {
        this.$('#livePlayerContent').show();
        this.hero.$welcome.addClass('hasVideo')
          .find('.label').show().removeClass('offair').addClass('live').html('Live');

        clearTimeout(this.timeoutId);
      }
    },

    disableLiveVideo: function(panel) {
      if(this.hero.$welcome.hasClass('hasVideo')) {
        // since channel goes off air after it's been playing
        // wait 60s before redirecting user back to watch landing page
        this.timeoutId = setTimeout(function() {
          Backbone.history.navigate('/en_US/watch/index.html', true);
        }, 60000);

        this.$('#livePlayerContent').hide();
        this.hero.$welcome.removeClass('hasVideo');
      }
      this.hero.$welcome.find('.label').show().removeClass('live').addClass('offair').html('Off Air');
    },

    refreshPlayers: function() {
      if(_.indexOf(['ac', '1516'], this.channel) > -1) {
        ScoresVideo.parsePlayersByChannel();
      } else if(this.channel.indexOf('fg') > -1) {
        ScoresVideo.assignFeaturedGroupPlayers();
      }
    },

    loadRelatedContent: function() {
      if(ChannelController.collection.length === 0) {
        PubSub.off('livevideo:reset', this.loadRelatedContent, this)
                .once('livevideo:reset', this.loadRelatedContent, this);
      } else {
        var type = 'url';
        var is_hole_channel = false;
        var is_player_channel = false;
        var has_players = false;
        if(this.related_url === '') {
          // calculate based on players showing
          switch(this.channel) {
            case 'ac':
            case '1516':
              var holes = ScoresVideo.holeChannels[this.channel];
              var players = [];
              $.each(holes, function(key, hole) {
                players.push(hole.players);
              });
              players = _.flatten(players);
              this.related_id = players;
              is_hole_channel = true;
              has_players = players.length > 0 ? true : false;
              break;
            case 'fg1':
            case 'fg2':
              var players = ScoresVideo.groupChannels[this.channel].players;
              this.related_id = players;
              is_player_channel = true;
              has_players = players.length > 0 ? true : false;
              break;
            default: break;
          }
          type = 'live';
        }
        if(this.related_id !== undefined && this.related_id !== '' && this.related_id.length > 0) {
          this.$('#recHeader, #recContent').show();
          this.recommended = new RelatedVideos({
            el: this.$('section.body'),
            type: type,
            related_id: this.related_id,
            url: this.related_url
          }).render();
        } else {
          this.$('#recHeader, #recContent').hide();

          // if no players to check for, make sure it wasn't because we hadn't processed them yet
          if(is_hole_channel && !has_players) {
            ScoresVideo.once('holeplayers:refresh', this.loadRelatedContent, this);
          } else if(is_player_channel && !has_players) {
            ScoresVideo.once('featuredplayers:refresh', this.loadRelatedContent, this);
          }
        }
      }
    }

  });

  return WatchLiveView;
});

