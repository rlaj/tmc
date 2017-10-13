define('views/watch-landing-hero',['require','backbone','jquery','views/base-hero','utils/browser','utils/pubsub','utils/geoblock','utils/window-size','utils/metrics','utils/scroll-to-fade','views/secondary-dropdown','utils/channel-controller','utils/scores-video','views/watch-carousel','views/watch-grid','views/watch-info','views/watch-schedule','jquery.cookie'],function(require) {
  var Backbone = require('backbone'),
      $ = require('jquery'),
      BaseHero = require('views/base-hero'),
      Browser = require('utils/browser'),
      PubSub = require('utils/pubsub'),
      Geo = require('utils/geoblock'),
      Win = require('utils/window-size'),
      Metrics = require('utils/metrics'),
      ScrollFade = require('utils/scroll-to-fade'),
      SecondaryDropdown = require('views/secondary-dropdown'),
      ChannelController = require('utils/channel-controller'),
      ScoresVideo = require('utils/scores-video'),
      WatchCarousel = require('views/watch-carousel'),
      WatchGrid = require('views/watch-grid'),
      WatchInfo = require('views/watch-info'),
      WatchSchedule = require('views/watch-schedule')
      ;

  require('jquery.cookie');

  var live_channel_path =
    '<% if(id !== "radio") { %>' +
    '<a href="/en_US/watch/live.html?videoChannel=<%= id %>" class="">' +
    '<% } else { %>' +
    '<a href="#" class="radio">' +
    '<% } %>';

  var WatchLandingHero = BaseHero.extend({
    el: '.content-wrap',

    window: '', // for radio popout

    events: {
      'click #showAllChannels': 'showAllChannels',
      'click #showSchedule': 'clickSchedule'
    },

    default_view: 'grid',
    non_default_view: 'channels',

    onInitialization: function(opts) {
      this.state = opts.state;

      this.$title = this.$('.navWrapper.title');
      this.$viewSelector = new SecondaryDropdown({
        el: this.$('.tabWrapper.title').find('.tabs'),
        metrics: null
      });

      this.$schedule = this.$('#schedule');
      this.$sizeMarker = this.$('#sizeMarker');

      this.$channelsWrapper = this.$('#liveChannelCarousel');

      this.infoScreen = new WatchInfo({
        el: this.$('#infoContainer'),
        $filler: this.$('#infoFiller')
      });
      this.listenTo(PubSub, 'livevideo:reset', this.removeBlockedChannels);
      this.listenTo(PubSub, 'livevideo:reset', this.refreshChannels);

      this.schedule = new WatchSchedule({
        el: this.$('#schedule'),
        $filler: this.$('#scheduleFiller')
      });
      this.listenTo(this.schedule, 'show', this.showScheduleHelper);
      this.listenTo(this.schedule, 'hide', this.hideScheduleHelper);

      this.listenTo(PubSub, 'radio:launch', this.launchRadio);
    },

    onRender: function() {
      this.$viewSelector.setOption(this.$viewSelector.$el.find('a[href$="' + this.default_view + '"]').index());

      this.scrollFade = new ScrollFade({
        no_fade: !Browser.ie8
      }).render();

      this.removeBlockedChannels();

      if(this.state === 'live') {
        this.loadChannelCarousel();
      } else {
        this.unveil(this.find('img'));

        // $('#channel').find('img').unveil();
      }

      this.schedule.render();
    },

    onDispose: function() {
      this.scrollFade.dispose();
    },

    processImage: function() {},

    geoAction: function() {
      console.log('running geoAction');

      // show only radio channel, no view selector, no schedule icon
      this.$channelsWrapper.find('.bx-control').addClass('hidden');
      this.$viewSelector.dispose(true);
      this.$('#showSchedule').remove();
      this.$title.css('margin-bottom', '1.5em');
    },

    removeBlockedChannels: function() {
      if(Geo.isBlocked()) {
        console.log('[WatchHero] removing blocked channels');
        var radio = ChannelController.collection.get('radio');
        ChannelController.collection.reset(radio);
      }
    },

    loadChannelCarousel: function() {
      this.carousel = new WatchCarousel({
        link_template: live_channel_path
      });
      this.listenTo(this.carousel, 'carousel:resize', this.resizeHandler);
      this.listenTo(this.carousel, 'info:open', this.openInfo);

      this.grid = new WatchGrid({
        link_template: live_channel_path
      });

      if(Win.size() !== Win.sizes.global) {
        this.enterDesktop();
      } else {
        this.enterMobile();
      }

      // attach resizing listeners
      this.listenTo(PubSub, 'windowsize:global:enter', function() {
        if(this.carousel.carousel.active) {
          console.log('carousel: entering global, destory desktop, init mobile');

          // destroy bxSlider, init mobile
          this.leaveDesktop();
          this.enterMobile();
        }
      });

      this.listenTo(PubSub, 'windowsize:global:exit', function() {
        if(!this.carousel.carousel.active) {
          console.log('carousel: leaving global, destory mobile, init desktop');
          this.leaveMobile();
          this.enterDesktop();
        }
      });

      this.listenTo(PubSub, 'windowsize:tablet:enter', function() {
        this.infoScreen.trigger('hide');
      });
    },

    enterMobile: function() {
      console.log('[WatchLandingHero] initing mobile channels');

      if(ChannelController.collection !== undefined && ChannelController.collection.length > 0) {
        this.populateMobileChannels();
      } else {
        this.listenToOnce(PubSub, 'livevideo:reset', function() {
          this.populateMobileChannels();
        });
      }

      if(this.schedule.isOpen) {
        this.toggleTitle();
      }
    },

    leaveMobile: function() {
      if(this.schedule.isOpen) {
        this.toggleTitle();
      }
    },

    enterDesktop: function() {
      console.log('[WatchLandingHero] initing desktop channels');

      // set default view based on stored cookie values
      if(!Geo.isBlocked()) {
        if($.cookie('channelViewSelect') === this.non_default_view) {
          this.toggleView(this.non_default_view);
          var idx = this.$viewSelector.findIndexByType(this.non_default_view);
          this.$viewSelector.setOption(idx);
        } else {
          this.toggleView(this.default_view);
        }
      }

      this.$viewSelector.setCallback(function(href) {
        var type = href.substring(5);

        if(type === this.non_default_view) {
          $.cookie('channelViewSelect', this.non_default_view, { expires: 5, path: '/en_US/' });
        } else {
          $.removeCookie('channelViewSelect', { expires: 5, path: '/en_US/' });
        }
        this.toggleView(type);

        // hide schedule if its visible
        if(this.$schedule.active) {
          this.$schedule.trigger('hide');
        }
      }, this);

      if(ChannelController.collection !== undefined && ChannelController.collection.length > 0) {
        this.carousel.render();
        this.grid.render();
      } else {
        this.listenToOnce(PubSub, 'livevideo:reset', function() {
          this.carousel.render();
          this.grid.render();
        });
      }
    },

    leaveDesktop: function() {
      console.log('[WatchLandingHero] destroying desktop channels');

      this.infoScreen.trigger('hide');
      this.$viewSelector.setCallback(function() {});

      // unset any artificial widths enforced to keep content within window frame
      var wrapper = this.$channelsWrapper;
      var navfilter = this.$title.find('.filter');
      var overlays = this.$schedule.add(this.infoScreen.$el);
      wrapper.css('width', '');
      navfilter.css('width', '');
      overlays.css('width', '');

      this.carousel.destroyCarousel();
    },

    toggleView: function(type) {
      if(type === 'grid') {
        this.$channelsWrapper.addClass('grid');
        this.$channelsWrapper.find('.bx-control').addClass('hidden');
        this.grid.trigger('desktop:show');
      } else {
        this.$channelsWrapper.removeClass('grid');
        this.$channelsWrapper.find('.bx-control').removeClass('hidden');
      }
    },

    refreshChannels: function() {
      ScoresVideo.assignFeaturedGroupPlayers();

      if(this.carousel) {
        this.carousel.trigger('refresh', this.infoScreen.isOpen);
      }
      if(this.grid) {
        this.grid.trigger('refresh');
      }

      if(this.infoScreen.isOpen) {
        this.infoScreen.trigger('refresh');
      }
    },

    /**
     * Handle resizing effects on carousel wrapper containers and adjust to keep carousel
     * at 85% width
     */
    resizeHandler: function() {
      var wrapper = this.$channelsWrapper;
      var navfilter = this.$title.find('.filter');
      var overlays = this.$schedule.add(this.infoScreen.$el);

      // make sure we're not setting artificial max-width when in mobile view
      if(Win.size() === Win.sizes.global) {
        overlays.css('max-width', '');
        return;
      }

      var offset = wrapper.offset().top + 110;
      var markerh = this.$sizeMarker.height() + offset;
      var markerw = this.$sizeMarker.width();
      var wh = $(window).height();

      console.info('offset: ' + offset + ', markerh: ' + markerh + ', wh: ' + wh);
      if(markerh + 10 >= wh) {
        // figure out how wide we need to be so carousel stays above the fold
        var newh = wh - offset;
        var neww = Math.ceil(newh * (16 / 9));

        // set minimum width for carousel image, corresponds to 440px height
        if(neww < 782) neww = 782;

        // use width to avoid box-sizing issue with IE8 and padding
        // set width as long as it's less than 85% of overall width, as that's what the carousel is set to
        if(neww <= markerw * 0.85) {
          wrapper.css('width', neww);
          navfilter.css('width', neww);
          overlays.css('width', neww);

          this.carousel.redraw();
        } else if(wrapper[0].style.width !== '') {
          wrapper.css('width', '');
          navfilter.css('width', '');
          overlays.css('width', '');

          this.carousel.redraw();
        }
      } else if(wrapper[0].style.width !== '') {
        wrapper.css('width', '');
        navfilter.css('width', '');
        overlays.css('width', '');

        this.carousel.redraw();
      }
    },

    /**
     * When receiving event that info panel has been opened, pass View to WatchInfo instance
     * and set up event listeners in case carousel goes to new slide
     * @param  {View} view WatchCarouselItem that where 'open' event was triggered
     */
    openInfo: function(view) {
      this.infoScreen.trigger('open', view);

      // attach one time handler to hide info sheet only if it was opened
      this.carousel.once('carousel:newslide', function() {
        this.infoScreen.trigger('hide');
      }.bind(this));
    },

    populateMobileChannels: function() {
      this.carousel.$el.html(this.carousel.populateItems());
      this.unveil(this.carousel.$('img'));

      this.$channelsWrapper.addClass('loaded');

      this.scrollFade.resetOffset();
    },

    showAllChannels: function(e) {
      this.carousel.$el.addClass('showall');
      $(e.currentTarget).hide();
      PubSub.trigger('lookup.unveil');

      Metrics.measureApp(Metrics.page_section, 'Show All Channels');
    },

    /**
     * Trigger show/hide events on WatchSchedule object, allow it to process calls, events
     */
    clickSchedule: function() {
      if(this.schedule.isOpen) {
        this.schedule.trigger('close');
      } else {
        this.schedule.trigger('open');
      }
    },

    /**
     * Perform all peripheral actions needed when schedule is brought to foreground
     */
    showScheduleHelper: function() {
      this.carousel.trigger('disable');
      this.$('.bx-control').addClass('disabled');
      this.infoScreen.trigger('hide');

      // handle desktop view changes
      // toggle selected tabWrapper link
      this.$('#showSchedule').addClass('active');

      if(Win.size() === Win.sizes.global) {
        this.toggleTitle();
      }
    },

    /**
     * Perform all peripheral actions needed when schedule is closed
     * @return {[type]} [description]
     */
    hideScheduleHelper: function() {
      this.carousel.trigger('enable');
      this.$('.bx-control').removeClass('disabled');

      // handle desktop view changes
      // toggle selected tabWrapper link
      this.$('#showSchedule').removeClass('active');

      if(Win.size() === Win.sizes.global) {
        this.toggleTitle();
      }
    },

    /** Toggle Live Coverage vs Schedule header */
    toggleTitle: function(state) {
      this.$title.find('.selected_option.hidden').removeClass('hidden').siblings().addClass('hidden');
    },

    launchRadio: function() {
      var radioLaunchPage = '/en_US/watch/radio/radio.html?';

      var params = window.location.search;

      // alert(params);
      var debug = false;
      if(params.indexOf('debug') > 0) debug = true;

      var d = new Date();
      var t = d.getTime();
      radioLaunchPage += 'ts=' + t;
      radioLaunchPage += (debug && debug.indexOf('debug') > -1) ? '&db=true' : '&db=false';
      radioLaunchPage += '&ref=' + document.location.host + document.location.pathname;
      radioLaunchPage += '&lang=en_US';// + lang;
      radioLaunchPage += '&stream=0';// + stream;
      if(this.window.closed || this.window === '') {
        this.window = window.open(radioLaunchPage, 'radioWindow', 'width=320,height=480,top=50,left=50,resizable=no,location=no');
        if(this.window.opener == null) this.window.opener = self;
      }
      this.window.focus();
    }
  });

  return WatchLandingHero;
});

