/**
 * Video is a Model representation of all associated video data for a stream, vod and live
 */
define('models/video',['require','jquery','backbone'],function(require) {
	var $ = require('jquery'),
			Backbone = require('backbone')
	;

	var Video = Backbone.Model.extend({
		defaults: {
			id: '',
			title: '',
			streamType: '',
			contentType: '',
			poster: '',
			tracks: '',
			ads: '',
			dashUrl: '',
			hlsUrl: '',
			progUrl: '',
			hlsMimeType: 'application/x-mpegURL',
			progMimeType: 'video/mp4',
			pageLink: '',
			replay_channel: '',
			track: '',
			cdn: 'unknown',
			panelButton: ''
		},

		initialize: function() {
			//console.log('Video - initialize');
		}
	});

	return Video;
});
