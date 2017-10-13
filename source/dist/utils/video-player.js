/**
 * Player is the base View for adding a ECP video player
 */
define('utils/video-player',['require','backbone','jquery','underscore','utils/metrics','utils/browser','models/video','utils/window-size','eventsCorePlayer'],function(require) {
    var Backbone = require('backbone'),
        $ = require('jquery'),
        _ = require('underscore'),
        Metrics = require('utils/metrics'),
        Browser = require('utils/browser'),
        Video = require('models/video');
        Win = require('utils/window-size'),

    require('eventsCorePlayer');

    var VideoPlayer = Backbone.Model.extend({
        events: {

        },

        players: {},
        singlePlayer: false,

        activeVideo: undefined, // track last loaded video. 'active' is probably a misnomer here
        floated: false,
        view: 'hero',

        initialize: function(opts) {
            _.bindAll(this, 'onPlayEvent', 'onMeasureEvent', 'onCompleteEvent', 'onPauseEvent', 'onPanelEvent', 'onStartEvent', 'onControlsEvent', 'onClickEvent', 'onVideoModeEvent', 'onFullscreenEvent');

            if (eventsCore.util.getUrlParam('loglevel') === 'all') {
                eventsCore.setLogLevel('all');
            }

            this.listenTo(Backbone.history, 'route', this.routeChange);

            this.logger = new eventsCore.util.Logger('VideoPlayer');
            this.logger.info('initialize - this:%o', this);

            $('.ecp-player').hide();
        },

        dispose: function() {
            var keys = Object.keys(this.players);
            this.logger.info('dispose 1 - keys:%o players:%o', keys, this.players);
            for (var i=keys.length-1; i>=0; i--) {
                if (keys[i].indexOf('panel') == -1 && keys[i].length > 6) {
                    eventsPlayer.destroy('#wrapper_' + keys[i]);
                    delete this.players[keys[i]];
                }
            }
            this.singlePlayer = false;
            this.logger.info('dispose 2 - keys:%o players:%o', Object.keys(this.players), this.players);
        },

        setSinglePlayerMode: function() {
            this.singlePlayer = true;
        },

        initPlayer: function(id) {
            this.logger.info('initPlayer - id:%o', id);

            if (!this.players[id] && !Browser.facebook_ios) {
                 this.players[id] = eventsPlayer.init(
                    '/ecp/playerConfig.json',
                    $('#wrapper_' + id),
                    this.singlePlayer
                );
                this.players[id].on('CompleteEvent', this.onCompleteEvent);
                this.players[id].on('StartEvent', this.onStartEvent);
                this.players[id].on('PlayEvent', this.onPlayEvent);
                this.players[id].on('MeasureEvent', this.onMeasureEvent);
                this.players[id].on('PauseEvent', this.onPauseEvent);
                this.players[id].on('ControlsEvent', this.onControlsEvent);
                this.players[id].on('PanelEvent', this.onPanelEvent);
                this.players[id].on('ClickEvent', this.onClickEvent);
                this.players[id].on('VideoModeEvent', this.onVideoModeEvent);
                this.players[id].on('FullscreenEvent', this.onFullscreenEvent);
            }
        },

        /**
         * start loading of video
         * @param _videoData - object representing video data
         * @param id - id of the player, as specified in html
         * @param options - options to be passed to video player, consisting of:
         *        forceType - allow forcing of video type to test controls live controls with a vod test stream
         *        floated - true indicates video started in floated panel directly
         *        metrics_prefix - value to use, if not Metrics.page_section when recording metrics for this player
         */
        loadVideo: function(_videoData, id, options) {
            var _default_options = {
                forceType: undefined,
                floated: undefined,
                metrics_prefix: Metrics.page_section
            };
            options = _.extend({}, _default_options, options);

            //get video data and construct the model
            var videoData = _videoData;
            this.logger.info('loadVideo - data:%o', videoData);

            var isAndroid = navigator.userAgent.match(/android/i) != null;

            var hlshigh = videoData['wwwhlshigh'];
            if((videoData.type !== 'live' && videoData.type !== 'dvr') && Browser.firefox && !Browser.mobiledevice) {
                // append string to wwwhlshigh feed URL
                hlshigh += (hlshigh.indexOf('?') > -1) ? '&' : '?';
                hlshigh += 'b=600-1700';
            }

            this.activeVideo = new Video({
                id: videoData['id'],
                title: videoData['title'],
                streamType: videoData['type'] || 'vod', //not absolutely needed anymore, do auto-detect, values can be 'vod', 'live', 'dvr'
                contentType: videoData['contentType'],  //used for vod as content catgeory
                poster: videoData['pictureM'],
                dashUrl: videoData['wwwdash'],
                hlsUrl: hlshigh,
                progUrl: videoData['pdl'],
                pageLink: videoData['link'],
                replay_channel: videoData['replay_channel'],
                track: videoData['track'],
                cdn: videoData['cdn'],
                panelButton: videoData['panelButton']
            });

            //if asked to move existing player
            var key = '';
            var keys = Object.keys(this.players);
            for (var i=0; i<keys.length; i++) {
                if (keys[i].indexOf('panel') == -1 && keys[i].length > 6) {
                    key = keys[i];
                }
            }

            //this.logger.info('loadVideo - single:%o key:%o id:%o player:%o', this.singlePlayer, key, id, this.players);
            if (this.singlePlayer && id !== key && this.players[key] && id.indexOf('panel') == -1) {
                this.trigger('player:stop', {id:key});
                $('#wrapper_' + key).closest('.ecp-player').hide();
                console.log('loadVideo - single:%o key:%o id:%o player:%o', this.singlePlayer, key, id, this.players);
                eventsPlayer.move('#wrapper_' + key, '#wrapper_' + id);
                this.players[id] = this.players[key];
                delete this.players[key];
            }

            //if player in this container does not exist, create it
            if (!this.players[id]) {
                this.initPlayer(id);
            }

            this.floated = options.floated;
            this.currentId = id;
            this.metrics_prefix = options.metrics_prefix;

            this.logger.info('loadVideo - video:%o id:%o fb:%o', this.activeVideo, this.currentId, Browser.facebook_ios);

            if (!Browser.facebook_ios) {
                this.loadStream(id, options.forceType);
                $('.ecp-player').has('div[id="wrapper_' + id + '"]').show();
            }
            else {
                this.logger.info('loadVideo - facebook - wrap:%o', $('#wrapper_' + key).closest('.ecp-player'));
                //$('#wrapper_' + id).closest('.ecp-player').append('<video src="' + this.activeVideo.hlsUrl + '""></video>');

                var tag = '<video id="fbVideo" width="640" height="360" controls autoplay preload="auto">' +
                          '  <source src="' + hlshigh + '" type="application/x-mpegURL"></source>' +
                          '</video>'

                $('.ecp-player').has('div[id="wrapper_' + id + '"]').after(tag);
                //$('.ecp-player').has('div[id="wrapper_' + id + '"]').show();
                var video = $('#fbVideo')[0];

                this.trigger('player:stop', {id:key});
                this.trigger('player:play', {id:id});

                setTimeout(function() {
                    video.load();
                    video.play();
                }, 500);
            }
        },

        pause: function() {
            if (this.players[id]) {
                this.players[id].pause();
            }
        },

        stop: function(id) {
            this.logger.info('stop - id:%o player:%o', id, this.players[id]);
            this.players[id].stop();
            this.trigger('player:stop', {id:id});
        },

        mute: function(muted, id) {
            this.logger.info('mute - val:%o id:%o', muted, id);
            if (this.players[id]) {
                this.players[id].mute(muted);
            }
        },

        close: function(id) {
            if (!Browser.facebook_ios){
                this.players[id].close();
            }

            this.trigger('player:stop', {id:id});
        },

        loadStream: function(id, force) {
            var playerTech;
            var userOrder;
            var controls = false;

            var playObj = {};
            var model = this.activeVideo;
            //stream data
            playObj.title = model.get('title');
            playObj.techOrder = null;
            playObj.streamType = model.get('streamType') || 'unknown';
            playObj.typeFixed = force;
            playObj.controls = false;
            playObj.poster = model.get('poster');
            playObj.cdn = model.get('cdn');

            playObj.windowSize = Win.size();

            if (model.get('hlsUrl')) {
                playObj.url = model.get('hlsUrl');
                playObj.mimeType = model.get('hlsMimeType');
            }
            else if (model.get('progUrl')) {
                playObj.url = model.get('progUrl');
                playObj.mimeType = model.get('progMimeType');
            }
            else {
                this.logger.error('loadStream - neither hls or prog video type found');
            }

            //values for webvtt tracks
            if (model.get('tracks')) {
                playObj.tracks = model.get('tracks');
            }

            if (model.get('ads')) {
                playObj.ads = model.get('ads');
            }

            //legacy page level data
            playObj.info = {
                'title': model.get('title'),
                'type': model.get('streamType') || 'unknown',
                'id': model.get('id'),
                'link': model.get('pageLink')
            };

            if (model.get('panelButton')) {
                playObj.config = {
                    "ui": {
                        "toolbar": {
                            "buttons": {
                                "panel": model.get('panelButton')
                            }
                        }
                    }
                }
            }


            this.logger.info('loadStream - playObj:%o', playObj);

            this.players[id].load(playObj);
        },

        routeChange: function() {
            this.logger.info('routeChange - video:%o', $('#fbVideo')[0]);
            if ($('#fbVideo')[0]) {
                $('#fbVideo')[0].pause();
                $('#fbVideo').remove();
            }
        },

        buttonClick: function(id, button) {
            this.players[id].buttonClick(button);
        },

        //record the mode, hero, float, popout
        recordView: function(id) {
            this.logger.info('recordView: %o', this.view);
            this.players[id].recordEvent('conviva', 'mode', {'position': this.view});
        },

        //record the mode, live or dvr
        recordVideoMode: function(id, mode) {
            this.logger.info('recordVideoMode: %o', mode);
            this.players[id].recordEvent('conviva', 'videoMode', {'mode': mode});
        },

        onPauseEvent: function(data) {
            var self = this;
            var id = data.id.replace('#wrapper_','');
            this.logger.info('onPauseEvent - paused:%o id:%o', data.paused, id);

            //if not the player issuing the event, the issuing player is not paused, and the other player is playing
            //  pause the other player
            _.each(this.players, function(player, key){
                if (key != id && !data.paused && player.isPlaying()) {
                    //player.mute();
                    //self.trigger('player:stop', {id:key});
                }
            });
        },

        onMeasureEvent: function(event) {
            var id = event.id.replace('#wrapper_','');

            this.logger.info('onMeasureEvent: %o id:%o type:%o', event, id, event.type);

            var videoType = this.activeVideo.get('streamType') === 'vod' ? 'Video' : 'Live';
            Metrics.video_action = this.activeVideo.get('streamType') === 'vod' ? 'VOD' : 'Live';

            switch (event.type) {
                case 'start':
                    if(videoType === 'Video') {
                        Metrics.trackS({
                            eVar27: this.activeVideo.get('title')
                        });
                        Metrics.measureVideoPlayer(this.metrics_prefix, videoType, 'Start');
                    }
                    break;
                case 'complete':
                    if(videoType === 'Video') {
                        Metrics.trackS({
                            eVar27: this.activeVideo.get('title')
                        });
                        Metrics.measureVideoPlayer(this.metrics_prefix, videoType, 'Complete');
                    }
                    break;
                case 'play':
                    Metrics.measureVideoPlayer(this.metrics_prefix, videoType, 'Play');
                    break;
                case 'pause':
                    Metrics.measureVideoPlayer(this.metrics_prefix, videoType, 'Pause');
                    break;
                case 'rewind':
                    Metrics.measureVideoPlayer(this.metrics_prefix, videoType, 'Rewind');
                    break;
                case 'timeline':
                    Metrics.measureVideoPlayer(this.metrics_prefix, videoType, 'Timeline');
                    break;
                case 'mute':
                    Metrics.measureVideoPlayer(this.metrics_prefix, videoType, 'Mute');
                    break;
                case 'unmute':
                    Metrics.measureVideoPlayer(this.metrics_prefix, videoType, 'Unmute');
                    break;
                case 'enterFullscreen':
                    Metrics.measureVideoPlayer(this.metrics_prefix, videoType, 'Full Screen');
                    break;
                case 'exitFullscreen':
                    // Metrics.measureVideoPlayer(this.metrics_prefix, videoType, 'Exit Full Screen');
                    break;
                case 'captionsOn':
                    Metrics.measureVideoPlayer(this.metrics_prefix, videoType, 'CC On');
                    break;
                case 'captionsOff':
                    Metrics.measureVideoPlayer(this.metrics_prefix, videoType, 'CC Off');
                    break;
                case 'Share:Open':
                    Metrics.measureApp(this.metrics_prefix, Metrics.video_action, this.activeVideo.get('title'), 'Share');
                    break;
                case 'panelOn':
                    Metrics.trackS({
                        prop57: Metrics.video_action + ' Panel On',
                        eVar57: Metrics.video_action + ' Panel On'
                    });
                    Metrics.measureVideoPlayer(this.metrics_prefix, videoType, 'Panel On');
                    break;
                case 'panelOff':
                    Metrics.trackS({
                        prop57: Metrics.video_action + ' Panel Off',
                        eVar57: Metrics.video_action + ' Panel Off'
                    });
                    Metrics.measureVideoPlayer(this.metrics_prefix, videoType, 'Panel Off');
                    break;
                case 'popOpen':
                    Metrics.measureVideoPlayer(this.metrics_prefix, videoType, 'Popout');
                    break;
                case 'live':
                    Metrics.measureVideoPlayer(this.metrics_prefix, videoType, 'DVR Seek to Live');
                    break;
                default:
                    if(event.type.indexOf('Share:') === 0) {
                        var service = event.type.substring(event.type.lastIndexOf(':') + 1, event.type.length);
                        Metrics.trackS({
                            prop50: Metrics.video_action + ':' + this.activeVideo.get('title')
                        });
                        Metrics.measureApp(this.metrics_prefix, Metrics.video_action, this.activeVideo.get('title'), 'Share', service);
                    }
                    break;
            }
        },

        onPlayEvent: function(data) {
            var id = data.id.replace('#wrapper_','');

            //this.logger.info('onPlayEvent: ev:%o', this);
            this.trigger('player:play', {id:id});
        },

        /**
         * handle video startevent
         *   don't mute other videos if starting video is floated
         * @param data
         **/
        onStartEvent: function(data) {
            var self = this;
            this.logger.info('onStartEvent');
            var id = data.id.replace('#wrapper_','');

            if (!this.floated) {
                _.each(this.players, function(player, key){
                    self.logger.info('onStartEvent - player:%o key:%o', player, key);
                    if (key != id && player.isPlaying()) {
                        self.mute(true, key);
                    }
                });
            }
            this.floated = false;

            this.logger.info('onStartEvent: ev:%o', this);
            this.trigger('player:start', {id:id});

            this.view = this.floated ? 'float' : 'hero';
            this.recordView(id);
        },

        onCompleteEvent: function(data) {
            var id = data.id.replace('#wrapper_','');
            //this.logger.info('onCompleteEvent:');
            this.trigger('player:complete', {id:id});
        },

        onControlsEvent: function(data) {
            var id = data.id.replace('#wrapper_','');
            //this.logger.info('onCompleteEvent:');
            this.trigger('player:controls', {id:id, visible:data.visible});
        },

        onPanelEvent: function(data) {
            var id = data.id.replace('#wrapper_','');
            this.logger.info('onPanelEvent: %o', data);
            if (data.open) {
                this.view = 'float';
                this.recordView(id);
                this.trigger('player:panelOpen', {id:id});
            }
            else {
                this.view = 'hero';
                this.recordView(id);
                this.trigger('player:panelClosed', {id:id});
            }
        },

        onClickEvent: function(data) {
            var id = data.id.replace('#wrapper_','');
            //this.logger.info('onClickEvent: %o', this);
            this.trigger('player:click', {id:id, type:data.type});
        },

        onVideoModeEvent: function(data) {
            var id = data.id.replace('#wrapper_','');
            //this.logger.info('onClickEvent: %o', this);
            this.trigger('player:video_mode', {id:id, mode:data.mode});

            this.recordVideoMode(id, data.mode);
        },

        onFullscreenEvent: function(data) {
            var id = data.id.replace('#wrapper_','');

            this.trigger('player:fullscreen', {id:id, state:data.state});
        }

    });

    return new VideoPlayer();
});
