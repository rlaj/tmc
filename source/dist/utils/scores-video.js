define('utils/scores-video',['require','jquery','backbone','utils/scores','utils/channel-controller','utils/pubsub','eventsCore'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Scores = require('utils/scores'),
      ChannelController = require('utils/channel-controller'),
      PubSub = require('utils/pubsub')
      ;

  require('eventsCore');

  var ScoresVideo = function() {
    _.extend(this, Backbone.Events);

    var default_hole_channels = {
      'ac': {
        '11': { 'players': [] },
        '12': { 'players': [] },
        '13': { 'players': [] }
      },
      '1516': {
        '15': { 'players': [] },
        '16': { 'players': [] }
      }
    };

    var default_group_channels = {
      'fg1': { 'players': [] }

      // 'fg2' : { 'players' : [] }
    };

    this.cid = 'scoresvideo';

    // make sure we do a deep copy here
    this.holeChannels = $.extend(true, {}, default_hole_channels);
    this.groupChannels = $.extend(true, {}, default_group_channels);

    var _callback;

    this.init = function(scope, callback) {
      this.setCallback(callback);

      var initParse = function() {
        if(!Scores.isDataLoaded()) {
          PubSub.off('scores:refresh', initParse, this)
            .once('scores:refresh', initParse, this);
          return;
        } else if(ChannelController.collection.length === 0) {
          PubSub.off('livevideo:reset', initParse, this)
            .once('livevideo:reset', initParse, this);
          return;
        }
        callback.apply(scope);
      };

      if(typeof _callback === 'function') {
        initParse();
        PubSub.on('scores:refresh', initParse, this);
      }

      return this;
    };

    this.setCallback = function(callback) {
      if(typeof callback === 'function') {
        _callback = callback;
      }
    };

    // return clean copy of hole channel list
    this.resetChannelPlayers = function() {
      // make sure we do a deep copy here
      this.holeChannels = $.extend(true, {}, default_hole_channels);
    };

    this.assignFeaturedGroupPlayers = function() {
      console.log('[ScoresVideo] assigning featured group players');
      var _this = this;
      ChannelController.collection.forEach(function(channel, index, collection) {
        if(channel.id.indexOf('fg') > -1) {
          var ids = channel.get('fg').split(',');
          if(ids[0] !== '') {
            if(_this.groupChannels[channel.id] === undefined) {
              _this.groupChannels[channel.id] = {};
            }
            _this.groupChannels[channel.id].players = ids;
          }
        }
      });
      this.trigger('featuredplayers:refresh');
    };

    this.parsePlayersByChannel = function() {
      if(!Scores.isDataLoaded()) {
        PubSub.off('scores:refresh', this.parsePlayersByChannel, this)
          .once('scores:refresh', this.parsePlayersByChannel, this);
      } else {
        console.log('[ScoresVideo] parsing players by channel');
        this.resetChannelPlayers();

        // make sure sorting with a cloned array
        var players = Scores.collection.clone();
        players.comparator = 'tee_order';
        players.sort();

        // players.sort(function(a,b) {
        //   return a.tee_order - b.tee_order;
        // });

        var _this = this;

        // assign players to channel
        players.forEach(function(player, i, list) {
          // if player is cut, dq, or wd, move on to next player
          if(Scores.Utilities.inGoodStanding(player) !== true || Scores.Utilities.missedCut(player)) {
            return;
          }

          // figure out what hole he's on
          var onHole = player.getCurrentHole();

          // console.log('player: '+player.name+' on '+onHole);

          // assign to hole channel
          if(player.get('live') !== '') {
            $.each(_this.holeChannels, function(j, v) {
              if(typeof this[onHole] !== 'undefined' && _.indexOf(this[onHole].players, player.id) === -1) {
                // assign player id to channel
                this[onHole].players.push(player.id);
              }
            });
          }
        });
        console.log(this.holeChannels);
        console.log(this.groupChannels);
        this.trigger('holeplayers:refresh');
      }
    };

    /**
     * Check if player is currently on a live channel
     * @param  {Number}  pid Player ID value
     * @return {String}     Channel ID if it exists, otherwise -1
     */
    this.isPlayerLive = function(pid) {
      var id = pid + '';
      var ch = -1;

      // check featured group channels first, make sure it's on air
      $.each(this.groupChannels, function(key) {
        if(_.indexOf(this.players, id) > -1 && ChannelController.checkChannelStatus(key)) {
          ch = key;
          return;
        }
      });

      // check hole channels second only if not found in featured group channel, make sure it's on air
      if(ch === -1) {
        $.each(this.holeChannels, function(key) {
          $.each(this, function(hole) {
            if(_.indexOf(this.players, id) > -1 && ChannelController.checkChannelStatus(key)) {
              ch = key;
              return;
            }
          });
          if(ch !== -1) {
            return;
          }
        });
      }

      return ch;
    };

    // given a round data object from the score file
    // return boolean for whether specified hole has a hole highlight video
    this.hasHighlightVideo = function(player, round, hole) {
      if(round < 5) {
        var round_data = player.get('r' + round);
        var tmp = round_data.split('|');
        round_data = tmp[2];

        var hole_ascii = round_data.charCodeAt(hole - 1);

        // if lower case letter (a-z), means we have video
        if(hole_ascii >= 96 && hole_ascii <= 122) {
          return true;
        }

        // uppercase means we don't
        return false;
      }

      // check playoff
      return Scores.Playoff.hasVideo(player.id, hole);
    };

    return this.init.apply(this, arguments);
  };

  return new ScoresVideo();
});

