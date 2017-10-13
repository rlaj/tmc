define('utils/ratio-resize',['require','jquery','backbone','utils/pubsub','utils/common'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      PubSub = require('utils/pubsub'),
      Common = require('utils/common')
      ;

  var Ratio = Backbone.Model.extend({
    defaults: {
      ratio: 16/9,
      container: window,
      hcallback: function() {},
      wcallback: function() {},
      height: 0,
      width: 0,
      view: window,
      once: false
    },

    initialize: function() {
      this.logger = new eventsCore.util.Logger('Ratio');

      if(this.get('title') === undefined) {
        this.set('title', { height: 0 });
      }

      if(this.get('container') === window) {
        this.set('container', $(window));
      }

      if(this.get('once')) {
        this.calculateRatio();
      } else {
        this.containRatio();
      }
    },

    // wrapper for calculateRatio to handle initial call as well as assign event to throttle.resize custom event
    // + evtsuffix : custom event suffix to allow for detaching. pass in '' as default
    // + see calculateRatio for remaining params
    // contain16x9: function(evtsuffix, container, hcallback, wcallback, height) {
    //   this.containRatio(16/9, evtsuffix, container, hcallback, wcallback, height);
    // },

    // contain4x3: function(evtsuffix, container, hcallback, wcallback, height) {
    //   this.containRatio(4/3, evtsuffix, container, hcallback, wcallback, height);
    // },

    // contain3x5: function(evtsuffix, container, hcallback, wcallback, height) {
    //   this.containRatio(3/5, evtsuffix, container, hcallback, wcallback, height);
    // },

    containRatio: function() {
      var win = this.get('container');
      if(win === window) {
        win = $(window);
      } else {
        win = $(win);
      }

      this.set('container', win);

      this.calculateRatio();
      this.listenTo(PubSub, 'throttle:resize', this.calculateRatio);
    },

    dispose: function() {
      this.stopListening();
    },

    // boilerplate to handle any object that needs to be contained within viewport window
    // + ratio     : aspect ratio to resize to, in 16/9, or 4/3, or 3/5 format
    // + container : window/jQuery object/selector string that resizing width/height is based on
    //               if 'window', assumes object is full width, constrained by height, typically in hero space
    // + hcallback : function when object is height constrained
    // + wcallback : function when object is width constrained
    // + height : any extra heights to be taken into consideration at all times. To use a percentage, pass a string ending in %, i.e. '20%'
    calculateRatio : function() {
      //this.logger.info('calculateRatio - calling on %o', this.get('view'));
      var useHPct = false,
          useWPct = false;

      var ratio = this.get('ratio'),
          container = this.get('container'),
          hcallback = this.get('hcallback'),
          wcallback = this.get('wcallback'),
          height = this.get('height'),
          width = this.get('width');

      if(typeof height === 'string') {
        height = parseFloat(height); // use parseFloat to strip off trailing % symbol
        if(isNaN(height)) {
          height = 0;
        } else {
          useHPct = true;
        }
      }

      this.logger.info('calculateRatio - closest:%o cont:%o title:%o', container.closest('html'), container.height(), this.get('title').height);
      var h;
      if(container.closest('html').length === 0) {
        // if resizing hero space based on window width
        h = container.height() - Common.header_height - this.get('title').height;
        // get window height, account for nav bar height, title bar height

        if (Common.alert && Common.alert.on) {
          h -= Common.alert.height;
        };
      } else {
        // otherwise resizing based on container width
        h = container.outerHeight();
      }
      var w = container.width();

      if(!useHPct && height !== 0) {
        height = parseInt(height, 10);

        if (!isNaN(height)) {
          h -= height;
        };
      }
      else if (useHPct) {
        h = h * (100 - height)/100;
      };

      //this.logger.info('calculateRatio - h:%o w:%o ratio:%o', h, w, ratio);
      if (h / w < 1/ratio) { // 9/16
        if (typeof hcallback === 'function') {
          hcallback.call(this.get('view'), w, h);
        }
      } else {
        if (typeof wcallback === 'function') {
          wcallback.call(this.get('view'), w, h);
        }
      }
    }
  });

  return Ratio;
});
