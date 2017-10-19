define('controllers/article',['require','jquery','underscore','backbone','baseview','utils/browser','utils/common','views/fontsize-change','views/base-hero','views/hole-carousel','views/photo-carousel','views/video-carousel','views/player-carousel','views/print-window','views/related-article','utils/video-player','utils/metrics'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      BaseView = require('baseview'),
      Browser = require('utils/browser'),
      Common = require('utils/common'),
      FontSize = require('views/fontsize-change'),
      BaseHero = require('views/base-hero'),
      HoleCarousel = require('views/hole-carousel'),
      PhotoCarousel = require('views/photo-carousel'),
      VideoCarousel = require('views/video-carousel'),
      PlayerCardCarousel = require('views/player-carousel'),
      PrintView = require('views/print-window'),
      RelatedArticle = require('views/related-article'),
      VideoPlayer = require('utils/video-player'),
      Metrics = require('utils/metrics')
      ;

  var ArticleHero = BaseHero.extend({
    events: {
      'click #welcome:not(.heroVideo) .imageWrapper': 'openHeroPhoto',
      'click #welcome:not(.heroVideo) .contentWrapper': 'openHeroPhoto'
    },

    onInitialization: function(opts) {
      this.heroDetails = opts.heroDetails || {};
    },

    openHeroPhoto: function(e) {
      e.preventDefault();

      if(Browser.app) {
        // replace low render with high render for apps
        this.heroDetails.imagefileL = this.heroDetails.imagefileH;
        this.heroDetails.scaption = this.heroDetails.lcaption;
        if(Browser.apptype.ios) {
          Common.sendiOSMessage('photoDetails', this.heroDetails);
        } else {
          var data = JSON.stringify(this.heroDetails);
          Common.sendAndroidMessage('photo?data=' + data);
        }
      } else {
        Backbone.history.navigate(this.heroDetails.photopage, true);
      }
    }
  });

  var ArticleView = BaseView.extend({
    events: {
      'click .media_promo a': 'mediaPromoClick',
      'click .bodyVideo > a': 'mediaPromoClick',

      'click .photoItem a': 'photoClick',
      'click .text a': 'textLinkClick',
      'click #newbox .close': 'closeAlerts'
    },

    articleTitle: '',

    onInitialization: function() {
      this.hero = new ArticleHero({
        el: this.$('.hero-wrap'),
        heroDetails: this.jsonData.heroImageDetails
      });

      this.self = this;
      this.logger = new eventsCore.util.Logger('ArticleView');
      this.logger.info('onInitialization');

      this.players = {};

      this.article_content = this.$('article').find('> .text');
      this.fontsize = new FontSize({
        el: this.$('.fontSizeChange'),
        article_text: this.article_content
      });
      this.next_article = new RelatedArticle({
        el: this.$('.next_article'),
        related_id: this.jsonData.pageDetails.pageId
      });

      VideoPlayer.setSinglePlayerMode();

      this.printOptions();
      this.listenTo(VideoPlayer, 'player:complete', this.onCompleteEvent);
      this.listenTo(VideoPlayer, 'player:play', this.onPlayEvent);
      this.listenTo(VideoPlayer, 'player:stop', this.onStopEvent);
    },

    processPageVars: function() {
      var pageDetails = this.jsonData.pageDetails;

      // encodeURIComponent the following values
      var encodeKeys = ['pageId', 'pageURL', 'pageTitle2', 'pageAbstr'];
      for(var i = encodeKeys.length - 1; i >= 0; i--) {
        var k = encodeKeys[i];
        pageDetails[k] = encodeURIComponent(pageDetails[k]);
      }

      if(pageDetails.pageTitle !== undefined) {
        this.articleTitle = pageDetails.pageTitle;
      }
      this.pageTitle = 'Article Detail';

      // assign prop values based on page vars
      this.props = {
        prop4: 'Articles',
        prop5: pageDetails.pageTitle,
        prop6: pageDetails.pageTitle,
        prop17: 'Articles' + ':' + pageDetails.pageTitle,
        prop20: pageDetails.pageAuthor,
        prop21: pageDetails.pageDate
      };

      this.logger.info('processPageVars - data:%o', this.jsonData);
    },

    onRender: function() {
      BaseView.prototype.onRender.apply(this, arguments);

      // check if article has carousels
      // pass the necessary attributes to carousel view
      var $carousel_el = this.$('.articleCarousel');

      // holders for Carousel objects
      this.carousels = [];

      $carousel_el.each(function(i, obj) {
        if($(obj).hasClass('holeInfoCarousel')) {
          var article_holes = [];
          var assignedHoles = $(obj).attr('data-holes');
          article_holes = assignedHoles.split(',');
          article_holes = _.map(article_holes, function(hole) {
            return parseInt(hole, 10);
          });

          var holeCarousel = new HoleCarousel({
            article_holes: article_holes,
            el: obj,
            measure_prefix: [Metrics.page_section, 'Article'],
            app_measure_prefix: 'News:Article'
          });
          holeCarousel.render();

          this.carousels.push(holeCarousel);
        } else if($(obj).hasClass('photoCarousel')) {
          var article_photos = $(obj).attr('data-path');

          var photoCarousel = new PhotoCarousel({
            article_photos: article_photos,
            el: obj,
            measure_prefix: [Metrics.page_section, 'Article'],
            app_measure_prefix: 'News:Article'
          }).render();
          this.carousels.push(photoCarousel);
        } else if($(obj).hasClass('videoCarousel')) {
          var article_videos = $(obj).attr('data-path');
          var vid_data = this.jsonData.video;
          if(vid_data === undefined) {
            this.jsonData.video = [];
            vid_data = this.jsonData.video;
          }

          var videoCarousel = new VideoCarousel({
            article_videos: article_videos,
            el: obj,
            video_data: vid_data,
            measure_prefix: [Metrics.page_section, 'Article'],
            app_measure_prefix: 'News:Article'
          }).render();
          this.carousels.push(videoCarousel);
        } else if($(obj).hasClass('playerCardCarousel')) {
          var article_players = $(obj).attr('data-ids').split(',');
          article_players = _.map(article_players, function(id) {
            return parseInt(id, 10);
          });

          var playerCarousel = new PlayerCardCarousel({
            article_players: article_players,
            el: obj,
            measure_prefix: [Metrics.page_section, 'Article'],
            app_measure_prefix: 'News:Article'
          }).render();
          this.carousels.push(playerCarousel);
        }
      }.bind(this));

      // unveil default photo/video images
      this.unveil(this.$('.containerPhoto, .containerVideo').find('img.srcpic'));

      this.next_article.render();
    },

    onDispose: function() {
      this.fontsize.dispose();
      this.printview.dispose();

      // TODO: dispose of all carousels
      this.carousels.forEach(function(carousel) {
        carousel.dispose();
      });

      VideoPlayer.dispose();
    },

    printOptions: function() {
      var author_date = this.hero.$('.articleInfo .author_date').clone();
      var printText = $('<div />').append(author_date).html() + '<br/>' + $('<div />').append(this.article_content.clone()).html();

      this.printview = new PrintView({
        el: this.$('.printLink'),
        navbar: true,
        page_title: this.articleTitle,
        print_text: printText,
        text_only: true,
        metrics_name: 'Articles',
        pageURL: true
      });
    },

    mediaPromoClick: function(ev) {
      var id = $(ev.target).closest('div[video-id]').attr('video-id');

      if(Browser.app) {
        if(id.search(/^body_/) === 0) {
          id = id.substring(5);
        }
        if(Browser.apptype.ios) {
          Common.sendiOSMessage('video', id);
        } else if(Browser.apptype.android) {
          Common.sendAndroidMessage('video?id=' + id);
        }
      } else {
        var video = _.find(this.jsonData.video, function(vid) {
          return vid.id === id;
        });
        VideoPlayer.loadVideo(video, id, {
          vod: true,
          metrics_prefix: Metrics.page_section + ':' + Metrics.page_title
        });
        Metrics.measureAppMediaLoad(Metrics.page_section, Metrics.page_title, Metrics.video_action, video.title);

        this.$('#welcome').has('div[id="wrapper_' + id + '"]').addClass('dim');
      }

      return false;
    },

    onPlayEvent: function(data) {
      this.logger.info('onPlayEvent - data:%o', data);
    },

    onStopEvent: function(data) {
      this.logger.info('onStopEvent - data:%o', data);

      // reset hero status if that player was stopped
      var wrapper = this.$('#wrapper_' + data.id);
      if(this.hero.$welcome.has(wrapper).length > 0) {
        this.hero.$welcome.removeClass('dim');
      }
    },

    onCompleteEvent: function(data) {
      this.logger.info('onCompleteEvent - data:%o', data);

      this.$('#welcome').has('div[id="' + data.id + '"]').removeClass('dim');
      this.$('.ecp-player').has('div[id="' + data.id + '"]').hide();
    },

    photoClick: function(e) {
      if(Browser.app) {
        e.preventDefault();
        var _this = e.currentTarget;

        // find JSON object
        var id = _this.getAttribute('data-id');
        if(this.jsonData.photoDetails && this.jsonData.photoDetails[id]) {
          var data = _.clone(this.jsonData.photoDetails[id]);

          data.imagefileL = data.imagefileH;
          data.scaption = data.lcaption;
          if(Browser.apptype.ios) {
            Common.sendiOSMessage('photoDetails', data);
          } else {
            data = JSON.stringify(data);
            Common.sendAndroidMessage('photo?data=' + data);
          }
        }

        return false;
      }

      return true;
    },

    textLinkClick: function(e) {
      if(Browser.app) {
        var $t = $(e.currentTarget),
            href = $t.attr('href');

        var index = href.search(/\/en_US\/news\/articles\/\d{4}-\d{2}-\d{2}\//);
        if(index > -1) {
          var new_href = href;

          // don't prepend /ipad if it already exists
          if(href.substring(index - 4, index) !== 'ipad') {
            new_href = href.slice(0, index) + '/ipad' + href.slice(index);
          }

          // attach proper app query string to article link
          new_href += new_href.search(/\?/) > -1 ? '&' : '?';
          if(Browser.apptype.android) {
            new_href += 'android';
          } else if(Browser.apptype.ios) {
            new_href += 'ios';
          }
          $t.attr('href', new_href);
        }
      }
    }
  });

  return ArticleView;
});

