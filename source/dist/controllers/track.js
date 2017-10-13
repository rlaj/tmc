define('controllers/track',['require','jquery','backbone','baseview','utils/browser','utils/pubsub','utils/background','collections/holes','utils/scores','utils/metrics','utils/social','utils/favorites','models/track/state','utils/track/constants','views/track/track','views/track/size','views/track/nav-bar','views/track/controls','views/track/green-video','views/track/shot-list','views/track/mobile-shot-list','utils/track/track','collections/track/players','models/track/player','jquery.touchswipe'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      BaseView = require('baseview'),
      Browser = require('utils/browser'),
      PubSub = require('utils/pubsub'),
      Background = require('utils/background'),
      HoleInfo = require('collections/holes'),
      Scores = require('utils/scores'),
      Metrics = require('utils/metrics'),
      Share = require('utils/social'),
      Favorites = require('utils/favorites'),

      State = require('models/track/state'),
      Constants = require('utils/track/constants'),
      TrackView = require('views/track/track'),
      TrackSize = require('views/track/size'),
      TrackNavBar = require('views/track/nav-bar'),
      TrackControls = require('views/track/controls'),
      TrackGreenVideo = require('views/track/green-video'),
      TrackShotList = require('views/track/shot-list'),
      TrackMobileShotList = require('views/track/mobile-shot-list'),

      TrackUtils = require('utils/track/track'),
      Players = require('collections/track/players'),
      Player = require('models/track/player')
      ;

  require('jquery.touchswipe');

  var Track = BaseView.extend({

    events: {
      'click #playerMessage a.linktag': 'viewActiveLeader'
    },

    onInitialization: function() {
      this.logger = new eventsCore.util.Logger('Track');

      Favorites.prefix = 'Track:Detail';

      HoleInfo.fetch({
        success: function() {
          State.trigger('holeinfo:ready');
        }
      });
      this.load_teepin();

      this.mobileShotWrapper = this.$('.mobile-shot-list-wrapper');
      this.primary = this.$('.player-box .primary');
      this.controlbar = this.$('.control-bar');

      if(Browser.ie8) {
        var $iebg = this.$('div.iefixedbg');
        if($iebg.length > 0) {
          this.iebg = new Background($iebg);
        }
      }

      if(Browser.ios) {
        this.$el.addClass('ios');
      } else {
        this.$el.addClass('standard');
      }

      this.view = new TrackView({
        el: this.$('#holeContainer')
      });
      this.controls = new TrackControls({
        el: this.$('#controls')
      }).render();
      this.navbar = new TrackNavBar({
        el: this.$('.nav-control-wrap')
      });
      this.greenvideos = new TrackGreenVideo({
        el: this.$('.trackerWrapper')
      });
      this.shotlist = new TrackShotList({
        el: this.$('.shot-list-info')
      });
      this.mobileshotlist = new TrackMobileShotList({
        el: this.$('.mobile-shot-list-wrapper')
      });

      this.loadScreenShare();

      this.listenTo(State, 'track:load:default', this.loadDefaultPlayer);
      this.listenTo(State, 'track:player', this.switchToSelectedPlayer);
      this.listenTo(State, 'track:compare:add', this.addComparePlayer);
      this.listenTo(State, 'change:view_fairway', this.toggleWhatsNewForGreenDetailView);

      this.listenTo(State, 'track:error:hide', this.hideOverlay);
      this.listenTo(State, 'track:error:show', this.showErrorMessage);

      this.listenTo(State, 'track:playerload:complete', this.onLoadComplete);

      // load this here so it can stop when page is unloaded
      this.listenTo(PubSub, 'scores:refresh', this.refreshPlayers);
    },

    processPageVars: function() {
      this.pageTitle = 'Detail';

      // set prop34 if requested with specific player
      var pid = eventsCore.util.getUrlParam('pid');
      if(pid !== null && pid !== '') {
        this.props = {
          prop34: pid
        };
      }
    },

    onRender: function() {
      this.logger.info('rendering');

      this.navbar.render();
      this.view.render();
      this.greenvideos.render();
      this.shotlist.render();
      this.mobileshotlist.render();

      if(State.get('view_fairway')) {
        PubSub.trigger('whats-new:show', 'greenDetailView');
      }

      // PubSub.trigger('whats-new:show', 'shotList');
      // PubSub.trigger('whats-new:show', 'shotListHighlight');

      this.size = new TrackSize({
        el: this.$('.trackerWrapper')
      }).render();

      // track page state change if in app and not first load
      if(Browser.app && eventsCore.util.getUrlParam('first') === null) {
        TrackUtils.measureState({
          playerId: eventsCore.util.getUrlParam('pid')
        });
      }
    },

    onDispose: function() {
      if(this.iebg) {
        this.iebg.dispose();
      }
      this.$el.removeClass('ios standard');

      this.view.dispose();
      this.size.dispose();
      this.controls.dispose();
      this.navbar.dispose();
      this.greenvideos.dispose();
      this.shotlist.dispose();
      this.mobileshotlist.dispose();

      while (Players.at(0)) {
        Players.at(0).destroy();
      }

      PubSub.trigger('whats-new:hide', 'greenDetailView');
      // PubSub.trigger('whats-new:hide', 'shotList');
      // PubSub.trigger('whats-new:hide', 'shotListHighlight');


      State.reset();
    },

    onLoadComplete: function() {
      this.logger.info('onLoadComplete: done drawing all players, execute completion code');

      if(typeof window.callPhantom === 'function') {
        window.callPhantom('takeShot');
      }

      State.set('notified', true);
    },

    load_teepin: function() {
      // fetch tee pin data, store
      var teepin = $.getJSON('/en_US/xml/gen/companion/teepin.json', function(data) {
        State.teepin = data;

        // update teepin data every 2 minutes
        setInterval(function() {
          $.getJSON('/en_US/xml/gen/companion/teepin.json', function(data) {
            State.teepin = data;
          });
        }, 60000 * 2);
      });

      teepin.done(function() {
        var data = this.parseRequested();
        if(data.player !== null) {
          this.loadStoredPlayer();
        } else {
          this.loadDefaultPlayer(function() {
            State.set('loaded', true);
          });
        }
      }.bind(this))
      .error(function() {

      });

      // TODO: Add error state
    },

    parseRequested: function() {
      var preselected = {
        player: null,
        round: null,
        hole: null,
        shot: null,
        compare: null
      };
      var params = {
        player: eventsCore.util.getUrlParam('pid') || null,
        round: eventsCore.util.getUrlParam('r') || null,
        hole: eventsCore.util.getUrlParam('h') || null,
        shot: eventsCore.util.getUrlParam('s') || null,
        compare: eventsCore.util.getUrlParam('c') || null
      };
      _.extend(preselected, params);
      return preselected;
    },

    refreshPlayers: function() {
      Players.refresh();
    },

    loadStoredPlayer: function() {
      if(!Scores.isDataLoaded()) {
        this.stopListening(PubSub, 'scores:refresh', this.loadStoredPlayer)
        .listenToOnce(PubSub, 'scores:refresh', this.loadStoredPlayer);

        return;
      }

      var data = this.parseRequested();
      var c = data.compare;

      // verify compare players
      var compare = [];
      if(c) {
        compare = c.split(',');
        var i = compare.length - 1;
        while (i >= 0) {
          if(Scores.Utilities.findByID(compare[i])) {
            State.set('compare_mode', true);
          } else {
            compare.splice(i, 1);
          }
          --i;
        }
      }

      this.switchToSelectedPlayer(data.player, data)
      .done(function() {
        // add compare players
        if(compare.length > 0) {
          compare.forEach(function(id) {
            this.addComparePlayer(id);
          }.bind(this));
        }
        State.set('loaded', true);
      }.bind(this));
    },

    loadDefaultPlayer: function(callback) {
      // store passed callback
      if(callback !== undefined) {
        this._callback = callback;
      }

      // in case we're not ready to execute method calls yet
      if(!Scores.isDataLoaded()) {
        this.stopListening(PubSub, 'scores:refresh', this.loadDefaultPlayer)
        .listenToOnce(PubSub, 'scores:refresh', this.loadDefaultPlayer);

        return;
      }

      // clear _callback property
      callback = this._callback;
      this._callback = undefined;

      var _default = this.parseRequested();
      var latest_round; // = Scores.Utilities.currentRound();
      var player = null;

      // check if requesting specific player
      if(_default.player !== null) {
        player = Scores.Utilities.findByID(_default.player);
      }

      // if not, load active leader by default
      if(player === null) {
        player = Scores.Utilities.findActiveLeader();
      }

      // assign default round/hole to load based on any parameters passed in
      var player_select = this.switchToSelectedPlayer(player.id, _default);

      player_select.done(function() {
        if(typeof callback === 'function') {
          callback.call(this);
        }
      });
    },

    // allow default values for round, hole to be passed in
    switchToSelectedPlayer: function(pid, _default) {
      pid = parseInt(pid, 10);
      var add_as_compare = false;

      if(Scores.collection.get(pid) === undefined) {
        State.trigger('track:error:show', pid, Constants.ERRORS.id);
        return $.Deferred().resolve();
      }

      // check and clear currently selected users
      if(State.player_position.primary !== undefined && pid !== State.player_position.primary) {
        // if player we're switching to is a compare player, swap compare and primary players
        if(State.player_position.compare.indexOf(pid) > -1) {
          TrackUtils.removeComparePlayer(pid);
          add_as_compare = State.player_position.primary;
        }

        // otherwise, free to destroy Player object
        else {
          Players.getPlayer().destroy();
        }
      }

      // check ghost players, destroy if no longer needed, else if compare player, set inactive
      for(var i = State.player_position.ghost.length - 1; i >= 0; --i) {
        var ghp = Players.get(State.player_position.ghost[i]);
        if(pid !== State.player_position.ghost[i]) {
          // verify Player is still a ghost player, and not a compare player, before destroying
          if(ghp.get('state') === Constants.STATE.GHOST) {
            ghp.destroy();
          }
        } else {
          if(State.player_position.compare.indexOf(pid) === -1) {
            ghp.set_inactive();
          }
        }
      }

      var player = Players.get(pid);

      // check if player object already exists
      if(player === undefined) {
        player = new Player({id: pid});
      }
      var player_select = player.select();

      if(add_as_compare !== false) {
        player_select.done(function() {
          this.addComparePlayer(add_as_compare);
        }.bind(this));
      }

      player_select.done(function() {
        var status = TrackUtils.checkPlayerStatus();

        if(!status) {
          return;
        }

        // assign round if exists, use first round if < 1, use latest round if beyond current play
        var in_default_rd = true;
        if(_default !== undefined && _default.round !== null) {
          var _defaultround = parseInt(_default.round, 10);
          if(isNaN(_defaultround)) {
            _defaultround = 1;
            in_default_rd = false;
          }
          if(_defaultround < 1) {
            _defaultround = 1;
            in_default_rd = false;
          }
          if(_defaultround > player.latest_round) {
            _defaultround = player.latest_round;
            in_default_rd = false;
          }
          State.set('selected_round', _defaultround);
        }

        // reset viewing_round when switching to new player
        this.controls.viewing_round = -1;

        // set split tee status based on player and round
        player.splittee = player.isSplitForRound(State.get('selected_round'));

        // if split tee, update selected hole to proper latest value
        var latest_hole = player.getLastHole();
        var _defaulthole = latest_hole;

        if(_default !== undefined && _default.round !== null && in_default_rd && _default.hole !== null) {
          // begin by assigning INT value of _default.hole
          _defaulthole = parseInt(_default.hole, 10);

          // if hole is NaN or less than 1, assign first hole
          if(isNaN(_defaulthole || _defaulthole < 1)) {
            _defaulthole = 1;
          }

          // if hole is greater than 18, assign 18
          if(_defaulthole > 18) {
            _defaulthole = 18;
          }

          // if in current round
          if(State.get('selected_round') === player.latest_round) {
            var sel_hole = _defaulthole;

            // store latest hole if selected is further than latest
            if(_defaulthole > latest_hole) {
              sel_hole = latest_hole;
            }

            // but if split tee, and latest is on front 9, and selected on back 9, then reset to original value
            if(player.splittee) {
              if(_defaulthole >= 10 && latest_hole <= 9) {
                sel_hole = _defaulthole;
              }
              if(_defaulthole <= 9 && latest_hole >= 10) {
                sel_hole = latest_hole;
              }
            }

            // finally assign selected_hole value
            _defaulthole = sel_hole;
          }
        }
        State.set('selected_hole', _defaulthole);

        // clear out any selected shot if we're switching players
        var _selectedshot = State.get('selected_shot');
        if(_selectedshot !== undefined) {
          _selectedshot.deselect();
          State.unset('selected_shot');
        }

        this.controls.determineEnabledHoles();

        // clear selected shot
        // if (Track.selected_shot !== undefined) {
        //   Track.Controls.deselectShot();
        // }

        var _default_shot;
        if(_default !== undefined && _default.shot !== null) {
          _default_shot = _default.shot;
        }

        State.addToTotal(player.id);

        this.controls.selectHole(State.get('selected_hole'), _default_shot);

        // if comparing, update primary player in stat bar
        if(State.get('compare_mode')) {
          State.trigger('statbar:set');
        }

        // TODO: Re-evaluate why we're triggering this event after switching players
        // Can we trigger a different, more specific, event for what we need?
        PubSub.trigger('livevideo:reset');

        // $(window).trigger('livevideo.refresh');
      }.bind(this));

      return player_select;
    },

    // assumptions:
    // - compare slot is available
    // - can't add primary player or 1st compared player
    addComparePlayer: function(pid) {
      this.logger.info('Adding ' + pid + ' as a compare player');
      var player = Players.get(pid);

      // check if player object already exists
      if(player === undefined) {
        player = new Player({ id: pid });
      }

      // check and clear currently selected users
      pid = parseInt(pid, 10);

      player.set_compare();

      // // clear ghost players if any
      // for(var i=0,l=Track.player_position.ghost.length;i<l;i++) {
      //   var gh = Track.players[Track.player_position.ghost[i]];
      //   if(gh.state === STATE.GHOST) {
      //     gh.canvas.clear();
      //   }
      // }

      // hide any open overlays
      for(var i = State.get('open_shot_stack').length - 1; i >= 0; --i) {
        State.get('open_shot_stack')[i].hide_details();
      }

      TrackUtils.updateURL();

      State.addToTotal(player.id);
    },

    hideOverlay: function() {
      this.$('#playerMessage').hide();
    },

    showErrorMessage: function(name, error) {
      // show error message
      var msgOverlay = this.$('#playerMessage');
      msgOverlay.find('.header').html(error.header);
      msgOverlay.find('.text').html(error.msg.replace(/#{[^}]*}/, name));
      msgOverlay.show();

      State.set('error_shown', true);
    },

    viewActiveLeader: function(e) {
      e.preventDefault();

      // clear url defaults
      Backbone.history.navigate(TrackUtils.getURL(), false);
      eventsCore.util.updateParams();
      this.loadDefaultPlayer();

      this.hideOverlay();

      TrackUtils.measure('Error Message', 'View Leader');
    },

    loadScreenShare: function() {
      // construct share URL
      var _url = _.template('http://track.masters.com/masters/track/<%= round %>/<%= player %>/<%= hole %>/<%= shot %>');

      this.listenTo(State, 'route:change', function() {
        if(State.get('selected_shot')) {
          var params = {
            round: State.get('selected_round'),
            player: State.player_position.primary,
            hole: State.get('selected_hole'),
            shot: State.get('selected_shot').get('number')
          };
          var url = _url(params);

          var l = State.player_position.compare.length;
          if(l > 0) {
            var c = '';
            for(var i = 0; i < l; i++) {
              if(i > 0) { c += ','; }
              c += State.player_position.compare[i];
            }
            url += '?comparePlayers=' + c;
          }

          if(!Browser.app) {
            Share.loadSocialOverlay(this.$('.share'), url, 'Track', 'Detail');
          } else if(Browser.app && Browser.apptype.android) {
            this.$('.share').off('click').on('click', function(e) {
              Metrics.appShare(e, url);
            });
          }
        }
      }.bind(this));
    },

    toggleWhatsNewForGreenDetailView: function(model, isFairwayView) {
      var action = isFairwayView ? 'show' : 'hide';
      PubSub.trigger('whats-new:' + action, 'greenDetailView');
    }

  });

  return Track;
});

