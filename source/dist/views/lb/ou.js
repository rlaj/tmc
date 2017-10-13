define('views/lb/ou',['require','jquery','underscore','collections/favorite-players','utils/lb/lb-common','utils/lb/lb-sticky-nav','views/lb/lb-base','views/lb/ou-player-row','utils/pubsub','utils/scores','collections/score-players','text!templates/lb/ou-player-row-empty.html!strip'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      FavPlayers = require('collections/favorite-players'),
      LBCommon = require('utils/lb/lb-common'),
      LBStickyNav = require('utils/lb/lb-sticky-nav'),
      LBBaseView = require('views/lb/lb-base'),
      OUPlayerRow = require('views/lb/ou-player-row'),
      PubSub = require('utils/pubsub'),
      Scores = require('utils/scores'),
      ScorePlayers = require('collections/score-players'),
      ouPlayerRowEmptyTemplate = require('text!templates/lb/ou-player-row-empty.html!strip')
      ;

  var OUView = LBBaseView.extend({

    ouPlayerRowEmptyTemplate: _.template(ouPlayerRowEmptyTemplate),

    events: {
      // 'click .headerRow .sort_item': 'sortPlayersBy',
      'click .playerRow:not(.searchEmptyRow)': 'playerRowClicked',
      'click .playerRow a': 'playerRowLinkClicked'
    },

    fave: false,

    initialize: function(opts) {
      LBBaseView.prototype.initialize.apply(this, arguments);

      this.logger = new eventsCore.util.Logger('OUView');
      this.logger.info('Initialize');

      this.options = opts;

      this.prRows = {};
      this.prOrder = [];

      this.fpRows = {};
      this.fpOrder = [];

      // for project cut line & sort filter use
      this.showCut = true;

      // default roundNum number - update accordingly when concurrent round selector is used
      this.roundNum = Scores.collection.currentRound;

      // collection creation needs to happen here in order to use sort and modifying fav rows
      this.scores_collection = Scores.collection.clone();
      this.scores_collection.comparator = 'current_sort_order';
      this.favcollection = new FavPlayers();
      this.favcollection.comparator = 'current_sort_order';

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

      // set isInview when view is created
      this.listenTo(PubSub, 'writeHtml:complete',  this.enterSkeuomorphic);

      // listener - current_sort_order is updated - event triggered in the master score collection (Scores.collection)
      // detach row and apply to the new row position
      this.listenTo(this.scores_collection, 'sortOrder:update', this.checkUpdates);

      // listener - to insert cutline - update everytime score gets refreshed during R2 & sorted by position
      // because players positions constantly move. Cutline needs to move along with the players positions
      this.listenTo(PubSub, 'scores:refresh',  this.insertCutLine);

      // listener - window size
      this.listenTo(PubSub, 'windowsize:lbLargeSkeuomorphic:enter windowsize:lbSmallSkeuomorphic:enter', this.enterSkeuomorphic);

      // listener - concurrentRound selector clicked, reset roundNum & reorder the LB
      this.listenTo(PubSub, 'concurrentRound:select', this.switchRound);

      // when round is changed, update this.roundNum & reorder the LB
      this.listenTo(ScorePlayers, 'change:currentRound', this.switchRound);
    },

    render: function() {
      // save dom el reference
      this.$favPlayerContainer = this.$(LBCommon._lbTypeLookUp.ouFavPlayersContainer);
      this.$allPlayerContainer = this.$(LBCommon._lbTypeLookUp.ouAllPlayersContainer);
      this.writeHtml();

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
      var obj = new OUPlayerRow({
        model: player,
        prefix: 'pr',
        roundNum: this.roundNum,
        view: this,
        lbFormat: this.lbFormat
      }).render();

      return obj;
    },

    // playerRow for Favorite Players
    createNewFpRow: function(player) {
      var obj = new OUPlayerRow({
        model: player,
        prefix: 'fp',
        roundNum: this.roundNum,
        view: this,
        lbFormat: this.lbFormat
      }).render();

      return obj;
    },

    createEmptyPrRow: function() {
      return this.ouPlayerRowEmptyTemplate({});
    },


    // concurrent selector is clicked - render the selected round player rows
    // change:currentRound triggered in scores_collection, switch to currentRound, srot collection
    // reOrderRows, and trigger event for ou-player-row.js to re-render
    switchRound: function(selectedRoundNum) {
      var criteria = 'r' + selectedRoundNum + '_sort_order';
      this.roundNum = selectedRoundNum;

      if(this.roundNum === Scores.collection.currentRound) {
        criteria = 'current_sort_order';
      }

      this.favcollection.sortCollection(criteria);
      this.scores_collection.sortCollection(criteria);

      this.reOrderRows();

      // trigger event for ou-player-row.js to re-render
      this.trigger('change:roundNum', this.roundNum);
    },

    // for listener to call skeuomorphic view specific functions
    enterSkeuomorphic: function() {
      clearTimeout(this.enterSkeuoTimeoutId);
      this.enterSkeuoTimeoutId = setTimeout(function() {
        LBCommon.isInView(this.$('.scroll-pane'));
      }.bind(this), 500);
    }

  });

  return OUView;

});
