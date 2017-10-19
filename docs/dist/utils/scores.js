define('utils/scores',['require','settings','utils/pubsub','collections/score-players','collections/lb-playoff-players','models/score-player'],function(require) {
  var Settings = require('settings'),
      PubSub = require('utils/pubsub'),
      ScorePlayers = require('collections/score-players'),
      PlayoffPlayers = require('collections/lb-playoff-players'),
      ScorePlayer = require('models/score-player')
      ;


  var Scores = function() {
    this.collection;
    this.playoff_collection;
    this.callback = function() {};
    this.interval = 15; // in seconds
    this.timeoutId;

    var _initialized = false; // prevent accidentally running init twice on same page
    var _loaded = false;

    var _startCodes = {
      normal: 'A',
      split: 'J',
      not_started: 'Z'
    };

      /*
        A:  Player is active in the current round.
        C:  Player has been cut.
        D:  Player has been disqualified.
        F:  Player has finished the latest round.
        N:  Player is still in the tournament but has yet to tee off for the latest round.
        W:  Player has withdrawn.
        X:  Player is in the tournament but has yet to tee off for round 1.
      */

    var _statusCodes = {
      playing: 'N',
      not_started: 'X',
      withdrawn: 'W',
      disqualified: 'D',
      cut: 'C'
    };

    var _statusLookup = {
      'W': 'WD',
      'D': 'DQ',
      'C': 'MC'
    };

    var _statusLookupName = {
      'W': 'WITHDRAWN',
      'D': 'DISQUALIFIED',
      'C': 'MISSED CUT'
    };

    this.holePar = [4, 5, 4, 3, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 5, 3, 4, 4];

      // create lookup arrays for player ID value and first+last name string
    this.dataByID = [];
    this.dataByName = [];

    this.init = function() {
      this.logger = new eventsCore.util.Logger('Scores');
      this.logger.info('Initialize');

      if(!_initialized) {
        this.refresh();
        _initialized = true;
      }

      return this;
    };

    this.unload = function() {
      clearInterval(this.timeoutId);
    };

    this.refresh = function() {
        // allow manual call for refresh to reset timer
      clearInterval(this.timeoutId);

      if(Settings.Scores.live) {
        this.timeoutId = setInterval(this.checkScoresJson.bind(this), this.interval * 1000);
      }

      this.collection = ScorePlayers;
      this.playoff_collection = PlayoffPlayers;
      this.checkScoresJson();
    };

    this.checkScoresJson = function() {
      this.collection.fetch({
          // reset: true,
        success: function() {
          this.Playoff.check();
          _loaded = true;
          console.log('checkScoresJson - this.collection:%o', this.collection);
          console.log('checkScoresJson - this.playoff_collection:%o', this.playoff_collection);

          PubSub.trigger('scores:refresh');
        }.bind(this)
      });
    };

    this.isDataLoaded = function() {
      return _loaded;
    };


      // assign this to _this to access Scores
    var _this = this;

      /** ***
      // Scores.Utilities
      *****/
    this.Utilities = (function() {
      var module = {};

        // input:
        //  score: -1, E, 1, +1 value types
        //  round: true|false if comparing to par 70 instead of E
        // output:
        //  class name: under, par, over
      module.className = function(score, sign, round) {
        var klass;
        sign = (typeof sign === 'undefined' ? true : sign);
        if(round !== undefined && round === true) {
          if(score === 72) {
            klass = 'over';
          } else if(score > 72) {
            klass = 'over';
          } else if(score < 72) {
            klass = 'under';
          }
        } else {
          if(score === '') {
            klass = '';
          } else if(score === 0 || score === 'E') {
            klass = 'over';
          } else if(score > 0) {
            klass = 'over';
          } else if(score < 0 && !sign) {
            klass = 'under', score = score * -1;
          } else if(score < 0 && sign) {
            klass = 'under';
          } else if(score.search(/[AP]M/) > -1) {
            klass = 'time';
          }
        }

        return klass;
      };

        // return string with name of score, given score and par value
      module.scoreName = function(score, par) {
        score = parseInt(score, 10);
        if(score === 1) {
          return 'Ace';
        }

        var ou = score - parseInt(par, 10);
        var text = 'Par';
        if(ou < -2) {
          text = 'Dbl Eagle-';
        } else if(ou > 2) {
          text = 'Dbl Bogey+';
        } else {
          switch(ou) {
            case -2 : text = 'Eagle'; break;
            case -1 : text = 'Birdie'; break;
            case 1 : text = 'Bogey'; break;
            case 2 : text = 'Dbl Bogey'; break;
          }
        }

        return text;
      };

        // locate player object given player ID
        // if not found, returns null
      module.findByID = function(pid) {
        pid = parseInt(pid, 10);

          // var pos = _.indexOf(api.dataByID,pid);
          // if(pos > -1) {
        return _this.collection.get(pid);

          // } else {
          //   return null;
          // }
      };

        // given a text string, return all player objects
        // whose name match the string, first + last or last + first
      module.search = function(value) {
        var list = [];
        value = value.toLowerCase();

          // avoid regex errors with backslash when using value as regex string
        if(value.match(/\\/) !== null) {
          value = null;
        }

          // find player names that match, return with index position
        var regex = new RegExp('^' + value);
        list = _this.collection.filter(function(player) {
          var name = player.get('full_name').toLowerCase();

            // create "last first" player name string
          var last_first = player.get('last_name') + ' ' + player.get('first_name');
          last_first = last_first.toLowerCase();
          if(name.match(regex) !== null || last_first.match(regex) !== null) {
            return true;
          }
        });

          // sort by last name
        list.sort(function(a, b) {
          if(a.get('last_name') > b.get('last_name')) {
            return 1;
          } else if(a.get('last_name') < b.get('last_name')) {
            return -1;
          } else if(a.get('last_name') === b.get('last_name')) {
            return 0;
          }
        });

        return list;
      };

        // returns top player that is currently on course
        // if none are active, then return tournament leader by ID
      module.findActiveLeader = function() {
        if(!_this.Playoff.active) {
          var leader;
          leader = _this.collection.find(function(player) {
            return player.get('active');
          });
          if(!leader) {
            leader = _this.collection.at(0);
          }
          return leader;
        }
        return _this.Playoff.findActiveLeader();
      };

      module.currentRound = function() {
          // formatted in Players collection
        return _this.collection.currentRound;

          // return _this.collection.currentRound.lastIndexOf('1') + 1;
      };

      module.currentRoundWithPlayoff = function() {
        return _this.Playoff.active ? 5 : module.currentRound();
      };

      module.isActiveRound = function(round) {
        if(round === undefined || round < 1 || round > 5) {
          return false;
        }
        if(round === 5 && _this.Playoff.active) {
          return true;
        }
        round = parseInt(round, 10);
        return (_this.collection.data.currentRound[round - 1] === '1');
      };

      module.isSplit = function(player, round) {
        if(round === undefined) {
          round = module.currentRoundWithPlayoff();
        }

        // don't care about split status if round is no longer active
        if(!module.isActiveRound(round)) {
          return false;
        }

        round = parseInt(round, 10);
        var start = player.get('start');
        if(start[round] === _startCodes.split) {
          return true;
        }
        return false;
      };

      /**
       * Get the current physical hole a player is currently playing based on
       * their lastHoleWithShot data. That value will also include any playoff
       * shot progress, so don't need to separately check playoff.getCurrentHole
       * @param  {ScorePlayer}  player  Player object with score attributes
       * @return {Integer}              hole that player is on, or null if not active
       */
      module.getCurrentHole = function(player) {
        var hole = null; // module.getHoleFromThru(player.get('thru'));

        // check for players on hole 1
        if(hole === null) {
          hole = module.getHoleFromShot(player.get('lastHoleWithShot'));
        }

        // make sure player is still active when on last hole
        if(hole !== null && !module.isActivePlayer(player.id)) {
          hole = null;
        }

        return hole;
      };

      // given a thru value (with or without asterisk)
      // return hole player is currently on
      module.getHoleFromThru = function(thru) {
        if(thru !== undefined) {
          var sthru = thru.toString();

          // if player's finished, return 'hole' 19
          if(sthru.indexOf('F') > -1 || sthru.indexOf('18') > -1) {
            if(sthru.indexOf('*') > -1) {
              return 9;
            }
            return 18;
          }
          if(thru === '') {
            return null;
          }
          thru = parseInt(thru, 10);
          if(sthru.indexOf('*') > -1) {
            thru += 9;
            thru = thru % 18;
          }
          if(thru < 0 || thru > 18) {
            // thru 0 means currently on 1 when split tee
            // something's wrong here
            console.error('getCurrentHole: calculated thru < 0 or > 18 : ' + thru);
            return null;
          }

          // retrieving hole being played, so add one to the thru value
          thru += 1;
          return thru;
        }
        return null;
      };

      // given a lastHoleWithShot value
      // return hole player is currently on
      module.getHoleFromShot = function(param) {
        var tmp = param.split('|');

        var round = parseInt(tmp[0], 10);
        var hole = parseInt(tmp[1], 10);

        // Account for playoff holes
        if(round === 5 && _this.Playoff.active) {
          hole = (hole % 2 === 0) ? _this.Playoff.alt_hole : _this.Playoff.start_hole;
        }

        if(isNaN(hole)) {
          return null;
        }

        return hole;
      };

      // given hole number and split tee state, return player's next hole on course
      // returns 19 if player has finished
      // returns -1 if invalid hole
      module.getNextHole = function(hole, split) {
        hole = parseInt(hole, 10);
        if(!split) {
          if(hole < 18 && hole >= 1) {
            return hole + 1;
          } else if(hole === 18) {
            return 19;
          } else {
            return -1;
          }
        } else {
          if(hole < 18 && hole >= 1) {
            return hole + 1;
          } else if(hole === 18) {
            return 1;
          } else if(hole === 9) {
            return 19;
          } else {
            return -1;
          }
        }
      };

        // given hole number and split tee state, return player's next hole on course
        // returns 0 if no previous holes
        // returns -1 if invalid hole
        // returns last played hole if passed hole value is 19
      module.getPrevHole = function(hole, split) {
        hole = parseInt(hole, 10);
        if(!split) {
          if(hole <= 19 && hole > 1) {
            return hole - 1;
          } else if(hole === 1) {
            return 0;
          } else {
            return -1;
          }
        } else {
          if(hole === 1) {
            return 18;
          } else if(hole === 10) { // starting hole
            return 0;
          } else if(hole === 19) {
            return 9;
          } else if(hole <= 18 && hole > 1) {
            return hole - 1;
          } else {
            return -1;
          }
        }
      };

        // returns whether player has holed out on a hole, given a hole to check and a current hole value
        // hole : hole we want to check (1-18)
        // current : current hole player is on, based on getCurrentHole method above
        // split : whether this player started on the back 9
      module.hasPlayedHole = function(player, round, hole, split) {
        var tmp = player.get('lastHoleWithShot').split('|');
        var lastRound = parseInt(tmp[0], 10);
        var lastHole = parseInt(tmp[1], 10);
        round = parseInt(round, 10);

          // if lastRound is NaN, means it's either blank, or something else has gone wrong
          // so player hasn't started play yet, return false
        if(isNaN(lastRound) || isNaN(round)) {
          return false;
        }

          // if round is previous round, return true
        if(lastRound > round) {
          return true;
        }

          // if round is greater than lastRound, player hasn't
          // started round yet, return false
        else if(lastRound < round) {
          return false;
        }

          // checking for current round
        else {
          hole = parseInt(hole, 10);
          if(!split) {
            return hole <= lastHole;
          }

            // if split, check scenarios
          else {
              // both values on front 9
            if(lastHole < 10 && hole < 10) {
              return hole <= lastHole;
            }

              // both values on back 9
            else if(lastHole > 9 && hole > 9) {
              return hole <= lastHole;
            }

              // currently on front 9, checking back 9
            else if(lastHole < 10 && hole > 9) {
              return true;
            }

              // currently on back 9, checking front 9
            else if(lastHole > 9 && hole < 10) {
              return false;
            }

              // return false as a catch all in case none of the above scenarios matches
            return false;
          }
        }
      };

      module.missedCut = function(player) {
        return player.get('status') === _statusCodes.cut;
      };

      module.withdrawn = function(player) {
        return player.get('status') === _statusCodes.withdrawn;
      };

      module.disqualified = function(player) {
        return player.get('status') === _statusCodes.disqualified;
      };

      // if player is in good standing, return true
      // else, return status code 'W' for withdrawn, 'D' for disqualified, 'X' for not yet started tournament
      module.inGoodStanding = function(player) {
        if(player.get('status') === _statusCodes.withdrawn || player.get('status') === _statusCodes.disqualified
           || (player.get('status') === _statusCodes.not_started && player.get('lastHoleWithShot') === '|')) {
          return player.get('status');
        }

        return true;
      };

      // TODO: Move to ScorePlayer instance method after figuring out how to attach
      // PlayoffPlayer to ScorePlayer
      // return whether player is active, either in tournament play or in the playoff, if he's in it
      module.isActivePlayer = function(id) {
        var player = _this.collection.get(id);
        var state = false;
        if(player !== null) {
          state = player.get('active');
          if(!state && player.get('lastHoleWithShot').split('|')[1] === '1') {
            state = true;
          }

          // Need to check if playoff active, and not active in playoff
          if(_this.Playoff.active) {
            // check if player's in playoff
            var pplayer = _this.Playoff.hasPlayer(id);
            if(pplayer !== false) {
              state = pplayer.get('active');

                // if still active, check if he's only player left in playoff
                // if so, playoff is over, he's no longer active
              if(state && _this.Playoff.active_players === 1) {
                state = false;
              }
            }
          }
        }

        return state;
      };

      module.getStatusCode = function(code) {
        return _statusLookup[code];
      };

      module.getStatusName = function(code) {
        return _statusLookupName[code];
      };

      module.getPosition = function(player) {
        if(module.missedCut(player) || module.inGoodStanding(player) !== true) {
          return module.getStatusCode(player.get('status'));
        } else {
          return player.get('pos');
        }
      };

      module.getScoreFromChar = function(input, par) { // yep
        input = input.replace(/ /g, '');
        var actualScore = '0';
        if(input != '') {
          var asciiValue = input.charCodeAt(0);

          if(asciiValue >= 65 && asciiValue <= 90) {
              // Capital
            actualScore = asciiValue - 64;
          } else {
              // Lowercase letter (also means we have video)
            actualScore = asciiValue - 96;
          }
        }

        if(actualScore > par) { actualScore = actualScore * -1;}

        return actualScore;
      };

      module.getTotalForRound = function(player, roundId) {
        var total = 0;

        var tmp = player[roundId];
        tmp = tmp.split('|');

        var score = module.getScoreFromChar(tmp[2].charAt(17));
        if(score !== 0) {
          total = tmp[1];
        } else {
          total = '';
        }

        return total;
      };

      module.getOverUnderScore = function(score, par, priorTotal) {
        var empty = '';

        priorTotal = parseInt(priorTotal);
        priorTotal = isNaN(priorTotal) ? 0 : priorTotal; // check if priorTotal is NaN then set 0
        score = parseInt(score);
        par = parseInt(par);

        if(score !== 0) {
          if(score === par) {
            priorTotal += 0;
          } else if(score > par) {
            priorTotal += (score - par);
          } else if(score < par) {
            priorTotal -= (par - score);
          }

          return priorTotal;
        } else {
          return empty;
        }
      };

      module.getScoreDetails = function(player, roundNum) {
          // used on OU
        var tmp = player.get('thruHistory').split('|');

          // if roundNum is not passed, use currentRound number
        if(roundNum === '' || roundNum === undefined) { roundNum = module.currentRound(); }
        var roundThru = tmp[parseInt(roundNum) - 1];

        return {
          priorTotal: player.get('r' + roundNum + '_prior'),
          roundScores: player.get('r' + roundNum + '_roundscores'),
          roundThru: roundThru
        };
      };

      return module;
    })();

    // Scores.Playoff
    this.Playoff = (function() {
      var playoff = {};

      playoff.active = false;
      playoff.active_players = 0;
      playoff.start_hole = 18;
      playoff.alt_hole = 10;
      playoff.players;

      playoff.check = function() {
        if(_this.collection.data !== undefined && _this.collection.data.playoff !== undefined) {
          this.active = true;
          this.players = _this.collection.data.playoff.player;
          this.start_hole = _this.collection.data.playoff.starthole;
          this.alt_hole = this.start_hole === 18 ? 10 : 18;

          // count active players
          // var count = 0;
          // for(var i = 0, l = this.players.length; i < l; i++) {
          //   if(this.players[i].active) {
          //     count++;
          //   }
          // }
          // this.active_players = count;
          this.active_players = _this.playoff_collection.where({active: true }).length;
        }
      };

      // check if player is in the playoff
      // returns player object if player is
      // returns false if player is not
      playoff.hasPlayer = function(pid) {
        pid = parseInt(pid, 10);
        var player = _this.playoff_collection.get(pid);
        if(player === undefined) {
          return false;
        }

        return player;
      };

      // pass in player object from playoff JSON
      // has properties:
      // id, status, name, score, total
      playoff.getCurrentHole = function(pid) {
        var player = this.hasPlayer(pid);
        if(player !== false) {
          var val = player.get('score').split(',').length;
          if(player.get('score').length === 0) {
            return this.start_hole;
          } else if(player.get('active') && this.active_players > 1) {
            return ((val + 1) % 2 === 0) ? this.alt_hole : this.start_hole;
          }
          return (val % 2 === 0) ? this.alt_hole : this.start_hole;
        }
        return null;
      };

      playoff.hasVideo = function(pid, hole) {
        var player = this.hasPlayer(pid);
        if(player !== false) {
          var videos = player.get('video').split(',');
          if(videos[hole - 1] === '1') {
            return true;
          }
          return false;
        }
        return false;
      };

      playoff.findActiveLeader = function() {
        return _this.playoff_collection.at(0);
      };

      playoff.getClassForPlayoffScore = function(score) {
        var scoreClass = '';
        var playoffscore = parseInt(score, 10);

        // par for playoff hole is always 4
        if(playoffscore <= 2) {
          scoreClass = 'eagle';
        } else if(playoffscore === 3) {
          scoreClass = 'birdie';
        } else if(playoffscore === 4) {
          scoreClass = 'par';
        } else if(playoffscore === 5) {
          scoreClass = 'bogey';
        } else if(playoffscore >= 6) {
          scoreClass = 'dbl_bogey';
        }
        return scoreClass;
      };

      playoff.getClassForPlayoffVideo = function(video) {
        var videoClass = '';

        if(video === '1') {
          videoClass = 'video';
        }

        return videoClass;
      };

      return playoff;
    })();

    return this.init.apply(this, arguments);
  };

  var scores = new Scores();

  ScorePlayer.prototype.getCurrentHole = function() {
    return scores.Utilities.getCurrentHole(this);
  };

  return scores;
});

