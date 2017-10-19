define('views/photo-card',['require','jquery','underscore','backbone','utils/browser','utils/common','text!templates/photo-card.html!strip'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      Browser = require('utils/browser'),
      Common = require('utils/common'),
      photoCardTemplate = require('text!templates/photo-card.html!strip')
      ;

  var PhotoCardView = Backbone.View.extend({

    className: 'photoItem',

    main_template: _.template(photoCardTemplate),

    events: {
      'click .photo a': 'clickPhoto'
    },

    _template: undefined,
    _default: {
      story: false,
      flyover: false,
      btn: false,

      metrics_suffix: ''
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('PhotoCardView');
      this.logger.info('Initialize');

      // this.$el.attr({
      //   'data-id': 'hole' + this.model.get('number')
      // });

      this.options = $.extend({}, this._default, opts);

      // this.listenTo(this.model, 'change:faved', this.toggleFavorite);
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

      var imagePathL = this.options.item.imagefileL || default_img,
          imagePathM = this.options.item.imagefileM || default_img,
          imagePathH = this.options.item.imagefileH || default_img;

      var url = this.options.item.photopage === '' ? '' : "href='" + this.options.item.photopage + "'";

      this.logger.info('build - this.options.item:%o', this.options.item);

      return this.main_template({
        url: url,
        img: default_img,
        imagePath: { L: imagePathL, M: imagePathM, H: imagePathH },
        options: this.options.item
      });
    },

    clickPhoto: function(e) {
      if(Browser.app) {
        e.preventDefault();

        // replace low render with high render for apps
        // this won't affect filmstrip render because HTML and data-* attributes will have already been written
        var data = _.clone(this.options.item);
        data.imagefileL = data.imagefileH;
        data.scaption = data.lcaption;
        if(Browser.apptype.ios) {
          Common.sendiOSMessage('photoDetails', data);
        } else {
          data = JSON.stringify(data);
          Common.sendAndroidMessage('photo?data=' + data);
        }

        return false;
      }

      return true;
    }
  });

  return PhotoCardView;
});

