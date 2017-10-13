define('views/photo-caption',['require','jquery','underscore','backbone','utils/browser','text!templates/photo-caption.html!strip'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      Browser = require('utils/browser'),
      photoCaptionTemplate = require('text!templates/photo-caption.html!strip')
      ;

  var PhotoCaptionView = Backbone.View.extend({

    className: 'photoItem',

    main_template: _.template(photoCaptionTemplate),

    events: {
    },

    _template : undefined,
    _default : {
      story: false,
      flyover: false,
      btn: false,

      metrics_suffix: ''
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('PhotoCaptionView');
      this.logger.info('Initialize');

      this.options = $.extend({}, this._default, opts);
    },

    render: function() {
      this.$el.html(this.build());
      return this;
    },

    dispose: function(){
      Backbone.View.prototype.dispose.call(this,true);
    },

    build: function() {

      this.logger.info('build - this.options.item:%o',this.options.item);

      return this.main_template({
        options : this.options.item
      });
    }
  });

  return PhotoCaptionView;
});
