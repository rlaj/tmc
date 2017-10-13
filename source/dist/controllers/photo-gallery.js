define('controllers/photo-gallery',['require','jquery','baseview','utils/metrics','utils/common','utils/gallery'],function(require) {
  var $ = require('jquery'),
      BaseView = require('baseview'),
      Metrics = require('utils/metrics'),
      Common = require('utils/common'),
      PhotoGallery = require('utils/gallery')
      ;

  var PhotoGalleryView = BaseView.extend({
    events: {
      'click .caption-toggle': 'loadCaption'
    },

    onInitialization: function() {
      // hideBackLink
      this.hideBackLink();

      this.infoBarShow();

      this.loadPhotoGallery();

      this.listenTo(this.photo_gallery, 'related:load', this.loadRelated);
      this.listenTo(this.photo_gallery, 'related:unload', this.unloadRelated);
    },

    processPageVars: function() {
      var pageDetails = this.jsonData.pageDetails;

      // encodeURIComponent the following values
      var encodeKeys = ['pageId', 'pageURL', 'pageTitle2', 'pageAbstr'];
      for(var i = encodeKeys.length - 1; i >= 0; i--) {
        var k = encodeKeys[i];
        pageDetails[k] = encodeURIComponent(pageDetails[k]);
      }

      this.pageTitle = 'Detail';

      this.pageId = pageDetails.pageId;

      var metrics = this.jsonData.metrics;
      // assign prop values based on page vars
      this.props = _.extend({}, {
        prop19: pageDetails.pageTitle,
        prop17: 'Photo Gallery:' + pageDetails.pageTitle
      }, metrics);

      this.logger.info('processPageVars - data:%o', this.jsonData);
    },

    onRender: function() {
      this.photo_gallery.render();
    },

    onDispose: function() {
      this.$el.removeClass('related');
      this.photo_gallery.dispose();
    },

    infoBarHide: function() {
      this.$('.info-bar').removeClass('visible');
      this.$('.info-bar').addClass('hidden');
      this.$('.caption-toggle').removeClass('open');
    },

    infoBarShow: function() {
      this.$('.info-bar').removeClass('hidden');
      this.$('.info-bar').addClass('visible');
      this.$('.caption-toggle').addClass('open');
    },

    hideBackLink: function() {
      if(Common.hideBackLink()) {
        var link = this.$('a.headerlink');
        var html = link.html();
        html = html.replace('Back', 'Home');

        link.attr({
          onclick: '',
          href: '/en_US/index.html'
        }).html(html);
      }
    },

    loadCaption: function(e) {
      if($(e.target).hasClass('open')) {
        this.infoBarHide();
        Metrics.measureApp(Metrics.page_section, 'Hide Caption');
      } else {
        this.infoBarShow();
        Metrics.measureApp(Metrics.page_section, 'Show Caption');
      }
    },

    loadPhotoGallery: function() {
      // console.log("gallery path--->%o", this.jsonData.galleryPath);
      this.photo_gallery = new PhotoGallery({
        el: this.$('#photoGallery'),
        title: this.$('.title-bar'),
        path: this.jsonData.galleryPath,
        load_details: true,
        related_id: this.jsonData.documentTitle === 'Photo' ? '' : this.pageId
      });
    },

    loadRelated: function() {
      this.$('.gallery').addClass('related');
    },

    unloadRelated: function() {
      this.$('.gallery').removeClass('related');
    }
  });

  return PhotoGalleryView;
});

