define('views/lb/lb-footer',['require','jquery','underscore','backbone','utils/metrics','utils/lb/lb-common','utils/scores','utils/pubsub','collections/score-players'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      Metrics = require('utils/metrics'),
      LBCommon = require('utils/lb/lb-common'),
      Scores = require('utils/scores'),
      PubSub = require('utils/pubsub'),
      ScorePlayers = require('collections/score-players')
      ;

  var JST = {};

  JST.alltimes = _.template('All times in EDT');
  JST.splittee = _.template('* Denotes 10th tee start');
  JST.concurrentMsg = _.template('Multiple rounds in progress');
  JST.playoffMsg = _.template('<a href="#" id="viewPlayoff">View Playoff Scores</a>');
  JST.concurrentRoundSelectorHtml = _.template(
    '<div class="concurrentRoundWrapper">' +
    '   <a class="leftRound" data-round="<%= previousRound %>" data-bypass>Round <%= previousRound %></a>' +
    '   <a class="rightRound" data-round="<%= currentRound %>" data-bypass>Round <%= currentRound %></a>' +
    '</div>'
  );


  var LBFooterView = Backbone.View.extend({
    el: '#leaderboardFooterBase',

    events: {
      'click #conCurrentRound a.selected': 'disableLink',
      'click #conCurrentRound a:not(.selected)': 'activateConcurrentRoundSelector',
      'click #viewPlayoff': 'triggerOpenPlayoff'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('LBFooterView');
      this.logger.info('Initialize');

      this.options = opts;
      this.currentLB = this.options.lbtype;

      // default roundNum number - update accordingly when concurrent round selector is used
      this.roundNum;

      this.$concurrentWrapper = this.$('.concurrentRoundWrapper');

      // HTML elements exist on the page because the order of the message matter
      this.$playoff_message = this.$('#view_playoff');
      this.$other_message = this.$('.messageContent');
      this.$splittee_message = this.$('#splittee');
      this.$allTimes_message = this.$('.allTimes');
      this.$concurrentRound_message = this.$('#conCurrentRoundText');
      this.$concurrentRoundSelector = this.$('#conCurrentRound');

      // listener - all times, splittee, concurrent rounds & playoff
      this.listenTo(PubSub, 'scores:refresh',  this.getLeaderboardMsg);
      this.listenTo(PubSub, 'change:playoffStatus',  this.getLeaderboardMsg);

      // listener - events fired by lbsubmenu when view selector is clicked
      // listen - lb-body forceTradView()
      this.listenTo(PubSub, 'currentLB:update forceTradView:enabled', this.resetCurrentLB);

      // currentRound number is changed in the feed,
      // reset this.roundNum so it doesn't have the previous roundNum
      this.listenTo(ScorePlayers, 'change:currentRound', this.getRoundNum);

      // update the footer LB message when LB view is switched b/w OU and Trad
      this.listenTo(PubSub, 'currentLB:update', this.getLeaderboardMsg);
    },

    render: function() {
      this.getRoundNum();
      this.getLeaderboardMsg();
      return this;
    },

    getRoundNum: function() {
      if(!Scores.isDataLoaded()) {
        PubSub.off('scores:refresh', this.getRoundNum, this)
          .once('scores:refresh', this.getRoundNum, this);
        return;
      } else {
        this.roundNum = Scores.collection.currentRound;
      }
    },

    getLeaderboardMsg: function() {
      if(!Scores.isDataLoaded()) {
        PubSub.off('scores:refresh', this.getLeaderboardMsg, this)
          .once('scores:refresh', this.getLeaderboardMsg, this);
        return;
      } else {
        if(Scores.collection.playoffExists) {
          // show Playoff message
          this.getPlayoffMsg();

          this.$other_message.addClass('hide');

          this.getConcurrentRoundMsg();
          this.getSplitTeeMsg();
          this.getAllTimesMsg();
        } else if(!Scores.collection.playoffExists) {
          // show other messages such as concurrent message, 10th tee start, all times in EDT
          this.$other_message.removeClass('hide');

          this.getConcurrentRoundMsg();
          this.getSplitTeeMsg();
          this.getAllTimesMsg();
          this.getPlayoffMsg();
        }
      }
    },

    getConcurrentRoundMsg: function() {
      var concurrent_round_selector = '';

      if(Scores.collection.concurrentExists && !Scores.collection.playoffExists) {
        if(this.currentLB === LBCommon._lbTypeLookUp.ou) {
          if((this.$concurrentRoundSelector.length > 0) || (this.$concurrentRound_message.length > 0)) {
            // show Concurrent Round message and selector on OU view
            this.$concurrentRound_message.html(JST.concurrentMsg()).removeClass('hide');

            // resposive view - populate the concurrent round selector
            concurrent_round_selector = JST.concurrentRoundSelectorHtml({
              previousRound: parseInt(Scores.collection.currentRound - 1),
              currentRound: Scores.collection.currentRound
            });
            this.$concurrentRoundSelector.html(concurrent_round_selector).removeClass('hide');

            this.highlightConcurrentRoundSelector();
          }
        } else {
          // hide concurrent roundSelector on Trad view
          // show Concurrent Round message on Trad view
          this.hideConcurrentMsg();
          this.$concurrentRound_message.html(JST.concurrentMsg()).removeClass('hide');
        }
      } else {
        this.hideConcurrentMsg();
      }
    },

    hideConcurrentMsg: function() {
      this.$concurrentRoundSelector.html('').addClass('hide');
      this.$concurrentRound_message.html('').addClass('hide');
    },

    getSplitTeeMsg: function() {
      if(Scores.collection.showAsterisk && this.currentLB === LBCommon._lbTypeLookUp.trad && !Scores.collection.playoffExists) {
        this.$splittee_message.html(JST.splittee()).removeClass('hide');
      } else {
        this.$splittee_message.html('').addClass('hide');
      }
    },

    getAllTimesMsg: function() {
      if(Scores.collection.allTimeExists && this.currentLB === LBCommon._lbTypeLookUp.trad && !Scores.collection.playoffExists) {
        // show All times in EDT message on Trad view
        this.$allTimes_message.html(JST.alltimes()).removeClass('hide');
      } else {
        this.$allTimes_message.html('').addClass('hide');
      }
    },

    getPlayoffMsg: function() {
      if(Scores.collection.playoffExists) {
        // show All times in EDT message on Trad view
        this.$playoff_message.html(JST.playoffMsg()).removeClass('hide');
      } else {
        this.$playoff_message.html('').addClass('hide');
      }
    },

    // view selector changed - listener currenLB:update
    // reset this.currentLB to be updated value
    resetCurrentLB: function(newLB) {
      this.currentLB = newLB;
      this.getLeaderboardMsg();
    },

    // concurrent round selector
    // skeuomorphic concurrent round number change
    activateConcurrentRoundSelector: function(e) {
      var roundNumber = $(e.currentTarget).data('round');
      this.roundNum = roundNumber;
      if(roundNumber <= 4) {
        // fire events to set selected Round number as roundNum to keep updating the selected Round
        PubSub.trigger('concurrentRound:select', roundNumber);
        $(e.currentTarget).siblings().removeClass('selected');
        $(e.currentTarget).addClass('selected');
        Metrics.measureApp(Metrics.page_section, 'Select Concurrent Round', 'Round ' + roundNumber);
      }
    },

    disableLink: function(e) {
      e.preventDefault();
    },

    highlightConcurrentRoundSelector: function() {
      this.$concurrentRoundSelector.find('[data-round=' + this.roundNum + ']').addClass('selected');
    },

    /** trigger event to open Playoff modal on skeuomorphic view
    * lb-body to togglePlayoffFade() & lb-playoff to openPlayoff
    */
    triggerOpenPlayoff: function() {
      LBCommon.clearMainClosePlayoffCookie();
      Metrics.measureApp(Metrics.page_section, 'View Playoff');
      PubSub.trigger('playoff:openPlayoff');
    }
  });

  return LBFooterView;
});
