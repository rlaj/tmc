define('models/rc_video',['require','underscore','backbone','settings'],function(require) {
  var _ = require('underscore'),
      Backbone = require('backbone'),
      Settings = require('settings')
      ;

  // sample url
  // http://www-pre.masters.com/relatedcontent/rest/masters_2016/en/content/byId/masters_2016_2016_r3_32839_2_1_en

  // sample data
  // {
  //   "title": "Hideki Matsuyama | 2nd Hole, Round 3",
  //   "contentId": "masters_2016_2016_r3_32839_2_1_en",
  //   "published": "2016-04-10 08:07:22.0",
  //   "date": "2016-04-10",
  //   "type": "video_shot_highlight",
  //   "thumb": "http://mastersprogressivedl.edgesuite.net/2016/thumbnails/LDR_2016_r3_32839_2_1280x720.jpg",
  //   "cmsId": "2016_r3_32839_2_1",
  //   "url": "/en_US/watch/2016/r3_32839_2.html",
  //   "extradata": {
  //     "sort": 2016302,
  //     "video-android": "http://mastersvod-i.akamaihd.net/i/2016/LDR/LDR_2016_r3_32839_2_,1280x720_3500,960x540_3000,960x540_2400,960x540_1700,640x360_1100,512x288_600,384x216_300,256x144_100,kbps.mp4.csmil/master.m3u8?__b__=364",
  //     "subtype": "highlight",
  //     "mp4": "http://mastersprogressivedl.edgesuite.net/2016/LDR/LDR_2016_r3_32839_2_512x288_600kbps.mp4",
  //     "m3u8": "http://mastersvod-i.akamaihd.net/i//2016/LDR/LDR_2016_r3_32839_2_,1280x720_3500,960x540_3000,960x540_2400,960x540_1700,640x360_1100,512x288_600,384x216_300,256x144_100,kbps.mp4.csmil/master.m3u8?__b__=1164"
  //   }
  // }

  var event_id = 'masters_' + Settings.tournament_year;

  var RelatedContentVideo = Backbone.Model.extend({
    urlRoot: '/relatedcontent/rest/' + event_id + '/en/content/byId/',
    url: function() {
      var contentId = event_id + '_' + this.id + '_en';
      return this.urlRoot + contentId;
    },

    defaults: {
      title: '',
      date: '',
      type: '',
      thumb: '',
      cmsId: '',
      url: ''
    },

    idAttribute: 'cmsId',

    initialize: function() {

    },

    parse: function(data) {
      _.each(data.extradata, function(val, key, list) {
        data[key] = val;
      });

      return data;
    },

    getVideoObject: function() {
      return {
        id: this.id,
        type: 'vod',
        title: this.get('title'),
        contentType: this.get('type'),
        pictureM: this.get('thumb'),
        wwwdash: '',
        wwwhlshigh: this.get('m3u8'),
        pdl: this.get('mp4'),
        link: this.get('url')
      };
    }
  });

  return RelatedContentVideo;
});

