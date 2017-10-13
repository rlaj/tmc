define('views/lb/par3-footer',['require','jquery','underscore','backbone','utils/metrics','utils/lb/lb-common','utils/pubsub'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      Metrics = require('utils/metrics'),
      LBCommon = require('utils/lb/lb-common'),
      PubSub = require('utils/pubsub')
      ;

  var JST = {};

  JST.playoffMsg = _.template('<a href="#" id="viewPlayoff">View Playoff Scores</a>');

  var Par3FooterView = Backbone.View.extend({
    el: '#par3FooterBase',

    events: {
      'click #conCurrentRound a': 'activateConcurrentRoundSelector',
      'click #viewPlayoff': 'triggerOpenPlayoff'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Par3FooterView');
      this.logger.info('Initialize');

      this.options = opts;
      this.par3_collection = this.options.par3_collection;

      // HTML elements exist on the page because the order of the message matter
      this.$playoff_message = this.$('#view_playoff');

      // listener - all times, splittee, concurrent rounds & playoff
      this.listenTo(PubSub, 'change:par3PlayoffStatus',  this.getPlayoffMsg);
    },

    render: function() {
      this.getPlayoffMsg();
      return this;
    },

    getPlayoffMsg: function() {
      this.$playoff_message = this.$('#view_playoff');
      if(this.par3_collection.par3PlayoffExists && this.$('#viewPlayoff').length === 0) {
        var playoffLink = JST.playoffMsg();
        this.$playoff_message.append(playoffLink).removeClass('hide');
      } else {
        this.$playoff_message.html('').addClass('hide');
      }
    },

    /** trigger event to open Playoff modal on skeuomorphic view
    * par3-body to togglePlayoffFade() & par3-playoff to openPlayoff
    */
    triggerOpenPlayoff: function() {
      LBCommon.clearPar3ClosePlayoffCookie();
      Metrics.measureApp(Metrics.page_section, 'View Playoff');
      PubSub.trigger('par3playoff:openPlayoff');
    }
  });

  return Par3FooterView;
});
