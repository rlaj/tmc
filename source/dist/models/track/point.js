define('models/track/point',['require','backbone','utils/browser','utils/track/constants','utils/track/gfx','utils/track/track','models/track/state','utils/window-size'],function(require) {
  var Backbone = require('backbone'),
      Browser = require('utils/browser'),
      Constants = require('utils/track/constants'),
      GfxUtils = require('utils/track/gfx'),
      TrackUtils = require('utils/track/track'),
      State = require('models/track/state'),
      Win = require('utils/window-size')
      ;

  var Point = Backbone.Model.extend({
    defaults: {
      x: 0,
      y: 0,
      z: 0,
      xz: 0,
      yz: 0,
      zz: 0,
      xm: 0,
      ym: 0,
      zm: 0,

      type: Constants.STATE.INACTIVE,
      hole: undefined,

      selected: false,

      canvas: undefined,
      player: undefined
    },

    initialize: function(attr, opts) {
      this.logger = new eventsCore.util.Logger('Track/Point');

      this.set('x', parseFloat(attr.x));
      this.set('y', parseFloat(attr.y));
      this.set('z', parseFloat(attr.z));

      // if xz is defined, assume yz is too
      if (attr.xz !== undefined) {
        this.set('xz', parseFloat(attr.xz));
        this.set('yz', parseFloat(attr.yz));
        this.set('zz', parseFloat(attr.zz));
      } else if (attr.xZ !== undefined) {
        this.set('xz', parseFloat(attr.xZ));
        this.set('yz', parseFloat(attr.yZ));
        this.set('zz', parseFloat(attr.zZ));
      } else { // otherwise, assign x, y to xz, yz
        this.set('xz', this.attributes['x']);
        this.set('yz', this.attributes['y']);
        this.set('zz', this.attributes['z']);
      }

      // if xz is defined, assume yz is too
      if (attr.xm !== undefined) {
        this.set('xm', parseFloat(attr.xm));
        this.set('ym', parseFloat(attr.ym));
        this.set('zm', parseFloat(attr.zm));
      } else if (attr.xM !== undefined) {
        this.set('xm', parseFloat(attr.xM));
        this.set('ym', parseFloat(attr.yM));
        this.set('zm', parseFloat(attr.zM));
      } else { // otherwise, assign x, y to xp, yp
        this.set('xm', this.attributes['x']);
        this.set('ym', this.attributes['y']);
        this.set('zm', this.attributes['z']);
      }

      if(!this.get('hole')) {
        this.set('hole', State.get('selected_hole'));
      }
    },

    getValue: function(key) {
      if(State.get('view_fairway')) {
        if(Win.size() === Win.sizes.global && Win.orientation() === Win.orientations.portrait) {
          return this.attributes[key + 'm'];
        }
        else {
          return this.attributes[key];
        }
      }
      else {
        return this.attributes[key + 'z'];
      }
    },

    /* If we're not converting from 4:3 dimensions to 16:9 renders, don't need to recalculate percentages */
    // returns px values based on 2048x1536 size, original 4:3 render size
    get: function (key) {
      if(key.length <= 2 && ['x','y','z'].indexOf(key[0]) > -1) {
        var val = this.getValue(key);
        // if(key === 'x') {
        //   return Track.WIDTH * val;
        // }
        // if(key === 'y') {
        //   return Track.OLD_HEIGHT * val;
        // }
        return val;

        // var ret;
        // if(Track.view_fairway) {
        //   var hole = this.hole;
        //   if(Track.showing_playoff) { hole = (hole % 2 === 0 ? 10 : 18); }
        //   ret = this[key] * Track.OLD_HEIGHT; // - (Track.CROP_OFFSET + OFFSET[hole - 1]);
        // } else {
        //   var hole = this.hole;
        //   if(Track.showing_playoff) { hole = (hole % 2 === 0 ? 10 : 18); }
        //   ret = this[key + 'z'] * Track.OLD_HEIGHT; // - (Track.CROP_OFFSET + OFFSET[hole - 1 + 18]);
        // }

        // return ret;
      } else {
        return Backbone.Model.prototype.get.call(this, key);
      }
    },

    // returns px values relative to dynamic container size
    getRel: function (key) {
      return GfxUtils.relative(key, this.get(key));
    },

    // returns true or false based on whether point is within view
    inView: function () {
      var x = GfxUtils.pctx(this.get('x')),
          y = GfxUtils.pcty(this.get('y'))
          z = this.getValue('z');

      return x >=0 && x <= 1 && y >=0 && y <= 1 && z >= 0 && z <= 1;
    },

    setType: function (value) {
      this.set('type', value);
      this.set('timeout', 10000);
      if(this.get('type') === Constants.STATE.GHOST) {
        this.set('timeout', 5000);
      }
    },

    /**
     * Check if Point matches a given type(s)
     * @param  {Array}  types Array of types to match against
     * @return {Boolean}       Returns true or false
     */
    isType: function(types) {
      if(types.indexOf(this.get('type')) > -1) {
        return true;
      }
      return false;
    },

    findMidpoint : function (from, to) {
      // var mid = {};
      // mid.x = (from.x + to.x) / 2;
      // mid.y = (from.y + to.y) / 2;

      var mid = new ControlPoint({
        x: (from.getValue('x') + to.getValue('x')) / 2,
        y: (from.getValue('y') + to.getValue('y')) / 2
      });
      return mid;
    },

    findSlope : function (from, to) {
      return (from.getRel('y') - to.getRel('y')) / (from.getRel('x') - to.getRel('x'));
    },

    findControlPoint : function (from, to, distance) {
      distance = distance/GfxUtils.container_width;
      var midpoint = this.findMidpoint(from, to);
      var shotSlope = this.findSlope(from, to);
      var controlPointSlope = -1 / shotSlope;

      // console.log('shot '+to.number+':');
      // console.log('slope: ' + shotSlope);
      // console.log('perpendicular: ' + controlPointSlope);
      // console.log('from: ');
      // console.log(from);
      // console.log('to:');
      // console.log(to);
      var controlPoint;
      if (shotSlope === 0) {
        // horizontal, return the x midpoint + distance to move up
        controlPoint = new ControlPoint({
          x: midpoint.getValue('x'),
          y: midpoint.getValue('y') - distance
        });
      } else if (from.get('x') === to.get('x')) {
        // vertical, return the y midpoint + distance to move left
        controlPoint = new ControlPoint({
          x: midpoint.getValue('x') - distance,
          y: midpoint.getValue('y')
        });
      } else {
        // normal arc
        var x1 = midpoint.getValue('x') + distance / Math.sqrt(1 + controlPointSlope * controlPointSlope);
        var x2 = midpoint.getValue('x') - distance / Math.sqrt(1 + controlPointSlope * controlPointSlope);

        var y1 = controlPointSlope * (x1 - midpoint.getValue('x')) + midpoint.getValue('y');
        var y2 = controlPointSlope * (x2 - midpoint.getValue('x')) + midpoint.getValue('y');

        // console.log('x1:'+x1+', y1:'+y1);
        // console.log('midpoint x:'+midpoint.getValue('x') + ', y:'+midpoint.getValue('y'));
        // console.log('x2:'+x2+', y2:'+y2);

        if (y1 <= midpoint.getValue('y')) {
          controlPoint = new ControlPoint({x: x1, y: y1 });
        } else {
          controlPoint = new ControlPoint({x: x2, y: y2 });
        }
      }

      return controlPoint;
    },


    draw: function() {
      // draw ball at ending position
      this.logger.info('drawing shot ' + this.get('number') + ' for ' + this.get('player').id);

      if(this.get('type') === Constants.STATE.PRIMARY || this.get('type') === Constants.STATE.COMPARE) {
        this.drawPath();
      }
      this.drawBall();
    },

    drawPath: function() {
      this.get('canvas').view.drawPath(this);

      var from = this.get('origin');
      if (from.get('origin') !== undefined) {
        from.draw();
      } else {
        this.endDraw();
      }
    },

    endDraw: function() {
      // Make sure we're not just redrawing the same tee ball when comparing players
      if(this.get('canvas').id === this.get('origin').get('canvas').id) {
        this.get('origin').drawBall();
      }
    },

    drawBall: function() {
      if(this.inView()) {
        if(this.get('type') === Constants.STATE.TEE || this.get('type') === Constants.STATE.PRIMARY || this.get('type') === Constants.STATE.COMPARE) {
          this.get('canvas').view.drawBall(this);
        }

        if(this.get('type') !== Constants.STATE.TEE && this.get('type') !== Constants.STATE.INACTIVE) {
          // don't draw for tee position
          if (this.get('remaining') !== undefined) {
            this.drawShotMarker();
          }
        }
      }
    },

    drawShotMarker: function() {
      // set up X+ in case of multiple putts in Fairway view
      var klass = '';

      if(this.get('type') === Constants.STATE.PRIMARY || this.get('type') === Constants.STATE.COMPARE) {
        // draw shot marker
        var number = this.get('number');
        var overlay_y_offset = 20;

        if(number > 0) {

          // if in fairway view and either shot did not start from green or shot did not land on the green
          if (State.get('view_fairway') && (!this.get('origin').get('ongreen') || !this.get('ongreen'))) {
            // only show plus if
            // this shot landed on the green
            // and if next shot is not a hole out, meaning player 1-putted

            // set next shot unless point is last one
            var all_shots = this.get('player').get('current_hole').shots;
            var next_shot_index = number;
            if (number === all_shots.length) {
              next_shot_index = this.get('number') - 1;
            }
            var next_shot = all_shots[next_shot_index];
            // show plus if next shot is not current, and next shot isn't hole out
            if (this.get('ongreen') && number !== next_shot.get('number') && next_shot.get('remaining') > 0) {
              klass = ' plus';
            }
          }
          // always show all shots on green
          else if (!State.get('view_fairway')) {
            klass = '';
          } else {
            klass = ' hidden';
            overlay_y_offset = 6;
          }

          if (this.get('penalty')) {
            klass += ' penalty';
          }
          if (this.get('selected')) {
            klass += ' selected';
          }

          if (this.get('type') === Constants.STATE.COMPARE) {
            klass += ' compare compare' + this.get('player').get('compareIndex');
          }

          this.get('canvas').marker_container.drawMarker(this, klass);
        }

        if (Win.size() !== Win.sizes.global && !State.get('compare_mode')) {
          if(this.get('type') === Constants.STATE.PRIMARY) {

            this.get('canvas').marker_container.drawDetailOverlay(this, overlay_y_offset);
          }
        }
      }
      /**
       * Ghost markers and overlays were deprecated, have not been moved to CanvasView and MarkerContainerView
       */
      // else if (!Track.compare_mode && this.type === STATE.GHOST) {
      //   klass = ' ghost';

      //   var ghost = $('#ghost' + this.player.id);
      //   var overlay = wrapper.find('.ghost-overlay');
      //   if(windowSize !== 'global'){
      //     if(ghost.length > 0) {
      //       ghost.attr({
      //         "class" : 'marker ' + klass,
      //         "data-shot" : this.number
      //       })
      //       .css({ left: this.getRel('x') - Track.GHOST_MARKER.W_OFFSET, top: this.getRel('y') - Track.GHOST_MARKER.H_OFFSET });
      //     } else {
      //       // create marker
      //       var marker = $('<div id="ghost' + this.player.id + '" class="marker' + klass + '" data-shot="' + this.number + '"></div>');
      //       // position marker
      //       marker.css({ left: this.getRel('x') - Track.GHOST_MARKER.W_OFFSET, top: this.getRel('y') - Track.GHOST_MARKER.H_OFFSET });

      //       // add marker
      //       wrapper.append(marker);
      //     }
      //   }

      //   // create/update shot detail overlay
      //   var new_overlay = false;
      //   if(overlay.length === 0) {
      //     var overlay = $('#shotOverlay').find('.ghost-overlay').clone();
      //     var name = this.player.name.first + ' ' + this.player.name.last;
      //     overlay.find('a.ghost_link').attr({
      //       'href' : '/en_US/players/player_' + this.player.id + '.html',
      //       'data-id' : this.player.id
      //     })
      //     .find('img').attr({
      //       'src' : '/images/players/2016/200x92/' + this.player.id + '.jpg',
      //       'alt' : name
      //     });
      //     overlay.find('.name').html(name);
      //     new_overlay = true;
      //   }

      //   overlay.attr({
      //     'data-shot': this.number
      //   })
      //   .find('.shot-number').html(this.number);

      //   if(this.viewing) {
      //     var open_shot;
      //     // if there's a shot open for the primary tracked player, dim it
      //     for(var o=0,l=Track.open_shot_stack.length;o<l;o++) {
      //       open_shot = Track.open_shot_stack[o];
      //       if(!open_shot.dimmed && open_shot.type === STATE.PRIMARY) { open_shot.dim_details(); }
      //     }

      //     // if(Track.open_shot_detail !== undefined) {
      //     //   open_shot = Track.Base.getPlayer().current_hole.shots[Track.open_shot_detail - 1];
      //     //   open_shot.dim_details();
      //     // }
      //     this.show_details(overlay);
      //   }

      //   var left_align = OVERLAY_ALIGN[Track.selected_hole - 1 + (Track.view_fairway ? 0 : 18)];
      //   if(left_align) {
      //     overlay.addClass('left');
      //   } else if (!new_overlay) {
      //     overlay.removeClass('left');
      //   }

      //   var overlay_offset = left_align ? 0 + 16 : 160 - 16;
      //   overlay.css({ left: this.getRel('x') - overlay_offset, top: this.getRel('y') + 12 });

      //   if(new_overlay) {
      //     wrapper.append(overlay);
      //   }
      // }
    }
  });

  // stictly for semantic purposes, but serves no real purpose otherwise
  var ControlPoint = Point.extend({});

  return Point;
});
