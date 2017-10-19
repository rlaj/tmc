(function(root, factory) {
  if(typeof define === 'function' && define.amd) {
    // AMD (Register as an anonymous module)
    define('utils/browser',['jquery', 'underscore', 'utils/querystring'], factory);
  } else if(typeof exports === 'object') {
    // Node/CommonJS
    module.exports = factory(require('jquery'), require('underscore'), require('utils/querystring'));
  } else {
    // Browser globals
    root.Browser = factory(jQuery, _, Querystring); // eslint-disable-line no-undef
  }
}(this, function($, _, Querystring) {
  var Browser = {
    ua: navigator.userAgent.toLowerCase(),
    name: navigator.appName.toLowerCase(),
    version: parseFloat(navigator.appVersion),

    oldIE: false,
    ie8: false,
    ie9: false,
    ie11: false,
    ie: false,

    osx: false,
    win: false,
    win7: false,
    ios: false,
    ipad: false,
    android: false,
    touch: false,

    safari: false,
    firefox: false,
    facebook: false,
    facebook_ios: false,

    hls: false,
    hls_live: false,

    mobiledevice: false,
    tabletdevice: false,

    app: false,
    apptype: {
      ipad: false,
      iphone: false,
      ios: false,
      android: false,
      version: 0
    },

    performChecks: function() {
      this.checkOldIE();
      this.checkHLSDevice();
      this.checkInApp();
      this.checkMobileTabletDevice();

      if(this.ua.match('firefox')) {
        this.firefox = true;
      }
      if(this.ua.match('win')) {
        this.win = true;

        // check windows version
        if(this.ua.match('nt 6.1')) {
          this.win7 = true;
        }

        // check for ie11
        if(this.ua.match('trident/7.0')) {
          this.ie11 = true;
        }
      }
      if(this.ua.match('fbios')) {
        this.facebook = true;
        if(this.ios) {
          this.facebook_ios = true;
        }
      }
    },

    checkOldIE: function() {
      var klass = document.getElementsByTagName('html')[0].className;
      if(klass.match('ie8') !== null) {
        this.oldIE = true;
        this.ie8 = true;
      }
      if(klass.match('ie9') !== null) {
        this.oldIE = true;
        this.ie9 = true;
      }

      // IE10+ ignore conditional comments, need to check useragent string
      // IE11 drops MSIE designation, uses appName Netscape, userAgent Trident combination
      this.ie = (this.name === 'microsoft internet explorer' && this.ua.search('msie') > -1) || (this.name === 'netscape' && this.ua.search('trident') > -1);
      if(this.ie) {
        $('html').addClass('ie');
      }
    },

    checkHLSDevice: function() {
      var match, ver;

      // iOS devices handle HLS natively
      if(this.ua.match(/ip(a|o)d/) || this.ua.match('iphone')) {
        this.ios = true;
        this.hls = true;
        this.hls_live = true;
      }

      // Mac Safari versions support HLS
      // Requires Safari 7+ to support live stream HLS
      if(this.ua.match('safari') && !this.ua.match('chrome') && this.ua.match('mac')) {
        this.osx = true;
        this.safari = true;
        this.hls = true;
        match = this.ua.match(/version\/([\d.]*)/);
        if(match !== null && match[1] !== '') {
          ver = parseFloat(match[1]);
          if(ver >= 7) {
            this.hls_live = true;
          }
        }
      }

      // Android 4+ supports HLS natively
      match = this.ua.match(/android ([\d.]+)/);
      if(match && match[0]) {
        this.android = true;
        this.version = parseFloat(match[1]);
        if(this.version > 4) {
          this.hls = true;
          this.hls_live = true;
        }
      }
    },

    checkMobileTabletDevice: function() {
      if(this.ua.match(/iphone/i)) {
        this.mobiledevice = true;
      }

      if(this.ua.match(/ipad/i)) {
        this.mobiledevice = true;
        this.tabletdevice = true;
        this.ipad = true;
      }

      if(this.ua.match(/touch/i)) {
        this.mobiledevice = true;
        this.tabletdevice = true;
        this.touch = true;
      }

      if(this.ua.match(/android/i) || this.ua.match(/silk/i)) {
        this.mobiledevice = true;
        this.tabletdevice = true;
      }
    },

    checkInApp: function() {
      var match,
          params = Querystring.params;
      var klass = [];
      if(params.app !== undefined) {
        this.app = true;
        klass.push('app');
      }
      if(params.ios !== undefined) {
        this.app = true;
        this.apptype.ios = true;
        klass.push('app');
        klass.push('ios');
      }
      if(params.ipad !== undefined) {
        this.app = true;
        this.apptype.ipad = true;
        this.apptype.ios = true;
        klass.push('app');
        klass.push('ios');
        klass.push('ipad');
      }
      if(params.iphone !== undefined) {
        this.app = true;
        this.apptype.iphone = true;
        this.apptype.ios = true;
        klass.push('app');
        klass.push('ios');
        klass.push('iphone');
      }
      if(params.android !== undefined || this.ua.match('ibm_events_android_apk')) {
        this.app = true;
        this.apptype.android = true;
        klass.push('app');
        klass.push('android');

        match = this.ua.match(/android ([\d.]+)/);
        if(match) {
          this.apptype.version = parseFloat(match[1]);
        }
      }

      klass = _.uniq(klass).join(' ');
      $('html').addClass(klass);
    }
  };

  return Browser;
}));

