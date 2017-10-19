define('views/lb/trad-player-row',['require','jquery','underscore','backbone','utils/scores','utils/browser','utils/lb/lb-common','utils/favorites','text!templates/lb/trad-player-row.html!strip','text!templates/lb/trad-score-cell.html!strip','text!templates/lb/trad-teetime-cell.html!strip','text!templates/lb/trad-edge-status-cell.html!strip','text!templates/lb/trad-today-teetime-cell.html!strip','text!templates/lb/trad-today-cell.html!strip','text!templates/lb/trad-round-score-cell.html!strip','text!templates/lb/score-blank-cell.html!strip'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      Scores = require('utils/scores'),
      Browser = require('utils/browser'),
      LBCommon = require('utils/lb/lb-common'),
      Favorites = require('utils/favorites'),
      playerRowTemplate = require('text!templates/lb/trad-player-row.html!strip'),
      tradScoreCellTemplate = require('text!templates/lb/trad-score-cell.html!strip'),
      tradTeetimeCellTemplate = require('text!templates/lb/trad-teetime-cell.html!strip'),
      tradEdgeStatusCellTemplate = require('text!templates/lb/trad-edge-status-cell.html!strip'),
      tradTodayTeeTimeCellTemplate = require('text!templates/lb/trad-today-teetime-cell.html!strip'),
      tradTodayCellTemplate = require('text!templates/lb/trad-today-cell.html!strip'),
      tradRoundScoreCellTemplate = require('text!templates/lb/trad-round-score-cell.html!strip'),
      scoreCellBlankTemplate = require('text!templates/lb/score-blank-cell.html!strip')
      ;

  var TradPlayerRowView = Backbone.View.extend({
    tagName: 'div',

    main_template: _.template(playerRowTemplate),
    score_cell_template: _.template(tradScoreCellTemplate),
    teetime_cell_template: _.template(tradTeetimeCellTemplate),
    edge_status_cell_template: _.template(tradEdgeStatusCellTemplate),
    today_teetime_cell_template: _.template(tradTodayTeeTimeCellTemplate),
    today_cell_template: _.template(tradTodayCellTemplate),
    round_score_cell_template: _.template(tradRoundScoreCellTemplate),
    score_cell_blank_template: _.template(scoreCellBlankTemplate),

    events: {
      'click .favorite': 'toggleFavorite'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('TradPlayerRowView');
      this.logger.info('Initialize');

      // used to check in this.checkUpdates()
      this.watchAttributes = ['pos', 'teetime', 'sort_order', 'status', 'today', 'thru', 'topar', 'total', 'r1', 'r2', 'r3', 'r4'];

      this.options = opts;
      this.showFlag = (this.options.lbFormat === LBCommon.lbFormat.EVERYWHERE ? LBCommon.lbShowPlayerFlag.EVERYWHERE : LBCommon.lbShowPlayerFlag.MAIN);
      this.listenTo(this.model, 'change:is_fave', this.updateFavoriteStyle);

      //hide/show player rows
      this.listenTo(this.model, 'change:' + this.showFlag, function(model, show) {
        LBCommon.togglePlayerRowDisplay(this.$el, show);
      });

      this.listenTo(this.model, 'change', this.checkUpdates);
      this.listenTo(this.model, 'change:is_trackable', this.toggleTrackClass);
      this.listenTo(this.model, 'change:is_fave', this.updateFavoriteStyle);

      // listen to the parent view and update this.roundNum and re-render
      this.listenTo(this.options.view, 'change:roundNum', this.setRound);
    },

    render: function() {
      //only rerender player row view if model change was not triggered by player search or filter
      // if(!this.isModelChangeTriggeredBySearchOrFilter()) {
        this.assignAttributes();
        this.$el.html(this.buildPlayerRow());

      //check whether to show/hide row when they get rerendered due to scores update
      LBCommon.togglePlayerRowDisplay(this.$el, this.model.get(this.showFlag));
      // }
      return this;
    },

    isModelChangeTriggeredBySearchOrFilter: function() {
      if(this.model.changedAttributes.length === 1) {
        if(this.model.hasChanged(LBCommon.lbShowPlayerFlag.EVERYWHERE) || this.model.hasChanged(LBCommon.lbShowPlayerFlag.MAIN)) {
          return true;
        }
      }
      return false;
    },

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
      var edgeStatus = (this.model.get('status') === 'C' || this.model.get('status') === 'D' || this.model.get('status') === 'W');

      var roundThru = this.model.get('thru');

      // format to par score
      var to_par = '';
      if(edgeStatus) {
        to_par = '<div class="data"></div>';
      } else {
        to_par = this.getFormattedScoreTrad(this.model.get('topar'), 'yes', 'topar');
      }

      var pos = Scores.Utilities.getPosition(this.model);
      var tee_time = this.getFormattedTeeTime(this.model.get('teetime'));

      // create score columns
      var score_row = '';

      if(edgeStatus) {
        score_row = this.edge_status_cell_template({
          status_klass: LBCommon.getEdgeClassName(this.model.get('status')),
          status_text: Scores.Utilities.getStatusName(this.model.get('status'))
        });
      } else if(this.model.get('today') === '' && this.model.get('teetime') !== '') { // score is blank and if there is tee time, display tee time
        score_row = this.today_teetime_cell_template({ today_teetime: tee_time, roundThru: roundThru, is_split_tee: tee_time[1].indexOf('*') >= 0 });
      } else {
        if(this.model.get('pos') !== '' && this.model.get('pos') !== ' ' && this.model.get('today').length > 3) {
          score_row = this.score_cell_blank_template({ }) + this.score_cell_blank_template({ });
        } else {
          roundThru = roundThru.toString();
          if(roundThru.indexOf('18') > -1) { roundThru = roundThru.replace('18', 'F');}
          score_row = this.today_cell_template({ today: this.getFormattedScoreTrad(this.model.get('today'), 'yes'), roundThru: roundThru });
        }
      }

      // create round columns
      var round_scores = '';
      for(var i = 1; i <= 4; i++) {
        var rTotal = Scores.Utilities.getTotalForRound(this.model.attributes, 'r' + i);
        var total_klass = Scores.Utilities.className(parseInt(rTotal), 'yes', true);
        round_scores += this.round_score_cell_template({ round: i, total_klass: total_klass, total: rTotal });
      }

      // far right total column
      var total_score = '';
      var total_score_klass = LBCommon.getFormattedTotalScore(this.model.attributes);

      // create track column
      var trackURL =  LBCommon.getTrackURL(this.model);

      return this.main_template({
        player: this.model.attributes,
        pos: pos,
        to_par: to_par,
        player_stat_html: score_row,
        round_scores_html: round_scores,
        total_score_klass: total_score_klass,
        total_score_html: total_score,
        track_url: trackURL,
        player_bio_url: LBCommon.getPlayerBioURL(this.model),
        tooltip_title_for_player_name: LBCommon.getTooltipTitleForPlayerName(this.options.lbFormat),
        is_lb_everywhere: (this.options.lbFormat === LBCommon.lbFormat.EVERYWHERE)
      });
    },

    getFormattedScoreTrad: function(score, sign, col) {
      var klass = Scores.Utilities.className(score, sign);

      return this.score_cell_template({
        klass: klass,
        score: score
      });
    },

    getFormattedTeeTime: function(time) {
      // input: xx:xx AM|PM
      if(time === '') { return ''; }
      var t = time.split(' ');

      // return this.teetime_cell_template({
      //   t: t,
      // });
      return t;
    },

    // only render when certain model attributes are changed
    checkUpdates: function() {
      this.logger.info('watched attributes changed:%o', this.model.changedAttributes());
      var changedAttributeNames = _.keys(this.model.changedAttributes());
      for(var i = 0; i < changedAttributeNames.length; i++) {
        if($.inArray(changedAttributeNames[i], this.watchAttributes) !== -1) {
          this.render();
          return false;
        }
      }
    },

    // common LB functions
    toggleTrackClass: function() {
      this.$('.track').toggleClass('on', this.model.get('is_trackable'));
    },

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
    },

    // reset this.roundNum to be updated round
    setRound: function(selectedRoundNum) {
      this.roundNum = selectedRoundNum;
      this.render();
    }

  });

  return TradPlayerRowView;
});
