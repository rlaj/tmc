define('utils/panoramas',['require','underscore','backbone','utils/browser','utils/overlay','utils/pubsub','bigshot','swfobject','utils/metrics'],function(require) {
  var _ = require('underscore'),
      Backbone = require('backbone'),
      Browser = require('utils/browser'),
      Overlay = require('utils/overlay'),
      PubSub = require('utils/pubsub'),
      bigshot = require('bigshot'),
      swfobject = require('swfobject'),
      Metrics = require('utils/metrics')
      ;

  var Panoramas = function() {
    var panocontainer, outerpanocontainer, renderer;
    var linear = null;
    var bvr;
    var bvrFull;
    var useFlash = !(Modernizr.csstransforms3d || Modernizr.webgl); // || Global.Browser.android;
    var resizeTimeout;
    var noFlashText = "<div class=\"noflashtext\"><a href=\"/en_US/flashupgrade.html?fl=false\">Flash 11.2 is necessary<br/>to view this content.<br/>Upgrade here.</a></div>";

    // debug
    var showYawButton = false;
    var forceFlash = false;

    var init = false;

    var JST = {}
    JST.image_map = '<div class="radar"><img src="/images/course/panorama_radar.png" width="41" height="43" /></div>' +
                    '<div class="button"><img src="/images/misc/trans.gif" width="12" height="12" /></div>';


    this.parsePanoObject = function(obj) {
      // create pano object
      var p = obj;
      p.set('title', obj.get('alt'));
      if(p.get('title') == undefined || p.get('title') == "") {
        p.set('title', obj.get('description'));
      }
      p.set('archive_path', obj.get('path'));

      // featured attributes
      p.set('img_width', parseInt(p.get('btn_width')) + 20);
    }

    var PanoOverlay = Backbone.View.extend({

      el: '#overlayPanoramaContent',

      events: {
        'click .close a': 'close',
        'mousedown #overlayPanoramaMessage': 'closeMessage',
        'touchstart': 'closeMessage',
        'mousedown': 'closeMessage',
        'click #overlayPanoramaFullscreen': 'vrFullScreen'
      },

      initialize: function() {
        if(!init) {
          // variable setup for panoramas
          this.setElement(Overlay.$('#overlayPanoramaContent'));
          this.$panocontainer = this.$('#overlayPanoramaContentWrapper');
          if (bigshot.WebGLUtil.isWebGLSupported ()) {
            linear = bigshot.WebGLUtil.createContext (document.createElement ("canvas")).LINEAR;
          } else {
            renderer = 'css';
          }

          // force flash if webgl unavailable, unless on iPad so that we only use CSS3D Transforms on iPad
          // CSS3D transforms don't seem to work well on Android 4.0.4
          useFlash = useFlash || (linear == undefined && !Global.Browser.ios);

          this.setupPanoOverlays();

          init = true;
        }
      },

      setupPanoOverlays: function() {
        // add radar cone and button images
        this.$('#overlayPanoramaImageMap').html(JST.image_map);

        // if using CSS3D Transforms
        if(!useFlash && !forceFlash && renderer == 'css') {
          // move #overlayPanoramaImageMap outside of #overlayPanoramaContentWrapper
          var map = this.$panocontainer.children().detach();
          this.$el.append(map);
        }
      },

      // fade message on mousedown, transfer click to canvas/object
      closeMessage: function(e) {
        var msg = this.$('#overlayPanoramaMessage').fadeOut();
        if($(e.currentTarget).attr('id') === 'overlayPanoramaMessage') {
          msg.siblings('canvas, object').trigger('click');
        }
      },

      loadPanorama: function(lnk) {
        // bring up overlay
        this.pano = lnk;

        this.openOverlayPano();

        Overlay.setPanoContainerSize();

        // var pano = $pano.data('pano');
        this.setupVRPano();
      },

      openOverlayPano: function() {
        Overlay.open();
        Overlay.$('.overlay_panel').hide();
        Overlay.$('#overlayPanorama').show();
      },

      closeOverlayPano: function() {
        PubSub.off('throttle:resize', this.resizePano, this);
        PubSub.off('windowsize:global:enter', this.disableFlashImageMap, this);
        PubSub.off('windowsize:global:exit', this.enableFlashImageMap, this);
        $(window).off('.pano');
        window.onEnter = function() {}

        if(!forceFlash && !useFlash)  {
          if(bvr && !bvr.disposed) {
            bvr.dispose(); // unregister existing hooks before loading new pano
          }
        } else {
          swfobject.removeSWF('flashcontainer');
          this.$('#flashcontainer').remove();
          // swfobject.removeSWF('overlayPanoramaContentWrapper');
          // $(outerpanocontainer).append('<div id="overlayPanoramaContentWrapper"></div>');
        }
        this.$('#showyawbtn').remove();
        this.pano = undefined;
      },

      close: function() {
        Metrics.measureApp(this.pano.data('measure'), 'Close View');
        this.closeOverlayPano();
      },

      setupVRPano: function() {
        var success = false;

        var p = this.pano.data('pano');
        var m = this.pano.data('measure');

        if(!forceFlash && !useFlash)  {
          bvr = new bigshot.VRPanorama (
            new bigshot.VRPanoramaParameters({
              basePath : p.archive_path,
              container : this.$panocontainer[0],
              // renderer: 'css',
              fileSystemType : "dzi",
              textureMinFilter: linear,
              textureMagFilter: linear,
              maxPitch: 33,
              minPitch: -37.5,
              yawOffset : p.yawOffset,
              pitchOffset : 0,
              rollOffset : 0
            })
          );

          bvr.setDragMode(bigshot.VRPanorama.DRAG_GRAB);
          bvr.autoResizeContainer(this.el);
          bvr.onresize();

          var move = this.loadImageMap(p);
          var prevAngle = -1;

          bvr.addRenderListener(function(state, cause, data) {
            if(state === bigshot.VRPanorama.ONRENDER_BEGIN) {
              var y = this.showYaw(p.yawOffset);
              y = parseInt(y,10);
              if(y !== prevAngle) {
                move(prevAngle,y);
                prevAngle = y;
              }
            }
          }.bind(this))

          bvr.render();

          // auto resize panorama on window resize after 0.5s timeout
          PubSub.on('throttle:resize', this.resizePano, this);

          Metrics.measureApp(m,'Select View','HTML5',p.title);
          success = true;
        } else {
          // if(!hasReqestedFlashVersion) {
          if(!swfobject.hasFlashPlayerVersion("11.2.0")) {
            this.$panocontainer.html(noFlashText);
          } else {
            var flash_path = p.archive_path.replace('images', 'en_US/xml/man');
            flash_path = flash_path.slice(0,-1);
            flash_path = flash_path.substr(0, flash_path.lastIndexOf('/')+1);
            var flashvars = {
              'xml' : flash_path+p.id+'.xml'
            };
            var params = {
              'menu' : 'false',
              'quality' : 'high',
              'wmode' : 'transparent',
              'allowfullscreen' : 'true'
            };
            if(document.getElementById('flashcontainer') !== undefined) {
              this.$('#flashcontainer').remove();
            }
            this.$panocontainer.html('<div id="flashcontainer"></div>');
            swfobject.embedSWF("/mas/flash/SaladoPlayer-1.3.swf", "flashcontainer", "100%", "100%", "10.1.0", false, flashvars, params);
            // swfobject.embedSWF("/mas/flash/SaladoPlayer-1.3.swf", "overlayPanoramaContentWrapper", "100%", "100%", "10.1.0", false, flashvars, params);
            this.$('#overlayPanoramaFullscreen, #overlayPanoramaImageMap').hide();

            $(window).off('.pano').on('resize.pano', this.resizePano);

            PubSub.on('windowsize:global:enter', this.disableFlashImageMap, this)
              .on('windowsize:global:exit', this.enableFlashImageMap, this);

            Metrics.measureApp(m,'Select View','Flash',p.title);
            success = true;

            // SaladoPlayer: JSGateway call to hide ImageMap on load if screen size <720px
            window.onEnter = function() {
              if(Win.size() === Win.sizes.global) {
                document.getElementById('flashcontainer').toggleImageMap(false);
              }
            }
          }
        }

        if(success) {
          this.initPanoramaMessage();
          var $title = this.$('#overlayPanoramaTitle');
          $title.html('360&#176; View of '+p.title);

          if(showYawButton && !forceFlash && !useFlash)  {
            // temporary show yaw button to determine starting points
            if(document.getElementById('showyawbtn') != undefined) {
              this.$('#showyawbtn,#showdiffbtn,#moveCenter').remove();
            }
            this.$el.append(
              '<div id="showyawbtn" onclick="alert(showYaw(\''+p.yawOffset+'\'))" style="position:absolute;left:0;top:0;z-index:15;background:black;color:white;cursor:pointer;">Show Yaw</div>' +
              '<div id="showdiffbtn" onclick="alert(showMapDiff(\''+p.mapDiff+'\'))" style="position:absolute;left:0;top:1em;z-index:15;background:black;color:white;cursor:pointer;">Show Diff</div>' +
              '<div id="moveCenter" style="position:absolute;right:5px;bottom:48px;z-index:15;width:38px;font-size:16px;text-align:center;background: #CCCCCC"><a href="#" onclick="showMapCoords();return false;" style="font-size:10px;float:left;margin-bottom:0.5em;">Show Coords</a><br/><a href="#" onclick="moveCenter(\'up\');return false;">^</a><br/><a href="#" onclick="moveCenter(\'down\');return false;">v</a><br/><a href="#" onclick="moveCenter(\'left\');return false;"><</a><br/><a href="#" onclick="moveCenter(\'right\');return false;">></a></div>'
            );
            this.$('#showyawbtn').on('click', function(e) {
              alert(this.showYaw(p.yawOffset));
            });
            this.$('#showdiffbtn').on('click', function(e) {
              alert(this.showMapDiff(p.mapDiff));
            });
          }

          // if(Cufon)
          //   Cufon.replace('#overlayPanoramaTitle', {fontFamily: 'Breuer Light',fontWeight:'bold'});
          $title.css('margin-left', -1*parseInt($title.width()/2 + 10)+'px');
        } else {
          this.$('#overlayPanoramaMessage').hide();
          this.$('#overlayPanoramaTitle').hide();
        }
      },

      resizePano: function() {
        Overlay.setPanoContainerSize();
        if(bvr) {
          bvr.onresize();
        }
      },

      enableFlashImageMap: function() {
        document.getElementById('flashcontainer').toggleImageMap(true);
      },

      disableFlashImageMap: function() {
        document.getElementById('flashcontainer').toggleImageMap(false);
      },

      showYaw: function(offset) {
        offset = bvr.getYaw() + 1*offset;
        if(offset > 360) {
          offset -=360;
        }
        return offset;
      },

      /** Start debug helper functions **/

      showMapDiff: function(diff) {
        var o1 = bvr.getYaw() + 1*diff;
        if(o1 > 360) {
          o1 -=360;
        }
        return o1;
      },

      moveCenter: function(dir) {
        switch(dir) {
          case 'up':
            this.$('#overlayPanoramaImageMap').find('.radar,.button').css('top','-=1');
            break;
          case 'down':
            this.$('#overlayPanoramaImageMap').find('.radar,.button').css('top','+=1');
            break;
          case 'left':
            this.$('#overlayPanoramaImageMap').find('.radar,.button').css('left','-=1');
            break;
          case 'right':
            this.$('#overlayPanoramaImageMap').find('.radar,.button').css('left','+=1');
            break;
        }
      },

      showMapCoords: function() {
        var l = parseInt(this.$('#overlayPanoramaImageMap').find('.radar').css('left'),10);
        var t = parseInt(this.$('#overlayPanoramaImageMap').find('.radar').css('top'),10);

        alert(l + "," + t);
      },
      /** End debug functions **/

      loadImageMap: function(pano) {
        var map_img = pano.archive_path + 'minimap.jpg';
        var mapcontainer = this.$('#overlayPanoramaImageMap');

        mapcontainer.css('background-image', 'url("'+map_img+'")');

        var width = 224,
            height = 121,
            radar = mapcontainer.find('.radar'),
            radar_cone = radar.find('img').get(0),
            button = mapcontainer.find('.button'),
            diff = parseInt(pano.mapDiff,10) || 0;

        // set center of radar cone and center dot
        var map_coord = pano.mapCoord;
        if(map_coord !== undefined && map_coord !== "") {
          map_coord = map_coord.split(',');
          radar.css({
            'left' : map_coord[0] + 'px',
            'top' : map_coord[1] + 'px'
          });

          button.css({
            'left' : (map_coord[0]-6) + 'px',
            'top' : (map_coord[1]-6) + 'px'
          })
        }

        return function(from,angle) {
          // subtract 135 deg so that 0 rotation centers cone due north to match flash viewer
          var rotation_angle = angle+diff-135;

          radar_cone.style[Modernizr.prefixed('transform')] = 'rotate('+rotation_angle+'deg)';
          return angle;
        }
      },

      initPanoramaMessage: function() {
        this.$('#overlayPanoramaMessage').show();

        if(Browser.ios) {
          setTimeout(function() {
            this.$('#overlayPanoramaMessage').fadeOut();
          }.bind(this), 2500);
        }
        if(Browser.mobiledevice){
          this.$('#overlayPanoramaFullscreen').hide();
        }
      },

      vrFullScreen: function() {
        if (bvrFull) {
          delete bvrFull;
        }
        var zi = bvr;
        savedParent = this.$panocontainer[0].parentNode;

        var div = document.createElement("div");
        div.style.position = "fixed";
        div.style.top = "0px";
        div.style.left = "50%";
        div.style.zIndex = "9999";

        var outer = document.createElement("div");
        outer.className = "vrContainerOuterFullScreen";

        outer = div.appendChild(outer);
        div = document.body.appendChild(div);

        this.$('#overlayPanoramaFullscreen, #overlayPanorama .close').hide();

        // if(Cufon)
        //   Cufon.refresh('#overlayPanoramaTitle');

        bvrFull = zi.fullScreen(function() {
          delete bvrFull;
          document.body.removeChild(div);
          this.$panocontainer.css('width', "");
          this.$panocontainer.css('height', "");

          this.$('#overlayPanoramaFullscreen, #overlayPanorama .close').show();
          // if(Cufon)
          //   Cufon.refresh('#overlayPanoramaTitle');
        });
      }

    });

    this.view = new PanoOverlay();
  }

  return new Panoramas();
});
