define('controllers/hole-detail',['require','jquery','underscore','backbone','baseview','utils/metrics','utils/common','settings','utils/scores','models/hole','collections/holes','models/panorama','collections/panoramas','utils/panoramas','views/panorama-carousel','views/photo-carousel','text!templates/hole-story.html!strip','text!templates/hole-info.html!strip','text!templates/hole-video.html!strip','text!templates/hole-footer.html!strip','utils/video-player','utils/title-selector','utils/gallery','utils/channel-controller','utils/geoblock','utils/pubsub'],function(require) {
  	var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      BaseView = require('baseview'),
      Metrics = require('utils/metrics'),
      Common = require('utils/common'),
      Settings = require('settings'),
      Scores = require('utils/scores'),
      Hole = require('models/hole'),
      Holes = require('collections/holes'),
      Panorama = require('models/panorama'),
      Panoramas = require('collections/panoramas'),
      PanoUtil = require('utils/panoramas'),
      PanoCarousel = require('views/panorama-carousel'),
      PhotoCarousel = require('views/photo-carousel'),
      holeStoryTemplate = require('text!templates/hole-story.html!strip'),
      holeInfoTemplate = require('text!templates/hole-info.html!strip'),
      holeVideoTemplate = require('text!templates/hole-video.html!strip'),
      holeFooterTemplate = require('text!templates/hole-footer.html!strip'),
      VideoPlayer = require('utils/video-player'),
      TitleSelector = require('utils/title-selector'),
      HeroGallery = require('utils/gallery'),
      ChannelController = require('utils/channel-controller'),
      Geo = require('utils/geoblock'),
      PubSub = require('utils/pubsub')
      ;

  var JST = {};

    // page selector template
  JST.page_selector = _.template(
      '<div class="selector"><a href="/en_US/course/hole<%= hole %>.html">HOLE NO. <%= hole %></a></div>'
    );

  JST.hole_stats = _.template(
      '<div class="border_info extra_border_padding">'
          + 'Historical Avg: <%= hist_avg %></div>'
          + '<div class="border_info extra_border_padding">Low Year: '
          + '<%= low_avg %></div>'
          + '<div class="border_info">High Year: <%= high_avg %></div>'
    );

  var HoleDetailView = BaseView.extend({
    events: {
      'click .bodyVideo > a': 'videoPlayClick'
    },

    story_content_tmpl: _.template(holeStoryTemplate),
    hole_info_tmpl: _.template(holeInfoTemplate),
    video_content_tmpl: _.template(holeVideoTemplate),
    footer_tmpl: _.template(holeFooterTemplate),

    carousels: [],

    onInitialization: function() {
      BaseView.prototype.onInitialization.apply(this, arguments);
      this.listenTo(VideoPlayer, 'player:complete', this.onCompleteEvent);
      this.listenTo(VideoPlayer, 'player:play', this.onPlayEvent);
      this.listenTo(VideoPlayer, 'player:stop', this.onStopEvent);
      this.listenTo(PubSub, 'livevideo:reset', this.loadChannel);
      this.titleSelector = new TitleSelector({
        el: this.$('#pageTitle'),
        max: 1,
        measure_key: ['Course', 'Hole Info Details']
      });

      VideoPlayer.setSinglePlayerMode();
    },

    onRender: function() {
      Holes.fetch({
        success: function() {
            // get Hole from Holes collection
          this.model = Holes.get(this.jsonData.hole);

            // assign specific hole detail JSON file
          this.model.url = '/en_US/xml/man/course/hole' + this.model.id + '.json';

          this.loadPageComponents();
        }.bind(this)
      });
      this.titleSelector.render();
    },

    processPageVars: function() {
      this.pageTitle = '' + this.jsonData.hole;
    },

    loadPageComponents: function() {
        // populate Hole with new data
      this.model.fetch({
        success: function(model, response, options) {
          this.loadHeroGallery();
          this.loadHole();
          this.loadStats();
          this.loadPhotoCarousel();
          this.populateVideo();
          this.loadChannel();
        }.bind(this)
      });

        // check if hole already has 360s fetched
      if(Holes.panos_fetched) {
        this.load360s();
      } else {
        this.load360Data();
      }
    },

    onDispose: function() {
      VideoPlayer.dispose();
      this.titleSelector.dispose();
      this.hero_gallery.dispose();

      for(var i = 0, l = this.carousels.length; i < l; i++) {
        this.carousels[i].dispose();
      }
    },

    loadHeroGallery: function() {
      this.gallery_path = '/en_US/xml/gen/course/hero_gallery/hole' + this.model.get('number') + '.json';
      this.hero_gallery = new HeroGallery({
        path: this.gallery_path,
        hole_number: this.model.id,
        title: this.titleSelector
      }).render();
    },

    loadHole: function() {
        // hole page selector
      var page_select_html = JST.page_selector({
        hole: this.model.get('number')
      });
      this.$('#holeSelector').html(page_select_html);

        // load hole details
      var hole_info_html = this.hole_info_tmpl({
        hole_number: this.model.get('number'),
        plant_name: this.model.get('plant'),
        par: this.model.get('par'),
        yds: this.model.get('yds')
      });
      this.$('#holeDetails').html(hole_info_html);

        // load story content
      var hole_content_html = this.story_content_tmpl({
        desc: this.model.get('holeDesc'),
        text: this.model.get('hist'),
        plant_image: '/images/course/P_hole' + this.model.get('number') + '.jpg',
        plant_text: this.model.get('plantText')
      });
      this.$('#courseStory').html(hole_content_html);

        // load footer
      this.hole_number = this.model.get('number');
      if(this.hole_number == 1) {
        var prev_hole = 18;
      } else {
        var prev_hole = parseInt(this.hole_number) - 1;
      }

      if(this.hole_number == 18) {
        var next_hole = 1;
      } else {
        var next_hole = parseInt(this.hole_number) + 1;
      }

      var footer_html = this.footer_tmpl({
        prev: prev_hole,
        next: next_hole
      });
      this.$('#footer_nav').html(footer_html);
    },

    loadStats: function() {
      if(Settings.Scores.pre) {
        this.$('.pretour').show();
      } else {
        this.$('.pretour').hide();
      }

      if(Settings.Scores.live || Settings.Scores.post) {
        this.$('.midtour').show();
      } else {
        this.$('.midtour').hide();
      }

        // hole stats
      var hole_stats_html = JST.hole_stats({
        hist_avg: this.model.get('cumAvSrks'),
        low_avg: this.model.get('lowAvStks'),
        high_avg: this.model.get('highAvStks')
      });
      this.$('.hole_stats').html(hole_stats_html);
    },

      // load photos
    loadPhotoCarousel: function() {
      var hole_photos = '/en_US/xml/gen/course/action_gallery/h' + this.model.get('number') + '.json';
      var photoCarousel = new PhotoCarousel({
        el: this.$('.articleCarousel.photoCarousel'),
        article_photos: hole_photos,
        metrics_keys: {
          photo: 'Bottom Gallery'
        }
      }).render();
      this.carousels.push(photoCarousel);
    },

      // load video player
    populateVideo: function() {
      var videoID = 'video_body_' + this.model.get('number');
      var videoTitle = 'Hole ' + this.model.get('number') + ' Flyover';

          // create video object
      this.videoObj = {
        'id': videoID,
        'type': 'vod',
        'title': videoTitle,
        'contentType': 'Flyover',
        'pictureL': this.model.get('videothumb'),
        'pictureM': '',
        'pictureH': this.model.get('videoslate'),
        'wwwdash': '',
        'wwwhlshigh': '',
        'pdl': this.model.get('highlink'),
            // 'pdlmed':this.model.get('mediumlink'),
            // "pdllow":this.model.get('lowlink'),
        'link': '/en_US/course/hole' + this.model.get('number') + '.html',
        'length': '',
        'description': this.model.get('vText')
      };

          // console.log("videoObj-->%o", this.videoObj );

      var hole_video_html = this.video_content_tmpl({
        pictureH: this.model.get('videoslate'),
        pictureL: this.model.get('videothumb'),
        videoID: videoID
      });

      this.$('#flyoverMedia').html(hole_video_html);

      this.channelId = this.model.channels[this.model.get('number')];
    },


    loadChannel: function() {
      if(this.channelId !== undefined) {
        this.channel_object = ChannelController.getChannel(this.channelId);
        if(Geo.isBlocked()) {
            // hide live status
          this.$('#liveHole').hide();
        } else if(!ChannelController.checkChannelStatus(this.channel_object)) {
            // hide live status
          this.$('#liveHole').hide();
        } else {
            // show live status
          this.$('#liveHole').show();

            // construct url
          var url = '/en_US/watch/live.html?videoChannel=' + this.channelId + '&promo=live_course';
          var name = this.channel_object.get('name');

            // update HTML components

          var newurl = '<a href="' + url + '" class="livetag chevron right white">' + name + ' <!--[if lt IE 9]><span></span><![endif]--></a>';
          this.$('#liveHole').find('.liveTitle').html(newurl);
        }
      } else {
          // hide live status
        this.$('#liveHole').hide();
      }
    },

    videoPlayClick: function(ev) {
      var id = $(ev.target).closest('div[video-id]').attr('video-id');

      VideoPlayer.loadVideo(this.videoObj, id, {
        metrics_prefix: Metrics.page_section + ':7'
      });

      Metrics.measureAppMediaLoad(Metrics.page_section, Metrics.page_title, this.videoObj.title);
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

    load360Data: function() {
        // if not, populate
      $.getJSON('/en_US/xml/gen/course/360s.json')
        .success(function(data) {
          for(var i = data.holes.length - 1; i >= 0; i--) {
            var hole_data = data.holes[i].panos;
            var panos = new Panoramas(hole_data);

            Holes.at(i).set('panoramas', panos);
          }

          Holes.panos_fetched = true;

          this.load360s();
        }.bind(this))
        .error(function() {
          this.$('#panorama').hide();
        }.bind(this));
    },

    load360s: function() {
        // build 360 carousel
      if(this.model.get('panoramas').length > 0) {
        this.$('#panorama').show();

        var panoCarousel = new PanoCarousel({
          el: this.$('#panoramaCarousel'),
          hole: this.model.get('number'),
          panoramas: this.model.get('panoramas')
        }).render();

        this.carousels.push(panoCarousel);
      } else { // no panoramas found
        this.$('#panorama').hide();
      }
    }

  });

  return HoleDetailView;
});

