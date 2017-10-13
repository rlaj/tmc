define('utils/overlay',['require','jquery','underscore','utils/window-size','utils/browser','utils/metrics','utils/common'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Win = require('utils/window-size'),
      Browser = require('utils/browser'),
      Metrics = require('utils/metrics'),
      Common = require('utils/common')
      ;

  var Overlay = Backbone.View.extend({
    el: '#light',

    events: {
      'contextmenu #overlayPhoto .image': 'noOp',
      'click #overlayShare .close': 'closeShare',
      'click #overlayPhoto .close a': 'closePhoto',
      'click #overlayPanorama .close a': 'close'
    },

    isOpen: false,

    initialize: function() {
      this.$fade_layer = this.$('#fade').add(this.$el);
      this.$overlayPhoto = this.$('#overlayPhoto');
      this.$overlayPhotoContent = this.$('#overlayPhotoContent');
      this.$overlayShare = this.$('#overlayShare');
      this.$overlayPanorama = this.$('#overlayPanorama');

      this.$w = $(window);
    },

    toggle: function(state) {
      var toOpen = !this.isOpen;
      if(typeof state !== undefined && (state === true || state === false)) {
        toOpen = state;
      }

      if(toOpen) {
        this.$fade_layer.show();
      } else {
        this.$fade_layer.hide();
      }
      this.isOpen = toOpen;
    },

    close : function(){
      this.toggle(false);
    },

    open: function() {
      this.toggle(true);
    },

    availableHeight: function(margin, tablet_margin) {
      var windowHeight = this.$w.height();

      var retHeight = windowHeight;
      retHeight -= Common.header_height; // subtract out main nav
      // retHeight -= 28; // subtract out sublevel nav
      // retHeight -=  37; // subtract out footer

      // subtract margin from top and bottom
      if(typeof tablet_margin != 'undefined' && Browser.tabletdevice) {
        retHeight -= tablet_margin*2;
      } else {
        retHeight -= margin*2;
      }

      return retHeight;
    },

    setPanoContainerSize: function() {
      // copied from inlineVideo.js, @writeInlinePlayer
      /**
       * Begin additions for large pano
       */

      var btnWidth = 28;
      var wh = this.getOverlayDimensions(btnWidth, 16/9);
      var overlayWidth = wh[0];
      var overlayHeight = wh[1];

      if (Win.size() === Win.sizes.global && Win.orientation() === Win.orientation.portrait) {
        // use full available height with gutter padding in mind
        overlayHeight = this.availableHeight(scrollGutterWidth);
      }

      this.$overlayPanorama.css({
        'width': overlayWidth + btnWidth,
        'height': 100 + overlayHeight
      });

      this.$overlayPanorama.find('#overlayPanoramaContent').css({
        'width': overlayWidth,
        'height': overlayHeight
      });

      /**
       * End large pano additions
       */
    },

    // calculate largest 16:9 dimensions that will fit in browser window
    getOverlayDimensions: function(btnWidth, ratio, max_height, height_margin) {
      // First, let's work out the best 16:9 size based on the open window
      var windowWidth = this.$w.width();
      var scrollGutterWidth = 25;

      if(max_height === undefined || isNan(max_height)) {
        max_height = -1;
      }

      if(height_margin === undefined || isNaN(height_margin)) {
        height_margin = scrollGutterWidth;
      }

      var overlayHeight = this.availableHeight(scrollGutterWidth);
      if(max_height > 0 && max_height < overlayHeight) {
        overlayHeight = max_height;
      }

      var overlayWidth = Math.round(overlayHeight*ratio) - scrollGutterWidth; // get associated 16x9 width - possible scroll gutter width

      if (windowWidth < overlayWidth + btnWidth) {
        overlayWidth = windowWidth - btnWidth - scrollGutterWidth;
        overlayHeight = Math.round(overlayWidth*(1/ratio))
      }

      return [overlayWidth,overlayHeight];
    },

    /**********************************************************************
    This function is called when a user clicks an image to see the large
    image in the overlay
    **********************************************************************/
    openPhoto : function(image,width,height,capcred,type){
      // calculate image ratio
      var ratio = width/height;

      this.getOverlayDimensions(btnWidth, ratio, height, 40)

      // var overlayHeight = this.availableHeight(40);
      // if(height < overlayHeight) {
      //   overlayHeight = height; // don't enlarge image
      // }

      // var scrollGutterWidth = 25;
      // var windowWidth = this.$w.width();
      // var overlayWidth = Math.round(overlayHeight*ratio) - scrollGutterWidth;
      // var btnWidth = 26; // close button width

      // // if window is narrower than image, resize image
      // if(windowWidth < overlayWidth + btnWidth) {
      //   overlayWidth = windowWidth - btnWidth - scrollGutterWidth;
      //   overlayHeight = Math.round(overlayWidth*(1/ratio));
      // }

      this.open();
      this.$overlayPhotoContent.show();
      this.$overlayPhoto.show();

      this.$overlayPhoto.css('width',overlayWidth+'px');

      this.$overlayPhoto.find('.image').html('<img src="'+image+'" width="'+overlayWidth+'" height="'+overlayHeight+'" border="0" alt=""/>');
      if(capcred){
        var tmp = capcred.split('|');
        this.$overlayPhoto.find('.caption').html(tmp[0]);
        this.$overlayPhoto.find('.credit').html(tmp[1]);
        Metrics.trackS({prop20 : tmp[1]});
      }

      // allow for custom external measurement call if +type+ is left undefined
      if(type !== undefined) {
        // use image filename as unique identifier
        var metric_id = image.substring(image.lastIndexOf('/')+1);
        Metrics.trackS({prop31 : metric_id});
        this.measurePhoto(type,metric_id);
      }
    },

    measurePhoto : function(type,photo_name) {
      Metrics.measureApp(Metrics.page_section, type, 'Photo',photo_name);
    },

    noOp: function() { return false },

    closePhoto : function(){
      this.$overlayPhotoContent.find('.image, .caption, .credit').html('');
      this.$overlayPhotoContent.hide();
      this.$overlayPhoto.hide();

      this.close();

      Metrics.measureApp('Photo Overlay','close');
    },

    openShare : function() {
      this.open();
      this.$('.overlay_panel').hide();
      this.$overlayShare.show().find('.socialOverlay').addClass('active');
    },

    closeShare : function() {
      this.$overlayShare.find('.socialOverlay').removeClass('active');
      this.close();
    }

  });

  return new Overlay();
});
