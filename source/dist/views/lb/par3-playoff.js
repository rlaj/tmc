define('views/lb/par3-playoff',['require','jquery','underscore','backbone','utils/browser','utils/lb/lb-common','utils/metrics','utils/pubsub','views/lb/par3-playoff-player-row','text!templates/lb/par3-playoff-container.html!strip','text!templates/lb/par3-playoff-header.html!strip'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      Browser = require('utils/browser'),
      LBCommon = require('utils/lb/lb-common'),
      Metrics = require('utils/metrics'),
      PubSub = require('utils/pubsub'),
      Par3PlayoffPlayerRow = require('views/lb/par3-playoff-player-row'),
      Par3PlayoffContainerTemplate = require('text!templates/lb/par3-playoff-container.html!strip'),
      Par3PlayoffHeaderTemplate = require('text!templates/lb/par3-playoff-header.html!strip')
      ;

  var JST = {};
  JST.hole_header_cell = _.template(
    '<td class="hole_no hole<%= holeNum %>"><%= holeNum %></td>'
  );
  JST.par_header_cell = _.template('<td class="hole_no">3</td>');
  JST.empty_playoff_cell = _.template('<td class="hole_no">&nbsp;</td>');

  var Par3Playoff = Backbone.View.extend({
    el: '#playoffContainer',

    container_template: _.template(Par3PlayoffContainerTemplate),
    header_template: _.template(Par3PlayoffHeaderTemplate),

    events: {
      'click #par3PlayOff .closeButton': 'triggerClosePlayoff'
    },

    prRows: {},
    prOrder: [],

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Par3Playoff');
      this.logger.info('Initialize');

      this.playoff_collection = this.collection;
      this.playoff_startHole = opts.startHole;
      this.playoff_holes = opts.playoff_holes;
      this.progress = opts.progress;

      // save dom el reference
      this.$playoffContainer = this.$el;
      this.$playoffDataTable;

      // listener - playoff modal to show/hide
      // listen to PubSub that's triggered in par3-players.js for PlayoffStatus change
      this.listenTo(PubSub, 'change:par3PlayoffStatus', function() {
        if(LBCommon.isPar3PlayoffDisplayed) {
          this.togglePlayoffModal('show');
        } else {
          this.togglePlayoffModal('hide');
        }
      });

      // listen to PubSub that's triggered in par3-footer.js for openPlayoff
      // listen to each text link updates
      this.listenTo(PubSub, 'par3playoff:openPlayoff par3playoff:mobileSubmenu:viewPlayoff', function() {
        this.togglePlayoffModal('show');
      });

      // listen to PubSub that's triggered in par3-body.js for triggerClosePlayoff
      // listen to each text link updates
      this.listenTo(PubSub, 'par3playoff:closePlayoff par3playoff:mobileSubmenu:playoffUnselected', function() {
        this.togglePlayoffModal('hide');
      });

      this.listenTo(this.playoff_collection, 'update', this.checkPlayerOrder);
    },

    render: function() {
      this.$playoffContainer.html('');
      this.writePlayoffHtml();
      return this;
    },

    onDispose: function() {
      this.prOrder.forEach(function(id) {
        this.prRows[id].dispose();
      }.bind(this));
    },

    writePlayoffHtml: function() {
      var playoffHthml = this.buildPlayoffContainerHtml();
      this.$playoffContainer.html(playoffHthml);

      var playoff_scorecard = this.buildPlayoffPlayerRows();
      this.$('#scorecard tbody').append(playoff_scorecard);

      // assign leaderboardPlayoff el
      this.$playoffDataTable = this.$('#par3PlayOff');
    },

    /** generates Playoff outer container
    * set margin-top
    */
    buildPlayoffContainerHtml: function() {
      var container_html;

      // calculate margin offset to vertically center playoff container
      // based on number of players. 20 is 1/2 the height of a player row
      var offset = 0;
      if(this.playoff_collection.length > 3) {
        offset = (this.playoff_collection.length - 3) * 20;
        if(offset > 100) {
          offset = 100;
        }
      }

      container_html = this.container_template({
        // display: 'margin-top: -' + offset + 'px;' + (!LBCommon.isPar3PlayoffDisplayed() ? 'display: none;' : ''),
        display: (!LBCommon.isPar3PlayoffDisplayed() ? 'display: none;' : ''),
        playoff_header: this.buildPlayoffHeaderHtml()
      });

      return container_html;
    },

    /** generates Playoff Header
    * both Hole row and Par row
    */
    buildPlayoffHeaderHtml: function() {
      // create round columns
      var hole_header_html = '';
      var par_header_html = '';
      for(var i = 0, l = this.playoff_holes.length; i < l; i++) {
        hole_header_html += JST.hole_header_cell({ holeNum: this.playoff_holes[i] });
        par_header_html += JST.par_header_cell({});
      }

      var playoff_header_html = this.header_template({
        hole_header_html: hole_header_html,
        par_header_html: par_header_html,
        empty_cells: this.getEmptyTDs(this.progress)
      });

      return playoff_header_html;
    },

    getEmptyTDs: function(totalNumberOfScores) {
      var numberOfTds = this.progress - totalNumberOfScores;
      var emptyTds = '';
      for(var i = 0; i < numberOfTds; i++) {
        emptyTds += JST.empty_playoff_cell({});
      }
      return emptyTds;
    },

    buildPlayoffPlayerRows: function() {
      var players_list = [];

      this.playoff_collection.forEach(function(player) {
        var html = '';
        var obj = this.createNewPrRow(player);
        this.prRows[player.id] = obj;
        this.prOrder.push(player.id);
        html = obj.$el;
        players_list.push(html);
      }.bind(this));

      return players_list;
    },

    // playerRow for All Players
    createNewPrRow: function(player) {
      var obj = new Par3PlayoffPlayerRow({
        model: player,
        prefix: 'playoff',
        progress: this.progress,
        playoff_holes: this.playoff_holes
      }).render();

      return obj;
    },

    checkPlayerOrder: function(players, options) {
      for(var i = 0, l = this.prOrder.length; i < l; i++) {
        var id = this.prOrder[i];
        var player = players.at(i);
        var new_id;

        if(player) {
          new_id = player.id;
        }

        // compare old order to new order, if mismatch, move
        // player row into correct position, update prRow to
        // reflect new positions, and repeat
        if(id !== new_id) {
          // remove old row from existing position
          var new_row = this.prRows[new_id].$el.detach();

          // attach in front of current player row
          this.prRows[id].$el.before(new_row);

          // update indicess in prOrder as well, moving
          // new player id into proper position to reflect
          // actual DOM position
          var new_index = this.prOrder.indexOf(new_id);
          this.prOrder.splice(new_index, 1);
          this.prOrder.splice(i, 0, new_id);
        }
      }
    },

    togglePlayoffModal: function(state) {
      switch(state) {
        case 'show':
          if(Browser.ie8) {
            this.$playoffDataTable.show();
          } else {
            this.$playoffDataTable.fadeIn();
          }
          break;
        case 'hide':
        default:
          if(Browser.ie8) {
            this.$playoffDataTable.hide();
          } else {
            this.$playoffDataTable.fadeOut();
          }
          break;
      }
    },

    triggerClosePlayoff: function() {
      LBCommon.setPar3ClosePlayoffCookie();
      Metrics.measureApp(Metrics.page_section, 'Hide Playoff');
      PubSub.trigger('par3playoff:closePlayoff');
    }

  });

  return Par3Playoff;
});
