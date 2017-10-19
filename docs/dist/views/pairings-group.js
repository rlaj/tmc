define('views/pairings-group',['require','backbone','underscore','text!templates/pairings-group.html!strip','momentTimezone'],function(require) {
  var Backbone = require('backbone'),
      _ = require('underscore'),
      pairingsGroupTemplate = require('text!templates/pairings-group.html!strip')
      ;

  var moment = require('momentTimezone');

  var PairingsGroup = Backbone.View.extend({
    className: 'pairingsGroupRow',

    template: _.template(pairingsGroupTemplate),

    defaults: {
    },

    initialize: function(opts) {
      this.show = true;
      this.playerCardViewsMap = opts.playerCardViewsMap;
      this.showPlayerIdsMap = {};
    },

    render: function() {
      this.buildPlayerGroup();
      return this;
    },

    buildPlayerGroup: function() {
      var that = this;
      var fragment = document.createDocumentFragment();
      this.model.player.forEach(function(player) {
        if(player.id) {
          playerModel = that.collection.get(player.id);
          view = that.playerCardViewsMap[playerModel.get('id')];
          that._updatePlayerViews(playerModel);
          fragment.appendChild(view.el);
          that.listenTo(playerModel, 'change:show', that._updatePlayerViews);
        }
      });

      this._updateGroupView();
      this.listenTo(that.collection, 'modified', that._updateGroupView);
      var clientTime = this._convertToClientTime(this.model.time);

      var splitTee = false;
      if(this.model.tee == 10) { //matches "10" or 10
        splitTee = true;
        this.trigger('hasSplitTee');
      }

      // don't display clientTime if client is in the same Time Zone as mastersTime
      if(clientTime.indexOf('EST') === -1 && clientTime.indexOf('EDT') === -1) {
        this.$el.html(this.template({group: this.model, clientTime: clientTime, display: '', splitTee: splitTee}));
      } else {
        this.$el.html(this.template({group: this.model, clientTime: '', display: 'hide', splitTee: splitTee}));
      }
      this.$el.append(fragment);
    },


    /**
     * Convert group's time from ET to client's timezone
     * taking daylight savings time into account
     * @param {String} timeStr (required) group time is always in ET
     */
    _convertToClientTime: function(timeStr) {
      //parse masters group time as ET
      var rawtime = moment(this.model.time, 'h:mm A').format('YYYY-MM-DD hh:mm A');
      var mastersTime = moment.tz(rawtime, 'YYYY-MM-DD hh:mm A', 'America/New_York');
      var mastersTimeStr = mastersTime.format('hh:mm A z');

      // convert to client timezone
      var clientTime = moment.tz(mastersTime, moment.tz.guess());
      var clientTimeStr = clientTime.format('h:mm A z');

      return clientTimeStr;
    },

    /**
     * Update player card view everytime the
     * player model's show attribute changes
     */
    _updatePlayerViews: function(player) {
      var playerId = player.get('id');
      var view = this.playerCardViewsMap[playerId];
      var show = player.get('show');
      view.trigger('fadeCard', !show);

      if(show) {
        this.showPlayerIdsMap[playerId] = true;
      } else {
        delete this.showPlayerIdsMap[playerId];
      }
    },

    /**
     * Update 'this' group view everytime player
     * collection is modified due to search or filter
     */
    _updateGroupView: function() {
      if(Object.keys(this.showPlayerIdsMap).length === 0) {
        this.show = false;
        this.$el.hide();
      } else {
        this.show = true;
        this.$el.show();
      }
    }

    });

  return PairingsGroup;
})

;
