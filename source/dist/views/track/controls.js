define('views/track/controls',['require','backbone','utils/browser','utils/scores','utils/pubsub','utils/autocolumn','collections/holes','utils/window-size','models/track/state','utils/track/constants','collections/track/players','utils/track/gfx','utils/track/track','views/track/live-video'],function(require) {
  var Backbone = require('backbone'),
      Browser = require('utils/browser'),
      Scores = require('utils/scores'),
      PubSub = require('utils/pubsub'),
      AutoColumn = require('utils/autocolumn'),
      HoleInfo = require('collections/holes'),
      Win = require('utils/window-size'),

      State = require('models/track/state'),
      Constants = require('utils/track/constants'),
      Players = require('collections/track/players'),
      GfxUtils = require('utils/track/gfx'),
      TrackUtils = require('utils/track/track'),
      TrackLiveVideo = require('views/track/live-video')
      ;

  var TrackControls = Backbone.View.extend({
    el: '#controls',

    events: {
      'click div.hole-info': 'toggleHole',
      'click div.round-info': 'toggleRound',
      'click div.options-nav li.video': 'toggleLiveVideo',
      'click div.options-nav li.highlight': 'goToHighlight',

      'click li.enabled.hole': 'clickHole',
      'click li.enabled.round': 'clickRound',

      'click .prev.enabled a.nav-control-link': 'selectPrevShot',
      'click .next.enabled a.nav-control-link': 'selectNextShot',
      'click .nav-control a.nav-control-link': 'noOp',

      'click .fairway': 'returnToFairway'
    },

    hole_open: false,
    round_open: false,

    viewing_round: -1,
    enable_holes: {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0, '10': 0, '11': 0, '12': 0, '13': 0, '14': 0, '15': 0, '16': 0, '17': 0, '18': 0},
    enable_rounds: {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0},
    last_enable_hole: -1,

    initialize: function() {
      this.logger = new eventsCore.util.Logger('Track/Controls');

      this.options = this.$('div.options');

      this.listenTo(State, 'controls:options:hide', this.hideOptions);
      this.listenTo(State, 'controls:holelist:reset', this.determineEnabledHoles);
      this.listenTo(State, 'controls:hole:change', this.changeHole);
      this.listenTo(State, 'controls:shot:set', this.setSelectedShot);
      this.listenTo(State, 'controls:shot:select', this.selectShot);
      this.listenTo(State, 'controls:shot:autoselect', this.autoSelectShot);
      this.listenTo(State, 'controls:arrows:reset', this.updateVisibleArrows);

      this.listenTo(State, 'controls:hole:previous', this.prevHole);
      this.listenTo(State, 'controls:hole:next', this.nextHole);

      this.listenTo(State, 'change:view_fairway', this.toggleFairwayButton);

      this.livevideo = new TrackLiveVideo({
        el: this.options.filter('.options-nav').find('.video')
      });

      // enable left/right arrows to navigation between shots
      $(document).on('keydown.track', function(e) {
        if(e.target.nodeName.toLowerCase() === 'input') {
          return;
        }
        keycode = e.keyCode || e.which;
        if(keycode === 37 && this.$('.prev.enabled').length > 0) {
          this.prevShot();
          TrackUtils.measure('Shot', 'Previous', 'Key Left');
        } else if(keycode === 39 && this.$('.next.enabled').length > 0) {
          this.nextShot();
          TrackUtils.measure('Shot', 'Next', 'Key Right');
        }
      }.bind(this));
    },

    render: function() {
      if(!Modernizr.csscolumns) {
        this.hole_nav = new AutoColumn(this.$el, { max: 2, min: 2 });
        this.hole_nav.run(this.$('.hole-nav'));
      }

      if(Browser.app) {
        var maplink = this.$('.hole-nav > a').attr('href');
        this.$('.hole-nav > a').attr('href', '/android' + maplink);
      }

      return this;
    },

    onDispose: function() {
      $(document).off('keydown.track');
      this.livevideo.dispose();
    },

    /** Events Handlers */

    toggleHole: function() {
      if(this.hole_open) {
        this.hideOptions();
        TrackUtils.measure('Menu', 'Hole', 'Close');
      } else {
        this.showOptionHole();
        TrackUtils.measure('Menu', 'Hole', 'Open');
      }
    },

    toggleRound: function() {
      if(this.round_open) {
        this.hideOptions();
        TrackUtils.measure('Menu', 'Round', 'Close');
      } else {
        this.showOptionRound();
        TrackUtils.measure('Menu', 'Round', 'Open');
      }
    },

    hideOptions: function() {
      this.hole_open = false;
      this.round_open = false;
      this.options.removeClass('open');

      this.viewing_round = -1;
    },

    showOption: function(option) {
      this.hideOptions();
      State.trigger('playerlist:close');
      State.trigger('shotlist:close');
      option.addClass('open');
    },

    showOptionHole: function() {
      this.showOption(this.$('div.hole-info'));
      this.hole_open = true;
      State.trigger('controls:holelist:open');
    },

    showOptionRound: function() {
      this.showOption(this.$('div.round-info'));
      this.round_open = true;
      State.trigger('controls:roundlist:open');
    },

    goToHighlight: function() {
      // TODO
      if(!Browser.app) {
        // TrackerHighlight.navigateToHighlight();
      }      else if(Browser.apptype.android) {
        // location.href = 'mobileapps://video?id=' + Settings.tournament_year + '_' + TrackerHighlight.getVideoId(Track.player_position.primary, Track.selected_round, Track.selected_hole);
      }
    },

    /**
     * Clicked on a hole number in the hole list
     * @param {Event} e Standard jQuery Event object
     */
    clickHole: function(e) {
      var _this = e.currentTarget;
      var hole = parseInt(_this.getAttribute('data-hole'), 10);
      if(!isNaN(hole)) {
        // get round number
        // var round_str = t.controls.find('.round-nav .round.selected').attr('data-round');
        // var round = parseInt(round_str,10);
        var round = State.get('selected_round');
        this.setRound(round);

        this.selectHole(hole);

        this.hideOptions();

        this.removeGreenOverlay();

        TrackUtils.measure('Menu', 'Hole ' + hole);
      }
    },

    clickRound: function(e) {
      var _this = e.currentTarget;
      var round = parseInt(_this.getAttribute('data-round'), 10);
      if(!isNaN(round)) {
        this.selectRound(round);
        this.setRound(round);

        // var hole = t.controls.find('.hole-nav .hole.selected').attr('data-hole');
        // hole = parseInt(hole, 10);
        var hole = State.get('selected_hole');
        this.selectHole(hole);

        this.hideOptions();

        this.removeGreenOverlay();

        TrackUtils.measure('Menu', _this.innerHTML);
      }
    },

    selectPrevShot: function() {
      this.prevShot();

      if(State.get('view_fairway')) {
        this.removeGreenOverlay();
      }

      TrackUtils.measure('Shot', 'Previous', 'Arrow Left');
    },

    selectNextShot: function() {
      this.nextShot();

      if(State.get('view_fairway')) {
        this.removeGreenOverlay();
      }

      TrackUtils.measure('Shot', 'Next', 'Arrow Right');
    },

    noOp: function(e) { e.preventDefault(); },

    /** Control methods */

    // given selected player, figure out how far he is from score file, enable all those holes
    determineEnabledHoles: function() {
      this.logger.info('determineEnabledHoles called');
      var player = Players.getPlayer();

      // first disable all rounds/holes
      // controls.find('.cell.enabled').removeClass('enabled');
      $.each(this.enable_holes, function(key) {
        this.enable_holes[key] = 0;
      }.bind(this));
      $.each(this.enable_rounds, function(key) {
        this.enable_rounds[key] = 0;
      }.bind(this));

      var rd = this.viewing_round;
      if(this.viewing_round < 1) {
        rd = State.get('selected_round');
      }

      // decide whether to enable or disable playoff tabs
      var playoff_player = false;
      if(Scores.Playoff.active) {
        playoff_player = player.get('latest_round') > 4;
        if(!playoff_player) {
          this.disablePlayoff();
        } else {
          this.enablePlayoff();

          // enable all round tabs
          // controls.find('.round').addClass('enabled');
          $.each(this.enable_rounds, function(key) {
            this.enable_rounds[key] = 1;
          }.bind(this));
        }
      }

      var hole_updated = false;

      // make updates for playoff tab
      if(rd === 5 && playoff_player) {
        State.set('showing_playoff', true);

        // switch to playoff holes
        this.setPlayoffHoles();

        for(var i = 1; i <= player.get('latest_hole'); i++) {
          this.enable_holes[i] = 1;
          this.last_enable_hole = i;
        }

        hole_updated = true;
      }

      if(!hole_updated) {
        // switch to playoff holes
        this.setNormalHoles();
        State.set('showing_playoff', false);

        for(var i = 1; i <= player.get('latest_round'); i++) {
          this.enable_rounds[i] = 1;
        }

        if(rd < player.get('latest_round')) {
          $.each(this.enable_holes, function(key) {
            this.enable_holes[key] = 1;
          }.bind(this));
        } else if(rd === player.get('latest_round')) {
          if(!player.get('splittee')) {
            for(var j = 1; j <= player.get('latest_hole'); j++) {
              this.enable_holes[j] = 1;
              this.last_enable_hole = j;
            }
          } else {
            if(player.get('latest_hole') > 9) {
              var over = player.get('latest_hole') - 9;

              // enable all back 9
              for(var j = 10; j <= 18; j++) {
                this.enable_holes[j] = 1;
                this.last_enable_hole = j;
              }

              // enable front 9 through 'over' value
              // holes.slice(0,over).addClass('enabled');
              for(var j = 1; j <= over; j++) {
                this.enable_holes[j] = 1;
                this.last_enable_hole = j;
              }
            }

            // still on back 9, just enable those
            else {
              for(var j = 10; j <= 9 + player.get('latest_hole'); j++) {
                this.enable_holes[j] = 1;
                this.last_enable_hole = j;
              }
            }
          }
        }

        hole_updated = true;
      }

      this.updateEnabledHoles();
    },

    updateEnabledHoles: function() {
      // first disable all rounds/holes
      var player = Players.getPlayer();
      this.$('.cell.enabled').removeClass('enabled').removeClass('current');
      var rounds = this.$('.round');
      for(var i = 1; i <= 5; i++) {
        if(this.enable_rounds[i] === 1) {
          rounds.eq(i - 1).addClass('enabled');
        }
      }
      rounds.eq(player.get('latest_round') - 1).addClass('current');

      var holes = this.$('.hole');
      for(var i = 1; i <= 18; i++) {
        if(this.enable_holes[i] === 1) {
          holes.eq(i - 1).addClass('enabled');
        }
      }

      // use isActiveRound to verify the round is active (for concurrent)
      // also check that we're in player's latest available round
      if(Scores.Utilities.isActiveRound(State.get('selected_round')) && State.get('selected_round') === player.get('latest_round')) {
        var h = player.getLastHole() - 1;
        holes.eq(h).addClass('current');
      }
    },

    enablePlayoff: function() {
      // enable playoff tab
      this.$('.round-nav').addClass('playoff');
    },

    disablePlayoff: function() {
      // disable playoff tab
      this.$('.round-nav').removeClass('playoff');
    },

    setPlayoffHoles: function() {
      // switch hole numbers
      this.$('.hole').html('').each(function(i) {
        if(i % 2 === 0) {
          this.innerHTML = '18';
        } else {
          this.innerHTML = '10';
        }
      });
    },

    setNormalHoles: function() {
      // switch hole numbers
      this.$('.hole').each(function(i) {
        this.innerHTML = this.getAttribute('data-hole');
      });
    },

    selectHole: function(x, _default_shot) {
      this.goToHole(x, function(player) {
        if(player.get('current_hole') !== undefined) {
          var s = 1;
          var shot = _default_shot;
          if(shot > 0 && shot < player.get('current_hole').shots.length) {
            s = shot;
          } else if(player.get('newly_selected')) {
            // if player is active and we're on the latest round/hole for player
            // then show last shot
            var latest_hole = player.getLastHole();
            if(Scores.Utilities.isActivePlayer(player.id) && State.get('selected_round') === player.get('latest_round') && State.get('selected_hole') === latest_hole) {
              s = player.get('latest_shot');
            }

            player.set('newly_selected', false);
          }
          this.selectShot(s);
        }
      }.bind(this));

      State.trigger('shotlist:update');
    },

    goToHole: function(x, callback) {
      // check live mode if we go to hole x
      var player = Players.getPlayer();
      player.check_mode(x);

      this.changeHole(x);

      player.loadGroup();

      // load hole data
      // trigger refresh in all active players
      player.process(callback);
      var types = ['compare', 'ghost'];
      if(State.get('compare_mode')) {
        types = ['compare'];
      }
      for(var k = 0, m = types.length; k < m; k++) {
        var type = types[k];
        for(var i = 0, l = State.player_position[type].length; i < l; i++) {
          var pid = State.player_position[type][i];
          Players.get(pid).process();
        }
      }

      // TODO: check for highlight video
      // TrackerHighlight.check();

      // Track.Base.fetch(callback);
      GfxUtils.redraw();

      // load mobile shot list
      State.trigger('shotlist:set', player.get('current_hole').shots);
    },

    changeHole: function(x, rd) {
      if(rd !== undefined && rd !== State.get('selected_round')) {
        this.selectRound(rd);
        State.set('selected_round', rd);
      }

      if(this.enable_holes[x + ''] !== 1) {
        x = this.last_enable_hole;
      }

      State.set('selected_hole', x);
      this.updateHoleInfo();

      // change highlighted hole & round
      this.changeHighlightedControls('hole', x);
      this.changeHighlightedControls('round', State.get('selected_round'));

      // anytime we load a new hole, exit forced green view
      GfxUtils.exitForcedGreenView();

      // deselect selected shot
      // if(Track.selected_shot !== undefined) {
      //   Track.Controls.deselectShot();
      // }

      // clear shot overlay viewing state
      if(State.get('open_shot_detail') !== undefined) {
        State.unset('open_shot_detail');
      }

      // swap hole image
      GfxUtils.switchToView(Constants.VIEW.fairway);
      State.trigger('holeimage:change');
      this.updateVisibleArrows();
    },

    setRound: function(x) {
      State.set('selected_round', x);
    },

    selectRound: function(x) {
      this.viewing_round = x;

      // this.updateHoleInfo();

      // change highlighted round
      this.changeHighlightedControls('round', x);

      // update available holes when switching rounds
      this.determineEnabledHoles();
    },

    updateHoleInfo: function() {
      if(HoleInfo.length > 0) {
        var h = HoleInfo.get(State.get('selected_hole'));
        if(State.get('showing_playoff')) {
          if(State.get('selected_hole') % 2 === 0) {
            h = HoleInfo.get(10);
          } else {
            h = HoleInfo.get(18);
          }
        }
        State.trigger('hole:change', h);
        this.$('.hole-info').attr('data-hole', h.get('number')).toggleClass('android4');

        this.$('#holeName').html(h.get('plant'));
        this.$('#holeYds').html(h.get('yds'));
        this.$('#holePar').html(h.get('par'));
        this.$('#holeNameMobile').html('Hole' + '<span>'  + h.get('number') + '</span>');

        var round_name = State.get('selected_round');
        round_name = this.$('.round-nav .round').filter('[data-round=' + round_name + ']').text();
        this.$('.round-info').attr('data-round', round_name)
            .find('.roundNumber').html(round_name);
      } else {
        this.stopListening(State, 'holeinfo:ready', this.updateHoleInfo)
          .listenToOnce(State, 'holeinfo:ready', this.updateHoleInfo);
      }
    },

    selectShot: function(shotnum) {
      if(shotnum > -1) {
        var shots = Players.getPlayer().get('current_hole').shots;
        var selected = shots[shotnum - 1];
        if(shotnum === 0 && selected === undefined) {
          selected = shots[0];
        }
        var switched_view = false;

        // if in Fairway view and clicking on final score
        if(State.get('view_fairway') && selected.get('number') > 1 && (parseInt(selected.get('remaining'), 10) === 0 || selected.get('ongreen'))) {
          // switch user to Green view
          GfxUtils.switchToView(Constants.VIEW.green);
          switched_view = true;
        }

        if(!State.get('view_fairway') && (!selected.get('ongreen') || selected.get('number') <= 1)) {
          // switch user to Fairway view
          GfxUtils.switchToView(Constants.VIEW.fairway);
          switched_view = true;
        }

        if(selected !== State.get('selected_shot')) {
          // deselect previous shot
          if(State.get('selected_shot') !== undefined) {
            State.get('selected_shot').deselect().hide_details();
          }

          // set viewing to false for open detail
          if(State.get('open_shot_detail') && State.get('open_shot_detail') !== shotnum) {
            shots[State.get('open_shot_detail') - 1].hide_details();
          }

          // hide ghost shots, only exist in live mode
          // if(Track.live_mode) {
          //   for(var i=0,l=Track.player_position.ghost.length;i<l;i++) {
          //     var pid = Track.player_position.ghost[i];
          //       Track.players[pid].hide_ghost_overlay();
          //   }
          // }

          this.setSelectedShot(selected);

          // draw updated shot selection
          // class names for marker HTML is automatically picked up during redraw
          GfxUtils.redraw();
        } else {
          // set viewing to false for open detail
          if(State.get('open_shot_detail') && State.get('open_shot_detail') !== shotnum) {
            shots[State.get('open_shot_detail') - 1].hide_details();
          }

          selected.show_details();

          // if we switched views at any point, or
          // we have two compare players and
          // this is the first shot on the hole, which may have been auto-selected without redrawing
          // then need to redraw arcs
          if(switched_view || (State.player_position.compare.length > 1 && selected.get('number') <= 1)) {
            GfxUtils.redraw();
          }
        }
      }
    },

    setSelectedShot: function(shot, show_details) {
      // assign and select newly selected shot
      State.set('selected_shot', shot.select());
      if(show_details === undefined || show_details === true) {
        shot.show_details();
      }

      // if shot number is 0, create Tee State
      if(shot.get('number') === 0) {
        this.$('.shot-info').addClass('tee').html('');
      } else {
        this.$('.shot-info').removeClass('tee').html(shot.get('number'));
      }
      this.updateVisibleArrows();

      TrackUtils.updateURL();
    },

    autoSelectShot: function(shotnum) {
      if(shotnum > 0) {
        /**
         * This section checks if auto-advanced selected shot is on the
         * green. If so, it kicks the user out of forced green mode, if
         * it was active.
         */
        var shots = Players.getPlayer().get('current_hole').shots;
        var shot = shots[shotnum - 1];

        // check if shot is on green
        var isongreen = shot.get('ongreen');

        // if so, and in forced green mode, take us out of that mode
        if(isongreen && State.get('forced_green')) {
          GfxUtils.exitForcedGreenView();
        }

        this.selectShot(shotnum);
      }
    },

    // DEPRECATED: should never be called, no unselected shot state
    deselectShot: function() {
      State.get('selected_shot').deselect().hide_details();
      State.unset('selected_shot');

      // only way to stay in green view is to select a shot on the green
      GfxUtils.switchToView(Constants.VIEW.fairway);
      this.$('.shot-info').html('');
    },

    updateVisibleArrows: function() {
      this.logger.info('calling updateVisibleArrows');

      // show both arrows
      this.$('.nav-control').addClass('enabled');

      // check for next shot
      var shot_num = -1;
      var ongreen = false;
      if(State.get('selected_shot') !== undefined) {
        shot_num = State.get('selected_shot').get('number');
        ongreen = State.get('selected_shot').get('ongreen');
      }

      // if no next shot, logically
      if(Players.getPlayer().hasNextShot(State.get('selected_round'), State.get('selected_hole'), shot_num) === false) {
        // and we're not in fairway view on the first shot that landed on the green
        if(!(State.get('view_fairway') && shot_num === 1 && ongreen)) {
          // then disable the next arrow
          this.$('.next').removeClass('enabled');
        }
      }

      // only hide prev arrow if in first round, first shot selected, and no shot on previous hole
      if(State.get('selected_round') === 1
          && shot_num === 1
          && Players.getPlayer().hasPrevShot(State.get('selected_round'), State.get('selected_hole')) === false) {
        this.$('.prev').removeClass('enabled');
      }
    },

    nextShot: function() {
      var player = Players.getPlayer();
      if(State.get('selected_shot') === undefined) {
        if(player.get('current_hole').shots.length >= 1) {
          // select first shot
          this.selectShot(1);
        }
      } else {
        var shot = State.get('selected_shot');
        var num = shot.get('number');
        var total_shots = player.get('current_hole').shots.length;

        // if first shot, also last shot, viewing fairway, and shot is on the green
        // then next arrow switches to green view only
        if(num === 1 && num === total_shots && State.get('view_fairway') && shot.get('ongreen')) {
          GfxUtils.switchToView(Constants.VIEW.green);
          GfxUtils.redraw();
          this.updateVisibleArrows();
          return;
        }

        // if shot is not the last shot, and it's not the tee shot while only one shot on hole
        // select next shot
        if(num !== total_shots && !(num === 0 && total_shots === 1)) {
          this.selectShot(num + 1);
        } else {
          // otherwise, go to next hole
          this.goToNextHole(player, State.get('selected_round'), State.get('selected_hole'), shot.get('number'));
        }
      }
    },

    prevShot: function() {
      var player = Players.getPlayer();
      if(State.get('selected_shot') !== undefined) {
        // since shot was selected, determine whether it's the first shot
        var shot = State.get('selected_shot');
        var num = shot.get('number');
        var total_shots = player.get('current_hole').shots.length;

        // if first shot, also last shot, viewing green, and shot is on the green
        // then prev arrow switches to fairway view only
        if(num === 1 && num === total_shots && !State.get('view_fairway') && shot.get('ongreen')) {
          GfxUtils.switchToView(Constants.VIEW.fairway);
          GfxUtils.redraw();
          this.updateVisibleArrows();
          return;
        }

        if(num === 0 || num === 1) {
          // since no shot selected, previous shot will be on previous hole
          // just need to determine whether that hole is still in the current round or not
          this.goToPrevHole(player, State.get('selected_round'), State.get('selected_hole'));

        } else {
          // if (num > 1) {
            // if not, select the previous shot
          this.selectShot(num - 1);

          // } else {
          //   // if so, deselect shot, go to base unselected state
          //   Track.Controls.deselectShot();

          //   Track.Gfx.redraw();
          //   Track.Controls.updateVisibleArrows();
          // }
        }
      } else {
        // if no shot was selected somehow, select first shot
        this.selectShot(1);
      }
    },

    goToNextHole: function(player, rd, hole, shot_num) {
      var next = player.hasNextShot(rd, hole, shot_num);

      if(next !== false) {
        // if next shot is in current round
        if(next.round === State.get('selected_round')) {
          // go to hole
          this.goToHole(next.hole, function() {
            this.selectShot(1);
          }.bind(this));
        }

        // if it's in a different round
        else {
          // set the round
          State.set('selected_round', next.round);
          this.determineEnabledHoles();

          // go to proper hole
          this.goToHole(next.hole, function() {
            this.selectShot(1);
          }.bind(this));
        }

        return true;
      }

      return false;
    },

    goToPrevHole: function(player, rd, hole, shot_num) {
      var prev = player.hasPrevShot(rd, hole);

      if(prev !== false) {
        // allow shot_num to predefine shot that we want to load upon loading new hole
        // if undefined, go to last shot on hole
        if(shot_num === undefined) {
          shot_num = prev.number;
        }
        // check if previous shot is still in current round
        if(prev.round === State.get('selected_round')) {
          // if so, go to hole, select the last shot
          this.goToHole(prev.hole, function() {
            this.selectShot(shot_num);
          }.bind(this));
        }          else {
          // otherwise, set the round
          State.set('selected_round', prev.round);
          this.determineEnabledHoles();

          // go to proper hole
          this.goToHole(prev.hole, function() {
            this.selectShot(shot_num);
          }.bind(this));
        }

        return true;
      }

      return false;
    },

    nextHole: function() {
      var player = Players.getPlayer(),
          rd = State.get('selected_round'),
          hole = State.get('selected_hole'),
          last_shot = player.get('current_hole').shots.length;

      // given current round, hole, and the last shot on the current hole
      // check if there is a next shot available
      var next = this.goToNextHole(player, rd, hole, last_shot);
      if(next) {
        TrackUtils.measure('Hole', 'Next');
      }
    },

    prevHole: function() {
      var player = Players.getPlayer(),
          rd = State.get('selected_round'),
          hole = State.get('selected_hole');

      var prev = this.goToPrevHole(player, rd, hole, 1);
      if(prev) {
        TrackUtils.measure('Hole', 'Previous');
      }
    },

    changeHighlightedControls: function(type, index, _this) {
      var _hole;
      if(_this === undefined) {
        if(type === 'hole' || type === 'round') {
          _this = this.$('.' + type).eq(index - 1);
        }
        if(type === 'round') {
          _hole = this.$('.hole.selected');
        }
      }

      // everything is in single column now, don't need to look for sibling columns
      _this.addClass('selected')
        .siblings('.selected').removeClass('selected');

      // if (type === 'round') {
      //   if(index !== Track.selected_round) {
      //     _hole.removeClass('selected');
      //   } else {
      //     this.controls.find('.hole').eq(Track.selected_hole - 1).addClass('selected');
      //   }
      // }

      if(Scores.Utilities.currentRoundWithPlayoff() !== State.get('selected_round')) {
        this.$('.hole').removeClass('current');
      }
    },

    // reset selected round/hole number to currently viewed round/hole
    resetHighlightedControls: function() {
      this.$('.hole, .round').filter('.selected').removeClass('selected');

      var h = this.$('.hole.selected').index();
      if(State.get('selected_hole') !== h + 1) {
        this.$('.hole').eq(State.get('selected_hole') - 1).addClass('selected');
      }
      var r = this.$('.round.selected').index();
      if(State.get('selected_round') !== r + 1) {
        this.$('.round').eq(State.get('selected_round') - 1).addClass('selected');
      }
    },

    removeGreenOverlay: function() {
      // remove video tag
      this.$('#maps').find('video').hide().remove();

      // for quick demo, remove the green grid hard coded image
      this.$('#maps').find('#greenContourOverlay').remove();
    },

    returnToFairway: function() {
      // turn off forced green
      GfxUtils.exitForcedGreenView();

      // select first shot
      if(State.get('selected_shot').get('number') > 0) {
        this.selectShot(1);
      } else {
        this.selectShot(0);
      }

      // measure
      TrackUtils.measure('Fairway');

      return false;
    },

    toggleFairwayButton: function(state, value, options) {
      if(value) {
        this.$('#forceFairway').hide();
      } else {
        this.$('#forceFairway').show();
      }
    }
  });

  return TrackControls;
});

