define('views/player-bio/stats-drive',['require','jquery','backbone','utils/window-size','utils/pubsub','text!templates/player-bio/stats-drive.html!strip'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Win = require('utils/window-size'),
      PubSub = require('utils/pubsub'),
      statsDriveTemplate = require('text!templates/player-bio/stats-drive.html!strip')
  ;

  var StatsDistance = Backbone.View.extend({
    el: '#tab_drive',

    template: _.template(statsDriveTemplate),

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Stats Drive View');
      this.logger.info('initialize');
      this.options = _.extend({}, this.defaults, opts); 

      this.$el.html(this.template()); //only load the template once

      this.$('> .title').html(
        '<span class="first">' + 
          this.options.bioModel.get('firstname') + 
        '</span> '+ 
        this.options.bioModel.get('lastname')
      );

    },

    render: function() {
      this.overview = this.options.scoresModel.get('stats').overview;
      var player = this.overview.longest;
      var p_wrapper = this.$('.player');
      if(player === "" || player === "|") {
        // player hasn't reached hole no. 5 yet
        p_wrapper.addClass('disabled');
        p_wrapper.find('.value').html('--');
        p_wrapper.find('.title_sm').html('Not Yet Started');
      } else {
        p_wrapper.removeClass('disabled');
        var p = player.split('|');
        var p_width = (p[1] > 0) ? ((p[1] - 100)/250)*100 : 1;
        p[1] = parseFloat(p[1]).toFixed();
        this.$('.player .value').html(p[1]);
        this.$('.player .bar').css('width', p_width + '%')
          .find('.title_sm').html('<span>'+p[0]+'</span>');
      }

      var field = this.overview.field_longest;
      var f_container = this.$('.field .stat-wrapper').first();
      if(field.length > 0) {
        for(var i=0,l=field.length;i<l;i++) {
          var _this = field[i];
          // name|round|yards
          var f = _this.split('|');
          var f_width = ((f[2] - 100)/250)*100;
          f[2] = parseFloat(f[2]).toFixed();
          f_container.find('.value').html(f[2]);
          f_container.find('.bar').css('width', f_width + '%')
            .find('.title_sm').html(f[0]+', <span>Round '+f[1]+'</span>');

          f_container = f_container.next();
        }
      }

      return this;
    },
  });

  return StatsDistance;
})

;
