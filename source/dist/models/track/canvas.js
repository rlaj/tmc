define('models/track/canvas',['require','backbone','utils/pubsub','utils/browser','utils/window-size','utils/track/gfx','utils/track/track','utils/track/constants','models/track/state','text!templates/track/shot-overlay.html!strip'],function(require) {
  var Backbone = require('backbone'),
      PubSub = require('utils/pubsub'),
      Browser = require('utils/browser'),
      Win = require('utils/window-size'),

      GfxUtils = require('utils/track/gfx'),
      TrackUtils = require('utils/track/track'),
      Constants = require('utils/track/constants'),
      State = require('models/track/state'),
      shotOverlay = require('text!templates/track/shot-overlay.html!strip')
      ;

  var MarkerContainerView = Backbone.View.extend({
    className: 'marker-wrapper',

    shot_overlay_template: _.template(shotOverlay),

    initialize: function() {
      this.$el.attr({
        id: 'markers' + this.model.id,
        'data-id': this.model.id
      });

    },

    render: function() {
      State.trigger('markerwrapper:add', this);

      return this;
    },

    clear: function() {
      var objs = this.$('.marker, .detail-overlay');
      objs.remove();
    },

    drawMarker: function(point, klass) {
      // set up X+ in case of multiple putts in Fairway view
      var klass;
      // draw shot marker
      var number = point.get('number');
      var marker = this.$('.marker.shot' + number);

      if(klass.indexOf('plus') > -1) {
        this.$('.plus').removeClass('plus');
      }

      if(marker.length > 0) {
        marker.attr({
          "class" : 'marker' + klass + ' shot' + number,
          "data-shot" : number
        })
        .html(number)
        .css({ left: point.getRel('x') - Constants.MARKER.W_OFFSET, top: point.getRel('y') - Constants.MARKER.H_OFFSET });
      } else {
        // create marker
        var marker = $('<a href="#" class="marker' + klass + ' shot' + number + '" data-shot="' + number + '">' + number + '</a>');
        // position marker
        marker.css({ left: point.getRel('x') - Constants.MARKER.W_OFFSET, top: point.getRel('y') - Constants.MARKER.H_OFFSET });

        // add marker
        this.$el.append(marker);
      }
    },

    drawDetailOverlay: function(point, y_offset) {
      var number = point.get('number');
      var overlay = this.$('.shot-overlay.shot' + number);

      // create/update shot detail overlay
      var new_overlay = false;
      if(overlay.length === 0) {
        overlay = $(this.shot_overlay_template(point.attributes));
        new_overlay = true;
      }

      if(number > 0) {
        var span = overlay.removeClass('selected').find('.distance span').removeClass('feet inch');
        TrackUtils.setShotDistance(span, point);

        span = overlay.find('.topin').removeClass('score').find('span').removeClass('feet inch score');
        TrackUtils.setShotToPin(span, point);
      }

      if(point.get('selected')) {
        overlay.addClass('selected');
      }

      if(point.get('viewing')) {
        var open_shot;
        // if there's a shot open that is not this shot, hide that shot
        if(State.get('open_shot_detail') !== undefined && State.get('open_shot_detail') !== number) {
          open_shot = this.model.get('player').get('current_hole').shots[State.get('open_shot_detail') - 1];
          open_shot.dim_details();
        }
        point.show_details(overlay);
      }

      var left_align = false;
      if(number > 0) {
        left_align = Constants.OVERLAY_ALIGN[State.get('selected_hole') - 1 + (State.get('view_fairway') ? 0 : 18)];
        if(left_align) {
          overlay.addClass('left');
        } else if (!new_overlay) {
          overlay.removeClass('left');
        }
      } else {
        left_align = true;
        overlay.addClass('left');
        y_offset = -1 * (43 + y_offset);
      }

      var overlay_offset =  left_align ? (0 + 15) : (150 - 15);
      overlay.css({ left: point.getRel('x') - overlay_offset, top: point.getRel('y') + y_offset });

      if(new_overlay) {
        this.$el.append(overlay);
      }
    }

  });

  var CanvasView = Backbone.View.extend({
    tagName: 'canvas',

    initialize: function() {
      this.logger = new eventsCore.util.Logger('Track/CanvasView');

      this.$el.attr({
        id: this.model.id,
        width: GfxUtils.container_width,
        height: GfxUtils.container_height
      });
    },

    render: function() {
      State.trigger('markerwrapper:add', this);

      this._canvas = this.el;
      if(Browser.ie8 && window.G_vmlCanvasManager){
        this._canvas = G_vmlCanvasManager.initElement(this._canvas);
      }
      this.context = this._canvas.getContext('2d');

      GfxUtils.canvas_list[this.model.id] = this;

      return this;
    },

    onDispose: function() {
      this.context = undefined;
      this._canvas = undefined;

      delete GfxUtils.canvas_list[this.model.id];
    },

    setType: function() {
      this.$el.removeClass().addClass('type' + this.model.get('player').get('state'));
    },

    redraw: function() {
      this.model.get('player').draw();

      PubSub.trigger('lookup.unveil');
    },

    resize: function(w,h) {
      if(this.context) {
        if(this._canvas.width === w && this._canvas.height === h) {
          return false;
        }
        this._canvas.width = w;
        this._canvas.height = h;
        return true;
      }
    },

    clear: function() {
      if(this.context) {
        this.logger.info('calling clear canvas for ' + this.model.id);

        this.context.clearRect(0, 0, GfxUtils.container_width, GfxUtils.container_height);

        if(Browser.apptype.android && Browser.apptype.version < 4.4) {
          // android 4.1-4.3 test
          this.$el.remove();
          this.render();
        }
      }
    },

    drawPath: function(point) {
      var context = this.context;
      context.save();

      context.beginPath();

      var from = point.get('origin');

      // console.log(from);
      var fromx = from.getRel('x'),
          fromy = from.getRel('y');
      context.moveTo(fromx, fromy);

      context.lineWidth = 2;
      if (point.get('selected') || point.get('type') === Constants.STATE.COMPARE) {
        context.strokeStyle = Constants.COLORS[point.get('type')][0];
        if(this.model.get('player').get('compareIndex') > -1) {
          context.strokeStyle = Constants.COLORS[point.get('type')][this.model.get('player').get('compareIndex')];
        }
      } else {
        context.strokeStyle = '#FFFFFF';
        if(!Browser.apptype.android) {
          context.lineWidth = 1;
          context.globalAlpha = .6;
        }
      }

      var tox = point.getRel('x'),
          toy = point.getRel('y');
      if (from.get('ongreen')) {
        // draw line for putts
        context.lineTo(tox, toy);
      } else {
        var arc = Constants.MOBILE_ARC_CONSTANT;
        if(!State.get('view_fairway') || Win.size() !== Win.sizes.global) {
          arc = Constants.ARC_CONSTANT[point.get('hole') - 1 + (State.get('view_fairway') ? 0 : 18)];
        }
        // draw curves for all other shots
        var c1 = point.findControlPoint(from, point, (point.get('distance') / 36) * arc);
        // var c2 = point.findControlPoint(from, to, (point.distance/36)*2*.97);

        context.quadraticCurveTo(c1.getRel('x'), c1.getRel('y'), tox, toy);
        // context.quadraticCurveTo(c2.relx(), c2.rely(), from.relx(), from.rely());

        // context.fillStyle = '#FFFF00';
        // context.fill();
      }

      // normal shot path behavior
      if(!point.get('penalty') && (from.inView() && point.inView())) {
        context.stroke();
      }

      context.restore();
    },

    drawBall: function(point) {
      var ctx = this.context;
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      if(point.get('type') === Constants.STATE.COMPARE) {
        ctx.fillStyle = Constants.COLORS[point.get('type')][this.model.get('player').get('compareIndex')];
      }

      // draw ball
      ctx.beginPath();

      var alpha = 1, radius = 3, useNumber = false;
      ctx.globalAlpha = alpha;

      // draw ball outline
      ctx.arc(point.getRel('x'), point.getRel('y'), radius, 0, 2 * Math.PI);

      // set up slight drop shadow behind ball
      // ctx.shadowColor = "rgba(0,0,0,.45)";
      // ctx.shadowBlur = 3;
      // ctx.shadowOffsetX = 0;
      // ctx.shadowOffsetY = 0;

      // fill in ball
      ctx.fill();

      // ctx.strokeStyle = '#333333';
      // ctx.lineWidth = 1;
      // ctx.stroke();

      // reset shadow, fill
      ctx.restore();
    }
  })

  var Canvas = Backbone.Model.extend({
    defaults: {
      id: '',


      player: undefined
    },

    view: undefined,
    marker_container: undefined,

    initialize: function(attr, opts) {
      this.logger = new eventsCore.util.Logger('Track/Canvas');

      this.set('id', 'shotCanvas' + attr.id);

      this.set('player', attr.player);

      if(this.get('player') === undefined) {
        this.logger.error('attempting to initialize canvas for undefined player');

        return false;
      }
    },

    render: function() {
      if(this.marker_container === undefined) {
        this.marker_container = new MarkerContainerView({
          model: this
        }).render();
      }
      // this.set('marker_container', $('#markers'+this.get('id')));
      // if(this.get('marker_container').length === 0) {
      //   this.set('marker_container', $('<div id="markers' + this.get('id') + '" class="marker-wrapper" data-id="' + this.get('id') + '"></div>'));
      //   $('#markerWrapper').prepend(this.get('marker_container'));
      // }
      if(this.view === undefined) {
        this.view = new CanvasView({
          model: this
        }).render();
      }
      // if(this.view.length === 0) {
      //   this.view = $('<canvas id="' + this.get('id') + '" width="' + GfxUtils.container_width + '" height="' + GfxUtils.container_height + '"></canvas>'));
      //   $('#markerWrapper').prepend(this.view);
      //   GfxUtils.canvas_list[this.get('id')] = this;
      // }
      return this;
    },

    destroy: function() {
      if(this.view) {
        this.view.dispose();
      }
      if(this.marker_container) {
        this.marker_container.dispose();
      }

      this.view = this.marker_container = undefined;
    },

    set_canvas_type: function() {
      if(this.view) {
        this.view.setType();
      }
    },

    draw: function() {
      this.logger.info('draw for ' + this.id);
      this.get('player').draw();

      PubSub.trigger('lookup.unveil');
    },

    redraw: function() {
      this.draw();
    },

    clear: function() {
      // if no markers/etc, then no shots were drawn, don't bother processing
      if(this.marker_container && this.marker_container.$('.marker, .detail-overlay').length > 0) {
        this.marker_container.clear();
      }
      if(this.view) {
        this.view.clear();
      }
    }
  });

  return Canvas;
});
