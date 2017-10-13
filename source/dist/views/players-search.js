define('views/players-search',['require','backbone','underscore','utils/metrics','utils/pubsub'],function(require) {
  var Backbone = require('backbone'),
      _ = require('underscore'),
      Metrics = require('utils/metrics'),
      PubSub = require('utils/pubsub');


  var JST = {};
  JST.players_search = _.template(
    '<div id="lbSearch">' +
      '<input id="searchField" type="text" placeholder="Find a Player">' +
        '<div id="lbSearchButton"></div>' +
        '<div class="lbClearButton"></div>' +
    '</div>'
  );

  var PlayersSearch = Backbone.View.extend({
    events: {
      'keyup #searchField': '_onSearch',
      'click #lbSearchButton.on': '_onClear',
      'click .lbClearButton': '_onClear'
    },

    defaults: {
      showFlag: 'show'
    },

    template: JST.players_search,

    initialize: function(opts) {
      this.options = _.extend({}, this.defaults, opts);
      this.searchKey = opts.searchKey || '';
      this.metricsArgs = this.options.metrics || [];

      // Rerender this view when collection is modified by other views
      this.listenTo(this.collection, 'modified', function(action, opts) {
        if(action !== 'search' && !opts.forcedTrigger) {
          this.render();
        }
      });

      // par3-body enteringSkeuomorphic view triggers par3-boda:clearSearch event
      this.listenTo(PubSub, 'par3-body:clearSarch', this._clear);
    },

    render: function() {
      this.$el.html(this.template({}));
      return this;
    },

    onDispose: function() {
      this._clear();
    },

    _onSearch: function(e) {
      this.searchVal = e.target.value;
      this._executeSearch();
    },

    _onClear: function(e) {
      Metrics.measureApp.apply(null, this.metricsArgs.concat(['Player Search', 'Cancel']));
      this._clear();
    },

    _clear: function(e) {
      this.searchVal = '';
      this.$('#searchField').val('');
      this._executeSearch();
    },

    _executeSearch: function() {
      this.$('#lbSearchButton').toggleClass('on', this.searchVal !== '');
      this.collection.searchBy(this.searchKey, this.searchVal, this.options.showFlag);
      this.collection.trigger('modified', 'search', this.searchVal);
    }

  });

  return PlayersSearch;
});

