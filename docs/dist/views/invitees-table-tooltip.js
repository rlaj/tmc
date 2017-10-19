define('views/invitees-table-tooltip',['require','backbone','utils/browser'],function(require) {
  var Backbone = require('backbone'),
      Browser = require('utils/browser')      
      ;

  var JST = {};


  JST.tooltip_hover = _.template(
      '<div class="text"><%= tip_html %></div>'
  );

  //template for mobile/touchscreen devices
  JST.tooltip_tap =  _.template(
    '<div class="close"></div>' +
    '<div class="text"><%= tip_html %></div>' 
  );

  var InviteesTableTooltipView = Backbone.View.extend({
    tagName: 'p',
    className: 'tooltip',

    events: function() {
      var _events = {};
      if(Browser.mobiledevice) {
        _events['click .close'] = '_close';
      } 
      return _events;
    },

    initialize: function(opts) {
      var klass = '';
      if(!Browser.mobiledevice) {
        this.template = JST.tooltip_hover;
        klass = 'hover';
      } else {
        this.template = JST.tooltip_tap;
        klass = 'tap';
      }
      this.$el.addClass(klass);

    },

    render: function(tipHtml) {
      this.$el.html(this.template({tip_html: tipHtml || ''}));
      return this;
    },

    _close: function() {
      this.trigger('close');
    },

    onDispose: function() {
    }

  });

  return InviteesTableTooltipView;
})

;
