define('views/players-filter',['require','jquery','backbone','underscore','utils/metrics','text!templates/players-filter.html!strip'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      _ = require('underscore'),
      Metrics = require('utils/metrics'),
      playersFilterTemplate = require('text!templates/players-filter.html!strip')
      ;


  var PlayersFilter = Backbone.View.extend({
    template: _.template(playersFilterTemplate),

    events: {
      'click .selectedContainer': 'toggleDropdownFilter',
      'click .options a': 'selectOption'
    },

    defaults: {
      favorites: true,
      on_course_players: true,
      professionals: true,
      amateurs: true,
      american_players: true,
      international_players: true,
      first_time_participants: true,
      past_champions: true
    },

    _filteredByMetricsNameLookUp: {
      all: 'All Players',
      fav: 'Favorites',
      active: 'On Course Players',
      pros: 'Professionals',
      amats: 'Amateurs',
      us: 'American Players',
      int: 'International Players',
      first: 'First Time Participants',
      pastChamps: 'Past Champions'
    },

    initialize: function(opts) {
      this.options = _.extend({}, this.defaults, opts);
      this.selected = null; //currently selected option. defaults to 'all players'
      this.metricsText = '';
      this.metricsArgs = this.options.metrics || [];

      //Rerender this view when collection is modified by other views
      this.listenTo(this.collection, 'modified', function(action) {
        if(action !== 'filter') {
          this.selected = null;
          this.render();
        }
      });

      this.on('filter', this._filter);
    },

    render: function() {
      this.$el.html(this.template({options: this.options}));
      return this;
    },

    toggleDropdownFilter: function(e, filterSelected) {
      this.$el.find('#playerSelector').toggleClass('open');

      // don't trigger if _filter() is performed to avoid double call 'Open' & 'Close'
      if(filterSelected !== false) {
        if(this.$('#playerSelector').hasClass('open')) {
          Metrics.measureApp.apply(null, this.metricsArgs.concat(['Filter', 'Open']));
        } else {
          Metrics.measureApp.apply(null, this.metricsArgs.concat(['Filter', 'Close']));
        }
      }
    },

    selectOption: function(e) {
      var filterValue = $(e.target).data('src');

      //Set Dropdown to selected option
      this.$el.find('.option.selected').removeClass('selected');
      $(e.target).addClass('selected');
      this.$el.find('.selected_option').text(e.target.text);
      this.toggleDropdownFilter(e, false); // don't trigger closing Metrics
      this.selected = filterValue;
      this._filter();

      // set metrics text
      this.metricsText = this._filteredByMetricsNameLookUp[this.selected];
      // this metricsText is for LB, Players, and Tee Times Player Filter
      if(this.metricsText !== undefined && this.metricsText !== '') {
        Metrics.measureApp.apply(null, this.metricsArgs.concat(['Filter', this.metricsText]));
      }
    },


    /**
     * Filters the collection by settings its model's 'show' attribute to true/false
     * @param  {Boolean} forcedTrigger (optional) If filter is triggered by an event
     * that originated from outside of this view
     */
    _filter: function(forcedTrigger) {
      switch(this.selected) {
        case 'active':
          this.collection.filterBy('active', true);
          break;
        case 'pros':
          this.collection.filterBy('amateur', false);
          break;
        case 'amats':
          this.collection.filterBy('amateur', true);
          break;
        case 'us':
          this.collection.filterBy('country', 'USA');
          break;
        case 'int':
          this.collection.forEach(function(model) {
            model.set('show', (model.get('country') !== 'USA'));
          });
          break;
        case 'first':
          this.collection.filterBy('firsttimer', true);
          break;
        case 'pastChamps':
          this.collection.filterBy('past', true);
          break;
        case 'fav':
          this.collection.filterBy('is_fave', true);
          break;
        default:
          if(!forcedTrigger) {
            this.collection.showAll();
          }
      }
      this.collection.trigger('modified', 'filter', {forcedTrigger: forcedTrigger, value: this.selected});
    }

  });

  return PlayersFilter;
});
