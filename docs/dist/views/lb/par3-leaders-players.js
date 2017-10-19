define('views/lb/par3-leaders-players',['require','jquery','underscore','backbone','views/lb/par3-leaders-player-row','utils/lb/lb-common','utils/pubsub','text!templates/lb/par3-blank-leaders-player-row.html!strip'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      Par3LeadersPlayerRow = require('views/lb/par3-leaders-player-row'),
      LBCommon = require('utils/lb/lb-common'),
      PubSub = require('utils/pubsub'),
      blankLeadersPlayersRowTemplate = require('text!templates/lb/par3-blank-leaders-player-row.html!strip')
      ;

  var JST = {};

  JST.no_results_found = _.template(
    '<div class="noplayers">No Results Found</div>'
  );

  var Par3LeadersPlayersView = Backbone.View.extend({

    blankLeadersPlayersRowTemplate: _.template(blankLeadersPlayersRowTemplate),

    events: {
      'click .headerRow .sort_item': 'sortPlayersBy'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Par3LeadersPlayersView');
      this.logger.info('Initialize');

      this.options = opts;

      this.ldRows = [];

      // collection creation needs to happen here in order to use sort and modifying fav rows
      this.par3_laeders_collection = this.options.collection;
      this.par3_closest_collection = this.options.closest_collection;

      console.log('Par 3 Leaders JSON - :%o', this.par3_laeders_collection);

      // save dom el reference
      this.$leadersPlayerContainer;

      // dispose and writeHtml after score refresh
      this.listenTo(PubSub, 'par3scores:refresh', this.disposePlayerRows_reRender);
      this.listenTo(PubSub, 'par3closestscores:refresh', this.disposePlayerRows_reRender);

      // listener - window size
      this.listenTo(PubSub, 'windowsize:lbLargeSkeuomorphic:enter windowsize:lbSmallSkeuomorphic:enter', this.enterSkeuomorphic);
    },

    render: function() {
      // save dom el reference
      this.$leadersPlayerContainer = this.$('#par3LeadersTableData');
      this.writeHtml();

      console.log('this.par3_laeders_collection :%o', this.par3_laeders_collection);
      return this;
    },

    onDispose: function() {
      this.ldRows.forEach(function(row) {
        row.ldRow.dispose();
      });
    },

    disposePlayerRows_reRender: function() {
      this.onDispose();
      this.ldRows = [];
      this.par3_laeders_collection.comparator = 'current_sort_order';
      this.par3_laeders_collection.sort();
      this.writeHtml();
    },

    writeHtml: function() {
      var ldRowObjs = this.buildLeadersPlayers();
      this.$leadersPlayerContainer.html(ldRowObjs);
      this.fillInTalbeWithEmptyRows();
      LBCommon.addBottomBorders(this.$leadersPlayerContainer);

      // event for .js to enable isInview()
      PubSub.trigger('writeHtml:complete');
    },

    buildLeadersPlayers: function() {
      var players_list = [];

      _.each(this.par3_laeders_collection.slice(0, this.par3_closest_collection.closestTotal), function(player) {
        var html = '';
        var obj = this.createNewldRow(player);
        this.ldRows.push({pid: player.id, ldRow: obj });
        html = obj.$el;
        players_list.push(html);
      }.bind(this));

      return players_list;
    },

    // playerRow for All Players
    createNewldRow: function(player) {
      var klass = (player.attributes.id !== '') ? 'hoverable' : '';
      var obj = new Par3LeadersPlayerRow({
        model: player,
        prefix: 'ld',
        klass: klass
      }).render();

      return obj;
    },

    createEmptyLdRow: function() {
      return this.blankLeadersPlayersRowTemplate({});
    },

    /*
     * Create empty rows to fill in leaders table so that
     * the closest and the leaders table height are equal height.
     */
    fillInTalbeWithEmptyRows: function() {
      this.$('.playerRow.searchEmptyRow').remove();
      this.$('.noplayers').remove();

      var nCurrentRows = this.par3_laeders_collection.length;
      var closestRows = this.par3_closest_collection.closestTotal;

      if(nCurrentRows < closestRows) {
        var nEmptyRowsToCreate = closestRows - nCurrentRows;
        var empty_rows_html = '';

        // if there are no results, create a row for 'no results' message
        if(nCurrentRows === 0) {
          nEmptyRowsToCreate--;
          empty_rows_html += JST.no_results_found({});
        }

        // create empty player rows
        for(var i = 0; i < nEmptyRowsToCreate; i++) {
          empty_rows_html += this.createEmptyLdRow();
        }

        this.$leadersPlayerContainer.append(empty_rows_html);
      }
    },

    /** after new models are added to the collection,
    * sort the collection so it's properly in order before render
    */
    sortCollection: function() {
      this.par3_laeders_collection.comparator = 'current_sort_order';
      this.par3_laeders_collection.sort();
      this.render();
    },

    // for listener to call skeuomorphic view specific functions
    enterSkeuomorphic: function() {
      // this.isInView();
    }

  });

  return Par3LeadersPlayersView;

});
