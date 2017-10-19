define('views/track/green-video',['require','backbone','jquery','utils/window-size','utils/pubsub','utils/browser','utils/metrics','collections/track/green-videos','models/track/state','utils/track/track','jquery.cookie'],function(require) {
  var Backbone = require('backbone'),
      $ = require('jquery'),
      Win = require('utils/window-size'),
      PubSub = require('utils/pubsub'),
      Browser = require('utils/browser'),
      Metrics = require('utils/metrics'),

      GreenVideos = require('collections/track/green-videos'),
      State = require('models/track/state'),
      TrackUtils = require('utils/track/track')
      ;

  require('jquery.cookie');

  var GreenVideoView = Backbone.View.extend({
    el: '.trackerWrapper',

    events: {
      // IE10 and below layer canvas above greenContourOverlay
      // add listener there to ensure we catch the click
      'click #holeContainer canvas': 'showGreenVideo',

      // doubling up here is fine because they are the same dimensions
      // but not siblings or descendents of each other
      // so only one will ever be on top, you'll never trigger both with single click
      'click #greenContourOverlay': 'showGreenVideo'
    },

    enabled: false,

    initialize: function() {
      this.logger = new eventsCore.util.Logger('Track/GreenVideos');

      this.listenTo(PubSub, 'windowsize:global:enter', this.disable);
      this.listenTo(State, 'view_fairway:enter', this.disable);

      this.listenTo(PubSub, 'windowsize:global:exit', this.enable);
      this.listenTo(State, 'view_fairway:exit', this.enable);

      GreenVideos.fetch();
    },

    render: function() {
      this.$greenInfoTip = this.$('.green-info-tips .green-info-tip');

      return this;
    },

    onDispose: function() {

    },

    disable: function() {
      this.enabled = false;
      this.hide();
      this.hideInstructions();
    },

    enable: function() {
      if(!State.get('view_fairway') && Win.size() !== Win.sizes.global) {
        this.enabled = true;
        this.show();
      }
    },

    show: function() {
      this.$('#maps').append('<div id="greenContourOverlay">');

      this.showInstructions();
    },

    hide: function() {
      this.removeVideos();

      // for quick demo, remove the green grid hard coded image
      this.$('#greenContourOverlay').remove();

      // make sure to remove all the overlay green video instructions
      // this.hideInstructionsIntro();
      this.hideInstructions();
    },

    removeVideos: function() {
      this.$('#maps').find('video').hide().remove();
    },

    /**
     * Method to display relevant Green Video
     * @param  {Event} e Expected click event object to be passed through
     */
    showGreenVideo: function(e) {
      if(this.enabled) {
        var x = e.pageX,
            y = e.pageY;

        // place the green details overlay image
        var selected_hole_num = State.get('selected_hole');
        if(State.get('showing_playoff')) {
          selected_hole_num = ((selected_hole_num % 2 === 0) ? 10 : 18);
        }
        if(selected_hole_num < 10) {
          selected_hole_num = '0' + selected_hole_num;
        }

        // get user clicked mouse position
        // find the shortest distance and get its video
        var greenVideo = this.getClosestGreenVideo(x, y);
        var greenVideoDir = 'http://mastersprogressivedl.edgesuite.net/2016/GreenSimulation/H' + selected_hole_num + '/';
        var poster = this.$('#mapGreen').attr('src');
        var greenVideoHtml = '<video poster="' + poster + '" autoplay="autoplay" width="100%" height="100%" loop="loop">';

        // Android browser seems to think it can play the Main version, but no arrows show up
        // so don't bother attaching it at all
        // TODO: Loop also doesn't seem to work properly for Android either
        if(!Browser.android && !Browser.apptype.android) {
          greenVideoHtml += '  <source src="' + greenVideoDir + 'MAIN/' + greenVideo + '" type="video/mp4">';
        }

        greenVideoHtml += '  <source src="' + greenVideoDir + 'BASELINE/' + greenVideo + '" type="video/mp4">'
                           + '</video>';

        var $greenVideo = $(greenVideoHtml);

        // clean up any existing video elements
        clearTimeout(this.timeoutId);
        this.removeVideos();
        this.$('#maps').append($greenVideo);
        $greenVideo.on('loadeddata', function() {
          GreenVideos.timeoutId = setTimeout(this.removeVideos.bind(this), 6000 * 3);
        }.bind(this)).show()[0].play();

        TrackUtils.measure('Options', 'Green Info Video', greenVideo);
      }
    },

    showInstructions: function() {
      if(!$.cookie('greenInfoTip')) {
        this.greenInfoTimeoutId = setTimeout(function() {
          this.$greenInfoTip.addClass('show');
        }.bind(this), 3000);

        this.$greenInfoTip.off('click').on('click', 'div.close', function(e) {
          this.setInstructionsCookie();
          TrackUtils.measure('Green Video Info', 'Prompt2', 'Close');
        }.bind(this));
      }
    },

    hideInstructions: function() {
      this.$greenInfoTip.removeClass('show');
      clearTimeout(this.greenInfoTimeoutId);
    },

    setInstructionsCookie: function() {
      $.cookie('greenInfoTip', 'true', { expires: 30, path: '/en_US/' });
      this.$greenInfoTip.removeClass('show');
      clearTimeout(this.greenInfoTimeoutId);
    },

    getClosestGreenVideo: function(x, y) {
      var holeNum = State.get('selected_hole');
      if(State.get('showing_playoff')) {
        holeNum = ((State.get('selected_hole') % 2 === 0) ? 10 : 18);
      }

      var $greenWrapper = this.$('#holeContainer');

      // get the mouse position relative to #holeContainer
      var offset = $greenWrapper.offset();
      var mouseX = x - offset.left,
          mouseY = y - offset.top;

      // get the render dimension
      var greenHeight = ($(document).height() - 50);
      var greenWidth = $greenWrapper.width();

      // convert mouse clicked location to percentage
      var xmouseperc = mouseX / greenWidth * 100;
      var ymouseperc = mouseY / greenHeight * 100;
      var closestDist = 100;
      var closestZone;

      var zone = GreenVideos.get(holeNum).get('zone');
      for(var i = 0; i < zone.length; i++) {
        var xposperc = zone[i].x * 100;
        var yposperc = zone[i].y * 100;
        var num = zone[i].num;

        // calculate the distance from the mouse points to each accesspoint
        // pythagoras theorem
        var dist = Math.sqrt(Math.pow((xmouseperc - xposperc), 2) + Math.pow((ymouseperc - yposperc), 2));

        if(dist < closestDist) {
          closestDist = dist;
          closestZone = num - 1;
        }
      }
      this.logger.info('VIDEO ====== ' + zone[closestZone].video);

      this.setInstructionsCookie();

      return zone[closestZone].video;
    }

  });

  return GreenVideoView;
});

