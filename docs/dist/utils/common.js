define('utils/common',['require','utils/querystring','utils/pubsub','underscore','jquery','utils/window-size','settings'],function(require) {
  var qsParse = require('utils/querystring'),
      PubSub = require('utils/pubsub'),
      _ = require('underscore'),
      $ = require('jquery'),
      Win = require('utils/window-size'),
      Settings = require('settings')
      ;

  var Common = {
    //* ********************* Global lang */
    defaultLang: 'en_US',
    lang: '',

    // store previous page if navigation is within app
    referrer: '',

    small_header_height: 40,
    large_header_height: 50,
    header_height: 50,

    // set this to enable/disable console output by default
    // - can be overridden with query param +debug+ set to "true|console"
    enable_logging: Settings.enable_logging,

    // store reference to panel controller instance for global access
    video_panel: undefined,

    // store whether a video panel is currently floating
    video_panel_float: false,

    initialize: function() {
      this.logger = new eventsCore.util.Logger('Common');
      this.setDefaults();
      this.patchConsole();
      this.watchHeaderHeight();
      this.logger.out('initializing');
    },

    setDefaults: function() {
      /** ************************** Language Detect */
      var lang;
      var site = location.pathname;
      if(site.indexOf('/en_FR/') === 0) {
        lang = 'en_FR';
      } else if(site.indexOf('/fr_FR/') === 0) {
        lang = 'fr_FR';
      } else if(site.indexOf('/es_FR/') === 0) {
        lang = 'es_FR';
      } else if(site.indexOf('/en_GB/') === 0) {
        lang = 'en_GB';
      } else if(site.indexOf('/en_AU/') === 0) {
        lang = 'en_AU';
      } else if(this.defaultLang) {
        lang = this.defaultLang;
      }

      this.lang = lang;
    },

    patchConsole: function() {
      // avoid IE8 errors when Developer Tools not enabled
      // and disable all console output unless debug is set
      if((!this.enable_logging && qsParse.get('debug') !== 'console' && qsParse.get('debug') !== 'true' && qsParse.get('loglevel') !== 'all') ||
          typeof console === 'undefined') {
        // http://www.elijahmanor.com/grunt-away-those-pesky-console-log-statements/
        (function() {
          var method;
          var noop = function() {};
          var methods = [
            'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
            'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
            'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
            'timeStamp', 'trace', 'warn'
          ];
          var length = methods.length;
          var console = (window.console = window.console || {});

          while (length--) {
            method = methods[length];

              // Only stub undefined methods.
              // if (!console[method]) {
            console[method] = noop;

              // }
          }
        }());
      }
    },

    sendAppMessage: function(platform, message) {
      if(platform === 'ios') {
        if(typeof message.value !== 'Array') {
          message.value = [message.value];
        }

        // convert all message values into arrays so we can send as many arguments as needed
        try {
          var handler = window.webkit.messageHandlers[message.type];
          handler.postMessage.apply(handler, message.value);
        } catch (e) {
          this.logger.out('sending app message failed: window.webkit.messageHandlers.' + message.type + '.postMessage.apply(window, %o);', message.value);
        }
      } else if(platform === 'android') {
        location.href = 'mobileapps://' + message;
      }
    },

    /**
     * Abstraction method for sending app messages to iOS app
     * @param  {String} type  messageHandler type to call
     * @param  {Object} value ID/string/etc to pass to app
     */
    sendiOSMessage: function(type, value) {
      this.sendAppMessage('ios', {type: type, value: value});
    },

    /**
     * Abstraction method for sending app messages to Android app
     * @param  {String} message Constructed URL string with key/value pairs
     */
    sendAndroidMessage: function(message) {
      this.sendAppMessage('android', message);
    },

    /**
     * Method to open the Masters Timline (Milestones) in custom popup window
     * @param  {[type]} e [description]
     * @return {[type]}   [description]
     */
    openTimeline: function(e) {
      e.preventDefault();
      var url = $(e.currentTarget).attr('href');

      window.open(url, 'timelineWindow', 'width=1024,height=758,resizable=yes,status=no,toolbar=no,menubar=no,location=no');

      return false;
    },

    /** ********************************************************************
     * This is a function over-ride for the launch from live icons
     */
    launchALC: function(videoRef, syn, debug, alt, source) {
      if(Geo.isBlocked()) {
        // Redirect to the blocked page
        location.href = '/en_US/watch/index.html';
      }

      // else if(location.href.indexOf('en_US/watch/live') != -1){
        // If we are on the live page then launch the live video console
        // measureApp('Live','Console Launch','Live Video'); // disabled because console tracks its own launch
        // launchALCPopup(videoRef, syn, debug, alt);
      // }

      else { // eslint-disable-line brace-style
        // If not then we redirect to the live page and append in the channel
        // requested by the user

        // measure launches only if debug disabled
        var launch_ref = '';
        var promo_cd = '';
        if(typeof debug === 'undefined' || !debug || debug === 'false') {
          var ref = document.location.pathname;
          if(typeof source !== 'undefined') {
            launch_ref = source;
          } else if(ref.indexOf('/en_US/scores/index') !== -1) {
            launch_ref = 'lb'; promo_cd = 'live_lb';
          } else if(ref.indexOf('/en_US/tournament/schedule') !== -1) {
            launch_ref = 'sch';
          } else if(ref.indexOf('/en_US/index') !== -1) {
            launch_ref = 'home';
          } else {
            launch_ref = ref; promo_cd = ref;
          }
        }

        var livePageURL = '/en_US/watch/live.html';

        livePageURL += '?videoChannel=' + videoRef;
        livePageURL += '&ref=' + launch_ref;
        livePageURL += '&promo=' + promo_cd;

        var d = new Date();
        var t = d.getTime();
        livePageURL += '&ts=' + t;

        location.href = livePageURL;
      }
    },

    getInstallFlashHtml: function() {
      require(['swfobject'], function(swfobject) {
        var flashUpgrade = '';
        var flash = qsParse.get('fl');
        var usrbrowser = qsParse.get('br');

        if(!swfobject.hasFlashPlayerVersion('11.2.0')) {
          flashUpgrade = ''
          + "<a href='http://get.adobe.com/flashplayer/' title='Download and install Flash here' target='_blank'>Download and install Flash here.</a>";
        }

        var message = '';
        if(flash !== 'true' && flash !== null) {
          message += 'It has been determined that you need to upgrade or install Flash Player to view the selected content.  '
                  + 'Please install or upgrade your Flash Player to view the latest content from masters.com.<br><br>';
          message += flashUpgrade + '<br><br>';
        }
        if(usrbrowser !== 'true' && usrbrowser !== null) {
          message += 'The content selected requires features of Flash Player only supported on the following browsers:<br>&nbsp;&nbsp;Internet Explorer 7.0 and higher<br>'
                  + '&nbsp;&nbsp;Mozilla 1.7.5 and higher<br>&nbsp;&nbsp;Firefox 1.0 and higher<br>&nbsp;&nbsp;Opera 9 and higher<br>&nbsp;&nbsp;Safari 1.3 and higher'
                  + '<br><br>Please use one of these browsers to see this content.<br><br>';
        }
        $('#errorMessage').html(message);
      });
    },

    // returns array of IDs (int) based on array of hashed objects
    // + list : array of objects
    // + id   : name of 'id' property
    extractIDs: function(list, id) {
      var id_prop = id;
      if(typeof(id) === 'undefined') {
        id_prop = 'id';
      }

      if(Array.prototype.map) {
        return list.map(function(item, i) {
          return parseInt(item[id_prop], 10);
        });
      }

      // if no native Array.map function, use underscorejs's
      return _.map(list, function(item) {
        return parseInt(item[id_prop], 10);
      });
    },

    // returns true|false based on whether the browser's HTML5 Fullscreen API has been invoked or not
    isFullScreen: function() {
      return !!(document.fullScreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    },


    // returns true|false based on whether user referred to current page via masters.com
    // used to determine instances like whether to autoplay a video
    internalRef: function() {
      var url = document.referrer;
      if(this.referrer !== '' || url.search(/\.masters\.com/) > -1) {
        // user referred by some page within masters.com
        return true;
      }

      return false;
    },

    // set whether a back link should be hidden
    // because history.go(-1) would do nothing or go to a different site
    hideBackLink: function() {
      // first check if internally referred
      if(!this.internalRef()) {
        return true;
      }

      // if it is, then check if tab/window has an actual history stack that can be used
      if(window.history.length <= 1) {
        return true;
      }

      // otherwise, leave it alone
      return false;
    },

    // returns true|false based on whether +path+ is an exit link or not
    // does not account for media URLs, like akamai
    // related: openExternal no longer needed, simply use target="_blank"
    isExitLink: function(path) {
      // if path starts with http:// or https://
      if(path.search(/^https?:\/\//) > -1) {
        // and if masters.com does not appear within the first 20 characters of the path
        var domain = path.search(/masters\.com/);
        // or if the subdomain is tickets.masters.com
        var isTickets = path.search(/tickets\.masters\.com/);
        if(domain === -1 || domain > 20 || isTickets > -1) {
          return true;
        }
      }

      return false;
    },

    toTitleCase: function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },

    watchHeaderHeight: function() {
      if(Win.size() === Win.sizes.global) {
        this.header_height = this.small_header_height;
      } else {
        this.header_height = this.large_header_height;
      }

      PubSub.on('windowsize:global:enter', function() {
        this.header_height = this.small_header_height;
      }, this);
      PubSub.on('windowsize:global:exit', function() {
        this.header_height = this.large_header_height;
      }, this);
    },

    collapseMenus: function(views) {
      if(Win.size() !== Win.sizes.global) {
        $.each(views, function(i, v) {
          if(typeof this.toggleOpenState === 'function') {
            this.toggleOpenState(false);
          } else {
            var el = this;
            if(el instanceof jQuery) {
              el = el;
            } else {
              el = $(el);
            }
            el.filter('.open').removeClass('open').find('.clone').remove();
          }
        });
      }
    }

  };

  return Common;
});

