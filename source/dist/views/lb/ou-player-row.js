define('views/lb/ou-player-row',['require','jquery','underscore','backbone','utils/browser','utils/pubsub','utils/scores','utils/lb/lb-common','text!templates/lb/ou-player-row.html!strip','text!templates/lb/trad-edge-status-cell.html!strip','utils/favorites'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      Browser = require('utils/browser'),
      PubSub = require('utils/pubsub'),
      Scores = require('utils/scores'),
      LBCommon = require('utils/lb/lb-common'),
      playerRowTemplate = require('text!templates/lb/ou-player-row.html!strip'),
      tradEdgeStatusCellTemplate = require('text!templates/lb/trad-edge-status-cell.html!strip'),
      Favorites = require('utils/favorites')
      ;

  var JST = {};
  // klass, score
  JST.score_cell = _.template(
    '<div class="data <%= klass %>"><%= score %></div>'
  );
  JST.score_empty_cell = _.template(
    '<div class="data">&nbsp;</div>'
  );

  var OUPlayerRowView = Backbone.View.extend({
    tagName: 'div',

    main_template: _.template(playerRowTemplate),
    edge_status_cell_template: _.template(tradEdgeStatusCellTemplate),

    events: {
      'click .favorite': 'toggleFavorite'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('OUPlayerRowView');
      this.logger.info('Initialize');

      this.timeout = 1500;


      this.options = opts;
      this.roundNum = this.options.roundNum;
      this.showFlag = (this.options.lbFormat === LBCommon.lbFormat.EVERYWHERE ? LBCommon.lbShowPlayerFlag.EVERYWHERE : LBCommon.lbShowPlayerFlag.MAIN);

      this.listenTo(this.model, 'change:' + this.showFlag, function(model, show) {
        LBCommon.togglePlayerRowDisplay(this.$el, show);
      });

      this.listenTo(this.model, 'change', this.checkUpdates);
      this.listenTo(this.model, 'change:is_trackable', this.toggleTrackClass);
      this.listenTo(this.model, 'change:is_fave', this.updateFavoriteStyle);
      this.listenTo(PubSub, 'concurrentRound:select', this.setRound);

      // listen to the parent view and update this.roundNum and re-render
      this.listenTo(this.options.view, 'change:roundNum', this.setRound);
      this.priorTotal = '';
    },

    render: function() {
      this.assignAttributes();
      this.$el.html(this.buildPlayerRow());

      //check whether to show/hide row when they get rerendered due to scores update
      LBCommon.togglePlayerRowDisplay(this.$el, this.model.get(this.showFlag));

      // storing el references
      this.$priorCell = this.$('.prior .data');
      this.$playerNameCell = this.$('.playerName .data');
      this.$scoreCell = this.$('.score'); // use eq:# to specify the position of the cell

      return this;
    },

    // TODO - same as Trad - move to central place - or create base player-row view maybe?
    assignAttributes: function() {
      var rowClass = '';

      if(this.options.prefix === 'fp') {
        rowClass = 'favoritePlayer';
      }
      if(this.options.prefix === 'pr' && this.model.get('is_fave')) {
        rowClass = 'favorited';
      }

      this.$el.attr({
        'class': 'leaderBoardRow playerRow ' + rowClass + (!Browser.tabletSite ? ' hoverable ' : ''),
        'id': this.options.prefix + this.model.get('id'),
        'data-id': this.model.get('id')
      });
    },

    buildPlayerRow: function() {
      // when "pos" : "", roundScores don't get defined.
      // set up the default value here
      var roundScores = '                  ';
      var priorTotal = '';
      if(this.model.get('pos') !== '') {
        this.priorTotal = Scores.Utilities.getScoreDetails(this.model, this.roundNum).priorTotal;
        roundScores = Scores.Utilities.getScoreDetails(this.model, this.roundNum).roundScores;
      }

      var roundThru = Scores.Utilities.getScoreDetails(this.model, this.roundNum).roundThru;

      // format prior score
      var prior =  JST.score_cell({
        klass: '',
        score: ''
      });
      if(this.roundNum !== 1 && this.priorTotal !== '') {
        prior = this.getFormattedScore(this.priorTotal);
      }

      // get an array of Over Under scores
      // priorTotal will be overwritten in getHoleOverUnderScores() to cascade down scores
      // prior column value var prior needs to be set before running this.getHoleOverUnderScores()
      var holeOverUnderScores = this.getHoleOverUderScores(roundThru, roundScores, this.priorTotal);

      var nameSize = '';

      // create hole score columns
      var score_row = '';
      var edgeStatus = (this.model.get('status') === 'C' || this.model.get('status') === 'D' || this.model.get('status') === 'W');

      // if selected R3/4 or currently R2 and selected R2 (for displaying MC row at end of R2)
      var rN = parseInt(this.roundNum, 10);
      var cR = parseInt(Scores.collection.currentRound, 10);
      if((rN > 2 || (cR === 2 && rN === 2)) && edgeStatus) {
        // missed the cut
        // empty the prior cell
        prior = JST.score_empty_cell({});

        score_row = this.edge_status_cell_template({
          status_klass: LBCommon.getEdgeClassName(this.model.get('status')),
          status_text: Scores.Utilities.getStatusName(this.model.get('status'))
        });
      } else {
        var cell_klass, k;
        for(var i = 0; i < 2; i++) {
          for(var j = 0; j < 9; j++) {
            cell_klass = 'score';
            k = j + 1;
            if(k === 1 || k === 9) {
              cell_klass += ' hole' + k;
            }
            // set hole1 and hole9 class names for holes 1,9,10,18
            // use [0-9]+(9*[0,1]) to get values 0-17
            score_row += JST.score_cell({
              klass: cell_klass,
              score: this.getFormattedScore(holeOverUnderScores[j + (9 * i)])
            });
          }
        }
      }

      // create track column
      var trackURL =  LBCommon.getTrackURL(this.model);

      return this.main_template({
        player: this.model.attributes,
        prior: prior,
        nameSize: nameSize,
        player_stat_html: score_row,
        track_url: trackURL,
        player_bio_url: LBCommon.getPlayerBioURL(this.model),
        is_lb_everywhere: (this.options.lbFormat === LBCommon.lbFormat.EVERYWHERE)
      });
    },

    getFormattedScore: function(score) {
      var klass = '';
      if(score === '0') {
        klass = 'over';
      } else {
        klass = Scores.Utilities.className(score);
      }

      if(score !== '') {
        score = Math.abs(score);
      }

      return JST.score_cell({
        klass: klass,
        score: score
      });
    },

    // returns array of Over Under scores
    getHoleOverUderScores: function(roundThru, roundScores, priorTotal) {
      var holeOverUnderScores = [];
      this.priorTotal = priorTotal;

      if(roundThru.indexOf('*') === -1) {
        for(var i = 0; i < 18; i++) {
          holeOverUnderScores[i] = Scores.Utilities.getOverUnderScore(
            Scores.Utilities.getScoreFromChar(roundScores.charAt(i)), Scores.holePar[i], this.priorTotal
          );

          // make sure to update this.priorTotal so the round scores get properly cascaded down
          this.priorTotal = holeOverUnderScores[i];
        }
      } else {
        for(var i = 9; i < 18; i++) {
          holeOverUnderScores[i] = Scores.Utilities.getOverUnderScore(
            Scores.Utilities.getScoreFromChar(roundScores.charAt(i)), Scores.holePar[i], this.priorTotal
          );

          // make sure to update this.priorTotal so the round scores get properly cascaded down
          this.priorTotal = holeOverUnderScores[i];
        }
        for(var i = 0; i < 9; i++) {
          holeOverUnderScores[i] = Scores.Utilities.getOverUnderScore(
            Scores.Utilities.getScoreFromChar(roundScores.charAt(i)), Scores.holePar[i], this.priorTotal
          );

          // make sure to update this.priorTotal so the round scores get properly cascaded down
          this.priorTotal = holeOverUnderScores[i];
        }
      }
      return holeOverUnderScores;
    },

    // reset this.roundNum to be updated round
    setRound: function(selectedRoundNum) {
      this.roundNum = selectedRoundNum;
      this.render();
    },

    // prioritize what to animate so score updates and row updates don't crash each other
    checkUpdates: function() {
      var prevData = this.model.previousAttributes();
      var prevRndScores = prevData['r' + this.roundNum + '_roundscores'];
      var curRndScores = this.model.get('r' + this.roundNum + '_roundscores');

      if(prevData.current_sort_order !== this.model.get('current_sort_order') ||
          prevData['r' + this.roundNum + '_sort_order'] !== this.model.get('r' + this.roundNum + '_sort_order')) {
          // sort order is changed, animate the row
        this.updateRow();
      } else if(prevRndScores !== curRndScores) {
        // create function just for the updated score cell animation
        this.updateScoreCell(prevRndScores, curRndScores);
      }

      // when status is changed to C or W or Q, update the row with status displayed
      if(this.model.get('status') !== prevData['status'] &&
          Scores.Utilities.missedCut(this.model) ||
          Scores.Utilities.withdrawn(this.model) ||
          Scores.Utilities.disqualified(this.model)) {
          // when status changes to C, D, or W, simply re-render the row
        this.render();
      }

      // when Round is changed, ou.js takes care of recreating the OU LB by listeing to change:currentRound
      // models are not yet updated to have the new round r#_prior value
      // to avoid showing 0 in the prior column when round is switched,
      // when r#_prior value is changed from "" to "#", re-render the row
      if(this.model.get('r' + this.roundNum + '_prior') !== prevData['r' + this.roundNum + '_prior']) {
        if(prevData['r' + this.roundNum + '_prior'] === '') {
          this.render();
        }
      }
    },

    // sort order has been changed, animate the entire row
    updateRow: function() {
      if(this.roundNum !== 1) {
        this.$priorCell.removeClass('over under');
        this.animateScoreCell(this.$priorCell, Scores.Utilities.getScoreDetails(this.model, this.roundNum).priorTotal);
      }
      this.animateNameCell(this.$playerNameCell, this.model.get('name'));

      // reset the priorTotal so the scores don't get cascaded down
      this.priorTotal = Scores.Utilities.getScoreDetails(this.model, this.roundNum).priorTotal;
      roundScores = Scores.Utilities.getScoreDetails(this.model, this.roundNum).roundScores;

      var roundThru = Scores.Utilities.getScoreDetails(this.model, this.roundNum).roundThru;
      var eachRoundScore = roundScores.split('');
      var holeOverUnderScores = this.getHoleOverUderScores(roundThru, roundScores, this.priorTotal);

      // var _this = this;
      // update the round scores
      $(eachRoundScore).each(function(i, el) {
        var newHole = i;

        if(el !== ' ') {
          // make sure remove the over under classes to avoid funky everyone has over numbers situation
          this.$('.score .data:eq(' + newHole + ')').removeClass('over').removeClass('under');
          this.animateScoreCell(
            this.$('.score .data:eq(' + newHole + ')'), holeOverUnderScores[i]
          );
        } else {
          this.$('.score .data:eq(' + newHole + ')').removeClass('over').removeClass('under');
          this.animateScoreCell(this.$('.score .data:eq(' + newHole + ')'), '');
        }
      }.bind(this));
    },

    updateScoreCell: function(prevRndScores, curRndScores) {
      // var holeOverUnderScores = [];

      var eachRoundScore = curRndScores.split('');
      var eachOldRoundScores = prevRndScores.split('');

      var roundScores = Scores.Utilities.getScoreDetails(this.model, this.roundNum).roundScores;

      // reset the priorTotal so the scores don't get cascaded down
      this.priorTotal = Scores.Utilities.getScoreDetails(this.model, this.roundNum).priorTotal;

      var roundThru = Scores.Utilities.getScoreDetails(this.model, this.roundNum).roundThru;
      var holeOverUnderScores = this.getHoleOverUderScores(roundThru, roundScores, this.priorTotal);

      // check if each score match, if not get the hole position
      $(eachRoundScore).each(function(i, el) {
        if(el !== eachOldRoundScores[i]) {
          var newHole = i;

          // make sure remove the over under classes to avoid funky everyone has over numbers situation
          this.$('.score .data:eq(' + newHole + ')').removeClass('over').removeClass('under');
          this.animateScoreCell(
            this.$('.score .data:eq(' + newHole + ')'), holeOverUnderScores[i]
          );
        }
        return;
      }.bind(this));
    },

    // animate cells
    animateScoreCell: function(selector, value) {
      var score = value !== '' ? parseInt(value) : '';
      var scoreClass = score !== '' ? Scores.Utilities.className(score) : '';
      var selectedRow = selector.closest('.playerRow');

      if(score !== '') {
        score = Math.abs(score);
      }

      var timeout = 0;

      // add class to prepare for animation
      selector.parent().addClass('preAnimate');

      // let's make sure player is visible before we animate to save CPU cycles
      if(this.options.lbFormat === LBCommon.lbFormat.MAIN && LBCommon.checkIfInView(selectedRow) && !selectedRow.hasClass('hidden')) {
        // change background color to black
        selector.parent().addClass('scoreAnimate');

        // set timeout to animation timeout
        timeout = this.timeout;
      }

      setTimeout(function() {
        // clear html so the number doesn't show on top of the black background color
        selector.html('');

        // display score
        selector.html(score);

        // add score Over Under class
        selector.addClass(scoreClass);

        // remove added classses
        selector.parent().removeClass('scoreAnimate');

        // wait for removal animation to complete before removing animation prep styles
        setTimeout(function() {
          selector.parent().removeClass('preAnimate');
        }, timeout);
      }, timeout);
    },

    animateNameCell: function(selector, value) {
      var selectedRow = selector.closest('.playerRow');

      var timeout = 0;

      // add class to prepare for animation
      selector.parent().addClass('preAnimate');

      // let's make sure player is visible before we animate to save CPU cycles
      if(this.options.lbFormat === LBCommon.lbFormat.MAIN && LBCommon.checkIfInView(selectedRow) && !selectedRow.hasClass('hidden')) {
        // change background color to black
        selector.parent().addClass('scoreAnimate');

        // set timeout to animation timeout
        timeout = this.timeout;
      }

      setTimeout(function() {
        selector.html(''); // clear html so the number doesn't show on top of the black background color
        selector.html(value);
        selector.parent().removeClass('scoreAnimate');

        // wait for removal animation to complete before removing animation prep styles
        setTimeout(function() {
          selector.parent().removeClass('preAnimate');
        }, timeout);

      }, timeout); // remove added classses
    },

    toggleTrackClass: function() {
      this.$('.track').toggleClass('on', this.model.get('is_trackable'));
    },

    // common LB functions
    toggleFavorite: function(e) {
      if(this.options.lbFormat === LBCommon.lbFormat.EVERYWHERE) {
        var prefix = Favorites.prefix;
        Favorites.prefix = 'Leader Board Everywhere';
      }
      this.model.trigger('toggleFavorite');
      if(this.options.lbFormat === LBCommon.lbFormat.EVERYWHERE) {
        Favorites.prefix = prefix;
      }
      return false;
    },

    updateFavoriteStyle: function() {
      var pid = this.model.get('id');
      var $selectedRow = this.$el.closest('[data-id="' + pid + '"]');
      $selectedRow.toggleClass('favorited', this.model.get('is_fave'));
    }
  });

  return OUPlayerRowView;
});
