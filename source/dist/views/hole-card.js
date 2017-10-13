define('views/hole-card',['require','jquery','underscore','backbone','utils/browser','utils/common','text!templates/hole-card.html!strip'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      Browser = require('utils/browser'),
      Common = require('utils/common'),
      holeCardTemplate = require('text!templates/hole-card.html!strip')
      ;

  var HoleCardView = Backbone.View.extend({

    className: 'holeCard',


    main_template: _.template(holeCardTemplate),

    events: {

      // 'click .favorite': 'updateFavorite'
    },

    _template: undefined,
    _default: {
      story: false,
      flyover: false,
      btn: false,

      metrics_suffix: ''
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('HoleCardView');
      this.logger.info('Initialize');

      this.$el.attr({
        'data-id': 'hole' + this.model.get('number')
      });

      this.options = $.extend({}, this._default, opts);

      // this.listenTo(this.model, 'change:faved', this.toggleFavorite);
    },

    render: function() {
      this.$el.html(this.build());
      return this;
    },

    onDispose: function() {
      this.$('a').off('click');
    },

    // build: function(hole_data, opts) {
    build: function() {
      // this.opts = $.extend({}, this._default, opts);

      // build standard hole card with hole info, etc
      var default_img = '/images/course/F_hole' + this.model.get('number') + '.jpg';

      // img = 'http://placehold.it/467x263/0C4825.jpg&text=Hole'+hole_data.number+', '+hole_data.find("plant").text();
      default_img = '/images/now/trans_16x9.gif';

      var par = this.model.get('par') || '&nbsp;',
          yards = this.model.get('yds') || '&nbsp;',
          story = this.options.story || '&nbsp;',
          imagePathL = this.model.get('imageL').src || default_img,
          imagePathM = this.model.get('imageM').src || default_img,
          imagePathH = this.model.get('imageH').src || default_img;

      var url = '/en_US/course/hole' + this.model.get('number')  + '.html';
      if(this.options.metrics_suffix !== '') {
        url += '?promo=' + this.options.metrics_suffix;
      }

      this.logger.info('build - this.model.attributes:%o', this.model.attributes);

      var html = this.main_template({
        hole_data: this.model.attributes,
        url: url,
        inApp: Browser.app,
        img: default_img,
        imagePath: { L: imagePathL, M: imagePathM, H: imagePathH },
        par: par,
        yards: yards,
        story: story,
        options: this.options
      });

      if(Browser.app) {
        html = $(html);
        var hole_num = this.model.get('number');
        if(Browser.apptype.android) {
          html.on('click', function(e) {
            e.preventDefault();
            Common.sendAndroidMessage('hole?id=' + hole_num);
          });
        } else {
          html.on('click', function(e) {
            e.preventDefault();
            Common.sendiOSMessage('hole', hole_num);
          });
        }
      }

      return html;
    }
  });

  return HoleCardView;
});

