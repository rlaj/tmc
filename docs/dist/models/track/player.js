define('models/track/player',['require','backbone','jquery','underscore','utils/scores','collections/holes','models/track/state','utils/track/constants','utils/track/track','utils/track/gfx','collections/track/players','models/track/canvas','models/track/shot','models/track/tee','models/track/pin'],function(require) {
  var Backbone = require('backbone'),
      $ = require('jquery'),
      _ = require('underscore'),
      Scores = require('utils/scores'),
      HoleInfo = require('collections/holes'),

      State = require('models/track/state'),
      Constants = require('utils/track/constants'),
      TrackUtils = require('utils/track/track'),
      GfxUtils = require('utils/track/gfx'),
      Players = require('collections/track/players'),
      Canvas = require('models/track/canvas'),
      Shot = require('models/track/shot'),
      Tee = require('models/track/tee'),
      Pin = require('models/track/pin')
      ;

  var Player = Backbone.Model.extend({
    defaults: {
      // 0: inactive, not visible
      // 1: primary player being tracked
      // 2: comparison player
      // 3: ghost player in primary player's group
      state: Constants.STATE.INACTIVE,
      newly_selected: false,

      canvas: undefined,

      id: '',
      name: { first: '', last: ''},

      data: {},
      score_data: {},
      round_data: [],

      latest_round: -1,

      // based on number of holes played
      latest_hole: -1,

      current_hole: undefined,

      // use to determine whether new shot has been loaded
      latest_shot: -1,
      stored_shot: -1,

      splittee: false,

      // position in compare list, so we can assign proper colors
      compareIndex: -1,

      load_group: false
    },

    initialize: function(attr, opts) {
      this.logger = new eventsCore.util.Logger('Track/Player/' + attr.id);

      // array of pointers to other Player objects
      this.set('groupPlayers', []);
      this.set('action_queue', []);

      this.set('id', parseInt(attr.id, 10));

      this.set('score_data', Scores.Utilities.findByID(this.id));
      this.set('name', {
        first: this.get('score_data').get('first_name'),
        last: this.get('score_data').get('last_name')
      });

      this.set('canvas', new Canvas({ id: this.id, player: this }));

      Players.add(this);
    },

    urlRoot: '/en_US/xml/gen/companion/',

    url: function() {
      return this.urlRoot + this.id + '.json';
    },

    destroy: function() {
      this.set_inactive();
      var canvas = this.get('canvas');
      if(canvas) {
        canvas.destroy();
      }
      Players.remove(this);
    },

    set_inactive: function() {
      var _state = this.get('state');
      this.set('state', Constants.STATE.INACTIVE);
      this.get('canvas').clear();

      // remove from any existing arrays
      var index;
      switch(_state) {
        case Constants.STATE.PRIMARY :
          if(this.id === State.player_position.primary) {
            State.player_position.primary = undefined;
          }
          break;
        case Constants.STATE.COMPARE :
          index = State.player_position.compare.indexOf(this.id);
          if(index > -1) {
            State.player_position.compare.splice(index, 1);

            // reset compareIndex for other players remaining in compare list
            if(State.player_position.compare.length > 0) {
              if(index < 1) {
                Players.get(State.player_position.compare[0]).set('compareIndex', 0);
              }
            } else {
              State.set('compare_mode', false);
            }
          }
          break;
        case Constants.STATE.GHOST :
          index = State.player_position.ghost.indexOf(this.id);
          if(index > -1) {
            State.player_position.ghost.splice(index, 1);
          }
          break;
        default:
          break;
      }
    },

    set_primary: function() {
      this.get('canvas').render();

      // remove id from all other instances (ghost/compare)
      this.set_inactive();

      // clear ghost players
      State.player_position.ghost = [];

      this.set('state', Constants.STATE.PRIMARY);
      State.player_position.primary = this.id;
      this.get('canvas').set_canvas_type();

      // create his faded back player node for the group row
      State.trigger('grouplist:clear');
      State.trigger('grouplist:add', this);

      this.set('load_group', true);

      // fetch fellow players in his group
      // this.loadGroup();
    },

    set_compare: function() {
      this.get('canvas').render();

      this.set('state', Constants.STATE.COMPARE);
      if(State.player_position.compare.indexOf(this.id) === -1) {
        State.player_position.compare.push(this.id);
        this.set('compareIndex', State.player_position.compare.length - 1);
      }
      this.get('canvas').set_canvas_type();

      State.set('compare_mode', true);

      var fetch;

      // don't bother fetching fresh file if data for current hole is already ready to go
      if(this.get('current_hole') === undefined) {
        // fetch = this.fetch_data();
        fetch = this.fetch();
      } else {
        fetch = new $.Deferred();
        fetch.resolve();
      }

      fetch.done(function() {
        this.logger.info(this.get('action_queue'));

        // add compare player to player nav
        State.trigger('playerbar:compare:add', this);

        this.process();

        // process action queue
        for(var i = 0, l = this.get('action_queue').length; i < l; i++) {
          var action = this.get('action_queue').shift();
          var name = action;

          this.logger.info(this.id + ' calls: ' + name);
          this[name]();
        }
      }.bind(this));
    },

    // for when a ghost player has been added as a compare player, and then
    // needs to return to a ghost player state
    reset_ghost: function() {
      this.set_inactive();
      this.get('canvas').destroy();

      this.set('state', Constants.STATE.GHOST);

      // this.canvas.set_canvas_type();
      // // reset Shot object types
      // if(this.current_hole && this.current_hole.shots !== undefined) {
      //   for(var i=0,l=this.current_hole.shots.length;i<l;i++) {
      //     this.current_hole.shots[i].type = this.state;
      //   }
      // }

      // if(!Track.compare_mode) {
      //   // if no compare players left, draw all ghost players
      //   for(var i=0,l=Track.player_position.ghost.length;i<l;i++) {
      //     var pid = Track.player_position.ghost[i];
      //     Track.players[pid].draw();
      //   }
      // }
    },

    set_ghost: function() {
      if(State.player_position.compare.indexOf(this.id) === -1) {
        // remove id from all other instances (primary/compare)
        this.set_inactive();
        this.set('state', Constants.STATE.GHOST);
      }

      if(State.player_position.ghost.indexOf(this.id) === -1) {
        State.player_position.ghost.push(this.id);
      }

      State.trigger('grouplist:add', this);

      // this.fetch()
      // .done(function() {
      //   console.log(this.action_queue);
      //   // process action queue
      //   for(var i=0,l=this.action_queue.length;i<l;i++) {
      //     var action = this.action_queue.shift();
      //     var name = action;

      //     console.info(this.id + ' calls: ' + name);
      //     this[name]();
      //   }
      // }.bind(this));
    },

    draw: function() {
      // if selected round/hole is beyond latest player has data for, immediately return
      if(this.latest_round <= State.get('selected_round') && this.latest_hole < State.get('selected_hole')) {
        this.done_with_initial_draw();

        return;
      }

      if(this.get('current_hole') === undefined) {
        // remove any previous instances of draw to ensure it only exists once in queue
        var i = this.get('action_queue').indexOf('draw');
        if(i > -1) {
          this.get('action_queue').splice(i, 1);
        }
        this.get('action_queue').push('draw');
        return;
      }

      if(this.get('state') === Constants.STATE.PRIMARY) {
        this.get('canvas').clear();
        State.get('hole_info').pin.off('pin:ready').once('pin:ready', function() {
          this.draw_shot();
          this.done_with_initial_draw();
        }.bind(this));
        State.get('hole_info').pin.draw();
      } else if(this.get('state') === Constants.STATE.COMPARE) {
        this.get('canvas').clear();
        this.draw_shot();
        this.done_with_initial_draw();
      }
    },

    draw_shot: function() {
      // don't draw ghost shot if we're not in live mode
      if(this.get('state') === Constants.STATE.GHOST
          // && (!Track.live_mode
          // // or there is at least one compare player being viewed
          // || Track.compare_mode)
      ) {
        return;
      }

      var l = this.get('current_hole').shots.length;
      var shot = this.get('current_hole').shots[l - 1];

      shot.draw();

      if(State.get('compare_mode')) {
        State.trigger('statbar:update', this.id);
      }

      // Track.Base.showShotOverlay();
    },

    done_with_initial_draw: function() {
      // Check if we're done drawing all players. Start by adding this player
      // to the array if it hasn't already been drawn
      if(_.indexOf(State.loaded_players, this.id) === -1) {
        State.loaded_players.push(this.id);
      }

      // Check if Track has been loaded, not yet notified, and
      // if the total loaded players matches the total players to be drawn
      if((State.get('loaded') || !State.get('compare_mode')) && !State.get('notified') && State.loaded_players.length === State.total_players) {
        // if so, trigger completion event
        State.trigger('track:playerload:complete');
      }
    },

    hide_ghost_overlay: function() {
      if(this.get('current_hole') === undefined) {
        this.get('action_queue').push('hide_ghost_overlay');
        return;
      }

      var last = this.get('current_hole').shots.length - 1;
      var cur_shot = this.get('current_hole').shots[last];
      if(cur_shot.get('viewing')) {
        cur_shot.hide_details();
      }
    },

    // grab player's data file, assign round_data, process latest round/hole
    parse: function(response, options) {
      response.latest_round = 1;
      response.latest_hole = 1;

      response.data = response.round;

      // process hole data
      var round_data = response.data;

      var l = round_data.length;

      response.round_data = [];
      for(var i = 0; i < l; i++) {
        var holes = round_data[i].hole;

        if(holes !== undefined) {
          response.round_data[i] = [];
          var hole, has_next = false;
          for(var j = 0, m = holes.length; j < m; j++) {
            hole = holes[j];

            // if(hole.shot.length === 1 && hole.shot[0].type === 'NEXT') {
            //   has_next = true;
            //   this.logger.info('NEXT shot detected and skipped');
            //   continue;
            // }
            response.round_data[i][hole.id] = hole;
          }
          m = has_next ? m - 1 : m;

          response.latest_hole = m;
          response.latest_round = i + 1;
          response.latest_shot = hole.shot.length;
        }
      }

      return response;
    },

    // upon selecting player, grab data, assign selected round/hole to latest available
    select: function() {
      // var request = this.fetch_data();
      var request = this.fetch();
      this.set_primary();
      this.set('newly_selected', true);

      request.done(function() {
        // prime selected round/hole with latest available for given player
        // split tee taken care of once proper round is determined
        State.set('selected_round', this.get('latest_round'));
        State.set('selected_hole', this.get('latest_hole'));
        this.set('stored_shot', this.get('latest_shot') - 1);

        // Track.Controls.determineEnabledHoles();

        // set primary only after player data has been fetched
        // to minimize the lag time between the player name changing
        // and the player's shots being drawn
        State.trigger('playerbar:primary:set', this);
      }.bind(this));

      return request;
    },

    refresh: function(callback) {
      if(this.get('state') !== Constants.STATE.INACTIVE) {
        // var request = this.fetch_data();
        var request = this.fetch();

        request.done(function() {
          // update score_data
          this.set('score_data', Scores.Utilities.findByID(this.id));
          this.process(callback);
        }.bind(this));

        return request;
      }
    },

    process: function(callback) {
      if(this.get('state') === Constants.STATE.PRIMARY) {
        // figure out what holes should be enabled
        State.trigger('controls:holelist:reset');

        var new_hole = false;
        if(State.get('live_mode')) {
          State.set('selected_round', this.get('latest_round'));
          State.set('selected_hole', this.getLastHole());
          if(State.get('selected_round') === 5) {
            State.set('showing_playoff', true);
          }

          if(State.get('selected_hole') !== State.get('stored_hole')) {
            // need to clear ghost shots at this stage so they don't up on next hole out of place
            GfxUtils.clear();

            // change to selected round/hole
            State.trigger('controls:hole:change', State.get('selected_hole'), State.get('selected_round'));

            this.loadGroup();

            this.set('stored_shot', -1);

            // // reset stored shot values for all ghost players
            // for(var i=0,l=Track.player_position.ghost.length;i<l;i++) {
            //   var pid = Track.player_position.ghost[i];
            //   Track.players[pid].stored_shot = -1;
            // }

            new_hole = true;

            // add selection of first shot to callback
            var _callback = callback;
            callback = function() {
              if(typeof _callback === 'function') {
                _callback.call(this, this);
              }
            };
          }
        }

        this.loadHole();

        if(TrackUtils.checkPlayerStatus() !== true) {
          return;
        }

        var hasShots = this.loadCurrentHole();

        if(!hasShots) {
          // clear all shots
          GfxUtils.clear();
        } else {
          // mark 1st shot as selected if going to new hole or no shots were selected
          if(new_hole || State.get('selected_shot') === undefined) {
            State.trigger('controls:shot:set', this.get('current_hole').shots[0]);
          } else if(State.get('selected_shot').get('number') === 0) {
            // if tee state, don't keep showing detail overlay?
            State.trigger('controls:shot:set', this.get('current_hole').shots[0], false);
          }

          State.trigger('shotlist:set', this.get('current_hole').shots);

          // if shot was previously selected
          // and we're still on the same hole (data refresh)
          if(State.get('selected_hole') === State.get('stored_hole') && State.get('selected_round') === State.get('stored_round')) {
            // if we're in live mode
            if(State.get('live_mode') && State.get('selected_shot') && this.get('stored_shot') === State.get('selected_shot').get('number')
               && this.get('current_hole').shots.length > this.get('stored_shot')) {
              // select latest shot
              this.logger.info('auto-select shot ' + this.get('current_hole').shots.length);
              State.trigger('controls:shot:autoselect', this.get('current_hole').shots.length);
            } else {
              // else select same shot
              // re-assign selected shot with new object
              var visible_overlay = State.get('selected_shot').get('viewing');
              var previous_shot = State.get('selected_shot'),
                  new_shot;
              var shots = this.get('current_hole').shots;
              if(previous_shot.get('number') === 0) {
                // get last shot in case more than 1 comes in at a time
                new_shot = shots[shots.length - 1];
              } else {
                new_shot = shots[previous_shot.get('number') - 1];
              }
              new_shot.select();
              new_shot.set('viewing', visible_overlay);
              State.set('selected_shot', new_shot);
            }
            State.trigger('controls:arrows:reset');
          }
        }

        this.set('stored_shot', this.get('latest_shot'));
        State.set('stored_hole', State.get('selected_hole'));
        State.set('stored_round', State.get('selected_round'));
      } else if(this.get('state') === Constants.STATE.COMPARE) {
        // loop through available players, draw them in order of z-index
        var has_current = this.loadCurrentHole();
        this.updateStoredShot();

        this.logger.info('current_hole: %o, player %o', has_current, this);
        if(!has_current) {
          // clear canvas because player has no shots on current hole
          this.get('canvas').clear();
        }
      }

      if(typeof callback === 'function') {
        callback.call(this, this);
      }

      this.draw();
    },

    loadGroup: function(round) {
      if(round === undefined) {
        // round = Scores.Utilities.currentRound();
        round = State.get('selected_round');
      }

      if(State.get('stored_round') === round && !this.get('load_group')) {
        return;
      }

      // clean out group list items except for first player
      State.trigger('grouplist:clear', 1);

      // if playoff, check number of players in playoff
      // if less than 3 total, show other 2 players
      // otherwise, just show primary player
      if(round === 5) {
        // TODO: Wait for Scores.Playoff to be redone
        var num_players = Scores.Playoff.players.length;
        var primary_id = this.id;
        var group;
        group = _.map(Scores.Playoff.players, function(player) {
          var gid = parseInt(player.id, 10);
          if(gid !== primary_id) {
            return gid;
          }
        });

        // remove undefined, any falsey elements
        this.set('group_ids', _.compact(group));

        // truncate group_ids list to first 2
        if(this.get('group_ids').length > 2) {
          this.get('group_ids').length = 2;
        }
      } else {
        // assume teepin has been loaded
        var rd = State.teepin.round[round - 1];

        // store ids of all players in the group
        var groupHistory = this.get('score_data').get('groupHistory').split('|');
        var group_num = groupHistory[round - 1];

        // no group number, just return, no group members available
        if(group_num === '') {
          this.set('group_ids', []);
          return;
        }

        this.set('group_ids', rd.groups[group_num].slice(0));

        // remove this player's id so group_ids only has fellow players
        var index = this.get('group_ids').indexOf(this.id);
        this.get('group_ids').splice(index, 1);
      }

      // create Player objects for group/ghost players
      for(var i = 0, l = this.get('group_ids').length; i < l; i++) {
        var pid = this.get('group_ids')[i];
        var player = Players.get(pid);

        // check if player object already exists
        if(player === undefined) {
          player = new Player({ id: pid });
        }

        player.set_ghost();
      }

      this.set('load_group', false);
    },

    loadHole: function() {
      // assign playoff tee/pin data
      var r = State.get('selected_round');
      var h = State.get('selected_hole');
      if(State.get('showing_playoff')) {
        r = 4;
        h = (h % 2 === 0 ? 10 : 18);
      }

      // create Point objects for tee and pin
      var rd = State.teepin.round[r - 1];
      var hole_info = {};
      hole_info.tee = new Tee(rd.tees[h - 1]);
      hole_info.tee.set('type', Constants.STATE.TEE);
      hole_info.tee.set('canvas', this.get('canvas'));
      hole_info.pin = new Pin(rd.pins[h - 1]);
      hole_info.pin.set('canvas', this.get('canvas'));

      // store par info
      if(HoleInfo.length > 0) {
        hole_info.par = parseInt(HoleInfo.get(h).get('par'), 10);
      } else {
        this.stopListening(State, 'holeinfo:ready')
          .listenToOnce(State, 'holeinfo:ready', function() {
            var hole = State.get('selected_hole');
            if(State.get('showing_playoff')) {
              hole = (hole % 2 === 0 ? 10 : 18);
            }
            State.get('hole_info').par = parseInt(HoleInfo.get(hole).par, 10);
          });
      }

      State.set('hole_info', hole_info);
    },

    loadCurrentHole: function() {
      var shots = [];

      if(this.get('round_data') === undefined) {
        this.get('action_queue').push('loadCurrentHole');
        this.get('action_queue').push('updateStoredShot');
        return false;
      }

      if(this.get('round_data')[State.get('selected_round') - 1] !== undefined) {
        this.set('current_hole', this.get('round_data')[State.get('selected_round') - 1][State.get('selected_hole')]);
      } else {
        // if no data for selected round, clear out current_hole
        this.unset('current_hole');
      }

      if(this.get('current_hole') !== undefined && this.get('current_hole').shot.length > 0) {
        // store shot array for player via copy by value
        var shot_data = this.get('current_hole').shot;

        // create Shot objects for each shot
        var l = shot_data.length;

        // // store live/vod/bad data info
        // Track.hole_info.live = this.current_hole.live;
        // Track.hole_info.vod = this.current_hole.vod;
        // Track.hole_info.bad = this.current_hole.bad;

        // var new_hole = (Track.stored_hole !== undefined && this.latest_shot === 1 && Track.stored_hole !== Track.selected_hole);
        this.logger.info('> viewing ' + this.id + ': stored_shot ' + this.get('stored_shot') + ', latest_shot ' + this.get('latest_shot'));
        var i = 0,
            s;
        for(i; i < l; i++) {
          s = shot_data[i];
          if(s.type !== 'NEXT') { // conditional always true, NEXT shots no longer included in feed
            s.number = i + 1;
            s.player = this;
            s.canvas = this.get('canvas');

            var _shot = new Shot(s);
            shots[i] = _shot;
            if(i === 0 && _shot.get('origin') === 1) {
              // only treat the first shot as having come from the Tee, regardless of origin
              // FIXME: For first players off on the course, may not have tee info here, what to do?
              _shot.set('origin', State.get('hole_info').tee);
            } else {
              // otherwise assume its origin is the previous shot
              _shot.set('origin', shots[i - 1]);
            }
            _shot.setType(this.get('state'));

            this.logger.info('> viewing ' + this.id + ' shot ' + _shot.get('number') +
                        ': new shot check - ' + (this.get('stored_shot') === -1 && _shot.get('number') === this.get('latest_shot')) +
                        ', shots check - ' + (this.get('stored_shot') > -1 && _shot.get('number') > this.get('stored_shot')));

            // set shot overlay to auto-display if it's different from the latest stored shot we have
            if(State.get('live_mode') &&
              (

                // make sure we're on new hole, show latest shot
                (this.get('stored_shot') === -1 && _shot.get('number') === this.get('latest_shot'))
                ||

                // if checking new shots, show shots greater than stored value
                (this.get('stored_shot') > -1 && _shot.get('number') > this.get('stored_shot') &&

                  // if ghost shot, make sure stored_shot data for ghost player is from current hole
                  ((this.get('state') === Constants.STATE.GHOST && this.get('latest_hole') === State.get('selected_hole'))
                  ||

                  // otherwise always show for primary player
                  this.get('state') === Constants.STATE.PRIMARY)
                )

                // ||
                // (new_hole && _shot.number === this.latest_shot)
              )
              ) {
              this.logger.info(this.get('stored_shot'));
              _shot.set('viewing', true);
            }
          } else {
            // On Tee state
            if(i === 0) {
              // create 'Tee State' shot
              var _shot = new Shot(State.get('hole_info').tee.attributes);
              _shot.set({
                number: 0,
                player: this,
                canvas: this.get('canvas'),
                origin: State.get('hole_info').tee
              });
              _shot.setType(this.get('state'));
              shots[i] = _shot;

            } else if(l === i + 1) {
              shots.splice(i);
            } else {
              shots[i] = new Shot(s);
              shots[i].set('origin', shots[i - 1]);
            }
          }
        }

        this.get('current_hole').shots = shots;
      } else {
        return false;
      }

      return true;
    },

    check_mode: function(hole) {
      var latest_hole = this.getLastHole();
      if(hole < latest_hole || State.get('selected_round') !== this.get('latest_round')
         || Scores.Utilities.inGoodStanding(this.get('score_data')) !== true || Scores.Utilities.missedCut(this.get('score_data'))) {
        State.set('live_mode', false);
      } else {
        State.set('live_mode', true);
      }
    },

    updateStoredShot: function() {
      if(this.get('latest_hole') === State.get('selected_hole')) {
        this.set('stored_shot', this.get('latest_shot'));
      }
    },

    isSplitForRound: function(round) {
      var rd = this.get('round_data')[round - 1];

      if(rd === undefined) {
        return rd;
      }

      // if round has shot details for hole 10, but not hole 9, return true
      if(rd[10] !== undefined) {
        if(rd[9] === undefined) {
          return true;
        } else if(rd[18] !== undefined) {
          // check if player has holed out on 9 yet
          var l = rd[9].shot.length;
          var last_shot = rd[9].shot[l - 1];
          var split = parseFloat(last_shot.remaining) > 0;

          // then make sure hole 18 was finished before hole 9
          l = rd[18].shot.length;
          last_shot = rd[18].shot[l - 1];

          // so if hole 9 has not been completed, but hole 18 was, then split will be true
          split = split && parseFloat(last_shot.remaining) === 0;

          // return true/false value
          return split;
        }
      }

      // if haven't returned by now, then not in split tee state
      return false;
    },

    // returns the last played hole number played by the player
    // based on this.latest_hole (number of holes played), taking into account split tee state
    getLastHole: function() {
      var latest_hole = this.get('latest_hole');
      if(this.get('splittee')) {
        if(latest_hole <= 9) {
          latest_hole += 9;
        } else {
          latest_hole -= 9;
        }
      }
      return latest_hole;
    },

    // given a round/hole combination, determine if player has shots on that hole
    // duplicates function of same name in Scores.Utilities, not sure if needed here
    hasPlayedHole: function(round_num, hole_num) {
      var round = this.get('round_data')[round_num - 1];

      if(round === undefined) {
        return false;
      }

      if(hole_num === undefined) {
        return false;
      }

      var hole = round[hole_num];
      if(hole === undefined || hole.shot === undefined) {
        return false;
      }

      if(hole.shot.length > 0) {
        return true;
      }

      return false;
    },

    // given a round/hole/shot combination, determine if there is a next shot available for the player
    // all values are expected to be 1-indexed
    hasNextShot: function(round_num, hole_num, shot_num) {
      var round = this.get('round_data')[round_num - 1];

      if(round === undefined) {
        return false;
      }

      if(hole_num === undefined) {
        hole_num = 1;

        // default to first hole of round if in split tee state
        if(this.isSplitForRound(round_num)) {
          hole_num = 10;
        }

        // no hole defined, clearly looking for first shot
        shot_num = -1;
      }
      var hole = round[hole_num];

      // stop if either hole doesn't exist, or hole has no shot object
      if(hole === undefined || hole.shot === undefined) {
        return false;
      }

      if(shot_num === undefined) {
        shot_num = -1;
      }

      var hole_shot_length = hole.shot.length;
      if(hole_shot_length > 0) {
        // if shot is last available, or on tee state
        if(shot_num >= hole_shot_length || shot_num === 0) {
          // see if there's a next hole available
          // for tee state, in case of data under review while player has moved on
          var next = round[hole_num + 1];

          // check for end of round/wrapping scenarios
          if(this.isSplitForRound(round_num)) {
            if(hole_num === 18) {
              hole_num = 0;
              next = round[1];
            } else if(hole_num === 9) {
              // can't have split tee state while not in latest round,
              // thus no next round shots exist when on the last hole in a
              // split tee round
              return false;
            }
          } else {
            // if at end of round, check if there's a first shot available for the next round
            if(hole_num === 18) {
              round_num++;
              return this.hasNextShot(round_num);
            }
          }

          if(next !== undefined) {
            // if there is a next hole, check for it's first shot
            return this.hasNextShot(round_num, hole_num + 1);
          }
          return false;
        }

        var shot = hole.shot[shot_num];
        if(shot_num === -1) {
          // return first shot on hole
          shot = hole.shot[0];
          if(shot.type !== 'NEXT') {
            shot_num = 0;
          }
        }

        // shot_num - 1 is current shot, shot_num is next shot
        return { round: round_num, hole: hole_num, shot: shot, number: shot_num + 1 };
      }

      // empty shot array?
      return false;
    },

    // given a round/hole/shot combination, determine if there is a previous shot available for the player
    // all values are expected to be 1-indexed
    hasPrevShot: function(round_num, hole_num, shot_num) {
      var round = this.get('round_data')[round_num - 1];

      if(round === undefined) {
        return false;
      }

      if(hole_num === undefined) {
        // assume looking for shot on last hole of round
        // so set hole to last hole of round
        // don't need to check for split because not currently active round
        hole_num = 18;

        // set shot_num to value we can check for once we've grabbed the hole info
        shot_num = -1;
      }

      var hole = round[hole_num];
      if(hole === undefined || hole.shot === undefined) {
        return false;
      }

      // checking for last shot
      if(shot_num === undefined) {
        shot_num = 0;
      }

      // if less than 0, means we're looking for final shot of hole
      else if(shot_num < 0) {
        shot_num = hole.shot.length + 1;
      }

      var hole_shot_length = hole.shot.length;
      if(hole_shot_length > 0) {
        // first shot, so need to check for previous hole
        if(shot_num <= 1) {
          var prev = round[hole_num - 1];

          if(this.isSplitForRound(round_num)) {
            if(hole_num === 1) {
              hole_num = 19;
              prev = round[18];
            } else if(hole_num === 10) {
              // first hole of current round, check previous round
              round_num--;
              return this.hasPrevShot(round_num);
            }
          } else {
            if(hole_num === 1) {
              // first hole of current round, check previous round
              round_num--;
              return this.hasPrevShot(round_num);
            }
          }

          if(prev !== undefined) {
            // use length + 1 because shot number is 1-indexed, need to pass shot after last shot
            return this.hasPrevShot(round_num, hole_num - 1, prev.shot.length + 1);
          }
          return false;
        }

        // return previous shot
        else if(shot_num <= hole_shot_length + 1) {
          return { round: round_num, hole: hole_num, shot: hole.shot[shot_num - 2], number: shot_num - 1 };
        }

        // shot_num needs to be greater than hole_shot_length here
        // not sure how to treat, or if this would ever occur even
        return false;
      }

      // empty shot array?
      return false;
    }

  });

  return Player;
});

