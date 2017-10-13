// ** TODO: Load select record & stats dropdown selection;
// ** load video

define('views/past-winners',['require','jquery','underscore','backbone','utils/metrics','utils/title-list','models/past-winner','utils/video-player'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      Metrics = require('utils/metrics'),
      TitleList = require('utils/title-list'),
      PastWinner = require('models/past-winner'),
      VideoPlayer = require('utils/video-player')
      ;

  var JST = {};

	// results table template
  JST.results_table = _.template(
		'<table class="tablesaw" data-tablesaw-mode="swipe" id="mytable">' +
			'<thead>' +
				'<tr>' +
				  '<th data-tablesaw-priority="persist" class="hposition">Pos</th>' +
				  '<th data-tablesaw-priority="persist" class="hplayer">Player</th>' +
				  '<th class="hround_1">R1</th>' +
				  '<th class="hround_2">R2</th>' +
				  '<th class="hround_3">R3</th>' +
				  '<th class="hround_4">R4</th>' +
				  '<th class="htotal_score">Total Score</th>' +
				  '<th class="htotal_par">Total Par</th>' +
				'</tr>' +
		    '</thead>' +
		    '<tbody id="place1">' +
		    '    <%= results_rows %>' +
		    '</tbody>' +
		'</table>'
	);


	// results row
  JST.results_row = _.template(
		'<tr>' +
			'<td class="position"><%= position %></td>' +
			'<td class="player"><%= name %></td>' +
			'<td class="r1"><%= round1 %></td>' +
			'<td class="r2"><%= round2 %></td>' +
			'<td class="r3"><%= round3 %></td>' +
			'<td class="r4"><%= round4 %></td>' +
			'<td class="score"><%= total %></td>' +
			'<td class="par"><%= vsPar %></td>' +
		'</tr>'
	);

	// media template
  JST.media_tmpl = _.template(
      '<div class="image"><img class="srcpic" data-high="/images/about/pw/d_<%= year %>.jpg" data-medium="/images/about/pw/d_<%= year %>.jpg" ' +
      'data-lower="/images/about/pw/m_<%= year %>.jpg" src="/images/now/trans_16x9.gif"></div>' +
      '<div class="centered_icon play"></div>'
	);

  // video player template
  JST.video_tmpl = _.template(
    '<div video-id="<%= videoID %>">' +
      '<section class="ecp-player"> ' +
          '<div id="wrapper_<%= videoID %>" class="masters-ecp playerwrapperContainer"></div> ' +
      '</section>' +
    '</div>'
  );

  var PastWinnersList = TitleList.extend({
    el: '#winnerSelect',

    events: function() {
      var events = TitleList.prototype.events;
      events['click ul a'] = 'switchYear';

      return events;
    },

    openList: function() {
      TitleList.prototype.openList.call(this);

			// set navWrapper to open, based on $.primaryDropdown
      this.toggleSelector.parents('.filter').addClass('open');

			// TODO: add handler when Flash video is loaded
			// if(inlineVideo.loaded.flash && Browser.oldIE) {
			//   var id = $('.videoPlayerWrapper').hide().attr('id');
			//   inlineVideo.videos[id.substring(6)].player[0].pauseVideoPlayer();
			// }
    },

    closeList: function() {
      TitleList.prototype.closeList.call(this);

      this.toggleSelector.parents('.filter').removeClass('open');

			// TODO: add handler when Flash video is loaded
			// if(inlineVideo.loaded.flash && Global.Browser.oldIE) {
			//   var id = $('.videoPlayerWrapper').show().attr('id');
			//   inlineVideo.videos[id.substring(6)].player[0].playVideoPlayer();
			// }
    },

    setSelected: function(el, year) {
      this.$('.option_wrapper').find('li.selected').removeClass('selected');
      el.parent().addClass('selected');

      this.$('a.selected_option').html(year + ' Masters Tournament');
    },

    switchYear: function(e) {
      var $this = $(e.currentTarget);
      if($this.parent().hasClass('selected')) {
        return false;
      }
      var year = $this.text();

      this.setSelected($this, year);
      this.closeList();

			// handle if video is playing
			// if(inlineVideo.loaded.html || inlineVideo.loaded.flash) {
			//   var id = $('.videoPlayerWrapper').attr('id');
			//   inlineVideo.videos[id.substring(6)].unload();
			// }

      Metrics.measureApp(this.options.measure_prefix, year);

      this.trigger('select', year);
    }
  });

  var PastWinnersView = Backbone.View.extend({
    el: 'section.past-winners-content',

    events: {
      'click .btn-micro': 'metrics_btnClick',
      'click #winnerMedia.hasVideo > a': 'videoPlayClick'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('PastWinnersView');
      this.options = opts;

      this.media = this.$('#winnerMedia');
      this.setupYearSelector();
    },

    render: function(year) {
      var opts = year === undefined ? {} : {year: year};
      this.model = new PastWinner(opts);
      this.model.fetch({
        success: function(model, response, options)				{
          var winnerObj = model;

          this.displayMedia(winnerObj, winnerObj.get('year'));
          this.displayWinner(winnerObj.get('info'));
          this.createResultsTable(winnerObj.get('data'));
        }.bind(this),
        error: function(model, response, options)				{

					// console.log("error: %o", response);
        }
      });
    },

    onDispose: function() {
      this.yearSelector.dispose();
    },

    setupYearSelector: function() {
      this.yearSelector = new PastWinnersList({
        el: this.$('#winnerSelect'),
        max: 1,
        measure_key: this.options.metrics_name
      });
      this.yearSelector.$('ul:first-child li:first-child').addClass('selected');

      this.listenTo(this.yearSelector, 'select', this.render);
    },

    createResultsTable: function(winnersTbl) {
      var results_rows_html = '';
      for(var i = 0; i < winnersTbl.length; i++) {
        results_rows_html += JST.results_row({
          position: winnersTbl[i].position,
          name: winnersTbl[i].name,
          round1: winnersTbl[i].round1,
          round2: winnersTbl[i].round2,
          round3: winnersTbl[i].round3,
          round4: winnersTbl[i].round4,
          total: winnersTbl[i].total,
          vsPar: winnersTbl[i].vsPar
        });
      }

      var html = JST.results_table({
        results_rows: results_rows_html
      });

      this.$('#winnersTable').html(html);
      this.$('#mytable').table().data('table').refresh();
    },

    displayMedia: function(winnerInfo, year) {
      // display winner image
      var media_html = JST.media_tmpl({
        year: year
      });
      this.media.html(media_html);

      // display winner video info if available
      if(winnerInfo.get('video')) {
        var videoID = 'video_body_' + winnerInfo.get('video').id;
        var video_html = JST.video_tmpl({
          videoID: videoID
        });

        VideoPlayer.dispose();
        this.media.wrapInner('<a href="#">');

        // create video object
        this.videoObj = {
          id: videoID,
          type: 'vod',
          title: winnerInfo.get('video').title,
          contentType: 'Past Winner',
          pictureL: winnerInfo.get('video').picture,
          pictureM: winnerInfo.get('video').slate,
          pictureH: winnerInfo.get('video').slate,
          wwwdash: '',
          wwwhlshigh: winnerInfo.get('video').highlink,
          pdl: winnerInfo.get('video').mobilehighlink,
          link: winnerInfo.get('video').pagelink
        };

        this.media.append(video_html)
          .addClass('hasVideo');
      }  else {
        this.media.removeClass('hasVideo');
      }

      this.clearUnveil();
      this.unveil(this.$el.find('img.srcpic'));
    },

    displayWinner: function(winnerInfo) {
      this.$('.champion-name').html(winnerInfo.winner).append(',&nbsp;Champion');

      this.$('.tournament-write-up').html(winnerInfo.summary);

      this.$('.tournament-field').html(winnerInfo.cut);

      this.$('.tournament-dates').html(winnerInfo.dates).prepend('TOURNAMENT DATES:&nbsp;');  // prepend

      this.$('.tournament-dates').html(winnerInfo.dates).append(',&nbsp;' + winnerInfo.results);
    },


    metrics_btnClick: function(e) {
      Metrics.measureApp(this.options.metrics_name, e.currentTarget.getAttribute('title'));
    },

    videoPlayClick: function(ev) {
		  var id = $(ev.target).closest('div[video-id]').attr('video-id');

      if(this.media.hasClass('hasVideo')) {
		    VideoPlayer.loadVideo(this.videoObj, this.videoObj.id);
        Metrics.measureAppMediaLoad(Metrics.page_section, Metrics.page_title, Metrics.video_action, this.videoObj.title);
      }
    },

    onPlayEvent: function(data) {
		  this.logger.info('onPlayEvent - data:%o', data);
    },

    onStopEvent: function(data) {
		  this.logger.info('onStopEvent - data:%o', data);
    },

    onCompleteEvent: function(data) {
		  this.logger.info('onCompleteEvent - data:%o', data);
    }


  });

  return PastWinnersView;
});

