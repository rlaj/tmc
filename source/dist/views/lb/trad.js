define('views/lb/trad',['require','jquery','underscore','collections/favorite-players','views/lb/lb-base','utils/lb/lb-common','utils/lb/lb-sticky-nav','utils/metrics','utils/pubsub','utils/scores','collections/score-players','views/lb/trad-player-row','text!templates/lb/trad-player-row-empty.html!strip'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      FavPlayers = require('collections/favorite-players'),
      LBBaseView = require('views/lb/lb-base'),
      LBCommon = require('utils/lb/lb-common'),
      LBStickyNav = require('utils/lb/lb-sticky-nav'),
      Metrics = require('utils/metrics'),
      PubSub = require('utils/pubsub'),
      Scores = require('utils/scores'),
      ScorePlayers = require('collections/score-players'),
      TradPlayerRow = require('views/lb/trad-player-row'),
      tradPlayerRowEmptyTemplate = require('text!templates/lb/trad-player-row-empty.html!strip')
      ;

  var TradView = LBBaseView.extend({

    trad_player_row_empty_template: _.template(tradPlayerRowEmptyTemplate),

    events: {
      'click .headerRow .sort_item': 'sortPlayersBy',
      'click .playerRow:not(.searchEmptyRow)': 'playerRowClicked',
      'click .playerRow a': 'playerRowLinkClicked'
    },

    fave: false,

    _sortTypeLookUp: {
      0: 'current_sort_order',
      1: 'name',
      2: 'today',
      3: 'thru',
      4: 'current_sort_order',
      5: 'r1_score',
      6: 'r2_score',
      7: 'r3_score',
      8: 'r4_score',
      9: 'current_sort_order',

      pos: 'current_sort_order'
    },

    // header element id
    _sortLabelLookUp: {
      0: 'Pos',
      1: 'Player',
      2: 'Today',
      3: 'Thru',
      4: 'ToPar',
      5: 'R1',
      6: 'R2',
      7: 'R3',
      8: 'R4',
      9: 'Total'
    },

    initialize: function(opts) {
      LBBaseView.prototype.initialize.apply(this, arguments);
      this.logger = new eventsCore.util.Logger('TradView');
      this.logger.info('Initialize');

      this.options = opts;

      this.prRows = {};
      this.prOrder = [];

      this.fpRows = {};
      this.fpOrder = [];

      // for project cut line & sort filter use
      this.showCut = true;
      this.sortItem = this._sortTypeLookUp.pos;

      // collection creation needs to happen here in order to use sort and modifying fav rows
      this.scores_collection = Scores.collection.clone();
      this.favcollection = new FavPlayers();

      //do not apply sticky nav to leaderboard everywhere
      if(this.lbFormat !== LBCommon.lbFormat.EVERYWHERE) {
        this.lbstickyNav = new LBStickyNav({
          el: this.$('.headerRow')
        });
      }

      // save dom el reference
      this.$favPlayerContainer;
      this.$allPlayerContainer;

      // listener - add | remove the favorite row
      this.listenTo(this.favcollection, 'add', this.addFavRow);
      this.listenTo(this.favcollection, 'remove', this.removeFavRow);

      // listener - current_sort_order or sortable column's data are updated
      // event triggered in the master score collection (Scores.collection)
      // if sortItem is not current_sort_order, call sortCollection() func then
      // detach row and apply to the new row position
      this.listenTo(this.scores_collection, 'sortOrder:update', this.checkUpdates);

      // listener - to insert cutline - update everytime score gets refreshed during R2 & sorted by position
      // because players positions constantly move. Cutline needs to move along with the players positions
      this.listenTo(PubSub, 'scores:refresh',  this.insertCutLine);

      // when round is changed, update this.roundNum & reorder the LB
      this.listenTo(ScorePlayers, 'change:currentRound', this.switchRound);
    },

    render: function(e) {
      // save dom el reference
      this.$favPlayerContainer = this.$(LBCommon._lbTypeLookUp.tradFavPlayersContainer);
      this.$allPlayerContainer = this.$(LBCommon._lbTypeLookUp.tradAllPlayersContainer);
      this.writeHtml();

      // if header is not clicked to sort, highlight the default Pos column header
      // otherwise keep the selected column by the user
      if(e === undefined) {
        this.selectDefaultHeaderSelect();
      }

      // When sorting, player scorecard is removed from the DOM. We need to
      // reappend this already existing scorecard in the right place after sorting
      if(this.scorecardView) {
        this.scorecardView.$el.addClass('noanimation');
        var targetPlayerId = this.scorecardView.options.targetPlayerId;
        this.$('#' + targetPlayerId).after(this.scorecardView.$el);
      }

      // do not apply sticky nav to leaderboard everywhere
      if(this.lbFormat !== LBCommon.lbFormat.EVERYWHERE) {
        this.lbstickyNav.render();
      }
      return this;
    },

    onDispose: function() {
      _.each(this.fpRows, function(row) {
        row.dispose();
      });

      _.each(this.prRows, function(row) {
        row.dispose();
      });

      if(this.lbstickyNav) {
        this.lbstickyNav.dispose();
      }
    },

    // playerRow for All Players
    createNewPrRow: function(player) {
      var obj = new TradPlayerRow({
        model: player,
        prefix: 'pr',
        view: this,
        lbFormat: this.lbFormat
      }).render();

      return obj;
    },

    // playerRow for Favorite Players
    createNewFpRow: function(player) {
      var obj = new TradPlayerRow({
        model: player,
        prefix: 'fp',
        view: this,
        lbFormat: this.lbFormat
      }).render();

      return obj;
    },

    createEmptyPrRow: function() {
      return this.trad_player_row_empty_template({});
    },

    // change:currentRound triggered in scores_collection, switch to currentRound, srot collection
    // reOrderRows, and trigger event for trad-player-row.js to re-render
    switchRound: function(selectedRoundNum) {
      var criteria = 'r' + selectedRoundNum + '_sort_order';
      this.roundNum = selectedRoundNum;

      if(this.roundNum === Scores.collection.currentRound) {
        criteria = 'current_sort_order';
      }

      this.favcollection.sortCollection(criteria);
      this.scores_collection.sortCollection(criteria);

      // trigger event for trad-player-row.js to re-render
      this.trigger('change:roundNum', this.roundNum);
    },

    // column sort
    sortPlayersBy: function(e) {
      var columnIndex = parseInt($(e.currentTarget).data('id'));
      var metricsTxt = $(e.currentTarget).text();
      var criteria = this._sortTypeLookUp[columnIndex];

      this.favcollection.sortCollection(criteria);
      this.scores_collection.sortCollection(criteria);
      this.setHeaderStyle(e);

      _.each(this.fpRows, function(row) {
        row.dispose();
      });

      _.each(this.prRows, function(row) {
        row.dispose();
      });

      this.prRows = {};
      this.prOrder = [];

      this.fpRows = {};
      this.fpOrder = [];

      // update vars that are used for inserting project cut
      this.sortItem = criteria;
      if(this.sortItem === this._sortTypeLookUp.pos) {
        this.showCut = true;
      } else {
        this.showCut = false;
      }

      this.render(e);

      if(this.lbFormat === LBCommon.lbFormat.MAIN) {
        this.fillInLeaderboardWithEmptyRows(this.minRows);
        Metrics.measureApp(Metrics.page_section, 'Sort', metricsTxt);
      } else if (this.lbFormat === LBCommon.lbFormat.EVERYWHERE) {
        this.fillInLeaderboardWithEmptyRows(this.calculateNumberOfEmptyRowsToInsert());
        Metrics.measureApp('Leader Board Everywhere', 'Sort', metricsTxt);
      }
    },

    setHeaderStyle: function(e) {
      var $selectedColumn = $(e.currentTarget);
      this.$('.sort_item').removeClass('selected');
      $selectedColumn.addClass('selected');
    },

    // select Pos column header highlight by default
    selectDefaultHeaderSelect: function() {
      this.$('#' + this._sortLabelLookUp[0]).addClass('selected');
    }

  });

  return TradView;
});

