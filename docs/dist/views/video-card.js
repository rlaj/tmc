define('views/video-card',['require','jquery','underscore','backbone','text!templates/video-card.html!strip'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      videoCardTemplate = require('text!templates/video-card.html!strip')
      ;

  var VideoCardView = Backbone.View.extend({

    className: 'videoItem bodyVideo',

    template: _.template(videoCardTemplate),

    events: {
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('VideoCardView');
      this.logger.info('Initialize');

      this.options = $.extend({}, this._default, opts);

      this.$el.attr({
        'video-id': 'body_' + this.options.item.id
      });
    },

    render: function() {
      this.$el.html(this.build());
      return this;
    },

    dispose: function() {
      Backbone.View.prototype.dispose.call(this, true);
    },

    build: function() {
      var default_img = '/images/now/trans_16x9.gif';

      var imagePathL = this.options.item.pictureL || default_img,
          imagePathM = this.options.item.pictureM || default_img,
          imagePathH = this.options.item.pictureH || default_img;

      // inlineVideo.videos['body_'+this.options.id] = $.extend({},this,{
      //   id: 'body_'+this.options.id,
      //   type: 'vod',
      //   contentType: Metrics.video_action
      // });

      return this.template({
        img: default_img,
        imagePath: { L: imagePathL, M: imagePathM, H: imagePathH },
        options: this.options.item
      });
    }
  });

  return VideoCardView;
});

