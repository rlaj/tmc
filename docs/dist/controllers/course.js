define('controllers/course',['require','underscore','baseview','collections/holes','utils/ratio-resize','text!templates/hole-list.html!strip','unveil'],function(require) {
  var _ = require('underscore'),
      BaseView = require('baseview'),
      Holes = require('collections/holes'),
      RatioResize = require('utils/ratio-resize'),
      holeListTemplate = require('text!templates/hole-list.html!strip')
      ;

  require('unveil');

  var CourseView = BaseView.extend({

    template: _.template(holeListTemplate),

    onInitialization: function() {
      BaseView.prototype.onInitialization.apply(this, arguments);
      this.logger = new eventsCore.util.Logger('CourseView');
    },

    onRender: function() {
      BaseView.prototype.onRender.apply(this, arguments);

      var $img = this.hero.$('.imageWrapper');
      this.resize = new RatioResize({
        view: this,
        hcallback: function(w, h) {
          if($img.length > 0) {
            $img.css({
              // force define width and height values when contained <img> needs to be centered
              'width': Math.floor(h * (16/9)),
              'height': h
            });
          }
        },
        wcallback: function(w, h) {
          if($img.length > 0) {
            if($img[0].style.height !== '') {
              $img.css({
                'width': '',
                'height': ''
              });
            }
          }
        }
      });

      Holes.fetch({
        success: function(holes) {
          var holes_list_html = '';
          var obj = [];

          for(var i = 0; i < holes.length; i++) {
            holes_list_html = this.template({
              number: holes.models[i].get('number'),
              par: holes.models[i].get('par'),
              yds: holes.models[i].get('yds'),
              plant: holes.models[i].get('plant'),
              imageM: holes.models[i].get('imageM'),
              imageL: holes.models[i].get('imageL')
            });
            obj.push(holes_list_html);
          }

          this.populateHoleList(obj);
        }.bind(this)

      });
    },

    onDispose: function() {
      this.resize.dispose();
    },

    populateHoleList: function(holesObj) {
        // console.log("html-->" + holesObj);
      this.$('.courseholes').html(holesObj);
      $course_imgs = this.$('.courseholes').find('img.srcpic');
      this.unveil($course_imgs);
    }

  });

  return CourseView;
});

