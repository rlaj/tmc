define('utils/track/track',['require','utils/scores','utils/metrics','utils/browser','models/track/state','utils/track/constants','collections/track/players'],function(require) {
  var Scores = require('utils/scores'),
      Metrics = require('utils/metrics'),
      Browser = require('utils/browser'),

      State = require('models/track/state'),
      Constants = require('utils/track/constants'),
      Players = require('collections/track/players')
      ;

  var TrackUtils = {
    measure: function() {
      var args = Array.prototype.slice.call(arguments, 0);
      if(Metrics.page_title !== 'Track') {
        args.unshift('Detail');
      }
      args.unshift('Track');
      if(!Browser.app) {
        Metrics.measureApp.apply(window, args);
      } else {
        Metrics.appMeasure(args.join(':'));
      }
    },

    measureState: function(contextData) {
      var args = Array.prototype.slice.call(arguments, 1);
      if(Metrics.page_title !== 'Track') {
        args.unshift('Detail');
      }
      args.unshift('Track');
      if(Browser.app) {
        Metrics.appState(args.join(':'), contextData);
      }
    },

    measurePlayer: function(id) {
      var args = Array.prototype.slice.call(arguments, 1);
      args.unshift('Track', 'Detail');
      if(!Browser.app) {
        Metrics.trackS({prop34: id});
        Metrics.measureApp.apply(window, args);
      } else if(Browser.apptype.android) {
        Metrics.appMeasure(args.join(':') + '&playerId=' + id);
      }
    },

    getURL: function(params) {
      var url = '/en_US/scores/track/track.html';
      if(Browser.app && Browser.apptype.android) {
        url = '/android' + url;
      }

      if(params) {
        url += '?' + params;
      }

      return url;
    },

    updateURL: function() {
      // check player, round, hole, shot
      var id = State.player_position.primary,
          r = State.get('selected_round'),
          h = State.get('selected_hole'),
          s;

      var shot = State.get('selected_shot');
      if(shot) {
        s = shot.get('number');
      }

      // check compare players
      var c = State.player_position.compare;

      var params = 'pid=<%= id %>&r=<%= round %>&h=<%= hole %>&s=<%= shot %><%= compare ? "&c=" + compare : "" %>';
      var querystring = _.template(params)({
        id: id,
        round: r,
        hole: h,
        shot: s,
        compare: c
      });

      if(Backbone.history._usePushState) {
        var url = this.getURL(querystring);

        var search = document.location.search;
        // params to keep through navigation
        var keys = ['ios', 'ipad', 'iphone', 'android', 'loglevel'];
        for(var i = 0, l = keys.length; i < l; i++) {
          var index = search.indexOf(keys[i]);
          if(index > -1) {
            var to = search.indexOf('&', index + 1);
            if(to === -1 && index > -1) {
              to = search.length;
            }
            if(to > -1) {
              if(index < 1) { index = 1; }
              var query = search.substring(index, to);
              url += (url.indexOf('?') > -1 ? '&' : '?') + query;
            }
          }
        }

        Backbone.history.navigate(url, {replace: true});
        State.trigger('route:change');
      }
    },

    selectPlayer: function(id) {
      // load selected player data, redraw canvas
      this.logger.info('load player ' + id + ' in tracker');
      if(id !== State.player_position.primary) {
        State.trigger('track:player', id);
      }

      // don't wait for player load to finish before closing list
      // to indicate to user that something happened while they're waiting
      State.trigger('playerlist:close');

      TrackUtils.measurePlayer(id, 'Player Picker', id + '');
      this.updateURL();
    },

    selectComparePlayer: function(id) {
      // load selected player data, redraw canvas
      this.logger.info('load compare player ' + id + ' in tracker');
      if(State.player_position.compare.indexOf(id) === -1) {
        State.trigger('track:compare:add', id);
      }

      // NOTE: #16601: Decided to always close after adding compare player
      // // only close if this was second compare player
      // if(State.player_position.compare.length === 2) {
        // don't wait for player load to finish before closing list
        // to indicate to user that something happened while they're waiting
        State.trigger('playerlist:close');
      // } else {
      //   State.trigger('playerlist:update');
      // }

      var i = '1';
      if(State.player_position.compare.length > 1) {
        i = '2';
      }
      TrackUtils.measurePlayer(id, 'Add Compare Player', i, id + '');
    },

    removeComparePlayer: function(id) {
      var pid = parseInt(id, 10);
      this.logger.info('Removing ' + pid + ' as a compare player');

      // delete player object if not a ghost player also
      if(State.player_position.ghost.indexOf(pid) === -1) {
        Players.get(pid).destroy();
      } else {
        Players.get(pid).reset_ghost();
      }

      // redraw other compare players, if any
      if(State.get('compare_mode')) {
        var cplayer = Players.get(State.player_position.compare[0]);
        cplayer.draw();
      }

      State.trigger('playerbar:compare:remove', pid);
    },

    convertTo: function(type, inches) {
      var val = inches / 12;
      if(type === 'yds') {
        var yds = val / 3;
        return Math.round(yds);
      }
      if(type === 'ft') {
        return Math.round(val);
      }
      return Math.round(inches);
    },

    /**
     * Calculate and write out shot distance for a given Shot object
     * @param {jQuery} container jQuery container for DOM element to write to
     * @param {Shot} shot      Shot model being displayed
     */
    setShotDistance: function(container, shot) {
      if(shot.get('penalty')) {
        container.html('Penalty');
        container.addClass('penalty').parent().addClass('penalty');
        return;
      }

      var _distance = shot.get('distance');
      var distance = this.convertTo('yds', _distance);
      if(shot.get('origin').get('ongreen')) {
        if(_distance >= 11.5) {
          distance = this.convertTo('ft', _distance);
          container.addClass('feet');
        } else {
          distance = Math.round(_distance);
          container.addClass('inch');
        }
      }

      container.html(distance);
    },

    /**
     * Calculate and write out remaining distance to hole for a given Shot object
     * @param {jQuery} container jQuery container for DOM element to write to
     * @param {Shot} shot      Shot model being displayed
     */
    setShotToPin: function(container, shot) {
      var _remaining = shot.get('remaining');
      var topin = this.convertTo('yds', _remaining);
      if(shot.get('ongreen')) {
        if(_remaining >= 11.5) {
          topin = this.convertTo('ft', _remaining);
          container.addClass('feet');
        } else if(_remaining > 0) {
          topin = Math.round(_remaining);
          container.addClass('inch');
        } else if(shot.get('penalty')) {
          // let's make sure this isn't a broken penalty shot
          topin = '';
          container.addClass('score');
          container.parent().addClass('score');
        } else {
          // determine score type
          topin = Scores.Utilities.scoreName(shot.get('number'), State.get('hole_info').par);
          container.addClass('score');
          container.parent().addClass('score');
        }
      }
      container.html(topin);
    },

    // check whether player has withdrawn or been disqualified
    checkPlayerStatus: function() {
      var player = Players.getPlayer();
      var status = Scores.Utilities.inGoodStanding(player.get('score_data'));
      if(status !== true) {
        var error;
        var name = player.get('name').first + ' ' + player.get('name').last;

        // if(status === 'W') {
        //   error = Track.PlayerList.errors.wd;
        // } else
        if(status === 'D') {
          error = Constants.ERRORS.dq;
          State.trigger('track:error:show', name, error);
          return false;
        } else if(status === 'X') {
          // do check on shot data before throwing up not teed off message
          error = Constants.ERRORS.ns;
          State.trigger('track:error:show', name, error);
          return false;
        }
        status = true;
      }

      if(State.get('error_shown')) {
        State.trigger('track:error:hide');
      }
      return status;
    }
  };

  TrackUtils.logger = new eventsCore.util.Logger('Track/Utils');

  return TrackUtils;
});

