define('controllers/stats',['require','jquery','underscore','backbone','baseview','utils/metrics','utils/common','utils/pubsub','settings','utils/scores','tablesaw','utils/title-selector','views/secondary-dropdown'],function(require) {
  	var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      BaseView = require('baseview'),
      Metrics = require('utils/metrics'),
      Common = require('utils/common'),
      PubSub = require('utils/pubsub'),
      Settings = require('settings'),
      Scores = require('utils/scores'),
      Tablesaw = require('tablesaw'),
      TitleSelector = require('utils/title-selector'),
      SecondaryDropdown = require('views/secondary-dropdown')
      ;

  var RecordStats = BaseView.extend({
    stats_data: [],
    page_load: true,
    round_id: 1,


    events: {
      'click .option_wrapper a': 'attachEvents',
      'click .selected_container': 'activateSelectorDropdown',
      'click .stats_data_table th a.sort': 'loadTable',
      'click .btn-micro': 'metrics_btnClick'
    },

    onInitialization: function() {
      BaseView.prototype.onInitialization.apply(this, arguments);

      this.titleSelector = new TitleSelector({
        el: this.$('#pageTitle'),
        max: 1,
        measure_key: ['Tournament Info', 'Select Records & Stats']
      });

      if(this.jsonData.pageState !== 'stub') {
        this.$stats_tbl =  this.$('.stats_table');
        this.$stats_stub = this.$('.stats_stub');
        this.$stats_data_tbl = this.$('.stats_data_table');

        this.$roundSelector = new SecondaryDropdown({el: this.$('.statsTabs')});
        this.$roundSelector.setCallback(function(href) {
          var roundNo = href.substring(1);
          this.loadStats(roundNo);
        }, this);

        this.listenTo(PubSub, 'throttle:resize', function() {
          Common.collapseMenus(['.statsTabs']);
        });
      }
    },

    processPageVars: function() {
      var pageDetails = this.jsonData.pageDetails;

      if(pageDetails && pageDetails.pageTitle !== undefined) {
        this.pageTitle = pageDetails.pageTitle;
      }
    },

    onRender: function() {
      BaseView.prototype.onRender.apply(this, arguments);

      if(this.jsonData.pageState !== 'stub') {
        this.populateStatsSelector();

        if(Settings.Scores.live || Settings.Scores.post) {
          setTimeout(this.checkStats.bind(this), 100);
        }
      }
    },

    onDispose: function() {
      this.titleSelector.dispose();

      if(this.jsonData.pageState !== 'stub') {
        this.$roundSelector.dispose();
      }
    },

    checkStats: function() {
      var check_url = '/en_US/xml/gen/scores/' + this.jsonData.page + '.json';
      var that = this;

      $.ajax({
        url: check_url,
        async: true,
        type: 'GET',
        dataType: 'json',
        success: function(checkResp) {
          that.stats_data = checkResp;
          this.loadStats('5');
        }.bind(this),
        error: function() {
          console.log('Error loading document - ' + check_url);
        }
      });
    },

    populateStatsSelector: function() {
      var filter_options = this.$('.filter .options a');
      var page = this.jsonData.page;

      $.each(filter_options, function() {
        $(this).removeClass('selected');

        if(page === $(this).attr('data-src')) {
          $('.filter .selected_container a').text($(this).text()).toggleClass('toggle');  // 'toggle' class needed to force reset of layout
          $(this).addClass('selected');
        }
      });
    },

    attachEvents: function(e) {
      var $this = $(this);
      if($this.parent().hasClass('selected') || $this.parent().hasClass('disabled')) {
        e.preventDefault();
        return;
      }
    },

    activateSelectorDropdown: function(e) {
      e.preventDefault();
      var that = $(e.currentTarget).parents('.filter');
      if(that.hasClass('open')) {
        that.removeClass('open');
        Metrics.measureApp(Metrics.page_section, 'Tab', 'Close');
      } else {
        that.addClass('open');
        Metrics.measureApp(Metrics.page_section, 'Tab', 'Open');
      }
    },

    loadTable: function(e) {
      e.preventDefault();

      var newId = $(e.currentTarget).attr('href').substring(1);
      this.loadStats(newId);
    },

    metrics_btnClick: function(e) {
      Metrics.measureApp(Metrics.page_section, Metrics.page_title, e.currentTarget.getAttribute('title'));
    },

    loadStats: function(id) {
      if(this.$('.statsTabs .round' + id).hasClass('disabled') || this.$('.stats_data_table th.round' + id).hasClass('disabled')) {
        return;
      }

      if(this.jsonData.page === 'cstats') {
        this.displayCStats(id);
      } else if(this.jsonData.page === 'eagles') {
        this.displayEagles();
      } else {
        this.displayStats(id);
      }

      if(this.jsonData.page !== 'eagles') {
        if(this.jsonData.page === 'cstats') {
          for(var x = 0; x < 5; x++) {
            var round = 'round' + (x);

            if(this.stats_data[round] !== 'none') {
              this.$('.statsTabs .round' + x).removeClass('disabled');
            }
          }
        } else {
          for(var x = 0; x < 6; x++) {
            var round = 'round' + (x + 1);

            if(this.stats_data[round] !== 'none') {
              this.$('.stats_data_table th.' + round).removeClass('disabled');
            }

            if(x === 5) {
              this.$('.stats_data_table th.round5').addClass('selected');
            }
          }
        }
      }

      if(this.page_load) {
        this.$('.statsTabs .round5').addClass('selected');
      }

      this.page_load = false;
    },

    displayCStats: function(round_no) {
      this.$stats_tbl.html('');       // delete content in div
      var $stats_data_round = this.stats_data['round' + round_no];

      if($stats_data_round === 'none') {
        this.$stats_tbl.hide();
        this.$stats_stub.show().html('Cumulative stats will be available after the first player completes a round.');

          // page_load = false;
        return;
      } else {
        this.$stats_tbl.show();
        this.$stats_stub.hide();

        var stats_data = $stats_data_round.hole;

        this.$stats_tbl.html(
            '<table class="eleven_column stats_data_table tablesaw tablesaw-swipe" data-tablesaw-mode="swipe">' +
                '    <thead>' +
                '      <tr>' +
                '        <th class="col1" data-tablesaw-priority="persist">Hole</th>' +

                '        <th class="col2">Yards</th>' +
                '        <th class="col3">Par</th>' +
                '        <th class="col4">Average</th>' +
                '        <th class="col5">Rank</th>' +
                '        <th class="col6">Eagles</th>' +
                '        <th class="col7">Birdies</th>' +
                '        <th class="col8">Pars</th>' +
                '        <th class="col9">Bogeys</th>' +
                '        <th class="col10">Double <br>Bogeys +</th>' +

                // '        <th class="col11">Other</th>' +
                '      </tr>' +
                '    </thead>' +
                '    <tbody></tbody>' +
                '  </table>');

        var tbody = this.$('.stats_data_table tbody');

        $.each(stats_data, function(x) {
          var cstats_row = '';
          if((this.id !== 'In') && (this.id !== 'Out') && (this.id !== 'Total')) {
            cstats_row += '<tr><td class="col1"><a href="/en_US/course/hole' + this.id + '.html">' + this.id + '</a></td>';
          } else {
            if(this.id === 'In' || this.id === 'Out') {
              cstats_row += '<tr class="boldrow"><td class="col1 double_line">' + this.id + '<br/>Subtotal</td>';
            } else {
              cstats_row += '<tr class="boldrow"><td class="col1">' + this.id + '</td>';
            }
          }
          cstats_row += '<td class="col2">' + this.yards + '</td>';
          cstats_row += '<td class="col3">' + this.par + '</td>';
          cstats_row += '<td class="col4">' + this.avg + '</td>';
          cstats_row += '<td class="col5">' + this.rank + '</td>';
          cstats_row += '<td class="col6">' + this.eagles + '</td>';
          cstats_row += '<td class="col7">' + this.birdies + '</td>';
          cstats_row += '<td class="col8">' + this.pars + '</td>';
          cstats_row += '<td class="col9">' + this.bogeys + '</td>';
          cstats_row += '<td class="col10">' + this.doublesbogeys + '</td>';

            // cstats_row+='<td class="col11">'+this.others+'</td>';

          cstats_row += '</tr>';

          tbody.append(cstats_row);
        });

        this.$('.stats_data_table').table().data('table').refresh();
      }
    },

    displayStats: function(round_no) {
      this.$stats_tbl.html('');         // delete content in div
      var $stats_data_round = this.stats_data['round' + round_no];

      if($stats_data_round === 'none') {
        this.$stats_tbl.hide();
        this.$stats_stub.show().html('Stats data will be available soon.');
      } else {
        var stats_info = this.stats_data['round' + round_no].player;

        if(this.jsonData.page === 'putts') {
          // sort
          this.round_id = 'round' + round_no;
          if(this.round_id === 'round5') {
            this.round_id = 'total';
          }
          stats_info.sort(this.sortPutts.bind(this));
        }

          // create table structure on the fly so tablesaw doesn't fake initialize
        this.$stats_tbl.html(
            '<table class="six_column stats_data_table tablesaw tablesaw-swipe" data-tablesaw-mode="swipe">' +
                '    <thead>' +
                '      <tr>' +
                '        <th class="col1" data-tablesaw-priority="persist">Player</th>' +
                '        <th class="col2 round1 disabled"><a class="sort" href="#1">Round 1</a></th>' +
                '        <th class="col3 round2 disabled"><a class="sort" href="#2">Round 2</a></th>' +
                '        <th class="col4 round3 disabled"><a class="sort" href="#3">Round 3</a></th>' +
                '        <th class="col5 round4 disabled"><a class="sort" href="#4">Round 4</a></th>' +
                '        <th class="col6 round5 disabled"><a class="sort" href="#5">Total</a></th>' +
                '      </tr>' +
                '    </thead>' +
                '    <tbody></tbody>' +
                '  </table>');

        var tbody = $('.stats_data_table tbody');

        $.each(stats_info, function(x) {
          var stats_row = '<tr>';

          if(this.id !== '') {
            stats_row += '<td class="col1"><a href="/en_US/players/player_' + this.id + '.html?promo=bio_stats">' + this.name + '</a></td>';
          } else {
            stats_row += '<td class="col1">' + this.name + '</td>';
          }

          var player_stats = this.stats[0];

          var key_count = 2;

          for(var key in player_stats) {
            stats_row += '<td class="col' + key_count + '">' + player_stats[key] + '</td>';
            key_count++;
          }

          stats_row += '</tr>';
          tbody.append(stats_row);
        });

        this.$('.stats_data_table').table().data('table').refresh();


        var mstring = this.getStatsMeasureText();
        if(!this.page_load) {
          if(round_no !== 5) {
            Metrics.measureApp('Statistics', mstring, 'Round ' + round_no);
          } else {
            Metrics.measureApp('Statistics', mstring, 'Total');
          }
        }
      }
    },

    displayEagles: function(round_no) {
      this.$stats_tbl.html('');     // delete content in div

      if(this.stats_data.eagles.player) {
        this.$stats_tbl.show();
        this.$stats_stub.hide();

        var stats_player = this.stats_data.eagles.player;

        this.$stats_tbl.html(
            '<table class="five_column stats_data_table tablesaw tablesaw-swipe" data-tablesaw-mode="swipe">' +
                  ' <thead>' +
                '      <tr>' +
                '        <th class="col1" data-tablesaw-priority="persist">Player</th>' +
                '        <th class="col2">Hole</th>' +
                '        <th class="col3">Par</th>' +
                '        <th class="col4">Score</th>' +
                '        <th class="col5">Round</th>' +
                '      </tr>' +
                '    </thead>' +
                '    <tbody></tbody>' +
                '</table>');

        var tbody = $('.stats_data_table tbody');

        $.each(stats_player, function(x) {
          var eagles_row = '<tr>';

          if(this.id !== '') {
            eagles_row += '<td class="col1"><a href="/en_US/players/player_' + this.id + '.html?promo=bio_stats">' + this.name + '</a></td>';
          } else {
            eagles_row += '<td class="col1">' + this.name + '</td>';
          }
          eagles_row += '  <td class="col2">' + this.hole + '</td>';
          eagles_row += '  <td class="col3">' + this.par + '</td>';
          eagles_row += '  <td class="col4">' + this.score + '</td>';
          eagles_row += '  <td class="col5">' + this.round + '</td>';

          eagles_row += '</tr>';
          tbody.append(eagles_row);
        });

        this.$('.stats_data_table').table().data('table').refresh();
      } else {
        this.$stats_tbl.hide();
        this.$stats_stub.show().html('Eagles data will be available soon.');
      }
    },

    getStatsMeasureText: function() {
      var measureText = '';

      switch(this.jsonData.page) {
        case 'birdies': measureText = 'Birdie Leaders'; break;
        case 'gir': measureText = 'Greens in Regulation'; break;
        case 'fir': measureText = 'Driving Accuracy'; break;
        case 'sand': measureText = 'Sand Saves'; break;
        case 'putts': measureText = 'Putts'; break;
        case 'drives_avg': measureText = 'Driving Distance'; break;
        case 'par3': measureText = 'Par 3 - Birdie Leaders'; break;
        case 'par4': measureText = 'Par 4 - Birdie Leaders'; break;
        case 'par5': measureText = 'Par 5 - Birdie Leaders'; break;
        default: break;
      }

      return measureText;
    },

    sortPutts: function(a, b) {
      var as = a.stats[0][this.round_id];
      var bs = b.stats[0][this.round_id];
      var x = parseFloat(as);
      var y = parseFloat(bs);
      var a3 = as.match(/\((\d+)\)/);
      var b3 = bs.match(/\((\d+)\)/);
      if(isNaN(x)) { x = 999; }
      if(isNaN(y)) { y = 999; }

      // if avg is the same, sort by 3 putts, lowest first
      if(x === y) {
        if(a3 && b3) {
          return parseInt(a3[1], 10) - parseInt(b3[1], 10);
        }
        if(a3) {
          return 1;
        }
        if(b3) {
          return -1;
        }
      }
      return x - y;
    }

  });

  return RecordStats;
});

