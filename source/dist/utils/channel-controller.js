/**
 * VideoChannel and VideoChannelCollection are defined as private Modules within ChannelController
 * because all access to them should be routed specifically through the controller, and
 * not directly by any other module. You have direct access to the collection via the
 * 'collection' property, and from there direct access to the models.
 */
define('utils/channel-controller',['require','backbone','jquery','settings','utils/browser','utils/geoblock','utils/pubsub'],function(require) {
  var Backbone = require('backbone'),
      $ = require('jquery'),
      Settings = require('settings'),
      Browser = require('utils/browser'),
      Geo = require('utils/geoblock'),
      PubSub = require('utils/pubsub')
      ;

  var VideoChannel = Backbone.Model.extend({
    defaults: {
      name: '',
      channelId: '',
      live: false,
      launchUrl: '',
      replay: '',
      desktop: '',
      mobile: '',
      nodvr: '',
      imagePath: '/images/now/trans_16x9.gif',
      closedCaptions: '',
      fg: '',
      relatedContent: "/en_US/xml/gen/video/lastX.json"
    },

    idAttribute: 'channelId',

    initialize: function() {

    },

    parse: function(resp, options) {
      resp.imagePathH = resp.imagePath;
      resp.imagePathM = resp.imagePath;
      resp.imagePathL = resp.imagePath;

      return resp;
    }
  });

  var VideoChannelCollection = Backbone.Collection.extend({
    // url: "/en_US/xml/man/alc/liveVideoChannels.demo.json",
    url: "/en_US/xml/gen/alc/liveVideoChannels.json",
    model: VideoChannel,

    geoblock: false,
    cdn: 'unknown',

    initialize: function() {
      this.cdn = this._cdn = {
        desktop: {
          akamai: '',
          level3: ''
        },
        mobile: {
          akamai: '',
          level3: ''
        },
        nodvr: {
          akamai: '',
          level3: ''
        }
      };
    },

    parse: function(response, options) {
      this.cdn = response.cdnBalance;
      this.setCDN(response.channels);

      return response.channels;
    },

    setCDN: function(channels) {
      for(var i=0,l=channels.length;i<l;i++) {
        var ch = channels[i];
        // Radio doesn't care about CDNs, skip
        if(ch.channelId === 'radio') {
          continue;
        }
        var random = Math.floor(Math.random()*10);

        ch.cdn = {
          desktop: '',
          mobile: '',
          nodvr: ''
        };

        if(this.cdn.desktop.akamai.indexOf(random) !== -1) {
          ch.desktopURL = ch.desktop.akamai;
          ch.cdn.desktop = 'akamai';
        } else if(this.cdn.desktop.level3.indexOf(random) !== -1){
          ch.desktopURL = ch.desktop.level3;
          ch.cdn.desktop = 'level3';
        }

        if(this.cdn.mobile.akamai.indexOf(random) !== -1) {
          ch.mobileURL = ch.mobile.akamai;
          ch.cdn.mobile = 'akamai';
        } else if(this.cdn.mobile.level3.indexOf(random) !== -1){
          ch.mobileURL = ch.mobile.level3;
          ch.cdn.mobile = 'level3';
        }

        if(this.cdn.nodvr.akamai.indexOf(random) !== -1) {
          ch.nodvrURL = ch.nodvr.akamai;
          ch.cdn.nodvr = 'akamai';
        } else if(this.cdn.nodvr.level3.indexOf(random) !== -1){
          ch.nodvrURL = ch.nodvr.level3;
          ch.cdn.nodvr = 'level3';
        }
      }
    }

  });

  var ChannelController = function() {
    this.collection;
    this.callback = function() {};
    this.interval = 30; // in seconds
    this.timeoutId;

    this.hasOnAirChannel = false;

    this.init = function(callbackFunc) {
      this.setCallback(callbackFunc);

      if(!Settings.Scores.post) {
        clearInterval(this.timeoutId);
        this.timeoutId = setInterval(this.checkVideoJson.bind(this), this.interval * 1000);
      }

      this.collection = new VideoChannelCollection();
      this.checkVideoJson();

      return this;
    }

    this.setCallback = function(callbackFunc) {
      if(typeof callbackFunc === 'function') {
        this.callback = callbackFunc;
      }
    }

    this.checkVideoJson = function() {
      this.collection.geoblock = Geo.isBlocked();
      this.collection.fetch({
        success: function() {
          this.callback(this.collection);
          PubSub.trigger('livevideo:reset');
        }.bind(this)
      });
    }

    this.checkChannelStatus = function(id) {
      var ch = this.getChannel(id);
      if(ch) {
        return ch.get('live');
      }
      return false;
    }

    this.getChannel = function(id) {
      if(!Geo.isBlocked()) {
        return this.collection.get(id);
      }
    }

    this.getVideoObject = function(id) {
      var obj = this.getChannel(id);
      if(obj) {
        // determine desktop vs mobile device, default to desktop
        var type = 'desktop';

        // if mobile device, but not ipad or touch
        if(Browser.mobiledevice && !Browser.ipad && !Browser.touch) {
          type = 'mobile';
        }

        // Win7/IE11 requires nodvr stream
        if(Browser.win7 && Browser.ie11) {
          type = 'nodvr';
        }

        return {
          id: obj.id,
          type: type === 'nodvr' ? 'live' : 'dvr',    //not absolutely needed anymore, values can be 'vod', 'live', 'dvr'
          title: obj.get('name'),
          contentType: "live",   //used for vod as content catgeory
          cdn: obj.get('cdn')[type],
          pictureL: obj.get('imagePath'),
          pictureM: obj.get('imagePath'),
          pictureH: obj.get('imagePath'),
          wwwdash: "",
          wwwhlshigh: obj.get(type + 'URL'),
          // wwwhlshigh: "http://ibmhlslive2-i.akamaihd.net/hls/live/265377/simulation/fg/full.m3u8",
          pdl: "",
          link: "/en_US/watch/index.html",
        }
      }
    }

    return this.init.apply(this, arguments);
  };

  return new ChannelController();
})
;
