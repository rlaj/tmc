define('utils/favorites',['require','jquery','backbone','underscore','utils/browser','utils/pubsub','utils/metrics','jquery.cookie'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      _ = require('underscore'),
      Browser = require('utils/browser'),
      PubSub = require('utils/pubsub'),
      Metrics = require('utils/metrics')
      ;

  // This doesn't need a stored return value since it just extends jQuery
  require('jquery.cookie');

  var Favorite = {
    init: false,
    first: true,
    favplayers: [],
    cookie_expires: 365, // new Date("April 7, 2014");
    cookie_path: '/en_US/',

    measurement: true, // allow measurement to be toggled manually

    prefix: '',

    /** ********************************************************
    Gets favorite player ids from cookie and populates
    favorites array
    **********************************************************/
    get: function() {
      // get favorite cookie and set value into favoritePlayers array
      var favFromStorage = $.cookie('customPlayers');
      if(favFromStorage !== null && favFromStorage !== '' && favFromStorage !== undefined) {
        this.favplayers = favFromStorage.split('|');
        this.init = true;
      }

      // backup check in case prefix doesn't get set
      if(this.prefix === '') {
        this.prefix = Metrics.page_section;
      }
    },

    check: function(pid) {
      if(!this.init) {
        this.get();
      }
      pid = pid + ''; // force to string
      if($.inArray(pid, this.favplayers) > -1) {
        return true;
      }

      return false;
    },

    getPlayerIDs: function() {
      this.get();
      return this.favplayers;
    },

    /** ********************************************************
    Change favorite players when star next to name is clicked
     - either add or remove from favorites array and cookie.

    If no cookie value, creates cookie
    **********************************************************/
    set: function(list) {
      if(list === undefined) {
        list = this.favplayers;
      } else {
        this.favplayers = list;
      }

      if(Browser.app && Browser.apptype.android) {
        this.cookie_path = '/android/en_US/';
      }

      // Update favorites in the cookie
      $.removeCookie('customPlayers', { path: this.cookie_path });
      $.cookie('customPlayers', list.join('|'), {
        expires: Favorite.cookie_expires,
        path: this.cookie_path
      });
    },

    remove: function(pid) {
      // check if player is a favorite first
      var pos = _.indexOf(this.favplayers, pid);
      if(pos > -1) {
        // remove player id from the list of favorites
        this.favplayers.splice(pos, 1);

        // refresh favorites array
        this.set();

        // execute callback
        // this._remove(obj, pid);
        PubSub.trigger('favorite:remove', [pid]);
        this.trigger('remove:' + pid);

        if(this.measurement) {
          Metrics.trackS({
            prop48: pid,
            prop47: ''
          });
          this.measure([this.prefix, 'Favorite Remove', pid + '']);
        }
      }
    },

    add: function(pid) {
      // check if player's already a favorite
      var pos = _.indexOf(this.favplayers, pid);
      if(pos === -1) {
        // add player id to the list of favorites
        this.favplayers.push(pid);

        // refresh favorites array
        this.set();

        // execute callback
        // this._add(obj, pid);
        PubSub.trigger('favorite:add', [pid]);
        this.trigger('add:' + pid);

        if(this.measurement) {
          Metrics.trackS({
            prop47: pid,
            prop48: ''
          });
          this.measure([this.prefix, 'Favorite Add', pid + '']);
        }
      }
    },

    _remove: function(pid) {
      // [md] not called for 2017 - use PubSub.trigger instead

      // callback function, overload as needed per page
      // - for measurement calls, HTML changes, etc
    },

    _add: function(pid) {
      // [md] not called for 2017 - use PubSub.trigger instead

      // callback function, overload as needed per page
      // - for measurement calls, HTML changes, etc
    },

    measure: function(args) {
      if(!Browser.app) {
        Metrics.measureApp.apply(Metrics, args);
      } else if(Browser.apptype.android) {
        var action = 'remove';
        if(args[1].indexOf('Add') > -1) {
          action = 'add';
        }
        var id = args[2];
        Metrics.appMeasure(args.join(':') + '&action=' + action + '&playerId=' + id);
      } else {
        Metrics.appMeasure(args.join(':'));
      }
    },

    toggle: function(pid) {
      if(!this.init) {
        this.get();
      }
      pid = pid + ''; // force to string
      if(_.indexOf(this.favplayers, pid) > -1) {
        this.remove(pid);
      } else {
        this.add(pid);
      }
    }
  };

  _.extend(Favorite, Backbone.Events);
  return Favorite;
});

