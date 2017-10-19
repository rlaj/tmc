define('views/lb/par3-closest-players',['require','jquery','underscore','backbone','views/lb/par3-closest-player-row','utils/lb/par3-window-size','utils/lb/lb-common','utils/lb/lb-sticky-nav','utils/pubsub'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      Par3ClosestRow = require('views/lb/par3-closest-player-row'),
      Par3Win = require('utils/lb/par3-window-size'),
      LBCommon = require('utils/lb/lb-common'),
      LBStickyNav = require('utils/lb/lb-sticky-nav'),
      PubSub = require('utils/pubsub')
      ;

  var Par3ClosestPlayersView = Backbone.View.extend({

    events: {
      // 'click .headerRow .sort_item': 'sortPlayersBy'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Par3ClosestPlayersView');
      this.logger.info('Initialize');

      this.options = opts;

      this.prRows = [];

      // collection
      this.par3_closest_collection = this.options.collection;

      this.lbstickyNav = new LBStickyNav({
        el: this.$('.headerRow')
      });

      // save dom el reference
      this.$closestPlayerContainer;

      // dispose and writeHtml after score refresh
      this.listenTo(PubSub, 'par3closestscores:refresh', this.disposePlayerRows_reRender);

      // listener - window size
      this.listenTo(PubSub, 'windowsize:lbLargeSkeuomorphic:enter windowsize:lbSmallSkeuomorphic:enter', this.enterSkeuomorphic);
    },

    render: function() {
      // save dom el reference
      this.$closestPlayerContainer = this.$('#closestTableData');
      this.$closestPlayerContainer.html('');
      this.writeHtml();
      return this;
    },

    onDispose: function() {
      this.prRows.forEach(function(row) {
        row.prRow.dispose();
      });
    },

    disposePlayerRows_reRender: function() {
      this.onDispose();
      this.prRows = [];
      this.writeHtml();
    },

    writeHtml: function() {
      var prRowObjs = this.buildAllPlayers();
      this.$closestPlayerContainer.html(prRowObjs);
      LBCommon.addBottomBorders(this.$closestPlayerContainer);

      // event for .js to enable isInview()
      PubSub.trigger('writeHtml:complete');
    },

    buildAllPlayers: function() {
      var players_list = [];

      this.par3_closest_collection.forEach(function(player) {
        var html = '';
        var obj = this.createNewPrRow(player);
        this.prRows.push({pid: player.id, prRow: obj });
        html = obj.$el;
        players_list.push(html);
      }.bind(this));

      return players_list;
    },

    // playerRow for All Players
    createNewPrRow: function(player) {
      var klass = (player.attributes.id !== '') ? 'hoverable' : '';
      var obj = new Par3ClosestRow({
        model: player,
        prefix: 'closest',
        klass: klass
      }).render();

      return obj;
    },

    // for listener to call skeuomorphic view specific functions
    enterSkeuomorphic: function() {
      // this.isInView();
    },

    resetSticky: function() {
      if(Par3Win.size() !== Par3Win.sizes.smskeuomorphic && Par3Win.size() !== Par3Win.sizes.lgskeuomorphic) {
        this.lbstickyNav.resizeListener();
      } else {
        this.lbstickyNav.render();
      }
    }

  });

  return Par3ClosestPlayersView;

});
