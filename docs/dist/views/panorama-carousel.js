define('views/panorama-carousel',['require','backbone','utils/carousel','utils/browser','views/base-carousel','settings','utils/metrics','utils/panoramas','text!templates/panorama-card.html!strip'],function(require) {
  var Backbone = require('backbone'),
      Carousel = require('utils/carousel'),
      Browser = require('utils/browser'),
      BaseCarousel = require('views/base-carousel'),
      Settings = require('settings'),
      Metrics = require('utils/metrics'),
      PanoUtil = require('utils/panoramas'),
      panoCardTemplate = require('text!templates/panorama-card.html!strip')
      ;

  var PanoramaCarousel = BaseCarousel.extend({

    template: _.template(panoCardTemplate),

    events: {
      'click div.panorama': 'launchPano'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('PanoramaCarouselView');
      BaseCarousel.prototype.initialize.apply(this, arguments);
    },

    loadContentCarousel: function() {
      this.populateCards();

      this.clearUnveil();
      this.unveil(this.$('.carousel').find('.image img'), { horizontal: true });

      this.carousel = new Carousel();
      var h_opts = this.getCarouselOptions();
      this.carousel.init(this.$('.carousel'),h_opts);
    },

    populateCards: function() {
      var panos = this.options.panoramas;

      var $panoramaContent = this.$('.carousel').empty();

      var title_prefix = "Hole No. " + this.options.hole + " ";

      for(var i=0,l=panos.length; i<l; i++) {
        var pano = panos.at(i);
        PanoUtil.parsePanoObject(pano);

        //gallery name label first item only
        if(i == 0) {
          pano.set('galleryname', "<div class='label text'>360&#176; View</div>");
        }

        //skip 360 view for ipad
        if(Browser.apptype.ipad){
          if(pano.get('device') == "no_ipad"){
            continue;
          }
        }

        // create html component
        var tmpl_html = this.template(pano.attributes);
        var $tmpl_html = $(tmpl_html);

        $tmpl_html.data('pano', pano.attributes);
        $tmpl_html.data('measure','Course:Hole '+this.options.hole+':360 Views');

        $panoramaContent.append($tmpl_html);
      };
    },

    launchPano: function(e) {
      var $this = $(e.currentTarget);
      if(!Browser.app) {
        PanoUtil.view.loadPanorama($this);
      } else {
        var pano_title = $this.data('pano').title;
        Common.sendiOSMessage('panorama', [this.options.hole, pano_title]);
      }
    }
  });

  return PanoramaCarousel;
});
