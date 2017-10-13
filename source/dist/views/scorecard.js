define('views/scorecard',['require','backbone','utils/metrics','utils/pubsub','text!templates/player-bio/bio-scorecard-panel.html!strip','text!templates/player-scorecard.html!strip','text!templates/lb/lb-scorecard-panel.html!strip','utils/browser','settings','utils/scores'],function(require) {
  var Backbone = require('backbone'),
      Metrics = require('utils/metrics'),
      PubSub = require('utils/pubsub'),
      bioScorecardPanelTemplate = require('text!templates/player-bio/bio-scorecard-panel.html!strip'),
      playerScorecardTemplate = require('text!templates/player-scorecard.html!strip'),
      lbScorecardPanelTemplate = require('text!templates/lb/lb-scorecard-panel.html!strip'),
      Browser = require('utils/browser'),
      Settings = require('settings'),
      Scores = require('utils/scores')
  ;


  var ScorecardView = Backbone.View.extend({
    tagName: 'figure',

    defaults: {
      scorecardUrl: '/en_US/includes/gen/players/scorecards/',
      refreshScoresDelay: 60000,
      type: 'bio',
      player: {
        id: null,
        name: null,
        country: null
      }
    },

    events: {
      'click .hole_no.video': '_showVideo',
      'click .selector a': '_handleSelector',
      'click .close': '_close'
    },

    bioScorecardPanel: _.template(bioScorecardPanelTemplate),
    playerScorecard: _.template(playerScorecardTemplate),
    lbScorecardPanel: _.template(lbScorecardPanelTemplate),

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Scorecard');
      this.logger.info('initialize');
      this.options = _.extend({}, this.defaults, opts);
      if(this.options.type === 'leaderboard') {
        this.options.playerId = this.options.player.id;
      }

    },

    render: function() {
      if(this.options.type === 'bio') {
        this.$el.html(this.bioScorecardPanel({}));
      } else if(this.options.type === 'leaderboard') {
        this.$el.html(this.lbScorecardPanel({
          player: this.options.player
        }));
        this.$el.attr('class', 'lbScorecardPanel');
      }
      this.$('#playerScorecard').replaceWith(this.playerScorecard({}));
      this.clearUnveil();
      this.unveil(this.$('#playerScorecardLegend img'));

      this.loadScorecard();

      //select the round with last shot
      var lastHoleWithShot = '1';
      var playerScoresModel = Scores.collection.get(this.options.playerId);
      if(playerScoresModel) {
        lastHoleWithShot = playerScoresModel.get('lastHoleWithShot').split('|')[0];
      }
      if(lastHoleWithShot.trim() !== '') {
        this._showRoundRow('rd'+ lastHoleWithShot);
      }

      this.timer = setInterval(function() {
       this.loadScorecard();
      }.bind(this), this.options.refreshScoresDelay);


      return this;
    },

    loadScorecard: function() {
      var that = this;
      Backbone.ajax({
        dataType: "html",
        url: that.options.scorecardUrl + this.options.playerId + '.ssi',
        success: function(data){
          var newData = $(data).filter('.player_scorecard');
          that.$('#playerScorecard').replaceWith(newData);

          // keep showing the round that is selected
          var rd = that.$('.selector a.selected').attr('href').substring(1);
          that._showRoundRow(rd);

          // translate scorecard eagle/birdie content for IE8
          if(Browser.ie8) {
            that.$('#playerScorecard .eagle')
              .append('<span class="outer"></span><span class="inner"></span>')
              .end().find('.birdie')
              .append('<span class="outer"></span>');
          }
        }
      });

    },

    _showVideo: function(e) {
      e.preventDefault();
      var $t = $(e.target);
      var r = $t.data('rd');
      var h = $t.data('hole');
      var link = '/en_US/watch/' + Settings.tournament_year + '/r' + r + '_' + this.options.playerId + '_' + h + '.html?promo=highlight_';
      link += (this.options.type === 'leaderboard') ? 'lb' : 'bio';
      Backbone.history.navigate(link, true);
    },

    /**
     * Handle switching between Rounds
     */
    _handleSelector: function(e) {
      var $t = $(e.target);
      var rd = $t.attr('href').substring(1);
      this._showRoundRow(rd);

      //update the menu
      Metrics.measureApp(Metrics.page_section, 'Scorecard', 'Round', $t.text());
      e.preventDefault();
    },

    _showRoundRow: function(rd) {
      this.$('.rd.selected').removeClass('selected');
      var $rd = this.$('.' + rd);
      $rd.addClass('selected');
      this.$('.selector a[href$="#' + rd +'"]').addClass('selected').siblings().removeClass('selected');

      // Show only one row when round has withdrawn/missed cut message
      // if($rd.hasClass('full_msg')) {
      //   this.$('.headers.mobile, .rd:not(.mobile)').addClass('hidden');
      //   $rd = $rd.filter('.mobile');
      // } else {
      //   this.$('.headers.mobile, .rd:not(.mobile)').removeClass('hidden');
      // }
      // $rd.addClass('selected');

    },

    _close: function() {
      Metrics.measureApp(Metrics.page_section, 'Scorecard', 'Close');
      PubSub.trigger('scorecard:close', this.options.targetPlayerId);
    },

    onDispose: function() {
      clearInterval(this.timer);
    }

  });

  return ScorecardView;
})

;
