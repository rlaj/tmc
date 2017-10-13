define('views/track/shot-list',['require','jquery','backbone','utils/browser','utils/window-size','utils/common','utils/pubsub','utils/metrics','models/rc_video','models/track/state','collections/track/players','utils/track/track','text!templates/track/mobile-shot-row.html!strip'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Browser = require('utils/browser'),
      Win = require('utils/window-size'),
      Common = require('utils/common'),
      PubSub = require('utils/pubsub'),
      Metrics = require('utils/metrics'),

      RCVideo = require('models/rc_video'),

      State = require('models/track/state'),
      Players = require('collections/track/players'),
      TrackUtils = require('utils/track/track'),

      shotRowTemplate = require('text!templates/track/mobile-shot-row.html!strip')
      ;

  var rowTemplate = _.template(shotRowTemplate);

  var ShotRow = Backbone.View.extend({
    tagName: 'li',
    className: 'shot-row',
    template: rowTemplate,

    initialize: function() {
      this.on('select', this.select);
    },

    render: function() {
      if(this.model.get('number') === 0) {
        this.html = $('<div>Group is on tee</div>');
        this.$el.addClass('tee');
      } else {
        this.checkVideo();
        this.html = $(this.template(this.model.attributes));
        this.$el.removeClass('tee');
        this.populateDistance();
        this.populateToPin();
      }

      if(this.tagName === 'li') {
        this.$el.addClass('shot' + this.model.get('number'));
      }
      this.$el.attr('data-shot', this.model.get('number'))
          .data('shot', this.model.get('number'))
          .html(this.html.html());

      return this;
    },

    select: function(e) {
      var $target = $(e.target);
      if(!$target.hasClass('shot-video') || !this.$el.hasClass('highlight')) {
        if(this.tagName === 'li') {
          State.trigger('controls:shot:select', this.model.get('number'));
          TrackUtils.measure('Shot List', 'Shot', this.model.get('number').toString());
        }
      } else {
        // launch shot video path
        console.log('[Shot Row ' + this.model.get('number') + '] attempting to launch shot video');
        if(Browser.app && Browser.apptype.android) {
          var id = this.model.get('highlightId');
          Common.sendAndroidMessage('video?id=' + id);
        } else {
          if(Win.size() === Win.sizes.global) {
            var url = this.model.get('highlightURL');
            Backbone.history.navigate(url, true);
          } else {
            this.video = new RCVideo({
              cmsId: this.model.get('highlightId')
            });
            this.video.fetch({
              success: function(model, resp, options) {
                var video = model.getVideoObject();
                video.panelButton = 'video_vod';
                PubSub.trigger('video:playPanel', [video], video.id, {
                  floated: true,
                  vod: true
                });

                Metrics.trackS({
                  prop33: model.get('title'),
                  prop43: model.get('title'),
                  prop22: model.get('date').substring(0,4),
                  prop57: 'VOD Panel On',
                  eVar57: 'VOD Panel On'
                });
                Metrics.measureAppMediaLoad(Metrics.page_section, Metrics.page_title, 'Single Shot VOD', 'Play');
              }
            });
          }
        }
      }
    },

    populateDistance: function() {
      var span = this.html.find('.distance span').removeClass('feet inch');
      TrackUtils.setShotDistance(span, this.model);
    },

    populateToPin: function() {
      var span = this.html.find('.topin').removeClass('score').find('span').removeClass('feet inch score');
      TrackUtils.setShotToPin(span, this.model);
    },

    checkVideo: function() {
      var klass_name = this.tagName === 'li' ? 'highlight' : 'selected';

      if(this.model.get('has_video')) {
        this.$el.addClass(klass_name);
      } else {
        this.$el.removeClass(klass_name);
      }
    }
  });

  var ShotList = Backbone.View.extend({
    el: '.shot-list-info',

    events: {
      'click div.shot-row': 'toggleShotList',
      'click .toggle': 'toggleShotList',
      'click li.shot-row': 'selectShotRow'
    },

    shots: [],

    is_open: false,

    initialize: function() {
      this.shot_info = new ShotRow({
        tagName: 'div'
      });

      this.shot_list = this.$('.shot-list-nav');
      this.list_ul = this.shot_list.find('ul').empty();

      this.listenTo(State, 'shotlist:set', this.processShots);
      this.listenTo(State, 'shotlist:close', this.closeShotList);
      this.listenTo(State, 'shotrow:set', this.setSelectedShot);
    },

    render: function() {
      var row = this.$('> .shot-row');
      row.replaceWith(this.shot_info.$el);
    },

    onDispose: function() {

    },

    selectShotRow: function(e) {
      var $target = $(e.currentTarget);
      var shot = $target.data('shot');
      this.shots[shot - 1].trigger('select', e);

      return false;
    },

    toggleShotList: function(e) {
      var $target = $(e.target);
      if(!$target.hasClass('shot-video')) {
        this.is_open = !this.is_open;
        this.shot_list.toggleClass('visible', this.is_open);
        this.$el.toggleClass('open', this.is_open);

        if(this.is_open) {
          // PubSub.trigger('whats-new:close', 'shotList');
        }

        TrackUtils.measure('Shot List', this.is_open ? 'Open' : 'Close');

        if(this.is_open) {
          State.trigger('playerlist:close');
          State.trigger('controls:options:hide');
        }
      } else {
        // launch shot video path
        var shot = $(e.currentTarget).data('shot');
        this.shots[shot - 1].trigger('select', e);
      }
    },

    closeShotList: function() {
      if(this.is_open) {
        this.shot_list.removeClass('visible');
        this.$el.removeClass('open');
        this.is_open = false;
      }
    },

    processShots: function(data) {
      if(data === undefined) {
        // clear shot data
        this.shot_info.$el.removeClass('highlight');
        this.shot_list.removeClass('highlight');
        this.list_ul.empty();
      }

      // create new shot view or update existing with new shot data
      var has_video = false;
      for(var i = data.length - 1; i >= 0; --i) {
        var shot = data[i];
        if(this.shots[i]) {
          this.shots[i].model = shot;
        } else {
          this.shots[i] = new ShotRow({
            model: shot
          });
        }
        this.list_ul.append(this.shots[i].render().$el);

        if(shot.get('has_video')) {
          has_video = true;
        }
      }

      if(data.length === 1 && data[0].get('number') === 0) {
        this.$('.toggle').hide();
        this.closeShotList();
      } else {
        this.$('.toggle').show();
      }

      // dispose extra shots
      if(data.length < this.shots.length) {
        for(var j = data.length, m = this.shots.length; j < m; j++) {
          this.shots[j].dispose();
        }
        this.shots.length = data.length;
      }

      this.setSelectedShot();

      if(has_video) {
        this.shot_info.$el.addClass('highlight');
        this.shot_list.addClass('highlight');
      } else {
        this.shot_info.$el.removeClass('highlight');
        this.shot_list.removeClass('highlight');
      }
    },

    setSelectedShot: function(shot) {
      var selected = shot;
      if(selected === undefined) {
        shot = State.get('selected_shot');
      }
      if(shot) {
        selected = shot.get('number');
      }

      if(selected !== undefined) {
        // set shot to selected in list
        this.list_ul.find('.shot-row.selected').removeClass('selected');
        if(selected === 0) {
          selected = 1;
        }
        this.list_ul.find('.shot-row.shot' + selected).addClass('selected');

        // set info to selected shot
        this.shot_info.model = shot;
        this.shot_info.render();
      }
    }
  });

  return ShotList;
});
