define('views/current-time',['require','backbone','underscore'],function(require) {
  var Backbone = require('backbone'),
      _ = require('underscore')
  ;

  var JST = {};

  JST.mastersTime_yourTime_template =  _.template(
      '<div class="mastersTime">Masters Time: <%= mastersTime %> </div>' +
      '<div class="yourTime">Your Time: <%= clientTime %> </div>'
  );

  JST.mastersTime_template =  _.template(
      '<div class="mastersTime">Masters Time: <%= mastersTime %> </div>'
  );

  var CurrentTime = Backbone.View.extend({
    el: '.currentTime',


    initialize: function() {
      this.refreshDelay = 10000; // 10 seconds
    },

    render: function() {
      var that = this;
      this._buildMastersAndClientTime();

      // update current time every 'refreshDelay' seconds
      this.timer = setInterval(function() {
        that._buildMastersAndClientTime();
      }, that.refreshDelay);
      return this;
    },


    _buildMastersAndClientTime: function() {
      // get current client time (can handle 12 or 24 hour format)
      var clientTime = moment.tz(moment.tz.guess());
      var clientTimeStr = clientTime.format('h:mm A z');

      // convert client time to masters time (EST/EDT)
      var mastersTimeStr = moment.tz(clientTime, 'America/New_York').format('h:mm A z');

      // don't display clientTime if client is in the same Time Zone as mastersTime
      if(clientTimeStr.indexOf('EST') === -1 && clientTimeStr.indexOf('EDT') === -1) {
        this.$el.html(JST.mastersTime_yourTime_template({mastersTime: mastersTimeStr, clientTime: clientTimeStr}));
      } else {
        this.$el.html(JST.mastersTime_template({mastersTime: mastersTimeStr}));
      }
    },


    onDispose: function() {
      clearInterval(this.timer);
    }

  });

  return CurrentTime;
})

;
