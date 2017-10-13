define('views/lb/par3-all-players',['require','jquery','underscore','backbone','views/lb/par3-all-player-row','utils/lb/lb-common','utils/lb/par3-sticky-nav','utils/metrics','utils/pubsub'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      Par3AllPlayerRow = require('views/lb/par3-all-player-row'),
      LBCommon = require('utils/lb/lb-common'),
      Par3StickyNav = require('utils/lb/par3-sticky-nav'),
      Metrics = require('utils/metrics'),
      PubSub = require('utils/pubsub')
      ;

  var Par3AllPlayersView = Backbone.View.extend({

    events: {
      'click .headerRow .sort_item': 'sortPlayersBy'
    },

    _sortTypeLookUp: {
      0: 'current_sort_order',
      1: 'name',
      2: 'thru',
      3: 'today',
      4: 'current_sort_order',

      pos: 'current_sort_order'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Par3AllPlayersView');
      this.logger.info('Initialize');

      this.options = opts;

      this.prRows = [];

      // collection creation needs to happen here in order to use sort and modifying fav rows
      this.par3_all_collection = this.options.collection;

      // default collection sort criteria
      this.criteria = 'current_sort_order';

      this.par3stickyNav = new Par3StickyNav({
        el: this.$('.headerRow')
      });

      // save dom el reference
      this.$allPlayerContainer;

      // dispose and writeHtml after score refresh
      this.listenTo(PubSub, 'par3scores:refresh', this.disposePlayerRows_reRender);

      // listener - window size
      // this.listenTo(PubSub, 'windowsize:lbLargeSkeuomorphic:enter windowsize:lbSmallSkeuomorphic:enter', this.enterSkeuomorphic);
    },

    render: function() {
      // save dom el reference
      this.$allPlayerContainer = this.$('#par3TableData');
      this.writeHtml();
      this.par3stickyNav.render();
      return this;
    },

    onDispose: function() {
      this.prRows.forEach(function(row) {
        row.prRow.dispose();
      });
      this.par3stickyNav.dispose();
    },

    disposePlayerRows_reRender: function() {
      this.prRows.forEach(function(row) {
        row.prRow.dispose();
      });
      this.prRows = [];
      this.par3_all_collection.sortCollection(this.criteria);
      this.writeHtml();
    },

    writeHtml: function() {
      var prRowObjs = this.buildAllPlayers();
      this.$allPlayerContainer.html(prRowObjs);
      LBCommon.addBottomBorders(this.$allPlayerContainer);

      // event for .js to enable isInview()
      PubSub.trigger('writeHtml:complete');
    },

    buildAllPlayers: function() {
      var players_list = [];

      this.par3_all_collection.forEach(function(player) {
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
      var obj = new Par3AllPlayerRow({
        model: player,
        prefix: 'all',
        klass: klass
      }).render();

      return obj;
    },

    createEmptyPrRow: function() {
      return this.ouPlayerRowEmptyTemplate({});
    },

    /** after change is detected in the collection,
    * sort the collection so it's properly in order before render
    */
    sortCollection: function() {
      this.par3_all_collection.sortCollection(this.criteria);
      this.render();
    },

    // column sort
    sortPlayersBy: function(e) {
      var columnIndex = parseInt($(e.currentTarget).index());
      var metricsTxt = $(e.currentTarget).text();
      this.criteria = this._sortTypeLookUp[columnIndex];

      this.par3_all_collection.sortCollection(this.criteria);
      this.setHeaderStyle(e);
      Metrics.measureApp(Metrics.page_section, Metrics.page_title, 'Sort', metricsTxt);

      // clear out the stored objs before rendering to avoid ghost
      this.prRows.forEach(function(row) {
        row.prRow.dispose();
      });
      this.prRows = [];

      this.render();
    },

    setHeaderStyle: function(e) {
      var $selectedColumn = $(e.currentTarget);
      this.$('.sort_item').removeClass('selected');
      $selectedColumn.addClass('selected');
    },

    // for listener to call skeuomorphic view specific functions
    enterSkeuomorphic: function() {
      // this.isInView();
    }

  });

  return Par3AllPlayersView;

});
