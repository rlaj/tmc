define('views/player-bio/tab-bio',['require','underscore','backbone','text!templates/player-bio/tab-bio.html!strip'],function(require) {
  var _ = require('underscore'),
      Backbone = require('backbone'),
      tabBioTemplate = require('text!templates/player-bio/tab-bio.html!strip')
      ;

  var JST = {};

  JST.no_data = _.template(
    '<div style="text-align:center;">' +
      'There <%= type_string[type_string.length-1] !== "s" ? "is" : "are" %> no <%= type_string %> for this player.' +
    '</div>');

  JST.stats_row = _.template('<dt><%= label %></dt><dd><%= data === "" ? "&nbsp;" : data %></dd>');

  // item { nation, best }
  JST.stats_left = _.template(
    '<%= getStatsRowFor({label: "Best Masters Finish", data: item.best}) %>' +
    '<%= getStatsRowFor({label: "First/Last Year", data: item.firstlast}) %>' +
    '<%= getStatsRowFor({label: "Tournaments Entered", data: item.tournaments}) %>' +
    '<%= getStatsRowFor({label: "Cuts Made", data: item.cuts}) %>' +
    '<%= getStatsRowFor({label: "Rounds Played", data: item.rounds}) %>');

// item { avg, low, high, underpar }
  JST.stats_right = _.template(
    '<%= getStatsRowFor({label: "Money Won", data: item.money}) %>' +
    '<%= getStatsRowFor({label: "Scoring Average", data: item.avg}) %>' +
    '<%= getStatsRowFor({label: "Low Round", data: item.low}) %>' +
    '<%= getStatsRowFor({label: "High Round", data: item.high}) %>' +
    '<%= getStatsRowFor({label: "Rounds Under Par", data: item.underpar}) %>');


  // rowClass, item { year, position, r1, r2, r3, r4, total, money }
  JST.results_row = _.template(
    '<div class="row">' +
    '  <div class="year"><%= item.year %></div>' +
    '  <div class="position"><%= item.position %></div>' +
    '  <div class="round r1"><%= item.r1 %></div>' +
    '  <div class="round r2"><%= item.r2 %></div>' +
    '  <div class="round r3"><%= item.r3 %></div>' +
    '  <div class="round r4"><%= item.r4 %></div>' +
    '  <div class="total"><%= item.total %></div>' +

    // '  <div class="money">$<%= item.money %></div>' +
    '</div>');


  var TabBio = Backbone.View.extend({
    el: '#tab_bio',

    template: _.template(tabBioTemplate),

    defaults: {
      playerBio: null,
      playerHistory: null
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Tab Bio View');
      this.logger.info('initialize');
      this.options = _.extend({}, this.defaults, opts);
    },

    render: function() {
      this.$el.html(this.template({}));
      this._buildOverview();
      if(this.options.playerHistory.history) {
        this._buildPastStats();
        this._buildPastMasters();
      }
      return this;
    },


    _buildOverview: function() {
      if(this.options.playerBio) {
        var html = this.options.playerBio.overview;
        this.$('.text.player_bio').html((html ? html : JST.no_data({type_string: 'bio data'})));
      }
    },

    _buildPastMasters: function() {
      var data = this.options.playerHistory.history;
      if(data && data === 'none') {
        this.$('#playerResults').html(JST.no_data({ type_string: 'results' }));
      } else {
        var _results_row = JST.results_row;
        var rhtml = '';

        _.each(data, function(val, x) {
          if(val.position === '') {val.position = '-';}
          if(val.r1 === '0') {val.r1 = '-';}
          if(val.r2 === '0') {val.r2 = '-';}
          if(val.r3 === '0') {val.r3 = '-';}
          if(val.r4 === '0') {val.r4 = '-';}

          rhtml += _results_row({ item: val });
        });
        this.$('#playerResults').find('.content').html(rhtml);
      }
      this.$('.past_results').addClass('visible');
    },

    _buildPastStats: function() {
      if(this.options.playerBio) {
        var bestStr = this.options.playerBio.best;
        if(bestStr.indexOf('First') === -1 && bestStr.indexOf('N/A') === -1) {
          var tmpl_html = JST.stats_left({
            item: this.options.playerBio,
            getStatsRowFor: JST.stats_row
          });
          this.$('.left').append(tmpl_html);

          tmpl_html = JST.stats_right({
            item: this.options.playerBio,
            getStatsRowFor: JST.stats_row
          });
          this.$('.right').append(tmpl_html);
        }
        this.$('.past_results').addClass('visible');
      }
    }

  });

  return TabBio;
});


