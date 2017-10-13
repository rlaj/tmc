/*! events_core_player - v1.2.0-60 - 2017-04-08T18:51:44Z */

/*
	Source: build/EventsPlayer.js
*/
/**
 * Create a core player object for namespacing
 */
(function($) {
function EventsPlayer() {
        this.version = '1.2.0-60';
        this.buildTime = '2017-04-08T18:51:44Z';
        
        console.log('[EventsCorePlayer] - version:%o built:%o', this.version, this.buildTime);  

        this.players = {};

        //create packages
        this.player = {};
        this.control = {};
        this.control.caption = {};
        this.commons = {};
        this.view = {};
        this.utils = {};
        this.ads = {};

        this.getVersion = function() {
            return self.version;
        };

        this.init = function(_config, _wrapper, _reinit, _path) {
            var selector = $(_wrapper).selector;
            console.log('EventsPlayer - init - wrapper:%o wsel:%o player:%o', _wrapper, selector, this.players[selector]);  
            
            if (!selector) {
               console.error('EventsPlayer - init - no wrapper selector found for player'); 
               return;
            }

            //allow initialization to reinit/rewrite the player, useful for backbone where EventsPlayer is not destroyed on page change
            if (_reinit) {
                this.players[selector] = null;
            }

            //if main not set (first init), set wrapper and create main
            //  subsequest inits will return same main object
            if (!this.players[selector]) {
                console.log('EventsPlayer - init - new Main - wrapper:%o', selector);
                this.players[selector] = new eventsPlayer.Main(this.version, _config, _wrapper, _path);
            }
            else {
                console.log('EventsPlayer - init - old Main - wrapper:%o', selector);
            }

            //if wrapper has changes (after initial init) move player to new wrapper
            //if (currentSelector != selector) {
                //console.log('init - change - wrapper:%o', _wrapper);  
                //currentWrapper = _wrapper;
                //main.move(_wrapper);
            //}

            return this.players[selector];
        };

        this.destroy = function(selector) {
            this.players[selector].removeHandlers();
            delete this.players[selector];
            this.players[selector] = null;
            console.log('EventsPlayer - destroy - selector:%o', selector);
        };

        this.move = function(_wrapper, _newWrapper) {
            var selector = $(_wrapper).selector;
            var newSelector = $(_newWrapper).selector;
            console.log('EventsPlayer - move - wrapper:%o player:%o players:%o', _wrapper, this.players[selector], this.players);  

            this.players[selector].stop();
            this.players[selector].move(_newWrapper);
            this.players[newSelector] = this.players[selector];
            delete this.players[selector];
        };
    }

    window.eventsPlayer = new EventsPlayer();
}(jQuery));
;

/*
	Source: build/PlayerCommons.js
*/
/**
 * Create event objects
 */
(function($) {
//sent when loading new tech into iframe
    function InitializingEvent() {
        var api = new Object();
        api.type = 'InitializingEvent';
        api.tech = null;

        return api;
    }

    //sent when new tech player is ready
    function PlayerReadyEvent() {
        var api = new Object();
        api.type = 'PlayerReadyEvent';
        api.tech = null;
        api.fullscreenEnabled = null;

        return api;
    }

    function LoadingEvent() {
        var api = new Object();
        api.type = 'LoadingEvent';
        api.playObject = null;

        return api;
    }

    function PlayEvent() {
        var api = new Object();
        api.type = 'PlayEvent';

        return api;
    }

    function PauseEvent() {
        var api = new Object();
        api.type = 'PauseEvent';
        api.paused = null;

        return api;
    }

    function MetadataEvent() {
        var api = new Object();
        api.type = 'MetadataEvent';
        api.aspect = null;
        api.live = null;
        api.dvr = null;
        api.width = null;
        api.height = null;
        api.renditions = null;
        api.fullscreenEnabled = null;

        return api;
    }

    function CompleteEvent() {
        var api = new Object();
        api.type = 'CompleteEvent';
        api.postroll = false;
        return api;
    }

    function TimeUpdateEvent() {
        var api = new Object();
        api.type = 'TimeUpdateEvent';
        api.time = null;
        api.duration = null;
        api.start = null;
        api.detectedStreamType = null;
        api.programDateTime = null;
        api.qos = null;
        api.loadedTime = null
        api.buffered = null;
        return api;
    }

    function BufferingEvent() {
        var api = new Object();
        api.type = 'BufferingEvent';
        return api;
    }

    function SeekEvent() {
        var api = new Object();
        api.type = 'SeekEvent';
        api.time = null
        return api;
    }

    function ErrorEvent() {
        var api = new Object();
        api.type = 'ErrorEvent';
        api.message = null;
        api.stack = null;
        api.code = null;
        return api;
    }

    function VolumeEvent() {
        var api = new Object();
        api.type = 'VolumeEvent';
        api.muted = null;
        api.volume = null;

        return api;
    }

    function ResizeEvent() {
        var api = new Object();
        api.type = 'ResizeEvent';
        api.width;
        api.height;
        return api;
    }

    function QosData() {
        var api = new Object();
        api.type = 'QosData';
        api.frameRate = null;
        api.playRate = null;
        api.rendition = null;
        api.stream = null;
        api.activeRendition = null;
        api.totalRenditions = null;
        api.uri = null;
        api.bandwidth = null;
        api.resolution = null;
        api.codecVideo = null;
        api.codecAudio = null;
        api.renderer = null;
        return api;
    }

    function AdStartEvent() {
        var api = new Object();
        api.type = 'AdStartEvent';
        return api;
    }

    function AdEndEvent() {
        var api = new Object();
        api.type = 'AdEndEvent';
        return api;
    }

    function TextTrackEvent() {
        var api = new Object();
        api.type = 'TextTrackEvent';
        api.data = null;
        return api;
    }

    function TrackLoadedEvent() {
        var api = new Object();
        api.type = 'TrackLoadedEvent';
        api.data = null;
        return api;
    }

    function CueChangeEvent() {
        var api = new Object();
        api.type = 'CueChangeEvent';
        api.data = null;
        return api;
    }

    function CaptionEvent() {
        var api = new Object();
        api.type = 'CaptionEvent';
        api.time = null;
        api.data = null;
        return api;
    }

    function VideoFullscreenEvent() {
        var api = new Object();
        api.type = 'VideoFullscreenEvent';
        api.fullscreen = null;
        api.measure = null;
        return api;
    }

    window.eventsPlayer.commons.InitializingEvent = InitializingEvent;
    window.eventsPlayer.commons.PlayerReadyEvent = PlayerReadyEvent;
    window.eventsPlayer.commons.LoadingEvent = LoadingEvent;
    window.eventsPlayer.commons.PlayEvent = PlayEvent;
    window.eventsPlayer.commons.PauseEvent = PauseEvent;
    window.eventsPlayer.commons.MetadataEvent = MetadataEvent;
    window.eventsPlayer.commons.CompleteEvent = CompleteEvent;
    window.eventsPlayer.commons.TimeUpdateEvent = TimeUpdateEvent;
    window.eventsPlayer.commons.SeekEvent = SeekEvent;
    window.eventsPlayer.commons.BufferingEvent = BufferingEvent;
    window.eventsPlayer.commons.ErrorEvent = ErrorEvent;
    window.eventsPlayer.commons.VolumeEvent = VolumeEvent;
    window.eventsPlayer.commons.ResizeEvent = ResizeEvent;
    window.eventsPlayer.commons.QosData = QosData;
    window.eventsPlayer.commons.AdStartEvent = AdStartEvent;
    window.eventsPlayer.commons.AdEndEvent = AdEndEvent;
    window.eventsPlayer.commons.TextTrackEvent = TextTrackEvent;
    window.eventsPlayer.commons.TrackLoadedEvent = TrackLoadedEvent;
    window.eventsPlayer.commons.CueChangeEvent = CueChangeEvent;
    window.eventsPlayer.commons.CaptionEvent = CaptionEvent;
    window.eventsPlayer.commons.VideoFullscreenEvent = VideoFullscreenEvent;
}(jQuery));;

/*
	Source: build/AnalyticsAkamai.js
*/
/**
 * Create a core player object for namespacing
 */
(function($) {
function AnalyticsAkamai(_player, _data) {
        var api = new Object();
        var self = this;
        var logger = new eventsCore.util.Logger('AnalyticsAkamai');

        var player = _player;
        var initData = _data;

        var akaPlugin;
        var akaPluginCallBack = {};
        
        var constants = window.eventsPlayer.PlayerConstants;

        logger.info('constructor - data:%o ', _data);

        var init = function() {
            window.AKAMAI_MEDIA_ANALYTICS_CONFIG_FILE_PATH = initData.beacon + '?enableGenericAPI=1';

            akaPluginCallBack["streamHeadPosition"] = getStreamHeadPosition;
            akaPluginCallBack["streamLength"] = getStreamLength;
            akaPluginCallBack["streamURL "] = getStreamURL;
             
            akaPlugin = new AkaHTML5MediaAnalytics(akaPluginCallBack);
        };

        // Should return the current Stream Head Position in seconds
        var getStreamHeadPosition = function(){
            return player.currentTime;
        };
         
        // Should return Stream Length in seconds.
        var getStreamLength = function(){
            return player.duration;
        };
         
        // Should return Stream URL being played.
        var getStreamURL = function(){
            return player.currentSrc;
        };

        api.loadedmetadata = function(_title, _renderer, _viewerId){
            //Handling Custom Data calls on your own:
            akaPlugin.setData("title", _title);
            akaPlugin.setData("playerId", _renderer);
            akaPlugin.setData('viewerId', _viewerId);
            //Initiating Session:
            akaPlugin.handleSessionInit();
        };

        api.onPlay = function(){
            logger.info('onPlay');
            akaPlugin.handlePlaying();
        };

        api.onPause = function(){
            logger.info('onPause');
            akaPlugin.handlePause();
        };

        api.onBufferStart = function(){
            logger.info('onBufferStart');
            akaPlugin.handleBufferStart();
        };

        api.onBufferEnd = function(){
            logger.info('onBufferEnd');
            akaPlugin.handleBufferEnd();
        };

        api.onBitrate = function(newBitRate){
            logger.info('onBitrate - rate:%o', newBitRate);
            akaPlugin.handleBitRateSwitch(newBitRate);
        };

        api.onEnded = function(){
            logger.info('onEnded');
            akaPlugin.handlePlayEnd("Play.End.Detected");
        };

        api.onError = function(){
            logger.info('onError');
            akaPlugin.handleError("VideoJS.Error");
        };

        init();
        return api;
    }

    window.eventsPlayer.control.AnalyticsAkamai = AnalyticsAkamai;
}(jQuery));;

/*
	Source: build/AnalyticsConviva.js
*/
/**
 * Create a core player object for namespacing
 */
(function($) {
function AnalyticsConviva(_data) {
        var api = new Object();
        var self = this;
        var logger = new eventsCore.util.Logger('AnalyticsConviva');
        
        var initData = _data;
        var hasConviva;
        var constants = window.eventsPlayer.PlayerConstants;
        var convivaSession;
        var sessionId = null;


        logger.info('constructor - data:%o ', initData);

        var init = function() {
            hasConviva = (typeof window.Conviva !== "undefined" && window.Conviva);
            logger.info('init - hasConviva:%o', hasConviva);
            
            if(hasConviva) {
                Conviva.LivePass.init(initData.key);
                Conviva.LivePass.toggleTraces(true); // TODO: change to false in production/live environment
            }
        };

        var livePassNotifier = function(convivaNotification) { 
            logger.info('livePassNotifier - notif:%o ', convivaNotification);
        };

        var getCdn = function(setCdn) {
            var cdn = Conviva.ConvivaContentInfo.CDN_NAME_OTHER;
            if (setCdn == "akamai"){
                cdn = Conviva.ConvivaContentInfo.CDN_NAME_AKAMAI;
            }
            else if (setCdn == "level3"){
                cdn = Conviva.ConvivaContentInfo.CDN_NAME_LEVEL3;
            }
            else if (setCdn == "highwinds"){
                cdn = Conviva.ConvivaContentInfo.CDN_NAME_HIGHWINDS;
            }
            return cdn;
        };

        var getDeviceType = function(setDevice) {
            var type = '';
            if (StringUtil.contains(setDevice, 'mobile')){
                type = Conviva.ConvivaContentInfo.DEVICE_TYPE_MOBILE;
            }
            else if (StringUtil.contains(setDevice, 'pc')){
                type = Conviva.ConvivaContentInfo.DEVICE_TYPE_PC;
            }
            return type;
        };

        api.cleanUpSession = function() {
            if (sessionId != null) {
                Conviva.LivePass.cleanupSession(sessionId);
                sessionId = null;
                logger.info('cleanUpSession - ');
             }
        };

        api.startSession = function(data) {
            if (!hasConviva) {
                logger.info('startSession - no conviva found');
                return;
            }

            logger.info('startSession - data:%o src:%o streamer:%o', data, data.url, data.player);

            //***********
            // Clean up previous session
            api.cleanUpSession();
     
            // Begin: Set up metadata
            var assetName = data.name;
            var tags = {
                screenType : data.screenType,
                pageURL    : data.pageUrl, 
                syndicator : data.syndicator,
                renderer : data.renderer
            };

            var convivaMetadata = new Conviva.ConvivaContentInfo( assetName, tags );
            convivaMetadata.defaultReportingCdnName = getCdn(data.cdn);
            convivaMetadata.streamUrl = data.url;
            convivaMetadata.isLive = data.isLive;
            convivaMetadata.playerName = data.playerName;
            convivaMetadata.viewerId = "conviva_tester";
            convivaMetadata.deviceType = getDeviceType(data.deviceType);

            logger.info('startSession - metadata:%o', convivaMetadata);

            var options = {};
            options[Conviva.LivePass.OPTION_EXTERNAL_BITRATE_REPORTING] = true;
            streamer = new Conviva.ConvivaVideojsStreamerProxy(data.player);
            sessionId = Conviva.LivePass.createSession(streamer, convivaMetadata, options);

        };

        api.sendEvent = function(name, data) {
            logger.info('sendEvent - name:%o data:%o', name, data);
            Conviva.LivePass.sendEvent( name, data );
        };

        api.reportBitrate = function(bitrateKbps) {
            if (sessionId != null) {
                logger.info('reportBitrate - bitrateKbps:%o', bitrateKbps);
                Conviva.LivePass.setBitrate(sessionId, bitrateKbps);
            }
        };

        api.reportError = function(msg) {
            if (sessionId != null) {
                logger.info('reportError - msg:%o', msg);
                Conviva.LivePass.reportError(sessionId, msg);
            }
        };

        /**
         * collect data from parent necessary for Conviva to send to tech on video load
         */
        api.getConvivaData = function() {
            return 'testConviva';
        };

        init();
        return api;
    }

    //console.log('PlayerManager: par:%o', window.eventsPlayer.player);
   	window.eventsPlayer.control.AnalyticsConviva = AnalyticsConviva;
}(jQuery));

;

/*
	Source: build/AnalyticsConvivaHtml5.js
*/
/**
 * Create a core player object for namespacing
 */
(function($) {
function AnalyticsConvivaHtml5(_data, _touchstone) {
        var api = new Object();
        var self = this;
        var logger = new eventsCore.util.Logger('AnalyticsConvivaHtml5');
        
        var initData = _data;
        var touchstone = _touchstone;
        var hasConviva;
        var constants = window.eventsPlayer.PlayerConstants;
        var client;
        var sessionKey = null;
        var html5PlayerInterface;
        var playerStateManager;

        logger.info('constructor - data:%o ', initData);

        var init = function(test) {
            hasConviva = (typeof window.Conviva !== "undefined" && window.Conviva);
            logger.info('init - hasConviva:%o touchstone:%o', hasConviva, touchstone);
            
            if(hasConviva) {
                // To create a SystemFactory to boostrap the Conviva Library
                var systemSettings = new Conviva.SystemSettings();
                var systemInterface = new Html5SystemInterfaceFactory().build();
                var systemFactory = new Conviva.SystemFactory(systemInterface, systemSettings);
                //Customer integration
                var clientSettings = new Conviva.ClientSettings(initData.key);

                //for touchstone testing
                if (touchstone)
                    clientSettings.gatewayUrl = 'https://ibm.testonly.conviva.com';

                client = new Conviva.Client(clientSettings, systemFactory);
            }
        };

        var getCdn = function(setCdn) {
            var cdn = Conviva.ConvivaContentInfo.CDN_NAME_OTHER;
            if (setCdn == "akamai"){
                cdn = Conviva.ConvivaContentInfo.CDN_NAME_AKAMAI;
            }
            else if (setCdn == "level3"){
                cdn = Conviva.ConvivaContentInfo.CDN_NAME_LEVEL3;
            }
            else if (setCdn == "highwinds"){
                cdn = Conviva.ConvivaContentInfo.CDN_NAME_HIGHWINDS;
            }
            return cdn;
        };

        var getDeviceType = function(setDevice) {
            var type = '';
            if (StringUtil.contains(setDevice, 'mobile')){
                type = Conviva.ConvivaContentInfo.DEVICE_TYPE_MOBILE;
            }
            else if (StringUtil.contains(setDevice, 'pc')){
                type = Conviva.ConvivaContentInfo.DEVICE_TYPE_PC;
            }
            return type;
        };

        api.cleanUpSession = function() {
            //logger.info('cleanUpSession - key:%o', sessionKey);
            if (sessionKey != null){
                client.cleanupSession(sessionKey);
                sessionKey = null;
                logger.info('cleanUpSession - client:%o', client);
            }
        };

        api.startSession = function(data) {
            if (!hasConviva) {
                logger.info('startSession - no conviva found');
                return;
            }

            logger.info('startSession - data:%o src:%o streamer:%o', data, data.url, data.player);

            // Clean up previous session
            api.cleanUpSession;

            playerStateManager = client.getPlayerStateManager();
 
            //Create metadata
            var contentMetadata = new Conviva.ContentMetadata();
            //contentMetadata.defaultReportingCdnName = getCdn(data.cdn);
            contentMetadata.assetName = data.name;
            contentMetadata.streamUrl = data.url;
            contentMetadata.streamType = data.isLive ? Conviva.ContentMetadata.StreamType.LIVE : Conviva.ContentMetadata.StreamType.VOD;
            //contentMetadata.defaultBitrateKbps = Math.floor(bitratekbps / 1000); // in Kbps
            contentMetadata.applicationName = data.playerName;
            contentMetadata.viewerId = "conviva_tester";
            //contentMetadata.deviceType = getDeviceType(data.deviceType);
             
            var tags = {
                screenType : data.screenType,
                pageURL    : data.pageUrl, 
                syndicator : data.syndicator,
                renderer : data.renderer,
                cdn : data.cdn
            };
            contentMetadata.custom = tags;
            logger.info('startSession - metadata:%o', contentMetadata);

            // Create a Conviva monitoring session.
            sessionKey = client.createSession(contentMetadata);
            html5PlayerInterface = new Html5PlayerInterface(playerStateManager, data.video);
             
            // Till player is attached, Conviva State remains in NOT_MONITORED State
            client.attachPlayer(sessionKey, playerStateManager);

            data.video.addEventListener('error',function() {
                api.cleanUpSession();
            });
            data.video.addEventListener('ended',function() {
                api.cleanUpSession();
            });

        };

        api.sendEvent = function(name, data) {
            if (sessionKey != null) {
                logger.info('sendEvent - name:%o data:%o', name, data);
                client.sendCustomEvent(sessionKey, name, data );
            }
            else {
                logger.info('sendEvent - no sessionKey - name:%o data:%o', name, data);
            }
        };

        api.reportBitrate = function(bitrateKbps) {
            logger.info('reportBitrate - bitrateKbps:%o', bitrateKbps);
            playerStateManager.setBitrateKbps(bitrateKbps);
        };

        api.reportError = function(msg) {
            if (sessionKey != null){
                logger.info('reportError - msg:%o', msg);
                client.reportError(sessionKey, msg, Conviva.Client.ErrorSeverity.FATAL);
            }
        };

        /**
         * collect data from parent necessary for Conviva to send to tech on video load
         */
        api.getConvivaData = function() {
            return 'testConviva';
        };

        init();
        return api;
    }

    //console.log('PlayerManager: par:%o', window.eventsPlayer.player);
   	window.eventsPlayer.control.AnalyticsConvivaHtml5 = AnalyticsConvivaHtml5;
}(jQuery));

;

/*
	Source: build/AnalyticsManager.js
*/
/**
 * Create a core player object for namespacing
 */
(function($) {
function AnalyticsManager(_state, _config, _messenger) {
        var api = new Object();
        var self = this;
        var logger = new eventsCore.util.Logger('AnalyticsManager');
        
        var config = _config;
        var messenger = _messenger;
        var analyticsOmniture;

        var init = function(){
            if (config.omniture) {
                analyticsOmniture = new eventsPlayer.control.AnalyticsOmniture(_state, config.omniture);
            }
        };

        init();
        return api;
    }

    //console.log('PlayerManager: par:%o', window.eventsPlayer.player);
   	window.eventsPlayer.control.AnalyticsManager = AnalyticsManager;
}(jQuery));

;

/*
	Source: build/AnalyticsOmniture.js
*/
/**
 * Create a core player object for namespacing
 */
(function($) {
function AnalyticsOmniture(_state, _config, _callback) {
        var api = new Object();
        var self = this;
        var logger = new eventsCore.util.Logger('AnalyticsOmniture');
        
        var state = _state;
        var analytics = _config;
        var constants = window.eventsPlayer.PlayerConstants;
        var eventType = 'player:SendMeasureEvent';
        var info = {
            'title': '',
            'tech': ''
        };

        $(state.container).on('player:LoadEvent',  function( event, data ) {
            logger.info('player:LoadEvent - data:%o ', data);
            info.tech = data.tech;
            info.title = data.playObj.info.title;
            info.type = '';
            if (data.playObj.streamType === constants.VOD)
                info.type = 'vod';
            else if (data.playObj.streamType === constants.LIVE || data.playObj.streamType === constants.DVR) 
                info.type = 'live';
            logger.info('player:LoadEvent - info:%o', info);
        });

        $(state.container).on('player:MeasureEvent',  function( event, data ) {
            onMeasureEvent(data);
        });

        var onMeasureEvent = function(data) {
            if (data.type && data.type === 'PlayStart') {
                sendPlayStart(data.tech);
                return;
            }

            //logger.info('onMeasureEvent - analytics:%o', analytics);

            var dataObj = {
                'tech': info.tech,
                'type': data.values
            };
            var obj;
            var objName;
            var values;

            //if object for passed value exists, use configured values
            //  set replacement values
            if (analytics.actions) {

                obj = analytics.actions[data.values];
                if (obj) {
                    values = obj;

                    //logger.info('onMeasureEvent - data:%o obj:%o info:%o', data, obj, info);

                    var regex = /<(.*)>/;
                    for (var i = 0; i < values.length; i++) {
                        //logger.info('onMeasureEvent - values:%o', values[i]);

                        var match = values[i].match(regex); 
                        if (match) {       
                           // logger.info('onMeasureEvent - match:%o true:%o i:%o', match[1], (match[1] === 'title'), i);             
                            try{
                                if (match[1].indexOf('Metrics') === 0) {
                                    objName = match[1].split('.');
                                    values[i] = window[objName[0]][objName[1]];
                                }
                                else if (match[1] === 'title'){
                                    values[i] = info.title;
                                }
                                else if (match[1] === 'tech'){
                                    values[i] = info.tech;
                                }
                            }
                            catch(e) {
                                values[i] = 'unknown';
                            }
                        }
                        
                    }
                    dataObj.measureLabels = values;  
                }
                //else log
                else if (data.measureLabels){
                    dataObj.measureLabels = data.measureLabels;
                }
            }

            // set replacement values in evars
            if (analytics['evars_' + info.type] && analytics['evars_' + info.type][data.values]) {
                dataObj.evars = [];
                obj = analytics['evars_' + info.type][data.values];
                for (var k = 0; k < obj.length; k++) {
                    //logger.info('onMeasureEvent - val:%o', obj[k][Object.keys(obj[k])[0]]);
                    if (obj[k][Object.keys(obj[k])[0]] === '<title>'){
                        obj[k][Object.keys(obj[k])[0]] = info.title;
                    }
                    dataObj.evars.push(obj[k]);
                }
            }

            if (analytics['events_' + info.type]) {
                dataObj.events = analytics['events_' + info.type][data.values];
            }
                
            //logger.info('onMeasureEvent - dataObj:%o', dataObj);
            $(state.container).trigger(eventType, dataObj);
        };

        return api;
    }

    //console.log('PlayerManager: par:%o', window.eventsPlayer.player);
   	window.eventsPlayer.control.AnalyticsOmniture = AnalyticsOmniture;
}(jQuery));

;

/*
	Source: build/AnalyticsYoubora.js
*/
/**
 * Create a core player object for namespacing
 */
(function($) {
function AnalyticsYoubora(_player, _data) {
        var api = new Object();
        var self = this;
        var logger = new eventsCore.util.Logger('AnalyticsYoubora');

        var player = _player;
        var initData = _data;
        var plugin;

        var constants = window.eventsPlayer.PlayerConstants;


        logger.info('constructor - data:%o ', _data);

        var init = function() {
            if (player.youbora) {
                logger.info('init - accountCode:%o', initData.accountCode);
                player.youbora({
                    accountCode: initData.accountCode
                });
            }

            var options = {
                //accountCode: initData.accountCode,
                //httpSecure: true,
                //parseHLS: true,
                //media: {
                //    title: "Sintel",
                //    duration: 600
                //},
                properties: {
                    year: "2001",
                    genre: "Fantasy",
                    price: "free"
                },
                network: {
                    ip: "1.2.3.4"
                },
                //ads: {
                //    adsExpected: true,
                //    campaign: "Ad campaign name"
                //},
                extraParams: {
                    param1: "Extra param 1 value",
                    param2: "Extra param 2 value"
                }
            };

            //plugin = new $YB.plugins.Generic('player', options);
            //logger.info('init - plugin:%o', player.youbora);
        };

        api.setStreamInfo = function(_title, _isLive, _resource, _cdn) {
            logger.info('setStreamInfo - title:%o isLive:%o', _title, _isLive, _resource, _cdn);

            player.youbora({
                media: {
                    isLive: _isLive,
                    title: _title
                },
                media: {
                    title: _title,
                    //duration: durationTest,
                    isLive: _isLive,
                    resource: _resource,
                    cdn: _cdn,
                },
                /*
                properties: {
                    filename: "test.m3u8",
                    content_id: "contentTest",
                    genre: "genreTest",
                    language: "languageTest",
                    year: "yearTest",
                    cast: "castTest",
                    director: "directorTest",
                    owner: "ownerTest",
                    parental: "parentalTest",
                    price: "priceTest",
                    rating: "ratingTest",
                    audioType: "typeTest",
                    audioChannels: "channelTest"
                },

				CDN	- Akamai, Level 3	 
				Player - VideoJS, Flash, iPhone App, Android App, iPad App	 
				IsApp - Web, App	 
				ScreenType - PC, Tablet, Phone, Smart TV, Gaming Console, Settop Box	Smart TV, Gaming Console and Settop Box are nice-to-have
				Section	- Watch, Track	Let's call it Watch for AAC
				Title -	AAC, Featured Groups, Amen Corner, Broadcast, Green Jacket Ceremony, Holes 15 & 16, Masters On the Range, Par 3 Contest	 
				Operating System - I assume this is captured out-of-the-box

                */
            });
        };

        api.setStreamType = function(_isLive) {
        	logger.info('setStreamType - isLive:%o', _isLive);
        	player.youbora({
	        	media: {
					isLive: _isLive
	            }
	        });
        };

        init();
        return api;
    }

    window.eventsPlayer.control.AnalyticsYoubora = AnalyticsYoubora;
}(jQuery));;

/*
	Source: build/CaptionConstants.js
*/
/**
 * Create a core player object for namespacing
 */
(function($) {
var CaptionConstants = {}; // Create object

    Object.defineProperty(CaptionConstants, 'NR_ROWS', {
        value: 15,
        writable: false,
        enumerable: true
    });

    Object.defineProperty(CaptionConstants, 'NR_COLS', {
        value: 42,
        writable: false,
        enumerable: true
    });

    Object.defineProperty(CaptionConstants, 'rowsLowCh1', {
        value:  {0x11 : 1, 0x12 : 3, 0x15 : 5, 0x16 : 7, 0x17 : 9, 0x10 : 11, 0x13 : 12, 0x14 : 14},
        writable: false,
        enumerable: true
    });
    
    Object.defineProperty(CaptionConstants, 'rowsHighCh1', {
        value:  {0x11 : 2, 0x12 : 4, 0x15 : 6, 0x16 : 8, 0x17 : 10, 0x13 : 13, 0x14 : 15},
        writable: false,
        enumerable: true
    });
    
    Object.defineProperty(CaptionConstants, 'rowsLowCh2', {
        value:  {0x19 : 1, 0x1A : 3, 0x1D : 5, 0x1E : 7, 0x1F : 9, 0x18 : 11, 0x1B : 12, 0x1C : 14},
        writable: false,
        enumerable: true
    });
    
    Object.defineProperty(CaptionConstants, 'rowsHighCh2', {
        value:  {0x19 : 2, 0x1A : 4, 0x1D : 6, 0x1E : 8, 0x1F : 10, 0x1B : 13, 0x1C : 15},
        writable: false,
        enumerable: true
    });

    Object.defineProperty(CaptionConstants, 'backgroundColors', {
        value:  ['white', 'green', 'blue', 'cyan', 'red', 'yellow', 'magenta', 'black', 'transparent'],
        writable: false,
        enumerable: true
    });

    Object.defineProperty(CaptionConstants, 'specialCea608CharsCodes', {
        value:  {
            0x2a : 0xe1, // lowercase a, acute accent
            0x5c : 0xe9, // lowercase e, acute accent
            0x5e : 0xed, // lowercase i, acute accent
            0x5f : 0xf3, // lowercase o, acute accent
            0x60 : 0xfa, // lowercase u, acute accent
            0x7b : 0xe7, // lowercase c with cedilla
            0x7c : 0xf7, // division symbol
            0x7d : 0xd1, // uppercase N tilde
            0x7e : 0xf1, // lowercase n tilde
            0x7f : 0x2588, // Full block
            // THIS BLOCK INCLUDES THE 16 EXTENDED (TWO-BYTE) LINE 21 CHARACTERS
            // THAT COME FROM HI BYTE=0x11 AND LOW BETWEEN 0x30 AND 0x3F
            // THIS MEANS THAT \x50 MUST BE ADDED TO THE VALUES
            0x80 : 0xae, // Registered symbol (R)
            0x81 : 0xb0, // degree sign
            0x82 : 0xbd, // 1/2 symbol
            0x83 : 0xbf, // Inverted (open) question mark
            0x84 : 0x2122, // Trademark symbol (TM)
            0x85 : 0xa2, // Cents symbol
            0x86 : 0xa3, // Pounds sterling
            0x87 : 0x266a, // Music 8'th note
            0x88 : 0xe0, // lowercase a, grave accent
            0x89 : 0x20, // transparent space (regular)
            0x8a : 0xe8, // lowercase e, grave accent
            0x8b : 0xe2, // lowercase a, circumflex accent
            0x8c : 0xea, // lowercase e, circumflex accent
            0x8d : 0xee, // lowercase i, circumflex accent
            0x8e : 0xf4, // lowercase o, circumflex accent
            0x8f : 0xfb, // lowercase u, circumflex accent
            // THIS BLOCK INCLUDES THE 32 EXTENDED (TWO-BYTE) LINE 21 CHARACTERS
            // THAT COME FROM HI BYTE=0x12 AND LOW BETWEEN 0x20 AND 0x3F
            0x90 : 0xc1, // capital letter A with acute
            0x91 : 0xc9, // capital letter E with acute
            0x92 : 0xd3, // capital letter O with acute
            0x93 : 0xda, // capital letter U with acute
            0x94 : 0xdc, // capital letter U with diaresis
            0x95 : 0xfc, // lowercase letter U with diaeresis
            0x96 : 0x2018, // opening single quote
            0x97 : 0xa1, // inverted exclamation mark
            0x98 : 0x2a, // asterisk
            0x99 : 0x2019, // closing single quote
            0x9a : 0x2501, // box drawings heavy horizontal
            0x9b : 0xa9, // copyright sign
            0x9c : 0x2120, // Service mark
            0x9d : 0x2022, // (round) bullet
            0x9e : 0x201c, // Left double quotation mark
            0x9f : 0x201d, // Right double quotation mark
            0xa0 : 0xc0, // uppercase A, grave accent
            0xa1 : 0xc2, // uppercase A, circumflex
            0xa2 : 0xc7, // uppercase C with cedilla
            0xa3 : 0xc8, // uppercase E, grave accent
            0xa4 : 0xca, // uppercase E, circumflex
            0xa5 : 0xcb, // capital letter E with diaresis
            0xa6 : 0xeb, // lowercase letter e with diaresis
            0xa7 : 0xce, // uppercase I, circumflex
            0xa8 : 0xcf, // uppercase I, with diaresis
            0xa9 : 0xef, // lowercase i, with diaresis
            0xaa : 0xd4, // uppercase O, circumflex
            0xab : 0xd9, // uppercase U, grave accent
            0xac : 0xf9, // lowercase u, grave accent
            0xad : 0xdb, // uppercase U, circumflex
            0xae : 0xab, // left-pointing double angle quotation mark
            0xaf : 0xbb, // right-pointing double angle quotation mark
            // THIS BLOCK INCLUDES THE 32 EXTENDED (TWO-BYTE) LINE 21 CHARACTERS
            // THAT COME FROM HI BYTE=0x13 AND LOW BETWEEN 0x20 AND 0x3F
            0xb0 : 0xc3, // Uppercase A, tilde
            0xb1 : 0xe3, // Lowercase a, tilde
            0xb2 : 0xcd, // Uppercase I, acute accent
            0xb3 : 0xcc, // Uppercase I, grave accent
            0xb4 : 0xec, // Lowercase i, grave accent
            0xb5 : 0xd2, // Uppercase O, grave accent
            0xb6 : 0xf2, // Lowercase o, grave accent
            0xb7 : 0xd5, // Uppercase O, tilde
            0xb8 : 0xf5, // Lowercase o, tilde
            0xb9 : 0x7b, // Open curly brace
            0xba : 0x7d, // Closing curly brace
            0xbb : 0x5c, // Backslash
            0xbc : 0x5e, // Caret
            0xbd : 0x5f, // Underscore
            0xbe : 0x7c, // Pipe (vertical line)
            0xbf : 0x223c, // Tilde operator
            0xc0 : 0xc4, // Uppercase A, umlaut
            0xc1 : 0xe4, // Lowercase A, umlaut
            0xc2 : 0xd6, // Uppercase O, umlaut
            0xc3 : 0xf6, // Lowercase o, umlaut
            0xc4 : 0xdf, // Esszett (sharp S)
            0xc5 : 0xa5, // Yen symbol
            0xc6 : 0xa4, // Generic currency sign
            0xc7 : 0x2503, // Box drawings heavy vertical
            0xc8 : 0xc5, // Uppercase A, ring
            0xc9 : 0xe5, // Lowercase A, ring
            0xca : 0xd8, // Uppercase O, stroke
            0xcb : 0xf8, // Lowercase o, strok
            0xcc : 0x250f, // Box drawings heavy down and right
            0xcd : 0x2513, // Box drawings heavy down and left
            0xce : 0x2517, // Box drawings heavy up and right
            0xcf : 0x251b // Box drawings heavy up and left
        },
        writable: false,
        enumerable: true
    });

    window.eventsPlayer.CaptionConstants = CaptionConstants;
}(jQuery));;

/*
	Source: build/CaptionDisplay.js
*/
/**
 * Caption display for 608 captions
 */
(function($) {
function CaptionDisplay(_state) {
        var api = new Object();
        var self = this;
        var logger = new eventsCore.util.Logger('CaptionDisplay');
        //if 608 custom display is the active/selected display mechanism
        var active = false;    
        var state = _state;
        var overlayCaptions;
        var captionParser;

        var enabled = false;
        var curMode;
        var parseCnt = 0;
        var playTime = 0;
        var messages = [];
        var rollUpRows;
        var baseRow;
        var cWin;
        var increment = 0;
        var lastCaptionIdx = -1;
        var rowPositions = [];
        var captionRows = [];
        var captionRowPos = [];
        var captionSettings;
        var bufferStart;
        var bufferEnd;
        var captionRange = 1;

        var colWidth = 2.380952; //for 42 column 16:9 display
        //    colWidth = 3.125; //for 32 column 4:3 display (but if src is 608 only?)
        var rowHeight = 6.666667;  //for 15 rows
        var numRows = 15;

        //logger.info('constructor - wrapper:%o show:%o', wrapper, showQosDefault);

        var init = function() {
            logger.info('init - active:%o', active);

            var posterElem = $(state.container).find('.playerPoster')[0];

            $(
                '<div class="overlayCaptions">' +
                    '<div class="captionColumns" style="color: white;">' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                        '<span> </span>' +
                    '</div>' +
                    //'<div class="captionWrap">' +
                    '<div class="captionWindow"></div>' +
                    //'</div>' +
                '</div>'
            ).insertBefore(posterElem);
            //logger.info('setupDisplayElements - container:%o overlay:%o', $(state.container), overlayQos);

            captionSettings = new eventsPlayer.control.caption.CaptionSettings();

            overlayCaptions = $(state.container).find('.overlayCaptions')[0];
            cWin = $(state.wrapper).find('.captionWindow');
            updateDisplay();

            captionParser = new eventsPlayer.control.caption.Cea608Parser(1, {'updateData': captionHandler, 'newCommand': commandHandler}, null);

            $(state.container).on("player:TimeUpdateEvent", function(event, data) {
                //logger.info('player:TimeUpdateEvent - ev:%o data:%o loadedTime:%o time:%o dur:%o', event, data, data.loadedTime, data.time, data.duration);  
                updateTime(data);
            });

            $(state.container).on("player:ResizeEvent", function(event, data) {
                //logger.info('player:ResizeEvent - ev:%o data:%o', event, data);
                sizeUpdate(data.width, data.height);
            });

            $(state.container).on( "player:MetadataEvent",  function( event, data ) {
                if (active) {
                    //let happen with timeUpdate
                    //  by showing here when not autoplaying, covers poster in iframe
                    //$(overlayCaptions).show();
                }
            });

            $(state.container).on( "player:SeekEvent",  function( event, data ) {
                //logger.info('playerSeekEvent - ev:%o time:%o bufferStart:%o bufferEnd:%o', event, data.time, bufferStart, bufferEnd);

                if (bufferStart && bufferEnd && (data.time < bufferStart || data.time > bufferEnd)) {
                    resetCaptions(true);
                }
                else {
                    resetCaptions(false);
                }
            });
        };

        var parseData = function(time, data) {
            messages.push({'time': time, 'data':data})
        }

        var updateTime = function(data) {
            if (active) {

                if (enabled && !$(overlayCaptions).is(':visible')) {
                    showOverlay(true, 'updateTime');
                }

                var current = [];

                playTime = data.time;
                
                //logger.info('updateTime - playTime:%o bufStart:%o bufEnd:%o', playTime, data.buffered[0].start, data.buffered[0].end);
                if (data.buffered[0]) {
                    bufferStart = data.buffered[0].start;
                    bufferEnd = data.buffered[0].end;
                }
                
                var ftime = (messages && messages[0]) ? messages[0].time : 'na';
                //logger.info('updateTime - dur:%o time:%o ftime:%o enabled:%o len:%o', data.duration, data.time, ftime, enabled, messages.length);

                //find the first index if it has been reset
                //  stop processing if not set
                if (lastCaptionIdx == -1) {
                    for (var k = 0; k < messages.length; k++) {
                        if (playTime <= messages[k].time) {
                            lastCaptionIdx = k;
                            //logger.info('updateTime - lastIndx:%o msgLength:%o', lastCaptionIdx, messages.length);
                            break;
                        }
                    }
                }

                if (lastCaptionIdx < 0)
                    return;

                //loop from end of captions list to last captured time
                //  find all messages less than the curren tplay time and copy to current array
                //  save index of last captured time
                for (var i = messages.length - 1; i > lastCaptionIdx; i--) {
                    if (playTime >= messages[i].time) {
                        current = messages.slice(lastCaptionIdx, i + 1);
                        lastCaptionIdx = i+1;
                        //logger.info('updateTime - time:%o i:%o cur:%o', playTime, i, current);
                        break;
                    }
                }

                //if captions enabled, process all current captions within 1 second of current time
                //  prevents older captions that are in initial messages list
                if (enabled && current.length) {
                    //logger.info('updateTime - curLength:%o', current.length);
                    for (var j = 0; j < current.length; j++) {
                        //logger.info('updateTime - playTime:%o cur:%o', playTime, current[j].time);
                        if (playTime >= current[j].time - captionRange) 
                            captionParser.addData(current[j].time, current[j].data);
                    }
                }
            }
        }

        var captionHandler = function(time, screen) {
            var rows = screen.getTextAndFormat();
            //logger.info('captionHandler - rows:%o currRow:%o', rows, screen.currRow);

            if (screen.rollUpRow != rollUpRows || screen.currRow != baseRow) {
                rollUpRows = screen.rollUpRow;
                baseRow = screen.currRow;
                //logger.info('captionHandler - base:%o rollUp:%o', baseRow, rollUpRows);
                setClipArea(baseRow, rollUpRows);
            }

            for (var i=0; i < rows.length; i++) {
                //logger.info('captionHandler - i:%o mode:%o txt:%o', i, curMode, rows[i].getTextString());

                if (rows[i].getTextString() != '') {
                    if (cWin){
                        //logger.info('captionHandler - row:%o txt:%o', $(captionRows[i].elem).attr('data-num'), rows[i].getTextString());
                        $(captionRows[i].elem).find('.captionText').html(rows[i].getTextString());
                        var leading = rows[i].getTextString().search(/\S/);
                        captionRows[i].elem.css('left', (leading * colWidth) + '%');

                        captionSettings.setBackgroundStyle($(captionRows[i].elem));
                        captionSettings.setTextStyle($(captionRows[i].elem.find('.captionText')));
                    }
                }
                else if (curMode == 'MODE_POP-ON'){
                    $(captionRows[i].elem).find('.captionText').html('');
                }
            }
            
        }

        var commandHandler = function(time, data) {
            //logger.info('commandHandler - play:%o time:%o cmd:%o', playTime, time, data);
            
            if (data.cmd == 'mode') {
                curMode = data.value;
            }

            if (data.cmd == 'rollup') {
                var curVal;
                var startTop;
                var startHeight;
                var nextVal = captionRows[numRows - 1].percTop; //find the top value of the last row

                var shrinkRow;
                var animPos;
                var time;

                //logger.info('commandHandler - rollup - *********************************');
                //logger.info('commandHandler - rollup - first:%o last:%o', captionRows[0].percTop, captionRows[captionRows.length-1].percTop);

                for (var i = 0; i < captionRows.length; i++){
                    time = 200;

                    /*
                    var inc = -1 * increment;
                    var curr = parseFloat(captionRows[i].percTop);
                    var next = (curr + inc);
                    if (next < inc) {
                        next = 100;
                    }
                    logger.info('commandHandler - rollup - row:%o cur:%o next:%o', captionRows[i].elem.attr('data-num'), curr, next);
                    next = next + '%';
                    */

                    //set iterated row top value to the next position 
                    tmpVal = captionRows[i].percTop;
                    captionRows[i].percTop = nextVal;
                    nextVal = tmpVal;

                    //use variable for position (so can update for shrink row)
                    //  reset shrinkrow
                    animPos = captionRows[i].percTop;
                    shrinkRow = null;
 
                    //if iterated row is the top roll up row, set it to shrink during animation instead of moving top
                    //  if set to shrink, moves at end of animation
                    if (i == baseRow - rollUpRows + 1) {
                        //if shrink row is the first row
                        //  modify the animation row to above the top of the caption window
                        // save the shrink row for use in the animation complete callback
                        if (baseRow == 1) {
                            shrinkRow = captionRows[i];
                            animPos = captionRowPos[0];
                        }
                        startTop = captionRows[i].elem.css('top');
                        startHeight = captionRows[i].elem.css('height');
                        captionRows[i].elem.attr('data-value', 'shrink');
                        //logger.info('commandHandler - i:%o nextVal:%o base:%o roll:%o', i, nextVal, baseRow, rollUpRows);
                        //logger.info('commandHandler - shrink - percTop:%o', animPos);
                    }

                    //if moving to bottom, do so quickly
                    else if (parseFloat(animPos) > parseFloat(tmpVal)) {
                        //logger.info('commandHandler - i:%o animPos:%o tmp:%o', i, animPos, tmpVal);
                        captionRows[i].elem.css('top', '100%');
                    }

                    //animate top position of the rows
                    captionRows[i].elem.animate({'top':animPos}, {
                        duration: time,
                        easing: 'linear',
                        progress: function(prom, prog){
                            if ($(this).attr('data-value') == 'shrink') {
                                var diff = parseFloat(startTop) - parseFloat($(this).css('top'));

                                //logger.info('animate - start:%o top:%o diff:%o height:%o txtBot:%o', startTop, $(this).css('top'), diff, $(this).css('height'), $(this).find('.captionText').css('bottom'));

                                $(this).css('top', startTop);

                                $(this).css('height', (parseFloat(startHeight) - diff) + 'px');

                                $(this).find('.captionText').css('bottom', diff + 'px');
                            }
                        },
                        complete: function(){
                            if ($(this).attr('data-value') == 'shrink') {
                                $(this).css('height', '');
                                $(this).find('.captionText').css('bottom', '');

                                $(this).attr('data-value', '');
                                $(this).find('.captionText').html('');

                                //if shrinkrow was the top row, move to end
                                if (shrinkRow) {
                                    shrinkRow.percTop = captionRowPos[numRows];
                                    $(this).css('top', captionRowPos[numRows]);
                                }
                                //logger.info('animate - complete - i:%o', i);
                            }
                        }
                    });
                }

                captionRows.sort(function(a, b){
                    return parseFloat(a.percTop) - parseFloat(b.percTop);
                });
                
            }

            else if (data.cmd == 'erase') {
                resetDisplayRows();
            }
        }

        var parsePerc = function(style) {
            var styles = style.split(';');

            for (var i=0; i<styles.length; i++) {
                if (styles[i].indexOf('top') >= 0) {

                }
            }
        };

        var showOverlay = function(show, src) {
            logger.info('showOverlay - show:%o src:%o', show, src);

            if (show) {
                $(overlayCaptions).show();
            }
            else {
                $(overlayCaptions).hide();
            }
        };

        /**
         * update display based on number of rollup rows
         */
        var updateDisplay = function() {
            var height = numRows * rowHeight;
            var top = 0;

            increment = 100/numRows;
            baseRow = numRows - 1;

            cWin.empty();

            cWin.css('height', height + '%');
            cWin.css('top', top + '%');

            captionRowPos.push((-1 * increment) + '%');

            for (var i = 0; i < numRows; i++) {
                var $div = $('<div id="row" class="captionRow" data-value="" data-num="' + i + '"><div class="captionText"></div></div>');
                cWin.append($div);
                captionRows.push({'elem': $div, 'percTop': (i * increment) + '%', 'percTopStart': (i * increment) + '%', 'id': i});
                captionRows[i].elem.css('top', captionRows[i].percTop);
                captionRows[i].elem.css('height', increment + '%');

                captionRowPos.push((i * increment) + '%');
            }  

            //cWin.css('clip', 'rect(10px, 290px, 190px, 10px)');      
        }

        var setClipArea = function(base, num) {
            return; 

            var top = (base - num + 1) * rowHeight + '%';
            var bot = (numRows - base - 1) * rowHeight + '%';

            cWin.css('-webkit-clip-path', 'inset(' + top + ' 0 ' + bot + ' 0)');
            cWin.css('clip-path', 'inset(' + top + ' 0 ' + bot + ' 0)');
        }

        var resetCaptions = function(clear) {
            logger.info('resetCaptions - clear:%o', clear);

            $(overlayCaptions).hide();
            showOverlay(false, 'resetCaptions');

            if (clear) {
                messages = [];
            }

            lastCaptionIdx = -1;
            rollUpRows = null;
            parseCnt = 0;
            baseRow = numRows - 1;
            captionParser.reset();
            resetDisplayRows();

        }

        var resetDisplayRows = function() {
            for (var i = 0; i < captionRows.length; i++) {
                captionRows[i].elem.stop(true);
                captionRows[i].elem.find('.captionText').html('');
                captionRows[i].percTop = captionRowPos[i+1];
                captionRows[i].elem.css('top', captionRows[i].percTop);
                captionRows[i].elem.attr('data-value', '');
            }

            captionRows.sort(function(a, b){
                return parseFloat(a.percTop) - parseFloat(b.percTop);
            });
        }

        var sizeUpdate = function(width, height) {
            var ratio = height/360;
            var perc = 100 * ratio;
            //logger.info('sizeUpdate - height:%o perc:%o', height, perc);
            $('.captionWindow > div').css('font-size', perc + '%');
        }

        api.add608 = function(time, data) {
            //logger.info('add608 - active:%o time:%o data:%o', active, time, data);
            if (active)
                parseData(time, data);
        };

        /**
         * enable if captions for this video
         */
        api.enable = function() {
            if (active) {
                logger.info('enable');
                captionParser.reset();
                sizeUpdate($(state.wrapper).width(), $(state.wrapper).height());
                enabled = true;
            }
        };

        api.disable = function() {
            if (active) {
                logger.info('disable');
                enabled = false;
                resetCaptions();
                showOverlay(false, 'disable');
            }
        }

        /**
         * allow custom caption display
         */
        api.activate = function(value) {
            resetCaptions(true);
            active = value;

        }

        init();
        return api;
    }

    window.eventsPlayer.view.CaptionDisplay = CaptionDisplay;
}(jQuery));;

/*
	Source: build/CaptionSettings.js
*/
/**
 * Caption display for 608 captions
 */
(function($) {
function CaptionSettings(_state) {
        var api = new Object();
        var logger = new eventsCore.util.Logger('CaptionSettings');
        
        var defaultSetting = {
            'text': 'White',
            'textOpacity': 'Opaque',
            'bgColor': 'Black',
            'bgOpacity': 'Opaque',
            'fontSize': '100%',
            'textEdge': 'None',
            'fontFamily': 'Proportional Sans-Serif'
        };

        var customSetting = {
            'textColor': 'White',
            'textOpacity': 'Opaque',
            'bgColor': 'Black',
            'bgOpacity': 'Opaque',
            'fontSize': '100%',
            'textEdge': 'None',
            'fontFamily': 'Proportional Sans-Serif'
        };

        var color = {
            'Black': '#000',
            'White': '#FFF',
            'Red': '#F00',
            'Green': '#0F0',
            'Blue': '#00F',
            'Yellow': '#FF0',
            'Magenta': '#F0F',
            'Cyan': '#0FF'
        };

        var transparency = {
            'Transparent': 0,
            'Semi-Transparent': .5,
            'Opaque': 1
        };

        var fontSize = {
            '50%': '50%',
            '75%': '75%',
            '100%': '100%',
            '125%': '125%',
            '150%': '150%',
            '175%': '175%',
            '200%': '200%'
        };

        var textEdge = {
            'None': 'none',
            'Raised': 'raised',         //text-shadow: rgb(34, 34, 34) 1px 1px, rgb(34, 34, 34) 2px 2px, rgb(34, 34, 34) 3px 3px;
            'Depressed': 'depressed',   //text-shadow: rgb(204, 204, 204) 1px 1px, rgb(204, 204, 204) 0px 1px, rgb(34, 34, 34) -1px -1px, rgb(34, 34, 34) 0px -1px;
            'Uniform': 'uniform',       //text-shadow: rgb(34, 34, 34) 0px 0px 4px, rgb(34, 34, 34) 0px 0px 4px, rgb(34, 34, 34) 0px 0px 4px, rgb(34, 34, 34) 0px 0px 4px;
            'Dropshadow': 'dropshadow'  //text-shadow: rgb(34, 34, 34) 2px 2px 3px, rgb(34, 34, 34) 2px 2px 4px, rgb(34, 34, 34) 2px 2px 5px;
        };

        var font = {
            'Proportional Sans-Serif': '"robotoregular"',
            //'Proportional Sans-Serif': '"Arial Unicode Ms", Arial, Helvetica, Verdana, "PT Sans Caption", sans-serif',
            //'Proportional Sans-Serif': '"Lucida Console"',
            'Monospace Sans-Serif': '"Deja Vu Sans Mono", "Lucida Console", Monaco, Consolas, "PT Mono", monospace',
            'Proportional Serif': '"Times New Roman", Times, Georgia, Cambria, "PT Serif Caption", serif',
            'Monospace Serif': '"Courier New", Courier, "Nimbus Mono L", "Cutive Mono", monospace',
            'Casual': '"Comic Sans MS", Impact, Handlee, fantasy',
            'Cursive': '"Monotype Corsiva", "URW Chancery L", "Apple Chancery", "Dancing Script", cursive',
            'Small Caps': '"Arial Unicode Ms", Arial, Helvetica, Verdana, "Marcellus SC", sans-serif' //font-variant: small-caps
        };

        

        var hexToRgb = function(hex) {
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                return r + r + g + g + b + b;
            });

            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            //logger.info('hexToRgb - hex:%o result:%o', hex, result);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };

        api.setBackgroundStyle = function(el) {
            var rgb = hexToRgb(color[customSetting.bgColor]);
            var trans = transparency[customSetting.bgOpacity];
            //logger.info('setBackgroundStyle - color:%o trans:%o', rgb, trans);
            
            $(el).css('background-color', 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + trans + ')');
        };

        api.setTextStyle = function(el) {
            var rgb = hexToRgb(color[customSetting.textColor]);
            var trans = transparency[customSetting.textOpacity];
            //logger.info('setBackgroundStyle - color:%o trans:%o', rgb, trans);
            
            $(el).css('color', 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + trans + ')');
            $(el).css('font-family', font[customSetting.fontFamily]);
            //$(el).css('font-family', 'robotoregular');
            $(el).css('font-size', fontSize[customSetting.fontSize]);
        };

        return api;
    }

    window.eventsPlayer.control.caption.CaptionSettings = CaptionSettings;
}(jQuery));


/*
        text - color, transparency
            <option value="0" selected="">Transparent</option> 
            <option value="0.5">Semi-Transparent</option> 
            <option value="1">Opaque</option>

            <option value="#000" selected="">Black</option>
                <option value="#FFF">White</option>
            <option value="#F00">Red</option>
            <option value="#0F0">Green</option>
            <option value="#00F">Blue</option>
            <option value="#FF0">Yellow</option>    
            <option value="#F0F">Magenta</option>
            <option value="#0FF">Cyan</option>
        background - color, transparency
            <option value="0" selected="">Transparent</option> 
            <option value="0.5">Semi-Transparent</option> 
            <option value="1">Opaque</option>

            <option value="#000" selected="">Black</option>
                <option value="#FFF">White</option>
            <option value="#F00">Red</option>
            <option value="#0F0">Green</option>
            <option value="#00F">Blue</option>
            <option value="#FF0">Yellow</option>
            <option value="#F0F">Magenta</option>
            <option value="#0FF">Cyan</option>
        font size
            <option value="0.50">50%</option>
            <option value="0.75">75%</option>
            <option value="1.00" selected="">100%</option>
            <option value="1.25">125%</option>
            <option value="1.50">150%</option>
            <option value="1.75">175%</option>
            <option value="2.00">200%</option>
            <option value="3.00">300%</option>
            <option value="4.00">400%</option>
        text edge style
            <option value="none" selected="">None</option> 
            <option value="raised">Raised</option> 
            <option value="depressed">Depressed</option> 
            <option value="uniform">Uniform</option>
            <option value="dropshadow">Dropshadow</option>
        font family
            <option value="proportionalSansSerif" selected="">Proportional Sans-Serif</option>
            <option value="monospaceSansSerif">Monospace Sans-Serif</option>
            <option value="proportionalSerif">Proportional Serif</option>
            <option value="monospaceSerif">Monospace Serif</option>
            <option value="casual">Casual</option>
            <option value="script">Script</option>
            <option value="small-caps">Small Caps</option>
        */;

/*
	Source: build/Cea608CaptionScreen.js
*/
/**
     * Keep a CEA-608 screen of 32x15 styled characters
     * @constructor
    */
(function($) {
function Cea608CaptionScreen() {
        var api = {
            get rows() {
                return rows;
            },
            get rollUpRow() {
                return nrRollUpRows;
            },
            get currRow() {
                return currRow;
            }
        };

        var logger = new eventsCore.util.Logger('Cea608CaptionScreen');

        var NR_ROWS = eventsPlayer.CaptionConstants.NR_ROWS;

        var rows = [];
        for (var i = 0 ; i <  NR_ROWS; i++) {
            rows.push(new eventsPlayer.control.caption.Cea608Row(i)); // Note that we use zero-based numbering (0-14)
        }
        var currRow = NR_ROWS - 1;
        var nrRollUpRows = null;

        api.reset = function() {
            //logger.info('reset');
            for (var i = 0 ; i < NR_ROWS ; i++) {
                rows[i].clear();
            }
            currRow = NR_ROWS - 1;
        };

        api.equals = function(other) {
            var equal = true;
            for (var i = 0 ; i < NR_ROWS ; i++) {
                if (!rows[i].equals(other.rows[i])) {
                    equal = false;
                    break;
                }
            }
            return equal;
        };

        api.copy = function(other) {
            for (var i = 0 ; i < NR_ROWS ; i++) {
                rows[i].copy(other.rows[i]);
            }

            nrRollUpRows = other.rollUpRow;
            currRow = other.currRow;
        };

        api.isEmpty = function() {
            var empty = true;
            for (var i = 0 ; i < NR_ROWS ; i++) {
                if (!rows[i].isEmpty()) {
                    empty = false;
                    break;
                }
            }
            return empty;
        };

        api.backSpace = function() {
            var row = rows[currRow]; 
            row.backSpace();
        };

        api.clearToEndOfRow = function() {
            //logger.info('clearToEndOfRow');
            var row = rows[currRow];
            row.clearToEndOfRow();
        };

        /**
         * Insert a character (without styling) in the current row.
         */
        api.insertChar = function(char) {
            var row = rows[currRow];
            //logger.info('insertChar - row:%o char:%o-%o', row.id, char, row.getCharForByte(char));
            row.insertChar(char);
        };

        api.setPen = function(styles) {
            var row = rows[currRow];
            row.setPenStyles(styles);
        };

        api.moveCursor = function(relPos) {
            var row = rows[currRow];
            row.moveCursor(relPos); 
        };

        api.setCursor = function(absPos) {
            //logger.info("setCursor: " + absPos);
            var row = rows[currRow];
            row.setCursor(absPos);
        };

        api.setPAC = function(pacData) {
            //logger.info("pacData = " + JSON.stringify(pacData));
            var newRow = pacData.row - 1;
            //test forcing to diff rows
            //newRow = 10;
            //newRow -= 2;
            if (nrRollUpRows  && newRow < nrRollUpRows - 1) {
                    newRow = nrRollUpRows-1;
            }
            currRow = newRow;
            var row = rows[currRow];
            if (pacData.indent !== null) {
                var indent = pacData.indent;
                var prevPos = Math.max(indent-1, 0);
                row.setCursor(pacData.indent);
                pacData.color = row.chars[prevPos].penState.foreground;
            }
            var styles = {foreground : pacData.color, underline : pacData.underline, italics : pacData.italics, background : 'black', flash : false};
            api.setPen(styles);
        };

        /**
         * Set background/extra foreground, but first do back_space, and then insert space (backwards compatibility).
         */
        api.setBkgData = function(bkgData) {
            //logger.info("bkgData = " + JSON.stringify(bkgData));
            backSpace();
            api.setPen(bkgData);
            api.insertChar(0x20); //Space
        };

        api.setRollUpRows = function(nrRows) {
            nrRollUpRows = nrRows;
        };

        api.rollUp = function() {
            if (nrRollUpRows === null) {
                //logger.info('rollUp - roll_up but nrRollUpRows not set yet');
                return; //Not properly setup
            }
            //logger.info('rollUp - text:%o', api.getDisplayText(true));

            var topRowIndex = currRow + 1 - nrRollUpRows;
            var topRow = rows.splice(topRowIndex, 1)[0];
            topRow.clear();
            rows.splice(currRow, 0, topRow);
        };

       /**
        * Get all non-empty rows with as unicode text. 
        */        
        api.getDisplayText = function(asOneRow) {
            asOneRow = asOneRow || false;
            var displayText = [];
            var text = "";
            var rowNr = -1;
            for (var i = 0; i < NR_ROWS ; i++) {
                var rowText = rows[i].getTextString();
                //logger.info('getDisplayText - i:%o row:%o text:%o', i, rows[i].id, rowText);
                if (rowText) {
                    rowNr = i+1;
                    if (asOneRow) {
                        displayText.push("Row " + rowNr + ': "' + rowText + '"');
                    } else {
                        displayText.push(rowText.trim());
                    }
                }
            }
            if (displayText.length > 0) {
                if (asOneRow) {
                    text = "[" + displayText.join(" | ") + "]";
                } else {
                    text = displayText.join("\n");
                }
            }
            return text;
        };

        api.getTextAndFormat = function() {
            return rows;
        };

        api.rows = function() {
            return rows;
        }

        api.reset();
        return api;
    };

    window.eventsPlayer.control.caption.Cea608CaptionScreen = Cea608CaptionScreen;
}(jQuery));;

/*
	Source: build/Cea608Channel.js
*/
/**
 * Handle a CEA-608 channel and send decoded data to outputFilter
 * @constructor
 * @param {Number} channelNumber (1 or 2)
 * @param {CueHandler} outputFilter Output from channel1 newCue(startTime, endTime, captionScreen)
*/
(function($) {
function Cea608Channel(channelNumber, outputFilter) {
        var api = {};
        var logger = new eventsCore.util.Logger('Cea608Channel');

        var NR_COLS = eventsPlayer.CaptionConstants.NR_COLS;
        var NR_ROWS = eventsPlayer.CaptionConstants.NR_ROWS;

        var chNr = channelNumber;
        var outputFilter = outputFilter;
        var mode = null;
        var verbose = 0;
        var displayedMemory = new eventsPlayer.control.caption.Cea608CaptionScreen();
        var nonDisplayedMemory = new eventsPlayer.control.caption.Cea608CaptionScreen();
        var lastOutputScreen = new eventsPlayer.control.caption.Cea608CaptionScreen();
        var currRollUpRow = displayedMemory.rows[NR_ROWS-1];
        var writeScreen = displayedMemory;
        var mode = null;
        var cueStartTime = null; // Keeps track of where a cue started.
        var msgTime = null;
        
        var modes = ["MODE_ROLL-UP", "MODE_POP-ON", "MODE_PAINT-ON", "MODE_TEXT"];
        
        api.reset = function() {
            mode = null;
            displayedMemory.reset();
            nonDisplayedMemory.reset();
            lastOutputScreen.reset();
            currRollUpRow = displayedMemory.rows[NR_ROWS-1];
            writeScreen = displayedMemory;
            mode = null;
            cueStartTime = null;
            lastCueEndTime = null;
        };

        api.setTime = function(time) {
            msgTime = time;
        }

        api.getHandler = function() {
            return outputFilter;
        };

        api.setHandler = function(newHandler) {
            outputFilter = newHandler;
        };

        api.setPAC = function(pacData) {
            writeScreen.setPAC(pacData);
        };

        api.setBkgData = function(bkgData) {
            writeScreen.setBkgData(bkgData);
        };

        var setMode = function(newMode) {
            if (newMode === mode) {
                return;
            }
            mode = newMode;
            //logger.info('setMode - %o', newMode);
            if (mode == "MODE_POP-ON") {
                writeScreen = nonDisplayedMemory;
            } else {
                writeScreen = displayedMemory;
                writeScreen.reset();
            }
            if (mode !== "MODE_ROLL-UP") {
                displayedMemory.nrRollUpRows = null;
                nonDisplayedMemory.nrRollUpRows = null;
            }
            mode = newMode;

            outputDataUpdate({'cmd': 'mode', 'value': mode});
        };

        api.insertChars = function(time, chars) {
            var added = '';
            msgTime = time;

            for (var i = 0 ; i < chars.length ; i++) {
                writeScreen.insertChar(chars[i]);
                added += currRollUpRow.getCharForByte(chars[i]);
            }
            var screen = writeScreen === displayedMemory ? "DISP" : "NON_DISP";
            //logger.info('insertChars - mode:%o chars:%o screen:%o chars:%o', mode, chars, screen, added);

            if (mode === "MODE_PAINT-ON" || mode === "MODE_ROLL-UP") {
                //logger.info('insertChars - time:%o dispText:%o', time, displayedMemory.getDisplayText(true));
                outputDataUpdate();
            }
        };

        api.cc_RCL = function() { // Resume Caption Loading (switch mode to Pop On)
            //logger.info('command - cc_RCL - Resume Caption Loading');
            setMode("MODE_POP-ON");
        };
        api.cc_BS = function() { // BackSpace
            //logger.info('command - cc_BS - BackSpace');
            if (mode === "MODE_TEXT") {
                return;
            }
            writeScreen.backSpace();
            if (writeScreen === displayedMemory) {
                outputDataUpdate();
            }
        }; 
        api.cc_AOF = function() { // Reserved (formerly Alarm Off)
            return;
        };
        api.cc_AON = function() { // Reserved (formerly Alarm On)
            return;
        };
        api.cc_DER = function() { // Delete to End of Row
            //logger.info('command - cc_DER - Delete to End of Row');
            writeScreen.clearToEndOfRow();
            outputDataUpdate();
        };
        api.cc_RU = function(nrRows) { //Roll-Up Captions-2,3,or 4 Rows
            //logger.info('command - cc_RU - roll up rows:%o', nrRows);
            writeScreen = displayedMemory;
            setMode("MODE_ROLL-UP");
            writeScreen.setRollUpRows(nrRows);
        };
        api.cc_FON = function() { //Flash On
            //logger.info('command - cc_FON - Flash On');
            writeScreen.setPen({flash : true});
        };
        api.cc_RDC = function() { // Resume Direct Captioning (switch mode to PaintOn)
            //logger.info('command - cc_RDC - Resume Direct Captioning');
            setMode("MODE_PAINT-ON");
        };
        api.cc_TR = function() { // Text Restart in text mode (not supported, however)
            //logger.info('command - cc_TR - Text Restart');
            setMode("MODE_TEXT");
        };
        api.cc_RTD = function() { // Resume Text Display in Text mode (not supported, however)
            //logger.info('command - cc-RTD - Resume Text Display');
            //setMode("MODE_TEXT");
        };
        api.cc_EDM = function() { // Erase Displayed Memory
            //logger.info('command - cc_EDM - Erase Displayed Memory');
            displayedMemory.reset();
            outputDataUpdate({'cmd': 'erase'});
        };
        api.cc_CR = function() { // Carriage Return
            //logger.info('command - cc_CR - Carriage Return');
            writeScreen.rollUp();
            outputDataUpdate({'cmd': 'rollup'});
        };
        api.cc_ENM = function() { //Erase Non-Displayed Memory
            //logger.info('command - cc_ENM - Erase Non-displayed Memory');
            nonDisplayedMemory.reset();
        };
        api.cc_EOC = function() { //End of Caption (Flip Memories)
            //logger.info('command - cc_EOC - End Of Caption');
            if (mode === "MODE_POP-ON") {
                var tmp = displayedMemory;
                displayedMemory = nonDisplayedMemory;
                nonDisplayedMemory = tmp;
                writeScreen = nonDisplayedMemory;
                //logger.info("cc_EOC - disp:%o", displayedMemory.getDisplayText(true));
            }
            outputDataUpdate();
        };
        api.cc_TO = function(nrCols) { // Tab Offset 1,2, or 3 columns
            logger.info('command - cc_TO - Tab Offset:%o', nrCols);
            writeScreen.moveCursor(nrCols);
        };
        api.cc_MIDROW = function(secondByte) { // Parse MIDROW command
            var styles = {flash : false};
            styles.underline = secondByte % 2 === 1;
            styles.italics = secondByte >= 0x2e;
            if (!styles.italics) {
                var colorIndex = Math.floor(secondByte/2) - 0x10;
                var colors = ["white", "green", "blue", "cyan", "red", "yellow", "magenta"];
                styles.foreground = colors[colorIndex];
            } else {
                styles.foreground = "white";
            }
            //logger.info('command - cc_MIDROW - %o', JSON.stringify(styles));
            writeScreen.setPen(styles);
        };

        var outputDataUpdate = function(cmd) {
            var time = msgTime;
            //logger.info('outputDataUpdate - time:%o cmd:%o last:%o', time, cmd, displayedMemory.getDisplayText(true));

            if (time === null) {
                return;
            }

            if (outputFilter) {
                if (cmd) {
                    if (outputFilter.newCommand){
                        outputFilter.newCommand(time, cmd);
                    }
                    return;
                }

                if (outputFilter.updateData) {
                    outputFilter.updateData(time, displayedMemory);
                }

                if (cueStartTime === null && !displayedMemory.isEmpty()) { // Start of a new cue
                    cueStartTime = time;
                } else {
                    if (!displayedMemory.equals(lastOutputScreen)) { 
                        if (outputFilter.newCue) {
                            outputFilter.newCue(time, lastOutputScreen);
                        }
                        cueStartTime = displayedMemory.isEmpty() ? null : time;
                    }
                }
                lastOutputScreen.copy(displayedMemory);
            }
        };

        var cueSplitAtTime = function(t) {
            if (outputFilter) {
                if (!displayedMemory.isEmpty()) {
                    if (outputFilter.newCue) {
                        outputFilter.newCue(cueStartTime, t, displayedMemory);
                    }
                    cueStartTime = t;
                }
            }
        };

        return api;
    };

    window.eventsPlayer.control.caption.Cea608Channel = Cea608Channel;
}(jQuery));;

/*
	Source: build/Cea608Parser.js
*/
/**
     * Parse CEA-608 data and send decoded data to out1 and out2.
     * @constructor
     * @param {Number} field  CEA-608 field (1 or 2)
     * @param {CueHandler} out1 Output from channel1 newCue(startTime, endTime, captionScreen)
     * @param {CueHandler} out2 Output from channel2 newCue(startTime, endTime, captionScreen)
     */
(function($) {
function Cea608Parser(field, out1, out2) {
        var api = {}
        var logger = new eventsCore.util.Logger('Cea608Parser');

        var rowsLowCh1 = eventsPlayer.CaptionConstants.rowsLowCh1;
        var rowsLowCh2 = eventsPlayer.CaptionConstants.rowsLowCh2;
        var rowsHighCh1 = eventsPlayer.CaptionConstants.rowsHighCh1;
        var rowsHighCh2 = eventsPlayer.CaptionConstants.rowsHighCh2;

        var field = field || 1;
        var outputs = [out1, out2];
        var channels = [new eventsPlayer.control.caption.Cea608Channel(1, out1), new eventsPlayer.control.caption.Cea608Channel(2, out2)];
        var currChNr = -1; // Will be 1 or 2
        var lastCmdA = null; // First byte of last command
        var lastCmdB = null; // Second byte of last command
        var bufferedData = [];
        var startTime = null;
        var lastTime = null;
        var dataCounters = {'padding' : 0, 'char' : 0, 'cmd' : 0, 'other' : 0};

        var getHandler = function(index) {
            return channels[index].getHandler();
        };
        
        var setHandler = function(index, newHandler) {
            channels[index].setHandler(newHandler);
        };

        var numArrayToHexArray = function(numArray) {
            var hexArray = [];
            for (var j = 0; j < numArray.length; j++) {
                hexArray.push(numArray[j].toString(16));
            }
            return hexArray;
        };

        //logger.info("constructor - channels:%o", channels);

        /**
         * Add data for time t in forms of list of bytes (unsigned ints). The bytes are treated as pairs.
         */
        api.addData = function(t, byteList) {
            var cmdFound, a, b, 
            charsFound = false;
            
            lastTime = t;
            //logger.info('addData - time:%o bytes:%o', t, byteList);

            for (var i = 0 ; i < byteList.length ; i+=2) {
                // remove the parity bits
                a = byteList[i] & 0x7f;
                b = byteList[i+1] & 0x7f;

                if (a === 0 && b === 0) {
                    dataCounters.padding += 2;
                    continue;
                } 
                else {
                    /*logger.info('addData - byte1:%o byte2:%o hex:%o hex:%o',
                        byteList[i], byteList[i+1],
                        numArrayToHexArray([byteList[i], byteList[i+1]]) ,
                        numArrayToHexArray([a, b]));*/
                }

                cmdFound = parseCmd(t, a, b);
                if (!cmdFound) {
                    cmdFound = parseMidrow(a, b);
                }
                if (!cmdFound) {
                    cmdFound = parsePAC(a, b);
                }
                if (!cmdFound) {
                    cmdFound = parseBackgroundAttributes(a, b);
                }

                if (!cmdFound) {
                    charsFound = parseChars(a, b);

                    //continue;

                    if (charsFound) {
                        if (currChNr && currChNr >=0) {
                            var channel = channels[currChNr-1];
                            channel.insertChars(lastTime, charsFound);
                        } else {
                            logger.warn("No channel found yet. TEXT-MODE?");
                        }
                    }
                }
                if (cmdFound) {
                    dataCounters.cmd += 2;
                } else if (charsFound) {
                    dataCounters.char += 2;
                } else {
                    dataCounters.other += 2;
                    logger.warn("Couldn't parse cleaned data " + numArrayToHexArray([a, b]) +
                                " orig: " + numArrayToHexArray([byteList[i], byteList[i+1]]));
                }
            }
        };

        /**
         * Parse Command.
         * @returns {Boolean} Tells if a command was found
         */
        var parseCmd = function(t, a, b) {
            //logger.info('parseCmd - a:%o b:%o 14:%o 1c:%o 17:%o 1F:%o', a, b, (a === 0x14), (a === 0x1C), (a === 0x17), (a === 0x1F));

            var chNr = null;

            var cond1 = (a === 0x14 || a === 0x1C) && (0x20 <= b && b <= 0x2F);
            var cond2 = (a === 0x17 || a === 0x1F) && (0x21 <= b && b <= 0x23);
            if (!(cond1 || cond2)) {
                return false;
            }
                 
            if (a === lastCmdA && b === lastCmdB) {
                lastCmdA = null;
                lastCmdB = null; // Repeated commands are dropped (once)
                logger.info("Repeated command (" + numArrayToHexArray([a, b]) + ") is dropped");
                return true;
            }

            if (a === 0x14 || a === 0x17) {
                chNr = 1;
            } else {
                chNr = 2; // (a === 0x1C || a=== 0x1f)
            }

            var channel = channels[chNr - 1];
            channel.setTime(t);

            if (a === 0x14 || a === 0x1C) {
                if (b === 0x20) {
                    channel.cc_RCL();
                } else if (b === 0x21) {
                    channel.cc_BS();
                } else if (b === 0x22) {
                    channel.cc_AOF();
                } else if (b === 0x23) {
                    channel.cc_AON();
                } else if (b === 0x24) {
                    channel.cc_DER();
                } else if (b === 0x25) {
                    channel.cc_RU(2);
                } else if (b === 0x26) {
                    channel.cc_RU(3);
                } else if (b === 0x27) {
                    channel.cc_RU(4);
                } else if (b === 0x28) {
                    channel.cc_FON();
                } else if (b === 0x29) {
                    channel.cc_RDC();
                } else if (b === 0x2A) {
                    channel.cc_TR();
                } else if (b === 0x2B) {
                    channel.cc_RTD();
                } else if (b === 0x2C) {
                    channel.cc_EDM();
                } else if (b === 0x2D) {
                    channel.cc_CR(lastTime);
                } else if (b === 0x2E) {
                    channel.cc_ENM();
                } else if (b === 0x2F) {
                    channel.cc_EOC();
                }
            } else { //a == 0x17 || a == 0x1F
                channel.cc_TO(b - 0x20);
            }
            lastCmdA = a;
            lastCmdB = b;
            currChNr = chNr;
            return true;
        };

        /**
         * Parse midrow styling command
         * @returns {Boolean}
         */
        var parseMidrow = function(a, b) {
            var chNr = null;
                
            if ( ((a === 0x11) || (a === 0x19)) && 0x20 <= b && b <= 0x2f) {
                if (a === 0x11) {
                    chNr = 1;
                } else  {
                    chNr = 2;
                }
                if (chNr !== currChNr) {
                    logger.log("ERROR", "Mismatch channel in midrow parsing");
                    return false;
                }
                var channel = channels[chNr-1];
                channel.cc_MIDROW(b);
                logger.info("MIDROW (" + numArrayToHexArray([a, b]) + ")");
                return true;
            }
            return false;
        };

        /**
         * Parse Preable Access Codes (Table 53).
         * @returns {Boolean} Tells if PAC found
         */
        var parsePAC = function(a, b) {

           var chNr = null;
           var row = null;
            
            var case1 = ((0x11 <= a  && a <= 0x17) || (0x19 <= a && a <= 0x1F)) && (0x40 <= b && b <= 0x7F);
            var case2 = (a === 0x10 || a === 0x18) && (0x40 <= b && b <= 0x5F);
            if (! (case1 || case2)) {
                return false;
            }

            if (a === lastCmdA && b === lastCmdB) {
                lastCmdA = null;
                lastCmdB = null;
                return true; // Repeated commands are dropped (once)
            }

            chNr = (a <= 0x17) ? 1 : 2;

            if (0x40 <= b && b <= 0x5F) {
                row = (chNr === 1) ? rowsLowCh1[a] : rowsLowCh2[a];
            } else { // 0x60 <= b <= 0x7F
                row = (chNr === 1) ? rowsHighCh1[a] : rowsHighCh2[a];
            }
            var pacData = interpretPAC(row, b);
            var channel = channels[chNr-1];
            channel.setPAC(pacData);
            lastCmdA = a;
            lastCmdB = b;
            currChNr = chNr;
            return true;
        };

        /**
         * Interpret the second byte of the pac, and return the information.
         * @returns {Object} pacData with style parameters.
         */
        var interpretPAC = function (row, byte) {
            var pacIndex = byte;
            var pacData = {color : null, italics : false, indent : null, underline : false, row : row};
            
            if (byte > 0x5F) {
                pacIndex = byte - 0x60;
            } else {
                pacIndex = byte - 0x40;
            }
            pacData.underline = (pacIndex & 1) === 1;
            if (pacIndex <= 0xd) {
                pacData.color = ['white', 'green', 'blue', 'cyan', 'red', 'yellow', 'magenta', 'white'][Math.floor(pacIndex/2)];
            } else if (pacIndex <= 0xf) {
                pacData.italics = true;
                pacData.color = 'white';
            } else {
                pacData.indent = (Math.floor((pacIndex-0x10)/2))*4;
            }
            return pacData; // Note that row has zero offset. The spec uses 1.
        };

        /**
         * Parse characters.
         * @returns An array with 1 to 2 codes corresponding to chars, if found. null otherwise.
         */
        var parseChars = function(a, b) {

           var  channelNr = null,
                charCodes = null,
                charCode1 = null,
                charCode2 = null;

            if (a >= 0x19) {
                channelNr = 2;
                charCode1 = a - 8;
            } else {
                channelNr = 1;
                charCode1 = a;
            }
            if (0x11 <= charCode1 && charCode1 <= 0x13) {
                // Special character
                var oneCode = b;
                if (charCode1 === 0x11) {
                    oneCode = b + 0x50;
                } else if (charCode1 === 0x12) {
                    oneCode = b + 0x70;
                } else {
                    oneCode = b + 0x90;
                }
                //logger.info("parseChars - Special char '" + getCharForByte(oneCode) + "' in channel " + channelNr);
                charCodes = [oneCode];
            } else if (0x20 <= a && a <= 0x7f) {
                charCodes = (b === 0) ? [a] : [a, b];
            }
            if (charCodes) {
                var hexCodes = numArrayToHexArray(charCodes);
                //logger.info("parseChars - Char codes =  " + hexCodes.join(","));
                lastCmdA = null;
                lastCmdB = null;
            }
            return charCodes;
        };
        
        /**
        * Parse extended background attributes as well as new foreground color black.
        * @returns{Boolean} Tells if background attributes are found
        */
        var parseBackgroundAttributes = function(a, b) {
           var  bkgData,
                index,
                chNr,
                channel;

            var case1 = (a === 0x10 || a === 0x18) && (0x20 <= b && b <= 0x2f);
            var case2 = (a === 0x17 || a === 0x1f) && (0x2d <=b && b <= 0x2f);
            if (!(case1 || case2)) {
                return false;
            }
            bkgData = {};
            if (a  === 0x10 || a === 0x18) {
                index = Math.floor((b-0x20)/2);
                bkgData.background = backgroundColors[index];
                if (b % 2 === 1) {
                    bkgData.background = bkgData.background + "_semi";
                }
            } else if (b === 0x2d) {
                bkgData.background = "transparent";
            } else {
                bkgData.foreground = "black";
                if (b === 0x2f) {
                    bkgData.underline = true;
                }
            }
            chNr = (a < 0x18) ? 1 : 2;
            channel = channels[chNr-1];
            channel.setBkgData(bkgData);
            lastCmdA = null;
            lastCmdB = null;
            return true;
        };

        /**
         * Reset state of parser and its channels.
         */
        api.reset = function() {
            for (var i=0 ; i < channels.length ; i++) {
                if (channels[i]) {
                    channels[i].reset();
                }
            }
            lastCmdA = null;
            lastCmdB = null;
        };

        /**
         * Trigger the generation of a cue, and the start of a new one if displayScreens are not empty.
         */
        var cueSplitAtTime = function(t) {
            for (var i=0 ; i < channels.length ; i++) {
                if (channels[i]) {
                    channels[i].cueSplitAtTime(t);
                }
            }
        };

        return api;
    };

    window.eventsPlayer.control.caption.Cea608Parser = Cea608Parser;
}(jQuery));;

/*
	Source: build/Cea608Row.js
*/
  /**
     * CEA-608 row consisting of NR_COLS instances of StyledUnicodeChar.
     * @constructor
     */

 (function($) {
function Cea608Row(_id) {
        var api = {
            get chars() {
                return chars;
            },
            get id() {
                return id;
            }
        };

        var id = _id;
        var logger = new eventsCore.util.Logger('Cea608Row-' + id);

        var NR_COLS = eventsPlayer.CaptionConstants.NR_COLS;
        var specialCea608CharsCodes = eventsPlayer.CaptionConstants.specialCea608CharsCodes;

        var chars = [];
        
        for (var i = 0 ; i < NR_COLS ; i++) {
            chars.push(new eventsPlayer.control.caption.StyledCharacter());
        }
        var pos = 0;
        var currPenState = new eventsPlayer.control.caption.PenState();
 
        api.getCharForByte = function(byte) {
            var charCode = byte;
            if (specialCea608CharsCodes.hasOwnProperty(byte)) {
                charCode = specialCea608CharsCodes[byte];
            }
            return String.fromCharCode(charCode);
        };
        
        api.equals = function(other) {
            var equal = true;
            for (var i = 0 ; i < NR_COLS; i ++) {
                if (!chars[i].equals(other.chars[i])) {
                    equal = false;
                    break;
                }
            }
            return equal;
        };
        
        api.copy = function(other) {
            for (var i = 0 ; i < NR_COLS; i ++) {
                chars[i].copy(other.chars[i]);
            }
        };
        
        api.isEmpty = function() {
            var empty = true;
            for (var i = 0 ; i < NR_COLS; i ++) {
                if (!chars[i].isEmpty()) {
                    empty = false;
                    break;
                }
            }
            return empty;
        };

        /**
         *  Set the cursor to a valid column.
         */
        api.setCursor = function(absPos) {
            //logger.info('setCursor - pos:%o', absPos);
            if (pos !== absPos) {
                pos = absPos;
            }
            if (pos < 0) {
                logger.info("ERROR", "Negative cursor position " + pos);
                pos = 0;
            } else if (pos > NR_COLS) {
                logger.info("ERROR", "Too large cursor position " + pos);
                pos = NR_COLS;
            }
        };

        /** 
         * Move the cursor relative to current position.
         */
        api.moveCursor = function(relPos) {
            var newPos = pos + relPos;
            if (relPos > 1) {
                for (var i = pos+1; i < newPos+1 ; i++) {
                    chars[i].setPenState(currPenState);
                }
            }
            api.setCursor(newPos);
        };

        /**
         * Backspace, move one step back and clear character.
         */
        api.backSpace = function () {
            api.moveCursor(-1);
            chars[pos].setChar(' ', currPenState);
        };

        api.insertChar = function(byte) {
            if (byte >= 0x90) { //Extended char
                api.backSpace();
            }
            var char = api.getCharForByte(byte);
            //logger.info('insertChar1 - byte:%o char:%o', byte, char);

            if (pos >= NR_COLS) {
                logger.error('insertChar - error inserting ' + byte.toString(16) +  
                            " (" + char + ") at position " + pos + ". Skipping it!");
                return;
            }
            chars[pos].setChar(char, currPenState);
            //logger.info('insertChar - pos:%o byte:%o', pos, chars[pos].uchar);
            api.moveCursor(1);
        };

        api.clearFromPos = function(startPos) {
            var i;
            for (i = startPos ; i < NR_COLS ; i++) {
                chars[i].reset();
            }
        };

        api.clear = function() {
            api.clearFromPos(0);
            pos = 0;
            currPenState.reset();
        };

        api.clearToEndOfRow  = function() {
            api.clearFromPos(pos);
        };

        api.getTextString = function() {
            var _chars = [];
            var empty = true;
            for (var i = 0 ; i < NR_COLS ; i++) {
                //logger.info('getTextString: %o', chars[i]);
                var char = chars[i].uchar;
                if (char !== " ") {
                    empty = false;
                }
                _chars.push(char);
            }
            if (empty) {
                return "";
            } else {
                return _chars.join("");
            }
        };

        api.setPenStyles = function(styles) {
            currPenState.setStyles(styles);
            var currChar = chars[pos];
            currChar.setPenState(currPenState);
        };

        return api;
    };

    window.eventsPlayer.control.caption.Cea608Row = Cea608Row;
}(jQuery));;

/*
	Source: build/Config.js
*/
/**
 * Create a core player object for namespacing
 */
(function($) {
function Config(_configfile, _onLoad) {
        var api = new Object();
        var self = this;
        var logger = new eventsCore.util.Logger('Config');

        var loadInterval = -1;
        var configLoader = eventsCore.Poller('config');
        var configsrc = {};
        var contentSource = ''; 
        var config; 

        var configId = (Math.random() * 100); 
        var cdnGroup = '';
        var retryLimit = 0;

        var onLoad = _onLoad;

        //logger.info('constructor - path:%o configId:%o', _configfile, configId);

        var configLoadHandler = function(data) {
            if (contentSource !== JSON.stringify(data)){
                config = data;
                contentSource = JSON.stringify(data);

                logger.info('configLoadHandler - data:%o', data);

                if (data.general.refresh !== loadInterval) {
                    loadInterval = data.general.refresh;
                    configLoader.add(configsrc, (loadInterval * 1000));
                }

                parseGeneral(data.general);

                if (onLoad !== null && $.isFunction(onLoad)){
                    onLoad.call(this, null);
                }
            }
        };

        var parseGeneral = function(data) {
            var cdns = data.cdns;
            try {
                var set = false;

                for (var i = 0; i < cdns.length; i++) {

                    if (i > 0) {
                        cdns[i].percent = parseInt(cdns[i].percent) + parseInt(cdns[i-1].percent);
                    }
                        
                    
                    if (!set && configId < cdns[i].percent) {
                        cdnGroup = cdns[i].order;
                        retryLimit = cdns[i].retry;
                        set = true;
                    }
                    else if (!set && configId < cdns[i].percent) {
                        cdnGroup = cdns[i].order;
                        retryLimit = cdns[i].retry;
                        set = true;
                    }
                }

                logger.info('parseCdn - id:%o group:%o retry:%o', configId, cdnGroup, retryLimit);
            }
            catch (e) {
                logger.error('parseCdn - %o', e);
            }


        };

        configsrc[_configfile] = configLoadHandler;
        var inte = (loadInterval * 1000);
        logger.info('parseGeneral - inte:%o', inte);
        configLoader.add(configsrc, inte);
        //configLoader.pause();
        //configLoader.resume();

        Object.defineProperty(api, "akamai", {
          get: function() { return config.general.akamai || false }
        });

        Object.defineProperty(api, "players", {
          get: function() { return config.general.players || false }
        });

        Object.defineProperty(api, "defaultVjsOrder", {
          get: function() {return config.general.defaultVjsOrder || false }
        });

        Object.defineProperty(api, "showQos", {
          get: function() {return (eventsCore.util.getUrlParam('qos') === 'true') || false }
        });

        Object.defineProperty(api, "cdnGroup", {
          get: function() {return cdnGroup }
        });

        Object.defineProperty(api, "retryLimit", {
          get: function() {return retryLimit }
        });

        Object.defineProperty(api, "techPaths", {
          get: function() {
                if (config.general.techPaths)
                    return config.general.techPaths
                else
                    return [{"type": "videojs", "uri":"tech/tech_videojs.html"}]
           }
        });

        Object.defineProperty(api, "domPath", {
          get: function() {return config.general.domPath || false }
        });

        Object.defineProperty(api, "uiConfig", {
          get: function() {return config.ui }
        });

        Object.defineProperty(api, "adsConfig", {
          get: function() {return config.ads }
        });

        Object.defineProperty(api, "analyticsConfig", {
          get: function() {return config.analytics }
        });

        Object.defineProperty(api, "socialShare", {
          get: function() {return config.ui.toolbar.social }
        });

        Object.defineProperty(api, "adConfig", {
          get: function() {return config.ads }
        });

        Object.defineProperty(api, "hlsjsConfig", {
          get: function() {return config.general.hlsjsConfig }
        });

        api.on = function(name, handler) {
            switch (name) {
                case 'load':
                    onLoad = handler;
                    break;
                default:
                    break;
            }
        };

        return api;
    }

    //console.log('PlayerManager: par:%o', window.eventsPlayer.player);
   	window.eventsPlayer.control.Config = Config;
}(jQuery));
;

/*
	Source: build/DisplayManager.js
*/
/**
 * Create a core player object for namespacing
 */
(function($) {
function DisplayManager(_state, _version, _controls, _messenger, _config, _toolbar) {
        var api = new Object();
        var self = this;
        var state = _state;
        var logger = new eventsCore.util.Logger('DisplayManager');
        
        var playerControls;
        var captionDisplay;
        var qosDisplay;
        var showQos = _config.showQos;
        var uiConfig = _config.uiConfig;
        var toolbar = _toolbar;

        //show the initially hidden wrapper
        $(state.wrapper).show();

        qosDisplay = new eventsPlayer.view.QosDisplay(state, _version, showQos);
        captionDisplay = new eventsPlayer.view.CaptionDisplay(state);

        if (_controls) {
            playerControls = new eventsPlayer.view.PlayerControls(state, _controls, _messenger, _config, _toolbar, captionDisplay);
        }

        //logger.info('constructor - ui:%o showQos:%o', uiConfig, showQos);

        $(state.container).on('player:PlayerReadyEvent',  function( event, data ) {
            playerReady(data.tech);
        });

        $(state.container).on('player:TimeUpdateEvent',  function( event, data ) {
            if (qosDisplay) qosDisplay.update(data.qos);
        });

        $(state.container).on('player:VideoTypeUpdate',  function( event, data ) {
            if (qosDisplay) 
                qosDisplay.setStreamType(data.type);
        });

        $(state.container).on('player:CaptionEvent',  function( event, data ) {
            if (captionDisplay)
                captionDisplay.add608(data.time, data.data);
        });

        var setupDisplayElements = function() {
            //logger.info('setupDisplayElements - ui:%o ctrl:%o', uiConfig, playerControls);
            if (playerControls) {
                //logger.info('setupDisplayElements - ui:%o tb:%o', uiConfig, toolbar);

                if (toolbar === 'default') {
                    playerControls.enable(false);
                }

                if (uiConfig.giantPlayButton) {
                    
                }
            }
            else {
                playerControls.enable(false);
            }
        };

        var playerReady = function(tech) {
            if (qosDisplay) qosDisplay.setTech(tech);
        };

        var registerKeyHandler = function() {
            $(_state.wrapper).keydown(function(e) {
                //logger.info('keyHandler - e:%o', e);
                if (e.target.className == 'videoControlsTouch') {
                    if (e.key === ' '){
                        playerControls.keyEntry(e);
                    }
                    qosDisplay.keyEntry(e);
                    e.preventDefault();
                    return false;
                }
            });
        };

        api.videoLoad = function(data) {
            logger.info('videoLoad - data:%o captions:%o', data, data.captions);
            if (playerControls) 
                playerControls.setStreamInfo(data);
            if (qosDisplay) 
                qosDisplay.setStreamType(data.streamType);
            if (captionDisplay) {
                captionDisplay.activate(data.captions == 'custom');
            }
        };

        api.reset = function(_state) {
            if (_state) {
                state = _state;
            }
            //logger.info('reset - %o', $('.overlayQos'));
            if (qosDisplay) qosDisplay.reset();

            playerControls.reset();
        };

        api.close = function() {
            playerControls.resetToolbar();
        };

        api.seek = function(time) {
            playerControls.seekTime(time);
        };

        api.pause = function(measure) {
            playerControls.pause(measure);
        };

        api.resume = function(measure) {
            playerControls.resume(measure);
        };

        api.mute = function(muted) {
            playerControls.mute(muted);
        };

        api.buttonClick = function(button) {
            playerControls.buttonClick(button);
        };

        registerKeyHandler();
        setupDisplayElements();
        return api;
    }

    //console.log('PlayerManager: par:%o', window.eventsPlayer.player);
   	window.eventsPlayer.control.DisplayManager = DisplayManager;
}(jQuery));

;

/*
	Source: build/Environment.js
*/
/**
 * Create a static class with Environment values
 */
var Environment = (function($) {
var api = new Object();
    var self = this;
    var logger = new eventsCore.util.Logger('Environment');

    //ipad - iPad device
    //silk - Kindle Fire device
    //android - Android device
    //touch - Surface device

    var d_ua = navigator.userAgent.toLowerCase(); //get device user agent - all lower case
    var isiPad = navigator.userAgent.match(/iPad/i) != null;
    var isiPhone = navigator.userAgent.match(/iPhone/i) != null;
    var isAndroid = navigator.userAgent.match(/android/i) != null;

    var isChrome = navigator.userAgent.indexOf('Chrome') > -1;
    var isExplorer = navigator.userAgent.indexOf('MSIE') > -1;
    var isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
    var isSafari;
    var isSafari9;
    var isOpera = navigator.userAgent.toLowerCase().indexOf("op") > -1;

    var isWindows7 = navigator.userAgent.indexOf('Windows NT 6.1') > 0;



    var sizes = {
        0: 'global',
        1: 'tablet',
        2: 'desktop'
    };

    if ((isChrome) && (isSafari)) { isSafari = false; }
    if ((isChrome) && (isOpera)) { isChrome = false; }

    var ua = navigator.userAgent.toLowerCase();
    if (ua.match('safari') && !ua.match('chrome') && ua.match('mac')) {
        match = ua.match(/version\/([\d.]*)/);
        if (match !== null && match[1] !== '') {
            ver = parseFloat(match[1]);
            if (ver >= 10) {
                isSafari = true;
            }
            else {
                isSafari9 = true;
            }
            logger.info('getSafariVersion - %o', ver);
        }
    }

    var getIEVersion = function() {
        var sAgent = window.navigator.userAgent;
        var Idx = sAgent.indexOf("MSIE");

        // If IE, return version number.
        if (Idx > 0)
            return parseInt(sAgent.substring(Idx + 5, sAgent.indexOf(".", Idx)));

        // If IE 11 then look for Updated user agent string.
        else if (!!navigator.userAgent.match(/Trident\/7\./))
            return 11;

        else
            return 0; //It is not IE
    }

    api.getBrowser = function() {
        if (isChrome)
            return 'chrome'
        else if (getIEVersion() > 0)
            return 'explorer' + getIEVersion();
        else if (isFirefox)
            return 'firefox'
        else if (isSafari9)
            return 'safari9'
        else if (isSafari)
            return 'safari'
        else if (isOpera)
            return 'opera'
        else
            return 'unknown'
    };

    api.isSafari = function() {
        return isSafari;
    };

    api.isiPhone = function() {
        return isiPhone;
    };

    api.isAndroid = function() {
        return isAndroid;
    };

    api.isMobileDevice = function() {
        if (d_ua.match(/iphone/i) ||
            d_ua.match(/ipad/i) ||
            d_ua.match(/android/i) ||
            d_ua.match(/silk/i) ||
            d_ua.match(/touch/i)) {
            return true;
        } else {
            return false;
        }
    };

    api.isTabletDevice = function() {
        if (d_ua.match(/ipad/i) ||
            d_ua.match(/silk/i) ||
            d_ua.match(/android/i) ||
            d_ua.match(/touch/i)) {
            return true;
        } else {
            return false
        }
    };

    api.screenType = function(_windowSize) {
        var screenType = 'PC';
        var windowSize = sizes[_windowSize] || 'unknown';

        if (api.isMobileDevice()) {
            if (windowSize !== 'global' || isiPad) {
                screenType = 'Tablet';
            } else {
                screenType = 'Phone';
            }
        }
        return screenType;
    };

    api.getDeviceType = function() {
        if (api.isMobileDevice()) {
            return 'mobile';
        } else {
            return 'pc';
        }
    };

    api.getPlatform = function() {
        if (isiPhone)
            return 'iphone';
        else if (isiPad)
            return 'ipad';
        else if (isAndroid)
            return 'android';
        else if (isWindows7)
            return 'windows7';
        else
            return 'default';
    };

    api.getPageUrl = function() {
        return document.location.href;
    };

    return api;

}(jQuery));
;

/*
	Source: build/FrameMessenger.js
*/
/**
 * Create a core player object for namespacing
 */
(function($) {
function FrameMessenger(_state) {
        var api = new Object();
        var self = this;
        var state = _state;
        var iframeId = 'playertech_' + state.namespace;
        var iFrameElem;
        var localport = (document.location.port !== '80') ? ':' + document.location.port : '';
    	var origin = location.protocol + '//' + document.domain + localport;

        var logger = new eventsCore.util.Logger('FrameMessenger');

        if (state.path) {
        	origin = state.path;
        }

        //logger.info('constructor - iframeId:%o iframeElem:%o', iframeId, iFrameElem);

        var receiveMessage = function(event) {
        	var eventData = event.data;

        	//logger.info('receiveMessage event:%o type:%o from:%o ns:%o', event, eventData.type, event.origin, state.namespace);

			if (eventData.type.indexOf(state.namespace) == 0) {
			   	var type = eventData.type.substring(eventData.type.indexOf(':') + 1);
			   	//logger.info('receiveMessage event:%o type:%o from:%o ns:%o', event, eventData.type, event.origin, state.namespace);

			    if (type === 'PlayerReadyEvent') {
			    	//logger.info('receiveMessage - call tech ready: %o', eventData.tech);
					sendEvent(type, eventData);
				}
				else {
					sendEvent(type, eventData);
				}

				event = null;
			}
		};
		
		var sendEvent = function(_type, _data) {
			var type = 'player:' + _type;
			$(state.container).trigger(type, [_data]);
		};

		var sendMessage = function(name, data) {
			logger.info('sendMessage - iframeid:%o name:%o', iframeId, name);

			if ($(iFrameElem)[0].contentWindow) {
				$(iFrameElem)[0].contentWindow.postMessage({name:name, data:data}, origin);
			}
			else {
				logger.error('sendMessage - no iFrameElem contentWindow: %o', $(iFrameElem)[0]);
			}
		};
		
		var addListeners = function() {
			window.addEventListener("message", receiveMessage);
		};

		var onFrameUnload = function() {
			logger.error('onFrameUnload - iframe: %o', iFrameElem);
		};

		api.sendMessage = function(name, msg) {
			sendMessage(name, msg);
		};

		api.sendEvent = function(event) {
			receiveMessage({data:event});
		};

		api.reset = function(_state) {
			if (_state)
				state = _state;
			iFrameElem = $('#' + state.namespace).find('#playertech') || $('#' + state.namespace).find('#' + iframeId);
			logger.info('reset - ns:%o iframeid:%o iframe:%o', state.namespace, iframeId, iFrameElem);

 			iFrameElem.id = iframeId;

 			if ($(iFrameElem)[0]) {
 				$(iFrameElem)[0].onunload = onFrameUnload;
 			}
		};

		addListeners();
        return api;
    }

   	window.eventsPlayer.control.FrameMessenger = FrameMessenger;
}(jQuery));

;

/*
	Source: build/FullscreenManager.js
*/
/**
 * Create a core player object for namespacing
 */
(function($) {
function FullscreenManager(_video, _state) {
        var api = new Object();
        var self = this;
        var video = _video;
        var state = _state;
        var isFullscreen = false;

        var onFullscreenOn = null;
        var onFullscreenOff = null;

        var fullscreenEnabled = !!(
            document.fullscreenEnabled || 
            document.mozFullScreenEnabled || 
            document.msFullscreenEnabled || 
            document.webkitSupportsFullscreen || 
            document.webkitFullscreenEnabled ||
            document.createElement('video').webkitRequestFullScreen
        );

        var logger = new eventsCore.util.Logger('FullscreenManager');
        logger.info('constructor - video:%o enabled:%o', video, fullscreenEnabled);   

        var init = function() {
            var elem;
            if (state)
                elem = $(state.wrapper);
            else if (video)
                elem = $(video);
            //logger.info('init - state:%o video:%o elem:%o', state, video, elem); 
        };

        /**
         * trigger callback in VideoControls
         *  - changes settings in VideoControls
         */
        var sendFullscreenOnCallback = function() {
            logger.info('sendFullscreenOnCallback - cb:%o', $.isFunction(onFullscreenOn));   
            if (onFullscreenOn !== null && $.isFunction(onFullscreenOn)){
                onFullscreenOn.call(this, null);
            }
        };

        /**
         * trigger callback in VideoControls
         *  - changes settings in VideoControls
         */
        var sendFullscreenOffCallback = function() {
            logger.info('sendFullscreenOffCallback - cb:%o', $.isFunction(onFullscreenOff));   
            if (onFullscreenOff !== null && $.isFunction(onFullscreenOff)){
                onFullscreenOff.call(this, true);
            }
        };

        api.fullScreenOn = function(wrapper) {
            var elem = wrapper;
            //logger.info('fullScreenOn - wrap:%o', elem);
            
            // listen to current document when fullscreen turned on from toggle button
            //  - ie11 requires listening to document vs element
            $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange', function(e){
                logger.info('onFullscreenChange - isFs:%o', api.isFullscreen());   
                if (api.isFullscreen()) {
                    sendFullscreenOnCallback();
                }
                else {
                    $(document).off('webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange');
                    sendFullscreenOffCallback();
                }
            });

            if (elem.requestFullscreen) {
                elem.requestFullscreen();
                return true;
            } 
            else if (elem.mozRequestFullScreen){
                elem.mozRequestFullScreen();
                return true;
            }
            else if (elem.webkitRequestFullScreen) {
                elem.webkitRequestFullScreen();
                return true;
            }
            else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
                return true;
            }

            return false;
        };

        api.fullScreenOff = function(elem) {
            logger.info('fullScreenOff - elem:%o', elem);

            if (document.exitFullscreen) {
                document.exitFullscreen();
                return true;
            } 
            else if (document.mozCancelFullScreen){
                document.mozCancelFullScreen();
                return true;
            }
            else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
                return true;
            }
            else if (document.msExitFullscreen) {
                document.msExitFullscreen();
                return true;
            }

            return false;

            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
            else if (document.webkitCancelFullScreen) document.webkitCancelFullScreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
        };

        api.isFullscreenEnabled = function() {
            return fullscreenEnabled;
        };

        api.isFullscreen = function() {
            return !!(document.fullScreen || document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement || document.fullscreenElement);
        };

        api.on = function(name, handler) {
            switch (name) {
                case 'fullscreenOn':
                    onFullscreenOn = handler;
                    break;
                case 'fullscreenOff':
                    onFullscreenOff = handler;
                    break;
                default:
                    break;
            }
        };

        init();
        return api;
    }


    //console.log('PlayerManager: par:%o', window.eventsPlayer.player);
   	window.eventsPlayer.utils.FullscreenManager = FullscreenManager;
}(jQuery));
;

/*
	Source: build/Ima.js
*/
/**
 * Create a core player object for namespacing
 */
(function($) {
function Ima(_config) {
        var api = new Object();
        var self = this;
        var logger = new eventsCore.util.Logger('Ima');
        var constants = window.eventsPlayer.PlayerConstants;

        var config = _config;
        var labelText;
        var ads;
        var player;
        var playerId;
        var events = [
            google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
            google.ima.AdEvent.Type.CLICK,
            google.ima.AdEvent.Type.COMPLETE,
            google.ima.AdEvent.Type.FIRST_QUARTILE,
            google.ima.AdEvent.Type.LOADED,
            google.ima.AdEvent.Type.MIDPOINT,
            google.ima.AdEvent.Type.PAUSED,
            google.ima.AdEvent.Type.STARTED,
            google.ima.AdEvent.Type.THIRD_QUARTILE
          ];

        var playingAd = false;
        var position;
        var playPosition;
        var onAdStart;
        var onAdEnd;

        var imaContainer;

        var init = function() {
            if (config && config.label) {
                labelText = config.label;
            }
            else {
                labelText = " Advertisement";
            }
        };

        var bind = function(thisObj, fn) {
            return function() {
                fn.apply(thisObj, arguments);
            };
        };

        var getAdTag = function(_type, _pos) {
            logger.info('getAdTag - ads:%o', ads);

            var tag = null;
            _.each(ads, function(elem){
                if (elem.type === _type && elem.position === _pos) {
                    //logger.info('getAdTag - type:%o pos:%o tag:%o', elem.type, elem.position, elem.tag);
                    tag = elem.tag;
                }
                else if (elem.type === _type && _pos == null) {
                    tag = elem.tag;
                }
            });
            return tag;
        };

        var adsManagerLoadedCallback = function() {
            imaContainer = $("#ima-ad-container");
            //logger.info('adsManagerLoadedCallback - container:%o', imaContainer);
            //logger.info('adsManagerLoadedCallback - uielem:%o', player.ima.getUiElements());
            $(imaContainer).addClass('constrain_iOS_iFrame');

            for (var index = 0; index < events.length; index++) {
                player.ima.addEventListener(
                    events[index],
                    bind(this, onAdEvent));
            }
            //logger.info('adsManagerLoadedCallback');
            player.ima.start();
        };

        var onAdEvent = function(event) {
            logger.info('onAdEvent - type:%o ev:%o', event.type, event);

            switch(event.type) {
                case 'loaded':
                    break;
                case 'start':
                    onAdStartHandler();
                    break;
                case 'firstquartile': 
                    break;
                case 'midpoint': 
                    break;
                case 'thirdquartile': 
                    break;
                case 'complete': 
                    logger.info('complete');
                    break;
                case 'allAdsCompleted':
                    logger.info('allAdsCompleted (per pod)');
                    onAdEndHandler();
                    break;
                default:
                    break;
            };
        };

        var onAdStartHandler = function() {
            $(imaContainer).addClass('constrain_iOS_iFrame');

            playingAd = true;

            if (onAdStart !== null && $.isFunction(onAdStart)){
                try{ 
                    onAdStart.call(this, position);
                }
                catch(e){
                    logger.error('ima:onAdStart - :%o', e);  
                }
            }
        };

        var onAdEndHandler = function() {
            //var adsMan = player.ima.getAdsManager();
            logger.info('onAdEndHandler - adEnd:%o playPos:%o', onAdEnd, position);

            playingAd = false;

            //if has vmap and all ads completed
            if (api.hasAd('vmap', null) && playPosition === constants.postroll)
                position = constants.postroll;

            if (position === constants.postroll)
                ads = null;

            if (onAdEnd !== null && $.isFunction(onAdEnd)){
                try{ 
                    onAdEnd.call(this, position);
                }
                catch(e){
                    logger.error('ima:onAdEnd - :%o', e);  
                }
            }
            position = null;
        };

        var onEnded = function(data) {
            //logger.info('onEnded - data:%o', data);
        };

        var onAdsError = function(data) {
            logger.info('onAdsError - data:%o', data);
            onAdEndHandler();
        };

        var initAds = function(_player, _playerId, _ads) {
            $(imaContainer).addClass('constrain_iOS_iFrame');

            ads = _ads;

            player = _player;
            playerId = _playerId;

            player.on('ended', onEnded);
            player.on('adserror', onAdsError);
            
            var options = {
                id: playerId,
                adTagUrl: null,
                requestMode: 'ondemand',
                adLabel: labelText,
                adsRenderingSettings: {
                   //adsRenderingSettings.uiElements = [google.ima.UiElements.COUNTDOWN, google.ima.UiElements.AD_ATTRIBUTION]
                    uiElements: []
                }
                //,contribAdsSettings: {
                 //   timeout: 1000
                //}
                //,"adLabel": 'test ad'
            };

            logger.info('initAds - options:%o', options);
            logger.info('initAds - pos:%o player:%o handler:%o ads:%o options:%o', position, player, onEnded, ads, options);

            player.ima(
                options,
                bind(this, adsManagerLoadedCallback)
            );
            //logger.info('initAds - initAdDisplayContainer');
            player.ima.initializeAdDisplayContainer();
        };

        api.play = function(_type, _position, _player, _playerId, _ads, _src) {
            initAds(_player, _playerId, _ads);

            var adTag = getAdTag(_type, _position);
            logger.info('play - type:%o pos:%o src:%o tag:%o', _type, _position, _src, adTag);
            position = _position;

            player.ima.setContent(_src, adTag, true);
            //player.ima.updateAdTag(adTag, position);

            player.ima.requestAds();
            player.play();
            return;

            if (position === constants.postroll)
                player.ima.start();
        };

        api.setAds = function(_ads) {
            ads = _ads;
        };

        api.pause = function() {
            player.ima.pauseAd();
        };

        api.hasAd = function(_type, _position) {
            if (getAdTag(_type, _position))
                return true;
            else
                return false;
        };

        api.setPosition = function(_position) {
            playPosition = _position;
        };

        api.getPosition = function() {
            return position;
        };

        api.isPlayingAd = function() {
            return playingAd;
        };

        api.on = function(name, handler) {
            switch (name) {
                case 'AdStart':
                    onAdStart = handler;
                    break;
                case 'AdEnd':
                    onAdEnd = handler;
                    break;
                default:
                    break;
            }
        };

        init();
        return api;
    }

    //console.log('PlayerManager: par:%o', window.eventsPlayer.player);
    window.eventsPlayer.ads.Ima = Ima;
}(jQuery));
;

/*
	Source: build/Main.js
*/
/**
 * Create a core player object for namespacing
 */
(function($) {
function Main(_version, _configFile, _container, _path) {
        var api = new Object();
        var self = this;

        var state;
        var logger = new eventsCore.util.Logger('Main');
        var constants = window.eventsPlayer.PlayerConstants;
        var initialized = false;
        var ready = false;
        var isPlaying = false;
        var playObjCache;

        var controls;
        var iframe;
        var container = _container;
        var playerWrapper;
        var platform = '';
        var browser = '';
        var config;
        var messenger;
        var displayManager;
        var playerManager;
        var analyticsOmniture;
        var analyticsConviva;
        var playData;

        var onCompleteEvent;
        var onStartEvent;
        var onPlayEvent;
        var onPauseEvent;
        var onTimeUpdateEvent;
        var onMeasureEvent;
        var onTrackLoaded;
        var onCueChange;
        var onClickEvent;
        var onPanelEvent;
        var onControlsEvent;
        var onFullscreenEvent;
        var onVideoModeEvent;
        var onErrorEvent;

        $(container).on( "player:PlayerReadyEvent",  function( event, data ) {
            data.id = $(container).selector;
            ready = true;
            //logger.info('player:PlayerReadyEvent - po:%o', playObjCache);  
            if (playObjCache) {
                api.load(playObjCache);
                //playObjCache = null;
            };
        });

        $(container).on( "player:CompleteEvent",  function( event, _data ) {
            var data = {
                id: $(container).selector
            };

            if (!data.postroll && onCompleteEvent !== null && $.isFunction(onCompleteEvent)){
                try{ 
                    isPlaying = false;
                    onCompleteEvent.call(this, data);
                }
                catch(e){
                    logger.error('player:CompleteEvent - :%o', event);  
                }
            }
        });

        $(container).on( "player:PauseEvent",  function( event, data ) {
            data.id = $(container).selector;
            if (onPauseEvent !== null && $.isFunction(onPauseEvent)){
                try{ 
                    isPlaying = !data.paused;
                    onPauseEvent.call(this, data);
                }
                catch(e){
                    //logger.error('player:PauseEvent - ev:%o error:%o', event, e);  
                }
            }
        });

        $(container).on('player:TimeUpdateEvent',  function( event, data ) {
            data.id = $(container).selector;
            if (onTimeUpdateEvent !== null && $.isFunction(onTimeUpdateEvent)){
                try{ 
                    onTimeUpdateEvent.call(this, data);
                }
                catch(e){
                    //logger.error('player:TimeUpdateEvent - :%o', e);  
                }
            }
        });

        //send play event
        // occurs when video starts or resume from pause/seek
        $(container).on( "player:PlayEvent",  function( event, _data ) {
            var data = {
                id: $(container).selector
            };

            if (onPlayEvent !== null && $.isFunction(onPlayEvent)){
                try{    
                    isPlaying = true;
                    onPlayEvent.call(this, data);
                }
                catch(e){
                    logger.error('player:PlayEvent - :%o', e);  
                }
            }
        });

        //send start event on metadata
        // so only receive once?
        $(container).on( "player:MetadataEvent",  function( event, _data ) {
            var data = {
                id: $(container).selector
            };

            if (onStartEvent !== null && $.isFunction(onStartEvent)){
                try{    
                    onStartEvent.call(this, data);
                }
                catch(e){
                    logger.error('player:MetadataEvent - :%o', e);  
                }
            }
        });

        $(container).on('player:VideoModeUpdate',  function( event, data ) {
            data.id = $(container).selector;

            if (onVideoModeEvent !== null && $.isFunction(onVideoModeEvent)){
                try{    
                    onVideoModeEvent.call(this, data);
                }
                catch(e){
                    logger.error('player:onVideoModeEvent - :%o', e);  
                }
            }
        });

        $(container).on( "player:SendMeasureEvent",  function( event, data ) {
            data.id = $(container).selector;
            if (onMeasureEvent !== null && $.isFunction(onMeasureEvent)){
                try{ 
                    onMeasureEvent.call(this, data);
                }
                catch(e){
                    logger.error('player:SendMeasureEvent - :%o', e);  
                }
            }
        });

        $(container).on( "player:TrackLoadedEvent",  function( event, data ) {
            data.id = $(container).selector;
            if (onTrackLoaded !== null && $.isFunction(onTrackLoaded)){
                try{ 
                    onTrackLoaded.call(this, data);
                }
                catch(e){
                    logger.error('player:TrackLoadedEvent - :%o', e);  
                }
            }
        });

        $(container).on( "player:CueChangeEvent",  function( event, data ) {
            data.id = $(container).selector;
            if (onCueChange !== null && $.isFunction(onCueChange)){
                try{ 
                    onCueChange.call(this, data);
                }
                catch(e){
                    logger.error('player:CueChangeEvent - :%o', e);  
                }
            }
        });

        //controsl visibility events
        $(container).on( "player:ShowControlsEvent",  function( event, data ) {
            data.id = $(container).selector;

            if (onControlsEvent !== null && $.isFunction(onControlsEvent)){
                try{    
                    onControlsEvent.call(this, data);
                }
                catch(e){
                    logger.error('player:ShowControlsEvent - :%o', e);  
                }
            }
        });

        $(container).on( "player:PanelEvent",  function( event, data ) {
            data.id = $(container).selector;
            //logger.info('player:PanelEvent - data:%o', data);  
            if (onPanelEvent !== null && $.isFunction(onPanelEvent)){
                try{ 
                    onPanelEvent.call(this, data);
                }
                catch(e){
                    logger.error('player:PanelEvent - :%o', e);  
                }
            }
        });

        $(container).on( "player:ClickEvent",  function( event, data ) {
            data.id = $(container).selector;
            //logger.info('player:PanelEvent - data:%o', data);  
            if (onClickEvent !== null && $.isFunction(onClickEvent)){
                try{ 
                    onClickEvent.call(this, data);
                }
                catch(e){
                    logger.error('player:ClickEvent - :%o', e);  
                }
            }
        });

        $(container).on( "player:FullscreenEvent",  function( event, data ) {
            data.id = $(container).selector;
            //logger.info('player:PanelEvent - data:%o', data);  
            if (onFullscreenEvent !== null && $.isFunction(onFullscreenEvent)){
                try{ 
                    onFullscreenEvent.call(this, data);
                }
                catch(e){
                    logger.error('player:FullscreenEvent - :%o', e);  
                }
            }
        });

         $(container).on( "player:ErrorEvent",  function( event, data ) {
            data.id = $(container).selector;

            if (onErrorEvent !== null && $.isFunction(onErrorEvent)){
                try{ 
                    onErrorEvent.call(this, data);
                }
                catch(e){
                    logger.error('player:ErrorEvent - :%o', e);  
                }
            }
        });
        
        

        var init = function() {
            //if ipad, force custom controls off
            //    and hide initial spinner

            platform = Environment.getPlatform();
            browser = Environment.getBrowser();

            if (platform == 'iphone' || platform == 'android') {
                $(container).addClass('mobile');
            }
            else {
                $(container).addClass('desktop');
            }

            playerWrapper = $(container).find('.playerwrapper')[0];
            controls = $(container).find('.videoControls')[0];
            iframe = $(container).find('#playertech')[0];

            logger.info('init - iframe:%o controls:%o platform:%o container:%o wrapper:%o', iframe, controls, platform, $(container).attr('id'), playerWrapper);   

            // if not showing custom controls, turn on default controls
            var toolbar = 'custom';
            if (typeof config.uiConfig.toolbar.show[platform] != "undefined") {
                toolbar = config.uiConfig.toolbar.show[platform];
            }
            

            state = new eventsPlayer.control.State();
            state.namespace = $(container).attr('id');
            state.container = container;
            state.wrapper = playerWrapper;
            state.path = _path;

            logger.info('init - toolbar:%o state:%o', toolbar, state);  

            playData = new eventsPlayer.control.PlayData();
            messenger = new eventsPlayer.control.FrameMessenger(state);
            displayManager = new eventsPlayer.control.DisplayManager(state, _version, controls, messenger, config, toolbar);
            playerManager = new eventsPlayer.control.PlayerManager(state, iframe, messenger, config, toolbar);
            analyticsManager = new eventsPlayer.control.AnalyticsManager(state, config.analyticsConfig, messenger);
            
             messenger.reset();
        };

        var writeDom = function() {
            //logger.info('writeDom - string:%o', Strings.getWrapper());  
            var rb = [];

            for (var key in config.uiConfig.toolbar.buttons) {
                if (config.uiConfig.toolbar.buttons[key].display && config.uiConfig.toolbar.buttons[key].position == 'right') {
                    rb.splice(config.uiConfig.toolbar.buttons[key].order, 0, Strings.getButton(key));
                }
            }
            //logger.info('writeDom - buttons:%o', rb);  

            $(container).html(Strings.getWrapper());
            $(container).find('#rightSideButtons').html(rb.join(''));
            onReady();
        };

        var onReady = function() {
            if (!initialized) {
                initialized = true;
                init();

                if (playObjCache) {
                    api.load(playObjCache);
                    //playObjCache = null;
                }
            }
        };

        api.load = function(playObj){
            logger.info('load - init:%o ready:%o playObj:%o autoPlay:%o', initialized, ready, playObj, playObj.hasOwnProperty('autoPlay'));  
 
            if (initialized && ready) {
                playObj = playData.addMetadata(config, playObj, platform, browser);
                //for testing
                //playObj.autoPlay = false;

                //if captions not set from load call use config value
                if (!playObj.captions) {
                    var cPlatform = platform;
                    var cBrowser = browser;

                    if (typeof config.players[cPlatform] == "undefined") {
                        cPlatform = 'default';
                    }
                    if (typeof config.players[cPlatform][cBrowser] == "undefined") {
                        cBrowser = 'default';
                    }
                    logger.info('load - config:%o plat:%o browser:%o', config.players, cPlatform, cBrowser);
                    playObj.captions = config.players[cPlatform][cBrowser]['captions'];
                }


                //base on platform, not track setting
                /*
                if (playObj.tracks) {
                      for (var i = 0; i < playObj.tracks.length; i++) {
                        if (playObj.tracks[i].display) {
                            playObj.captions = playObj.tracks[i].display;
                        }
                    }
                }
                */

                if (playObj.adConfig.platform[platform] === "disable") {
                    playObj.ads = null;
                }

                //set playback rates
                if (config.uiConfig.playbackRates) {
                    playObj.playbackRates = config.uiConfig.playbackRates;
                }

                logger.info('load - auto:%o platform:%o ads:%o adc:%o captions:%o', playObj.autoPlay, platform, playObj.ads, playObj.adConfig.platform[platform], playObj.captions);  

                playObjCache = null;
                playerManager.stop();
                displayManager.reset();
                playerManager.load(playObj, config.cdnGroup, config.retryLimit);
                displayManager.videoLoad(playObj);

            }
            else {
                playObjCache = playObj;
            }
        };

        //used to restart loaded video, or without controls
        api.play = function() {
            playerManager.play();
        };

        api.stop = function() {
            playerManager.stop();
            displayManager.reset();
        };

        api.seek = function(time) {
            displayManager.seek(time);
        };

        api.pause = function(measure) {
            displayManager.pause(measure);
        };

        api.resume = function(measure) {
            displayManager.resume(measure);
        };

        api.mute = function(muted) {
            displayManager.mute(muted);
        };

        api.close = function() {
            api.stop();
            displayManager.close();
        };

        api.sendMessage = function(name, message){
            
        };

        api.updateTextTrack = function(obj){
            playerManager.updateTextTrack(obj);
        };

        api.move = function(newWrapper){
            var det = $(playerWrapper).detach();
            //logger.info('move - wrapper:%o det:%o', newWrapper, det);

            //$(newWrapper).empty();
            $(newWrapper).append(det);

            container = newWrapper;
            state.namespace = $(container).attr('id');
            messenger.reset(state);
            playerManager.reset(state);
            displayManager.reset(state);
        };

        api.isPlaying = function() {
            return isPlaying;
        };

        api.buttonClick = function(button) {
            displayManager.buttonClick(button);
        };

        api.recordEvent = function(service, name, data) {
            //logger.info('recordEvent service:%o name:%o data:%o', service, name, data);

            messenger.sendMessage('recordEvent', {'service': service, 'name':name, 'data':data});
        };

        api.on = function(name, handler) {
            switch (name) {
                case 'CompleteEvent':
                    onCompleteEvent = handler;
                    break;
                case 'StartEvent':
                    onStartEvent = handler;
                    break;
                case 'PlayEvent':
                    onPlayEvent = handler;
                    break;
                case 'PauseEvent':
                    onPauseEvent = handler;
                    break;
                case 'MeasureEvent':
                    onMeasureEvent = handler;
                    break;
                case 'TrackLoadedEvent':
                    onTrackLoaded = handler;
                    break;
                case 'CueChangeEvent':
                    onCueChange = handler;
                    break;
                case 'TimeUpdateEvent':
                    onTimeUpdateEvent = handler;
                    break;
                case 'ControlsEvent':
                    onControlsEvent = handler;
                    break;
                case 'PanelEvent':
                    onPanelEvent = handler;
                    break;
                case 'ClickEvent':
                    onClickEvent = handler;
                    break;
                case 'VideoModeEvent':
                    onVideoModeEvent = handler;
                    break;
                case 'FullscreenEvent':
                    onFullscreenEvent = handler;
                    break;
                case 'ErrorEvent':
                    onErrorEvent = handler;
                    break;
                default:
                    break;
            }
        };

        api.removeHandlers = function() {
            onCompleteEvent = null;
            onStartEvent = null;
            onPlayEvent = null;
            onPauseEvent = null;
            onMeasureEvent = null;
            onTrackLoaded = null;
            onCueChange = null;
            onTimeUpdateEvent = null;
            onControlsEvent = null;
            onPanelEvent = null;
            onClickEvent = null;
            onVideoModeEvent = null;
            onFullscreenEvent = null;
            onErrorEvent = null;
        };

        config = new eventsPlayer.control.Config(_configFile, writeDom);
        return api;
    }

   window.eventsPlayer.Main = Main;

}(jQuery));

;

/*
	Source: build/PenState.js
*/
/**
     * State of CEA-608 pen or character
     * @constructor
     */

 (function($) {
function PenState(foreground, underline, italics, background, flash) {
        var api = {};
        
        var foreground = foreground || "white";
        var underline = underline || false;
        var italics = italics || false;
        var background = background || "black";
        var flash = flash || false;
        
        api.reset = function() {
            foreground = "white";
            underline = false;
            italics = false;
            background = "black";
            flash = false;
        };
        
        api.setStyles = function(styles) {
            var attribs = ["foreground", "underline", "italics", "background", "flash"];
            for (var i = 0 ; i < attribs.length; i++) {
                var style = attribs[i];
                if (styles.hasOwnProperty(style)) {
                    this[style] = styles[style];
                }
            }
        };
        
        api.isDefault = function() {
            return (foreground === "white" && !underline && !italics && 
                    background === "black" && !flash);
        };

        api.equals = function(other) {
            return ( (foreground === other.foreground) && 
                     (underline === other.underline) &&
                     (italics === other.italics) &&
                     (background === other.background) &&
                     (flash === other.flash) );
        };

        api.copy = function(newPenState) {
            foreground = newPenState.foreground;
            underline = newPenState.underline;
            italics = newPenState.italics;
            background = newPenState.background;
            flash = newPenState.flash;
        };
        
        api.toString = function() {
            return ("color=" + foreground + ", underline=" + underline + ", italics=" + italics +
                ", background=" + background + ", flash=" + flash);
        };

        return api;
    };

    window.eventsPlayer.control.caption.PenState = PenState;
}(jQuery));;

/*
	Source: build/PlayData.js
*/
/**
 * Create a core player object for namespacing
 */
(function($) {
function PlayData() {
        var api = new Object();
        var self = this;
        var constants = window.eventsPlayer.PlayerConstants;

        var logger = new eventsCore.util.Logger('PlayData');
        
        api.addMetadata = function(config, playObj, platform, browser){
            logger.info('addMetadata - configConv:%o platform:%o', config.analyticsConfig.conviva, platform);

            var isLive;

            //force autoplay to false if ipad
            // set to true if not set
            if (!playObj.hasOwnProperty('autoPlay')){
                playObj['autoPlay'] = true;
            }
            if (platform.toLowerCase().indexOf('ipad') > -1 || 
                platform.toLowerCase().indexOf('iphone') > -1 || 
                platform.toLowerCase().indexOf('ios') > -1 || 
                platform.toLowerCase().indexOf('android') > -1 ){
                playObj.autoPlay = false;
            }
            
            var type = '';
            isLive = false;
            if(playObj.streamType.toLowerCase().indexOf('live') > -1) {
                 type = constants.LIVE;
                 isLive = true;
            }
            else if (playObj.streamType.toLowerCase().indexOf('dvr') > -1) {
                type = constants.DVR;
                isLive = true;
            }
            else if (playObj.streamType.toLowerCase().indexOf('vod') > -1) {
                type = constants.VOD;
                isLive = false;
            }
            else {
                logger.warn('addMetadata - streamType should be set to either "live", "dvr", or "vod".  Defaulted to "" for autodetection');
            }
            playObj.streamType = type;

            //environment/conviva
            playObj.analytics = {};
            if (config.analyticsConfig.conviva && config.analyticsConfig.conviva.enable) {
                var convivaData = {
                    'enable': config.analyticsConfig.conviva.enable,
                    'serviceUrl': config.analyticsConfig.conviva.serviceUrl,
                    'key': config.analyticsConfig.conviva.key,
                    'syndicator':  playObj.syndicator || config.analyticsConfig.conviva.syndicator,
                    'playerName': playObj.playerName || config.analyticsConfig.conviva.playerName,
                    'screenType': Environment.screenType(playObj.windowSize),
                    'deviceType': Environment.getDeviceType(),
                    'channelName': playObj.channelName || 'unknownChannel',
                    'pageUrl': Environment.getPageUrl(),
                    'isLive': isLive,
                    'cdn': playObj.cdn,
                    'traces': (eventsCore.getLogLevel() === 'all') //enable if loglevel set to all
                };
                playObj.analytics['convivaData'] = convivaData;
            }

            if (config.analyticsConfig.akamai && config.analyticsConfig.akamai.enable) {
                var akamaiData = {
                    'enable': config.analyticsConfig.akamai.enable,
                    'beacon': config.analyticsConfig.akamai.beacon
                };
                playObj.analytics['akamaiData'] = akamaiData;
            }

            if (config.analyticsConfig.youbora && config.analyticsConfig.youbora.enable) {
                var youboraData = {
                    'enable': config.analyticsConfig.youbora.enable,
                    'accountCode': config.analyticsConfig.youbora.accountCode
                };
                playObj.analytics['youboraData'] = youboraData;
            }

            if (config.hlsjsConfig) {
                   playObj.hlsjsConfig = config.hlsjsConfig;
            }

            playObj.adConfig = config.adConfig;

            //set to use native text track display (for safari)
            playObj.useNativeTextTracks = false;
            //make inband option configurable as more support
            playObj.useInbandVtt = false;

            if (browser.toLowerCase().indexOf('safari') > -1) {
                playObj.useNativeTextTracks = true;
                playObj.useInbandVtt = true;
            }

            if (!playObj.hasOwnProperty('cdn')){
                playObj['cdn'] = 'unknown';
            }

            //add akamai acceleration config to playObj
            playObj.akamaiAcceleration = config.akamai ? config.akamai.acceleration : false;

            //check for mismatched mimetypes/streams
            //  if find mp4, set mime type
            var hlsMimeType =  'application/x-mpegURL';
            var progMimeType =  'video/mp4';

            var pattMP4 = /\.(mp4)($|\?|#)/;
            var pattM3U8 = /\.(m3u8)($|\?|#)/;
            var matchMP4 = pattMP4.test(playObj.url);
            var matchM3U8 = pattM3U8.test(playObj.url);

            if (matchMP4 && playObj.mimeType != progMimeType) {
                logger.warn('loadStream - found mp4 stream, but m3u8 mime, changing mime'); 
                playObj.mimeType = progMimeType;
            }
            else if (matchM3U8 && playObj.mimeType != hlsMimeType) {
                logger.warn('loadStream - found m3u8 stream, but mp4 mime, changing mime'); 
                playObj.mimeType = hlsMimeType;
            }

            logger.info('addMetadata - playObj:%o', playObj);
            return playObj;
        }

        return api;
    }

    //console.log('PlayerManager: par:%o', window.eventsPlayer.player);
   	window.eventsPlayer.control.PlayData = PlayData;
}(jQuery));

;

/*
	Source: build/PlayerBitmovin.js
*/
function PlayerBitmovin(_holder, _controls, _namespace) {
    var api = new Object();
    var self = this;
    var localport = (location.port !== '80') ? ':' + location.port : '';
    var namespace = _namespace;
    var localorigin = 'http://' + document.domain + localport + '/' + namespace;
    var controls = _controls;
    var logger = new eventsCore.util.Logger('PlayerBitmovin');
    
    var techName = 'bitmovin';
    var playerId = 'events-video-obj';
    var holder = _holder;
    var constants = eventsPlayer.PlayerConstants;

    var playObj;
    var player;                 //player object from bitmovin

    var qosData;                
    var renditions;             //array of renditions
    var subtitles;              //array of subtitles

    var activeRenditionIndex;   //the current rendition index
    var activeUri;
    var streamType;             //Live or Vod
    var segmentsLength;          //number of segments
    var masterUri;
    var tech;
    var detectedStreamType;
    var detectedTech;
    var fullscreenManager;
    var analyticsConviva;
    var analyticsYoubora;
    var ima;
    var currentCues = [];
    var trackIndex;
    var currentTrack;
    var captionsEnabled = false;
    var captions608display = false;
    var useInbandTrack = true;
    var curVolume;
    var muted;
    var defaultVolume = .8;
    var endIncrement = 0;
    var videoEnded = false;
    var firstPlay = false;

    var initialDuration = 0;

    logger.info('constructor:%o holder:%o player:%o controls:%o ns:%o', self, holder, player, controls, namespace);   


    var init = function() {
        fullscreenManager = new eventsPlayer.utils.FullscreenManager($('#events-video-obj_html5_api')[0]);
        $('.poster').hide();
        logger.info('init - fs:%o', fullscreenManager.isFullscreenEnabled());

        //to allow communication back to any page loading the ecp player
        localorigin = '*';

        //playObj.playbackRates
        //(controls === 'default')

        var conf = {
            key: "5134baad-6453-4367-a644-af739e4a0d63",
            playback: {
                autoplay: true,
                muted: false,
                preferredTech: [
                    {
                        player: 'html5',
                        streaming: 'hls'
                    }, {
                        player: 'native',
                        streaming: 'hls'
                    }, {
                        player: 'flash',
                        streaming: 'hls'
                    }
                ]
            },
            style: {
                //ux: false,
                bufferingOverlay: false,
                controls: false,
                playOverlay: false
                
            },
            events: {
                onReady: function(data) {
                    //logger.info('onReady - data:%o', data);
                    onReady(data);
                },
                onMetadata: function(data) {
                    onLoadedMetadata(data);
                },
                onPlay: function(data) {
                    //logger.info('onPlay - data:%o', data);
                    onPlay();
                },
                onPaused: function(data) {
                    onPaused();
                },
                onPlaybackFinished: function(data) {
                    onEnded();
                },
                onError: function(data) {
                     logger.info('onError - data:%o', data);
                },
                onTimeChanged: function(data) {
                    //logger.info('onTimeChanged - data:%o', data);
                    onTimeUpdate(data.time);
                },
                onPlayerResize: function(data) {
                    logger.info('onPlayerResize - data:%o', data);
                },
                onVideoDownloadQualityChanged: function(data) {
                    logger.info('onVideoDownloadQualityChanged - data:%o', data);
                },
                onVideoPlaybackQualityChanged: function(data) {
                    logger.info('onVideoPlaybackQualityChanged - data:%o', data);
                },
                onSubtitleAdded: function(data) {
                    onSubtitles(data);
                },
                onCueEnter: function(data) {
                    logger.info('onCueEnter - data:%o', data);
                },
                onCueExit: function(data) {
                    logger.info('onCueExit - data:%o', data);    
                }
            }
        };

        player = bitmovin.player(holder);
     
        player.setup(conf).then(function(value) {
            logger.info('success');
        }, function(reason) {
            logger.info('error');
        });
    };

    var load = function(_playObj) {
        var tracksTags = '';
        hls = null;
        renditions = null;
        subtitles = [];
        activeRenditionIndex = null;
        qosData = null;
        detectedStreamType = null;
        useInbandTrack = true;
        endIncrement = 0;
        videoEnded = false;
        firstPlay = false;

        playObj = _playObj;

        logger.info('********************');
        logger.info('load - playObj:%o', playObj);

        player.unload();

        var source = {
            hls: playObj.url,
            poster: playObj.poster,
            // tracks: [{
            //     file: 'http://path/to/thumbnail/vtt/file.vtt',
            //     kind: 'thumbnails'
            // }],
        };

        player.load(source);

        if (playObj.poster) {
            $('.poster').css("background-image", "url(" + playObj.poster + ")");
            $('.poster').show();
        }

		logger.info('load - holder:%s playObj:%o nativett:%o', holder, playObj, playObj.useNativeTextTracks);

        initAnalytics(playObj.analytics);

        //player.userActive(false);
        //player.playbackRate(3);

        //$('.vjs-tech').on('contextmenu', function(e) {
        //    e.preventDefault();
        //});

        if (playObj.autoPlay){
            $('.poster').hide();
        } 
        else {
            $('.poster').show();
            $('.wrapper').on('click', function (event) {
                //logger.info('wrapper click');
                $('.wrapper').off('click');
                $('.poster').hide();
                player.play();
            });
        }
    };


    var initAnalytics = function(analytics) {
        logger.info('initAnalytics - analytics:%o', analytics);

        if (!analyticsConviva && analytics.convivaData && analytics.convivaData.enable) {
            analyticsConviva = new eventsPlayer.control.AnalyticsConviva(analytics.convivaData);
        }
                
        if (analyticsConviva) {
            analyticsConviva.startSession(analytics.convivaData, player.src, $(player.element).find('video')[0]);
        }

        if (!analyticsYoubora && analytics.youboraData && analytics.youboraData.enable) {
            analyticsYoubora = new eventsPlayer.control.AnalyticsYoubora(player, analytics.youboraData);
        }
    };

    var onReady = function(data) {
        logger.info('onReady - data:%o vq:%o', data, player.getAvailableVideoQualities());

        renditions = player.getAvailableVideoQualities();

        return;
        var playerEvent = new eventsPlayer.commons.MetadataEvent();
        playerEvent.aspect = player.aspectRatio();
        // playerEvent.live = player.live;
        // playerEvent.dvr = player.dvr;
        playerEvent.width = player.videoWidth();
        playerEvent.height= player.videoHeight();
        playerEvent.fullscreenEnabled = fullscreenManager.isFullscreenEnabled();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onLoadedMetadata = function(data) {
        logger.info('onLoadedMetadata - data:%o', data);

        return;

        
    };

    var onLoadedData = function(data) {
        //logger.info('onLoadedData - data:%o', data);
        //logger.info('onLoadedMetadata - tracks:%o remtracks:%o', player.textTracks(), player.remoteTextTracks());
        updateQosData();
        logger.info('onLoadedData - send meta, tracks:%o len:%o rs:%o', player.textTracks(), player.textTracks().length, player.readyState());
        

        setupTextTracks();
    };

    var onPlay = function(data) {
        videoEnded = false;

        if (!firstPlay) {
            firstPlay = true;

            var playerEvent = new eventsPlayer.commons.PlayEvent();
            sendMessage(playerEvent, localorigin);

            if (muted) {
                player.muted(muted);
            }

            if (!curVolume) {
                player.setVolume(defaultVolume);
                curVolume = defaultVolume;
            }
            else {
               player.setVolume(curVolume); 
            }
        }

        var playerEvent = new eventsPlayer.commons.PauseEvent();
        playerEvent.paused = false;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onPaused = function(data) {
        var playerEvent = new eventsPlayer.commons.PauseEvent();
        playerEvent.paused = true;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onDurationChange = function(data) {
        //onLoadedMetadata(null);
    };

    var onTimeUpdate = function(time) {
        var playerEvent = new eventsPlayer.commons.TimeUpdateEvent();
        

        if (!detectedStreamType && time > 0) {
            if (!isFinite(player.getDuration()) && time > 30) {
                detectedStreamType = constants.DVR;
            }
            else if (!isFinite(player.getDuration())) {
                detectedStreamType = constants.LIVE;
            }
            else if (isFinite(player.getDuration())) {
                detectedStreamType = constants.VOD;
            }

            if (analyticsYoubora) {
                analyticsYoubora.setStreamType((detectedStreamType != constants.VOD));
            }
        }

        /*
        if (detectedStreamType === 'dvr') {
            playerEvent.duration = playerEvent.loadedTime - 10;
        }
        */

        //logger.info('onTimeUpdate - dt:%o type:%o duration:%s current:%s bufferEnd:%o seekEnd:%o', player.currentProgramDateTime, detectedStreamType, player.duration(), player.currentTime(), player.bufferedEnd(), player.seekable().end(0));
        //logger.info('onTimeUpdate - textTracks:%o band:%o hls.segmentXhrTime:%o', player.textTracks().length, hls.bandwidth, hls.stats);
        //logger.info('onTimeUpdate - tracks:%o', player.textTracks());
        
        playerEvent.start = 0;

        if (detectedStreamType == constants.DVR) {
            playerEvent.time = time;
            playerEvent.duration = player.getMaxTimeShift() * -1;
            //playerEvent.start = player.seekable().start(0);
            //if (playerEvent.time > playerEvent.duration)
            //    playerEvent.time = playerEvent.duration;
            initialDuration = playerEvent.duration;
        }
        else {
            playerEvent.time = time;
            playerEvent.duration = player.getDuration();
        }
        
        //playerEvent.loadedTime = player.bufferedEnd();
        playerEvent.detectedStreamType = detectedStreamType;
        playerEvent.qos = qosData;
        //playerEvent.programDateTime = player.currentProgramDateTime;

        /*
        try{
            var activeMedia = hls.playlists.media();
            if (activeUri !== activeMedia.uri) {
                logger.info('onTimeUpdate - active:%o', activeMedia.uri);
                activeUri = activeMedia.uri;
                updateQosData();
            }
        }
        catch (e) {
            //logger.error('onTimeUpdate - %o', e);
        }
        */
        sendMessage(playerEvent, localorigin);
        playerEvent = null;

    };

    var onSubtitles = function(data) {
        //logger.info('onSubtitles - avail:%o', player.getAvailableSubtitles());
        subtitles.push(data.subtitle);

        logger.info('onSubtitles - list:%o', subtitles);

        if (subtitles.length > 0){
            var tracks = {};
            tracks = [];
            for (var i=0; i<subtitles.length; i++) {
                tracks.push({
                    kind: subtitles[i].kind,
                    language: subtitles[i].lang,
                    label: subtitles[i].label
                });
            }

            var playerEvent = new eventsPlayer.commons.TextTrackEvent();
            playerEvent.data = tracks;

            sendMessage(playerEvent, localorigin);
            playerEvent = null;
        }
    };

    var onWaiting = function(data) {
        //logger.info('onWaiting - %o buffered:%o start:%o', data, player.buffered);
        var playerEvent = new eventsPlayer.commons.BufferingEvent();

        sendMessage(playerEvent , localorigin);
        playerEvent = null;
    };

    var onEnded = function(data) { 
        logger.info('onEnded - ');
        var playerEvent = new eventsPlayer.commons.CompleteEvent();

        if (!videoEnded){
            videoEnded = true;
            sendMessage(playerEvent, localorigin);
            playerEvent = null;
        }
    };

    var onStalled = function(data) {
        //logger.info('onStalled - %o', data);
    };

    var onError = function(data) {
        //logger.error('onError - %o', data);
        var playerEvent = new eventsPlayer.commons.ErrorEvent();
        if (data.error) {
            playerEvent.message = data.error.message;
            playerEvent.stack = data.error.stack; 
        }
        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onVolumeChange = function(data) {
        //logger.info('onVolumeChange - muted:%o vol:%o', player.muted(), player.volume());

        muted = player.muted();

        var playerEvent = new eventsPlayer.commons.VolumeEvent();
        playerEvent.muted = player.muted();
        playerEvent.volume = player.volume();
        curVolume = player.volume();

        sendMessage(playerEvent, localorigin);
    };

    var updateQosData = function() {
        var data = new eventsPlayer.commons.QosData();
        var qos = {};

        //data.frameRate = player.frameRate;
        data.playRate = player.playbackRate();
        qos.renderer = detectedTech;
        
        logger.info('updateQosData - hls:%o', hls);

        if (hls) {
            renditions = getPlaylist();
            logger.info('updateQosData - Qos renditions:%o activeInd:%o', renditions, activeRenditionIndex);
            var activeRendition = renditions[activeRenditionIndex];

            if (activeRendition) {
                var path = masterUri.substring(0, masterUri.lastIndexOf('/') + 1);
                var shortUri = activeRendition.uri.replace(path, '');

                qos.stream = masterUri;
                qos.activeRendition = activeRenditionIndex + 1;
                qos.totalRenditions = renditions.length;
                qos.uri = shortUri;
                qos.bandwidth = activeRendition.bandwidth;
                qos.resolution = activeRendition.resolution.width + 'x' + activeRendition.resolution.height;
                qos.codecVideo = activeRendition.codecs.video;
                qos.codecAudio = activeRendition.codecs.audio;
            }
            else {
                qos.stream = masterUri;
                qos.activeRendition = 1;
                qos.totalRenditions = 1;
                qos.uri = 'm3u8 rendition';
                qos.bandwidth = '';
                qos.resolution = '';
                qos.codecVideo = '';
                qos.codecAudio = '';
            }
        }
        
        //var timeRange = player.buffered();
        //logger.info('buffer - buffered start:%o end:%o', timeRange.start(0), timeRange.end(0));
        
        //logger.info('renditions - total:%o current:%o ', renditions.length, activeRendition);

        //logger.info('onTimeUpdate - Qos framerate:%o playrate:%o', data.frameRate, data.playRate);
        //logger.info('onTimeUpdate - Qos network:%o', player.networkState());
        //logger.info('onTimeUpdate - Qos buffer:%o', player.bufferedPercent());

        //logger.info('updateQosData - Qos framerate:%o playrate:%o qos:%o', data.frameRate, data.playRate, data);

        qosData = qos;
    };

    var getPlaylist = function() {
        var master = hls.playlists.master;
        var renditions = [];
        var data = {};
        var codecs;

        logger.info('getPlaylist - master:%o playerHls:%o active:%o', master, hls.playlists.media(), activeUri);

        if (master.playlists.length > 1) {
           masterUri = master.uri; 

           for (var i = 0; i < master.playlists.length; i++) {
                data = {};
                try{
                    data.id = master.playlists[i].attributes['PROGRAM-ID'];
                }
                catch(e){
                    data.id = 'unknown';
                }
                data.bandwidth = master.playlists[i].attributes.BANDWIDTH;
                data.uri = master.playlists[i].uri;
                data.resolution = {};
                data.codecs = {};

                if (master.playlists[i].attributes.RESOLUTION) {
                    data.resolution.width = master.playlists[i].attributes.RESOLUTION.width;
                    data.resolution.height = master.playlists[i].attributes.RESOLUTION.height;
                }
                else {
                    data.resolution.width = 0;
                    data.resolution.height = 0;
                }

                if (master.playlists[i].attributes.CODEC) {
                    codecs = master.playlists[i].attributes.CODEC.split(',');
                    data.codecs.video = codecs[0];
                    data.codecs.audio = codecs[1];
                }
                else {
                    data.codecs.video = 'N/A';
                    data.codecs.audio = 'N/A';
                }

                renditions.push(data);

                if (data.uri === activeUri) {
                    activeRenditionIndex = i;
                }
            } 

        }
        else {
            masterUri = playObj.url;
            data.id = 'unknown';
            data.bandwidth = '';
            data.uri = '';
            data.resolution = '';
            data.codecs = '';

            renditions.push(data);
        }
        
        //logger.info('getPlaylist - uri:%o', masterUri);
        logger.info('getPlaylist - index:%o active:%o', activeRenditionIndex, renditions[activeRenditionIndex]);

        return renditions;
    };

    var seek = function(time) {
        logger.info('seek - time:%o', time);

        player.timeShift(time);
        player.seek(time);
        return;

        if (time >= player.duration()) {
            time = player.duration() - .001;
        }

        var seekTime = time;

        if (detectedStreamType === constants.DVR) {
            if (seekTime < player.currentTime()) {
                seekTime = time + player.seekable().start(0) + 5;
            }
            else {
                seekTime = time + player.seekable().start(0);
            }
        }

        logger.info('seek - type:%o time:%o seekTime:%o dur:%o', detectedStreamType, time, seekTime, player.duration());

        if (player){
            player.currentTime(seekTime);
        }
        
    }

    /**
     * setup texttracks
     */
    var setupTextTracks = function() {
        var inbandTracks = player.textTracks();
        var tracks = [];
        var addedTrack;
        logger.info('setupTextTracks - inbandTrackLen:%o trackIndex:%o', inbandTracks.length, trackIndex);

        if (playObj.captions == 'default' && playObj.tracks && inbandTracks.length == 0) {
            useInbandTrack = false;
            for (var i = 0; i < playObj.tracks.length; i++) {
                //tracksTags += '<track kind="' + playObj.tracks[i]['type'] + '" srclang="en" src="' + playObj.tracks[i]['file'] + '" label="' + playObj.tracks[i]['label'] + '"></track>'
                addedTrack = player.addRemoteTextTrack({
                    kind: playObj.tracks[i]['type'],
                    language: 'en',
                    label: playObj.tracks[i]['label'],
                    src: playObj.tracks[i]['file'],
                    id: 'added',
                    mode: 'hidden'
                  });

                tracks.push(addedTrack);

                addedTrack.addEventListener('load', function() {
                    logger.info('setupTextTracks - onload');
                    updateCueList(player.textTracks()[trackIndex]);
                });

                logger.info('setupTextTracks - track:%o', tracks[i]);
            }
        }
        else if (inbandTracks.length > -1){
            var inband = [];
            for (var i=0; i<inbandTracks.length; i++) {
                inbandTracks[i].mode = 'disabled';
                logger.info('setupTextTracks - inbandTrack:%o kind:%o lang:%o label:%o', inbandTracks[i], inbandTracks[i].kind, inbandTracks[i].language, inbandTracks[i].label);
                inband.push({
                    'label': inbandTracks[i].label,
                    'language': inbandTracks[i].language,
                    'kind': inbandTracks[i].kind
                });
            }

            if (inband.length > 0){
                var playerEvent = new eventsPlayer.commons.TextTrackEvent();
                playerEvent.data = inband;

                sendMessage(playerEvent, localorigin);
                playerEvent = null;
            }
        }

        //if track index has been set, and the track exists
        //  go head and enable it
        if (trackIndex >= 0 && (tracks.length > 0 || inbandTracks.length > 0)) {
            if (player.textTracks().length) {
                enableTextTracks(trackIndex);
            }
            else {
                setTimeout(enableTextTracks, 200, trackIndex);
            }
        }
        //else if using native 608 and captions enabled
        else if (playObj.captionsEnabled && playObj.captions == 'custom') {
            if (player.textTracks().length) {
                enableTextTracks();
            }
            else {
                setTimeout(enableTextTracks, 200);
            }
        }

        //listen for inband cue changes (default controls?)
        if (inbandTracks.length > 0) {
            var currentTrack = player.textTracks()[0];
            var cue; 

            currentTrack.oncuechange = function() {
                if(currentTrack.activeCues[0] !== undefined){
                    cue = currentTrack.activeCues[0];
                    //logger.info('activeCue - cue:%o', cue);
                } 
            }
        }
    };

    /**
     * turns on text track with the index value specified
     *  - if using default VTT display
     *
     * PARAM values
     * index
     */
    var enableTextTracks = function(index) {
        if (playObj.captions == 'default') {
            logger.info('enableTextTracks - index:%o subtitles:%o', index, subtitles);

            player.setSubtitle(subtitles[index].id);
        }

        //set enabled flag and change display mode of first inband track if exists
        //  custom608 display only works for inband native 608
        else if (playObj.captions == 'custom'){
            captions608display = true;
            
        }
    };

    /**
     * disable text track
     *  - if using default VTT display
     */
    var disableTextTracks = function(){
        if (playObj.captions == 'default') {
            captionsEnabled = false;
            trackIndex = null;
        }
        else if (playObj.captions == 'custom'){
            captions608display = false;
        }
        updateCaptionsDisplay();
    };

    /**
     * toggle the display of captions based on if 'captions' on and if a currentTrack is set
     */
    var updateCaptionsDisplay = function() {
        logger.info('updateCaptionsDisplay - track:%o captionsEnabled:%o', currentTrack, captionsEnabled);

        if ((captions608display || captionsEnabled) && currentTrack) {
            currentTrack.mode = 'showing';
        }
        else if (currentTrack){
            currentTrack.mode = 'disabled';
        }
    };

    /**
     * update and dispatch the cue list if it has changed
     */
    var updateCueList = function(tt) {
        var cues = [];
        
        if (tt.cues && tt.cues.length > 0) {
            //logger.info('updateCueList - cue:%o len:%o', tt.cues, tt.cues.length);
            for (var i = 0; i < tt.cues.length; i++) {
                cues.push(getCueData(tt.cues[i]));
            }
        }

        logger.info('updateCueList - new:%o', (JSON.stringify(cues) !== JSON.stringify(currentCues)));
        if (JSON.stringify(cues) !== JSON.stringify(currentCues)) {
            currentCues = cues;
            //logger.info('updateCueList - cues:%o', currentCues);

            var playerEvent = new eventsPlayer.commons.TrackLoadedEvent();
            playerEvent.data = currentCues;

            sendMessage(playerEvent, localorigin);
            playerEvent = null;
        }
    };

    /**
     * get formatted data object representing a text track cue
     */
    var getCueData = function(cue) {
        var data = {};
        var text = '';
        var id = cue.id.split(',');
        
        text = cue.text.replace(/(<.*?>)/g, '');
        text = text.replace(/(\r\n|\n|\r)/gm, '');

            //confidence = text.match(/(Watson Confidence: .*%)/g);
            //logger.info('updateCueList - cue:%o', tt.cues[i]);
            //if (confidence)
            //    confidence = confidence[0].substr(confidence[0].indexOf(': ') + 2);

        text = text.replace(/(Watson Confidence: .*%)/g, '');

        data.id = id[0];
        data.start = cue.startTime;
        data.end = cue.endTime;
        data.text = text;
        data.confidence = (id.length >= 2) ? id[1].replace(' ', '') : '0%';
        data.status = (id.length >= 3) ? id[2].replace(' ', '') : '';

        return data;
    };

    /**
     * update track cues
     */
    var updateTrackData = function(data) {
        var id;
        var cue;
        var perc;

        if (trackIndex >= 0) {
            var tt = player.textTracks()[trackIndex];
            var data = data.subtitle;
            logger.info('updateTrackData - length:%o cuelen:%o', data.length, tt.cues.length);

            for (var j = tt.cues.length-1; j >= 0; j--) {
                tt.removeCue(tt.cues[j]);
            }
            
            for (var i = 0; i < data.length; i++) {
                //logger.info('updateTrackData - entry:%o', data[i]);
                var cue = new window.VTTCue(data[i].startTime, data[i].endTime, data[i].transcript);
                perc = Math.round(data[i].confidence * 1000)/10;
                cue.id = data[i].index + ', ' + perc + '%, ' + data[i].status;;
                //logger.info('updateTrackData - i:%o cuelen:%o new:%o', i, tt.cues.length, cue);
                tt.addCue(cue);
            }

            updateCueList(tt);
        }
    };

    

    //******************************
    // Ad Event Handlers
    //******************************
    var onAdStart = function(position) {
        logger.info('onAdStart - pos:%o', position);
        var playerEvent = new eventsPlayer.commons.AdStartEvent();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onAdEnd = function(position) {
        logger.info('onAdEnd - pos:%o', position);
        var playerEvent = new eventsPlayer.commons.AdEndEvent();
        playerEvent.position = position;
        sendMessage(playerEvent, localorigin);
        playerEvent = null;

        if (position === constants.postroll) {
            var playerEvent = new eventsPlayer.commons.CompleteEvent();
            sendMessage(playerEvent, localorigin);
            playerEvent = null;
        }
    };

    //******************************
    //postMessage Handling
    //******************************
    var receiveMessage = function(event) {
        var eventData = event.data;
        //logger.info('receiveMessage msg:%o from:%s player:%o', eventData, event.origin, player);

        switch(eventData.name) {
            case 'load': 
                load(eventData.data);
                break;

            case 'stop':
                if (player) {
                    player.pause();
                    if (ima) {
                        ima.pause();
                    }
                    //player.dispose();
                }
                break;

            case 'play': 
                if (player) player.play();
                break;

            case 'pause': 
                if (player) player.pause();
                break;

            case 'seek': 
                if (player) 
                    seek(eventData.data.time);
                break;

            case 'mute': 
                muted = eventData.data.mute;
                if (player) player.muted(muted);
                break;

            case 'volume': 
                if (player) player.volume(eventData.data.volume);
                break;

            case 'fullscreenOn': 
                fullscreenManager.fullScreenOnVideo(player);
                break;

            case 'updateTextTrack': 
                updateTrackData(eventData.data);
                break;

            case 'captionsOn': 
                enableTextTracks(eventData.data.index);
                break;

            case 'captionsOff': 
                disableTextTracks();
                break;

            default:
                break;
        }
    };
    
    var sendMessage = function(message, origin) {
        //logger.info('sendMessage - send msg:%o origin:%o', message, origin);
        var localMessage = message;

        message.type = namespace + ':' + message.type;
        window.parent.postMessage(message, origin);

        var type = 'tech:' + localMessage.type;
        //$(document).trigger(type, [localMessage]);
    };
    
    var addListeners = function() {
        window.addEventListener("message", receiveMessage);
    };


    var sendReady = function() {
        logger.info('sendReady - ns:%o', namespace);

        var playerEvent = new eventsPlayer.commons.PlayerReadyEvent();
        playerEvent.tech = techName;
        playerEvent.fullscreenEnabled = fullscreenManager.isFullscreenEnabled();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    api.receive608 = function(time, data){
        //logger.info('receive608 - time:%o data:%o cur:%o', time, data, player.currentTime(), player.dur);
   
        if (detectedStreamType == constants.DVR) {
            time += initialDuration;
        }

        var playerEvent = new eventsPlayer.commons.CaptionEvent();
        playerEvent.time = time;
        playerEvent.data = data;
        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };
    
    // api functions
    api.load = function(obj) {
        load(obj);
    };

    api.forceError = function() {
        player.error({code:'2'});
        
    };

    init();
    addListeners();
    setTimeout(sendReady,100);
    return api;
};

/*
	Source: build/PlayerConstants.js
*/
/**
 * Create a core player object for namespacing
 */
(function($) {
var PlayerConstants = {}; // Create object

    Object.defineProperty(PlayerConstants, 'COMPLETE', {
        value: 'complete',
        writable: false,
        enumerable: true
    });

    Object.defineProperty(PlayerConstants, 'TIME_UPDATE', {
        value: 'time_update',
        writable: false,
        enumerable: true
    });

    Object.defineProperty(PlayerConstants, 'LIVE', {
        value: 'video_live',
        writable: false,
        enumerable: true
    });

    Object.defineProperty(PlayerConstants, 'DVR', {
        value: 'video_dvr',
        writable: false,
        enumerable: true
    });

    Object.defineProperty(PlayerConstants, 'VOD', {
        value: 'video_vod',
        writable: false,
        enumerable: true
    });

    Object.defineProperty(PlayerConstants, 'preroll', {
        value: 'preroll',
        writable: false,
        enumerable: true
    });

    Object.defineProperty(PlayerConstants, 'postroll', {
        value: 'postroll',
        writable: false,
        enumerable: true
    });

    window.eventsPlayer.PlayerConstants = PlayerConstants;
}(jQuery));;

/*
	Source: build/PlayerControls.js
*/
/**
 * Create a core player object for namespacing
 */
(function($) {
function PlayerControls(_state, _controls, _messenger, _config, _toolbar, _captionDisplay) {
        var api = new Object();
        var self = this;
        var state = _state;
        var messenger = _messenger;
        var analytics = _config.analyticsConfig;
        var constants = window.eventsPlayer.PlayerConstants;
        var fullscreenManager = new eventsPlayer.utils.FullscreenManager(null, _state);

        var toolbar = _toolbar;
        var autoPlay = true;
        var breakpoint = _config.uiConfig.breakpoint;
        var buttons = _config.uiConfig.toolbar.buttons;
        var keyboard = _config.uiConfig.toolbar.keyboard;
        var streamInfo;
        var sessionConfig;
        var captionsSetting;
        var showCaptionsButton = false;
        var captionsOnDefault = false;
        var captionDisplay = _captionDisplay;
        var initialized = false;
        var paused = true;
        var ended = false;
        var fullscreenEnabled = false;
        var isVideoFullScreen = false;
        var muted = false;
        var playingLive = false;
        var showingLoader = false;
        var controlsVisible = false;
        var volume;
        var controls = _controls;
        var controlsHovered = false;
        var socialShare = new eventsPlayer.view.SocialShare(_state, _controls, _config);

        var playerPoster = $(state.container).find('.playerPoster')[0];
        var loadContainer = $(state.container).find('.loaderContainer')[0];
        var videoControlsTouch = $(state.container).find('.videoControlsTouch')[0];

        //var cover = $(controls).find('.controlsCover')[0];
        var controls = $(controls);
        var playBtn = $(controls).find('.ecp-playBtn')[0];
        var rewindBtn = $(controls).find('.ecp-rewindBtn')[0];
        var liveBtn = $(controls).find('.ecp-liveBtn')[0];
        var captions = $(controls).find('.ecp-captionsBtn')[0];
        var muteBtn = $(controls).find('.ecp-muteBtn')[0];
        var panelBtn = $(controls).find('.ecp-panelBtn')[0];
        var shareBtn = $(controls).find('.ecp-shareBtn')[0];
        var extraBtn = $(controls).find('.ecp-extraBtn')[0];
        var fullScreenToggleButton = $(controls).find(".ecp-fullScreenBtn")[0];
        var popOpenBtn = $(controls).find('.ecp-popOpenBtn')[0];

        var volumeContainer = $(controls).find(".volume");
        var volumeHolder = $(controls).find(".volume_bar")[0];
        var volumeBar = $(controls).find(".volume_progress")[0];

        var timeText = $(controls).find('.timeText')[0];
        var curTimeText = $(controls).find('.curTimeText');
        var durTimeText = $(controls).find('.durTimeText');

        var progressContainer = $(controls).find(".progress");
        var progressHolder = $(controls).find(".progress_bar")[0];
        var playProgressBar = $(controls).find(".play_progress")[0];

        var configVideoType = 'unknown';
        var videoType = 'unknown';
        var videoTypeFixed = false;
        var duration;
        var currentTime;
        var loadedTime;
        var displayTime;
        var videoStarted = false;
        var captionsOn = false;

        var playBtnHTML = '&#x25BA;';
        var pauseBtnHTML = '<span class="ecp-pauseButton"></span>';
        var stopBtnHTML = '<span class="ecp-stopButton"></span>';

        var fullScreenEnabled;
        var usePlayerCaptions = true;
        var trackIndex;

        var lastMouse = { x: null, y: null };
        var moveTimeout;
        var cursorTimeout;
        var CONTROLS_TIMEOUT = 3000;
        var CONTROLS_TRANSITION = 500;


        //if using tech within same page instead of iframe
        //var tech = new eventsPlayer.player.PlayerVideojs(_holder);
        //tech = new eventsPlayer.player.PlayerTHEOplayer(_holder);

        var logger = new eventsCore.util.Logger('PlayerControls');
        logger.info('constructor - controls:%o constants:%o fstoggle:%o', controls, constants, fullScreenToggleButton);


        /**
         * Initialize PlayerControls
         * - listen for player messages
         * - add control handlers
         */
        var init = function() {
            logger.info('init - container:%o wrapper:%o', state.container, state.wrapper);

            // Helpful CSS trigger for JS.
            //document.documentElement.className += ' js';
            $(state.wrapper).addClass('ecp');

            sizeUpdate($(state.wrapper).width(), $(state.wrapper).height());

            hideControlsTouch();

            enableControls(false, 'init');
            showControls(false, 'init');
            setPoster(false);

            fullScreenEnabled = fullscreenManager.isFullscreenEnabled();
            fullscreenManager.on('fullscreenOn', fullScreenOn);
            fullscreenManager.on('fullscreenOff', fullScreenOff);

            if (toolbar === 'none' || toolbar === 'default') {
                showLoader(false, 'toolbar');
            }

            $(state.container).on("player:PlayerReadyEvent", function(event, data) {
                //logger.info('player:PlayerReadyEvent - ev:%o data:%o', event, data);  
                onPlayerReady(data);
            });

            $(state.container).on("player:MetadataEvent", function(event, data) {
                //logger.info('player:MetadataEvent - ev:%o data:%o', event, data);
                onMetadataEvent(data);
            });

            $(state.container).on("player:TimeUpdateEvent", function(event, data) {
                //logger.info('player:TimeUpdateEvent - ev:%o data:%o loadedTime:%o time:%o dur:%o', event, data, data.loadedTime, data.time, data.duration);  
                timeUpdate(data);
            });

            $(state.container).on("player:ResizeEvent", function(event, data) {
                //logger.info('player:ResizeEvent - ev:%o data:%o', event, data);
                sizeUpdate(data.width, data.height);
                updatePlayProgress();
            });

            $(state.container).on("player:PlayEvent", function(event, data) {
                //logger.info('player:PlayEvent - ev:%o data:%o', event, data);
                onPlay();
            });

            $(state.container).on("player:PauseEvent", function(event, data) {
                //logger.info('player:PauseEvent - ev:%o data:%o', event, data);
                onPause(data.paused);
            });

            $(state.container).on("player:BufferingEvent", function(event, data) {
                //logger.info('player:BufferingEvent - ev:%o data:%o', event, data);  
                onBuffering();
            });

            $(state.container).on("player:VolumeEvent", function(event, data) {
                //logger.info('player:PauseEvent - ev:%o data:%o', event, data);  
                updateVolume(data.muted, data.volume);
            });

            $(state.container).on("player:CompleteEvent", function(event, data) {
                //logger.info('player:CompleteEvent - ev:%o data:%o', event, data);
                onComplete(!data.postroll);
            });

            $(state.container).on("player:ErrorEvent", function(event, data) {
                //logger.info('player:CompleteEvent - ev:%o data:%o', event, data);
                captionDisplay.disable();
                enableControls(false, 'error_event');
            });

            $(state.container).on("player:AdStartEvent", function(event, data) {
                //logger.info('player:AdStartEvent - ev:%o data:%o', event, data);
                onAdStart();
            });

            $(state.container).on("player:AdEndEvent", function(event, data) {
                //logger.info('player:AdEndEvent - ev:%o data:%o', event, data);
                onAdEnd(data);
            });

            $(state.container).on("player:VideoFullscreenEvent", function(event, data) {
                logger.info('player:VideoFullscreenEvent - ev:%o data:%o', event, data);
                if (data.fullscreen){
                    fullScreenOn();
                }
                else {
                    fullScreenOff(data.measure);
                }
            });

            $(state.container).on("player:TextTrackEvent", function(event, data) {
                logger.info('player:TextTrackEvent - %o', data.data);
                //logger.info('player:TextTrackEvent - kind:%o lang:%o label:%o',  data.data[0].kind, data.data[0].language, data.data[0].label);

                //for moment set cc track to the first index
                trackIndex = data.data[0].index;
                showCaptionsButton = true;
                captionsSetting = {};
                captionsSetting[data.data[0].label] = data.data[0].language;
                initializeCaptions();

                if (captionsOnDefault) {
                    turnCaptionsOn();
                }
            });

            // add touch class to buttons for devices
            var testTablet = true;
            testTablet = false;
            logger.info('init - tablet:%o iphone:%o testTablet:%o', Environment.isTabletDevice(), Environment.isiPhone(), testTablet);

            if (Environment.isiPhone() || Environment.isTabletDevice() || testTablet) {
                $(playBtn).addClass('touch');
                $(rewindBtn).addClass('touch');
                $(liveBtn).addClass('touch');
                $(captions).addClass('touch');
                $(panelBtn).addClass('touch');
                $(popOpenBtn).addClass('touch');
                $(shareBtn).addClass('touch');
                $(extraBtn).addClass('touch');
                $(fullScreenToggleButton).addClass('touch');

                if (Environment.isTabletDevice() || testTablet) {
                    $(state.wrapper).addClass('tablet');
                    
                }
                if (Environment.isiPhone()) {
                    $(state.wrapper).addClass('phone');
                }
            }

            //enable or disable buttons by configuration
            if (shareBtn) {
                shareBtn.setAttribute('data-state', '');
            }
            if (popOpenBtn) {
                popOpenBtn.setAttribute('data-state', '');
            }
            if (panelBtn) {
                panelBtn.setAttribute('data-state', '');
            }


            setFullscreenEnabled(fullScreenEnabled);

            addMoveHandlers();
            addMobileTouchHandlers();
            addScrubTouchHandlers();
            addVolumeScrubHandler();
            setupButtonPressHandlers();
            if (shareBtn)
                setupShareHandlers();
        };

        var showLoader = function(show, src) {
            if (show) {
                //logger.info('showLoader - value:%o src:%o', show, src);
                showingLoader = true;
                $(loadContainer).show();
                $(loadContainer).html('<div class="loader">Loading...</div>');
            } 
            else {
                //logger.info('showLoader - value:%o src:%o', show, src);
                showingLoader = false;
                $(loadContainer).hide();
                $(loadContainer).html('');
            }
        };

        var sizeUpdate = function(width, height) {
            //logger.info('sizeUpdate break:%o size:%o ns:%o share:%o', breakpoint, width + 'x' + height, state.namespace, $(shareBtn).position());
            if (width <= breakpoint) {
                if (!$(state.wrapper).hasClass('smallWidth')) {
                    socialShare.clear();
                }
                $(state.wrapper).addClass('smallWidth');
            } 
            else {
                if ($(state.wrapper).hasClass('smallWidth')) {
                    socialShare.clear();
                }
                $(state.wrapper).removeClass('smallWidth');
            }

            if (shareBtn){
               socialShare.positionUpdate($(shareBtn).position().left);
                socialShare.sizeUpdate(width, height); 
            }
        };

        var timeUpdate = function(data) {
            //logger.info('timeUpdate data:%o dur:%o time:%o start:%o loaded:%o', data, data.duration, data.time, data.start, data.loadedTime);

            if (data.time != currentTime && showingLoader) {
                //logger.info('timeUpdate time:%o currentTime:%o', data.time, currentTime);
                showLoader(false, 'time');
                if (controlsVisible)
                    resetMoveTimeout();
            }

            duration = data.duration;
            currentTime = data.time;
            loadedTime = data.loadedTime;
            displayTime = (currentTime - data.start);

            //logger.info('timeUpdate dur:%o time:%o start:%o display:%o perc:%o', data.duration, data.time, data.start, displayTime, (displayTime/duration));

            if (displayTime > duration) {
                displayTime = duration;
            }
            //logger.info('timeUpdate data:%o ', data);

            if (videoStarted) {
                var type = configVideoType;

                //logger.info('timeUpdate vidType:%o detVideoType:%o fixed:%o', configVideoType, data.detectedStreamType, videoTypeFixed);

                if (configVideoType && !videoTypeFixed) {
                    if (configVideoType === constants.DVR && data.detectedStreamType === constants.DVR) {
                        type = constants.DVR;
                    } 
                    else if (configVideoType === constants.LIVE && (data.detectedStreamType === constants.DVR || data.detectedStreamType === constants.LIVE)) {
                        type = constants.LIVE;
                    } 
                    else if (configVideoType === constants.VOD && data.detectedStreamType === constants.VOD) {
                        type = constants.VOD;
                    }
                } 
                else if (!videoTypeFixed) {
                    type = data.detectedStreamType;
                }

                /*
                if (isNaN(duration) && currentTime == 0 && configVideoType === constants.VOD) {
                    type = constants.VOD;
                }
                else if(!isFinite(duration) || (duration > 0 && duration < 1)) {
                    type = constants.LIVE;
                }

                //dvr, but starting at beginning, set to vod, and don't change after time past 2
                else if (currentTime < 2 && configVideoType === constants.LIVE) {
                    configVideoType = constants.VOD;
                    type = constants.VOD;
                }
                else if (duration > 1 && (configVideoType === constants.DVR)) {
                    type = constants.DVR;
                }
                else if (duration > 0 && currentTime > 0 && configVideoType != constants.LIVE){
                    type = constants.VOD;
                }
                */

                //console.log('updateTime cur:%o dur:%o loaded:%o type:%o-%o', currentTime, duration, loadedTime, videoType, type);
                if (type !== videoType) {
                    videoType = type;
                    setControlsType();
                }
            }


            updateTimeDisplay();
            updatePlayProgress();
            //logger.info('updateTime :%o :%o', currentTime, videoStarted);
            if (currentTime > 0 && !videoStarted) {
                if (toolbar != 'none' && toolbar != 'default') {
                    enableControls(true, 'time');
                }
                videoStarted = true;
                if (shareBtn)
                    socialShare.positionUpdate($(shareBtn).position().left);
            }

            if (type === constants.DVR && currentTime < 0) {
                //playPause();
                //setSeekTime(5);
            }

            //logger.info('updateTime data:%o vidType:%o time:%o dur:%o loaded:%o', data, type, displayTime, duration, loadedTime);
        };

        var onMetadataEvent = function(data) {
            //logger.info('onMetadataEvent - initializeControls, setFullscreen');

            initializeControls(data.fullscreenEnabled);
            setFullscreenEnabled(data.fullscreenEnabled);
        };

        var initializeControls = function(isFullscreenEnabled) {
            //logger.info('initializeControls - type:%o tb:%o', videoType, toolbar);

            // When all meta information has loaded
            // check for duration to determine live stream or not

            // show controls and set the progress bar.
            updateTimeDisplay();
            setControlsType();

            /*
            if(autoplay) {
                video.play();
                // only allow autoplay the first time through
                autoplay = false;
            }
            */
        };

        var onPlayerReady = function(data) {
            setFullscreenEnabled(data.fullscreenEnabled);
        };

        var setFullscreenEnabled = function(enabled) {
            fullscreenEnabled = enabled;
            //logger.info('setFullscreenEnabled  - fs:%o', fullscreenEnabled); 

            if (fullscreenEnabled) {
                fullScreenToggleButton.style.display = 'block';
            }
        };

        var setPlayButton = function() {
            //logger.info('setPlayButton - paused:%o type:%o', paused, videoType);
            if (videoType === 'unknown')
                return;

            if (paused) {
                playBtn.title = 'Play';
                //playBtn.innerHTML = playBtnHTML;
                playBtn.setAttribute('data-state', 'play');
            } else {
                if (videoType === constants.VOD || videoType == constants.DVR) {
                    playBtn.title = 'Pause';
                    //playBtn.innerHTML = pauseBtnHTML;
                    playBtn.setAttribute('data-state', 'pause');
                } else {
                    playBtn.title = 'Stop';
                    //playBtn.innerHTML = stopBtnHTML;
                    playBtn.setAttribute('data-state', 'stop');
                }
            }
        };

        var initializeCaptions = function() {
            // check for existence of captions in config/playObj
            // else hide captions
            //logger.info('initializeCaptions - showCaptionsButton:%o buttonState:%o', showCaptionsButton, captions.getAttribute('data-state'));

            if (showCaptionsButton) {
                if (captions.getAttribute('data-state') != 'active')
                    captions.setAttribute('data-state', '');
                $(captions).off('click', toggleClosedCaptions);
                $(captions).on('click', { clicked: true }, toggleClosedCaptions);
            } 
            else {
                // hide CC button
                captions.setAttribute('data-state', 'disabled');
                $(captions).off('click', { clicked: true }, toggleClosedCaptions);
            }
        };

        var toggleClosedCaptions = function(event) {
            //logger.info('toggleClosedCaptions - click:%o', event.data.clicked);

            if (!captionsOn) {
                turnCaptionsOn(event.data.clicked);
            } else {
                turnCaptionsOff(event.data.clicked);
            }

            //logger.info('toggleClosedCaptions - data-state:%o', captions.getAttribute('data-state'));
        };

        var turnCaptionsOn = function(click) {
            //logger.info('turnCaptionsOn - usePlayerCaptions:%o', usePlayerCaptions);

            if (usePlayerCaptions) {
                messenger.sendMessage('captionsOn', { 'index': trackIndex });
            }

            captions.setAttribute('data-state', 'active');
            captionsOn = true;

            captionDisplay.enable();

            if (click)
                measureApp('captionsOn');
        };

        var turnCaptionsOff = function(click) {
            //logger.info('turnCaptionsOff - ');

            if (usePlayerCaptions) {
                messenger.sendMessage('captionsOff');
            }

            captions.setAttribute('data-state', 'inactive');
            captionsOn = false;

            captionDisplay.disable();

            if (click)
                measureApp('captionsOff');
        };

        var setControlsType = function() {
            logger.info('setControlsType video:%o wrapper:%o', videoType, $(state.wrapper));

            $(state.wrapper).removeClass('live_video');
            $(state.wrapper).removeClass('dvr_video');

            rewindBtn.setAttribute('data-state', '');

            if (videoType === constants.LIVE) {
                // disable all VOD control listeners
                //video.removeEventListener('timeupdate');
                //window.removeEventListener('resize');
                //$(progressHolder).off('mousedown touchstart');

                //if(!video.paused) {
                //    videoPlayer.setVideoLive();
                //}
                $(state.wrapper).addClass('live_video');
                playProgressBar.style.width = "100%";
                timeText.setAttribute('data-state', 'none');
                rewindBtn.setAttribute('data-state', 'none');
                setLiveState(true);
            } 
            else if (videoType === constants.DVR) {
                $(state.wrapper).addClass('dvr_video');
                playProgressBar.style.width = "100%";
                setLiveState(true);
            } 
            else if (videoType === constants.VOD) {
                setLiveState(false);
            }

            //set buttons from session (load call)
            //  can set panel and pop_open
            //set display type of panel and pop_open based on video type
            var sessionButtons = getDeep(sessionConfig, 'ui', 'toolbar', 'buttons');

            //logger.info('setControlsType buttons.panel:%o obj:%o', buttons.panel, (typeof buttons.panel === 'object') );
            //logger.info('setControlsType panel:%o ', sessionButtons['panel'] );
            if (sessionButtons && sessionButtons['panel']) {
                if (sessionButtons['panel'].indexOf(videoType) > -1) {
                    $(panelBtn).show();
                }
                else {
                    $(panelBtn).hide();
                }
            }
            else if (typeof buttons.panel.display === 'string') {
                if (buttons.panel.display.indexOf(videoType) > -1) {
                    $(panelBtn).show();
                }
                else {
                    $(panelBtn).hide();
                }
            }

            if (sessionButtons && sessionButtons['pop_open']) {
                logger.info('setControlsType pop_open:%o', sessionButtons['pop_open'] );
                if (sessionButtons['pop_open'].indexOf(videoType) > -1) {
                    $(popOpenBtn).show();
                }
                else {
                    $(popOpenBtn).hide();
                }
            }
            else if (typeof buttons.pop_open.display === 'string') {
                if (buttons.pop_open.display.indexOf(videoType) > -1) {
                    $(popOpenBtn).show();
                }
                else {
                    $(popOpenBtn).hide();
                }
            }

            $(state.container).trigger('player:VideoTypeUpdate', { 'prop': null, 'type': videoType });
        };

        var setLiveState = function(live) {
            if (live)
                liveBtn.setAttribute('data-state', 'active');
            else
                liveBtn.setAttribute('data-state', '');

            if ((!playingLive && live) || (playingLive && !live)) {
                var mode = 'live';
                if (!live) {
                    mode = 'dvr';
                }
                $(state.container).trigger('player:VideoModeUpdate', { 'prop': null, 'mode': mode });
            }

            playingLive = live;
        };

        var liveClickHandler = function() {
            if (!playingLive) {
                setSeekTime(loadedTime);
                setLiveState(true);
                measureApp('live');
            }
        };

        var showControls = function(value, src) {
            if (controls) {
                if (value) {
                    controlsVisible = true;
                    $(controls).removeClass('hidden').addClass('visible');
                    $(state.container).trigger('player:ShowControlsEvent', { 'visible': true });
                } 
                else {
                    controlsVisible = false;
                    $(controls).removeClass('visible').addClass('hidden');
                    $(state.container).trigger('player:ShowControlsEvent', { 'visible': false });
                }
            }
            //logger.info('showControls - value:%o src:%o controls:%o', value, src, controls);
        };

        var showControlsTouch = function(value, src) {
            //logger.info('showControlsTouch - show:%o', value);
            //if(Environment.isMobileDevice()) {
            if (value && (toolbar != 'none' && toolbar != 'default')) {
                $(videoControlsTouch).show();
                $(videoControlsTouch).css({ bottom: 0 });
            } else {
                hideControlsTouch();
            }
            //}
        };

        var hideControlsTouch = function() {
            $(videoControlsTouch).hide();
            $(videoControlsTouch).css({ bottom: -5000 });
        };

        var enableControls = function(value, src) {
            //logger.info('enableControls val:%o controls:%o toolbar:%o src:%o', value, controls, toolbar, src);
            //logger.info('enableControls %o %o', controls, value);
            if (controls) {
                if (value && (toolbar != 'none' && toolbar != 'default')) {
                    $(controls).show();
                    $(controls).css({ bottom: 0 });
                } else {
                    $(controls).hide();
                    $(controls).css({ bottom: -5000 });
                }
            }
        };

        var updateTimeDisplay = function() {
            //logger.info('updateTimeDisplay - live cur:%o dur:%o', currentTime, duration);

            if (videoType === constants.VOD) {
                var nt = currentTime * (100 / duration);
                playProgressBar.value = nt;

                setTimeText(currentTime, duration);
            } 
            else if (videoType === constants.DVR) {
                //logger.info('updateTimeDisplay - dvr cur:%o dur:%o', currentTime, duration);
   
                setTimeText(displayTime, duration);

                if (playingLive && displayTime < duration - 10) {
                    setLiveState(false);
                } 
                else if (!playingLive && displayTime >= duration - 10) {
                    setLiveState(true);
                }

            } 
            else if (videoType === constants.LIVE) {
                // live video stream has Infinity value for duration
                curTimeText.html('');
                durTimeText.html('');
            }
        };

        var setTimeText = function(playTime, durTime) {
            var curhours = Math.floor(playTime / 3600);
            var curmins = Math.floor((playTime - (curhours * 3600)) / 60);
            var cursecs = Math.floor(playTime - (curhours * 3600) - (curmins * 60));

            var durhours = Math.floor(durTime / 60 / 60);
            var durmins = Math.floor((durTime - (durhours * 3600)) / 60);
            var dursecs = Math.floor(durTime - (durhours * 3600) - (durmins * 60));

            //logger.info('updateTimeDisplay - dur:%o hrs:%o mins:%o secs:%o', duration, durhours, durmins, dursecs);

            if (cursecs < 10) { cursecs = "0" + cursecs; }
            if (dursecs < 10) { dursecs = "0" + dursecs; }
            if (curmins < 10) { curmins = "0" + curmins; }
            if (durmins < 10) { durmins = "0" + durmins; }

            var curTime = '';
            var durTime = '';
            timeText.setAttribute('data-state', '');

            if (curhours > 0 || durhours > 0) {
                durTime += (durhours > 0 ? durhours + ':' : '');

                if (curhours > 0) {
                    curTime += curhours + ':';
                } else if (durhours != '') {
                    curTime += '0:';
                }

                timeText.setAttribute('data-state', 'hours');
            }

            if (!isNaN(curmins) || !isNaN(durmins)) {
                curTime += ((!isNaN(curmins)) ? curmins : '00') + ':';
                durTime += ((!isNaN(durmins)) ? durmins : '00') + ':';
            }

            if (!isNaN(cursecs) || !isNaN(dursecs)) {
                curTime += ((!isNaN(cursecs)) ? cursecs : '00');
                durTime += ((!isNaN(dursecs)) ? dursecs : '00');
            }

            curTimeText.html(curTime);
            durTimeText.html(durTime);
        };

        var updatePlayProgress = function() {
            playProgressBar.style.width = ((displayTime / duration) * (progressHolder.offsetWidth)) + "px";
        };

        /**
         * calculate seek time based on scrub position
         * - never let seek fully to 100% so finishes/ends naturally and stop, allowing user restart
         */
        var setScrubPosition = function(clickX) {
            var newPercent = Math.max(0, Math.min(.999999, (clickX - findPosX(progressHolder)) / progressHolder.offsetWidth));

            //logger.info('setScrubPosition - perc:%o', newPercent);
            
            setSeekTime(newPercent * duration);

            playProgressBar.style.width = newPercent * (progressHolder.offsetWidth) + "px";
            updateTimeDisplay();
        };

        /**
         * return the relative X position of mouse in the specified holder
         */
        var findPosX = function(holder) {
            //logger.info('findPosX - fullscreen:%o holder:%o holder.offsetLeft:%o', isVideoFullScreen, holder, holder.offsetLeft)

            //not needed with current controls structure
            //if (isVideoFullScreen)
            //    return holder.offsetLeft;

            var curleft = holder.offsetLeft;
            while (holder = holder.offsetParent) {
                //logger.info('findPosX - cur:%o holder:%o holderOffsetLeft:%o', curleft, holder.offsetParent, holder.offsetLeft);
                curleft += holder.offsetLeft;
            }
            return curleft;
        };

        /**
         * return the relative Y position of mouse in the specified holder
         */
        var findPosY = function(holder) {
            var curtop = holder.offsetTop;
            while (holder = holder.offsetParent) {
                curtop += holder.offsetTop;
            }
            return curtop;
        };

        var playPause = function(measure) {
            //logger.info('playPause - paused:%o ended:%o measure:%o', paused, ended, measure);

            if (paused || ended) {
                if (ended) {
                    setSeekTime(0);
                }
                play();

                if (measure)
                    measureApp('play');
            } else {
                pause();

                if (measure)
                    measureApp('pause');
            }
        };

        var playPauseClick = function() {
            //logger.info('playPauseClick ');
            playPause(true);
        };

        var posterClickHandler = function() {
            logger.info('posterClickHandler - :%o' );
            setPoster(false);
            enableControls(true, 'poster');
            playPauseClick();
        };

        var play = function() {
            //video.play();
            messenger.sendMessage('play');
        };

        var pause = function() {
            messenger.sendMessage('pause');
        };

        var rewindClickHandler = function() {
            seekOffset(-30);
            measureApp('rewind');
        };

        var seekOffset = function(offset) {
            var newTime = currentTime + offset;

            if (newTime < 0)
                newTime = 0;
            else if (newTime > duration)
                newTime = duration;

            setSeekTime(newTime)
        };

        var setSeekTime = function(time) {
            currentTime = time;
            //logger.info('setSeekTime - time:%o duration:%o', time, duration);
            messenger.sendMessage('seek', { 'time': currentTime });
        };

        /**
         * play video event handlers
         */
        var onPlay = function() {
            logger.info('onPlay - ');
            paused = false;
            ended = false;
            setPlayButton();

            //trackPlayProgress();
            //$(controls).removeClass('visible').addClass('hidden');
            showControlsTouch(true, 'onPlay');

            setPoster(false);

            //if(captions.getAttribute('data-state') === 'active') {
            //    videoPlayer.startPollClosedCaptions();
            //}
        };

        /**
         * pause video event handlers
         */
        var onPause = function(_paused) {
            paused = _paused;
            ended = false;
            setPlayButton();

            //stopTrackingPlayProgress();
            //if(captions.getAttribute('data-state') === 'active') {
            //    videoPlayer.stopPollClosedCaptions();
            //}
        };

        /**
         * buffering video event handlers
         */
        var onBuffering = function(_paused) {
            showLoader(true, 'buffer');
        };


        /**
         * handle player complete
         */
        var onComplete = function(show) {
            videoStarted = false;
            if (show)
                setPoster(true, true);

            if (fullscreenManager.isFullscreen()) {
                if (fullscreenManager.fullScreenOff()) {
                    logger.info('onComplete - fullscreenOff - doc: true');
                } 
                else {
                    messenger.sendMessage('fullscreenOff', { 'wrapper': null });
                }
            }
        };

        /**
         * handle fullscreen toggling
         *  tries to enable locally from wrapper element
         *  but if false, then sends message to iframe to try on video tag
         */
        var toggleFullScreen = function() {
            if (fullscreenManager.isFullscreen()) {
                fullscreenManager.fullScreenOff();
            } 
            else {
                var elem = $(state.wrapper)[0];
                //logger.info('toggleFullScreen - try elem:%o', elem);
                $(state.container).trigger('player:FullscreenEvent', { 'state': 'enter' });

                if (fullscreenManager.fullScreenOn(elem)) {
                    logger.info('toggleFullScreen - elem: true');
                } else {
                    logger.info('toggleFullScreen - elem: false');

                    messenger.sendMessage('fullscreenOn', { 'wrapper': null });
                }
                measureApp('enterFullscreen');
            }

            hideExtra();
        };

        /**
         * updates based on fullscreen turning on
         * ?? // this is to make the video full screen only in the browser
         */
        var fullScreenOn = function() {
            logger.info('fullScreenOn - width:%o', $(state.wrapper).width());

            isVideoFullScreen = true;

            //$(controls).removeClass('hidden visible').addClass('fs-control');
            $(state.wrapper).addClass('fullscreen');
            $(fullScreenToggleButton).addClass("fs-active control");
            setFullscreenData(true);

            // Listen for escape key. If pressed, close fullscreen.
            //document.addEventListener('keydown', checkKeyCode, false);

            //hide cursor after goign fullscreen
            cursorTimeout = setTimeout(function() {
                $(videoControlsTouch).addClass('nocursor');
            }, CONTROLS_TIMEOUT + CONTROLS_TRANSITION);

            showControls(false, 'fullscreenOn');
        };

        /**
         * updates based on fullscreen turning off
         *
         */
        var fullScreenOff = function(measure) {
            logger.info('fullScreenOff - width:%o measure:%o', $(state.wrapper).width(), measure);
            $(state.container).trigger('player:FullscreenEvent', { 'state': 'exit' });

            isVideoFullScreen = false;

            $(state.wrapper).removeClass('fullscreen');
            $(fullScreenToggleButton).removeClass("fs-active");
            setFullscreenData(false);
            //$(controls).removeClass('fs-control');

            if (measure)
                measureApp('exitFullscreen');
        };

        /**
         * set css attributes based on fullscreen state
         * ?? resizing
         */
        var setFullscreenData = function(state) {
            var cur = !!state;
            fullScreenToggleButton.setAttribute('data-fullscreen', cur);
            //$(state.wrapper).setAttribute('data-fullscreen', cur);
            // console.log(videoContainer.getAttribute('data-fullscreen'));

            return;

            if (state) {
                $(window).off('throttle.resize.videoPlayer');
                videoContainer.style.height = '';
                videoContainer.style.paddingBottom = '';
                video.style.height = '';
            } else {
                if (isResizable) {
                    videoPlayer.checkResize();
                }
            }
        }

        var checkKeyCode = function(e) {
            logger.info('checkKeyCode - e:%o', e)
            e = e || window.event;
            if ((e.keyCode || e.which) === 27) {
                logger.info('checkKeyCode - exit fullscreen - escape key')
                document.removeEventListener('keydown', checkKeyCode, false);
                measureApp('exitFullscreen');
            }
        };

        /**
         * send muting command to player
         */
        var mute = function(value) {
            messenger.sendMessage('mute', { 'mute': value })
        };

        /**
         * control video muting
         */
        var videoMute = function(event) {
            var measure = typeof event == 'object';

            if (muted) {
                mute(false);
                if (measure)
                    measureApp('unmute');
            } 
            else {
                mute(true);
                if (measure)
                    measureApp('mute');
            }
        };

        var setVolume = function(clickX) {
            //logger.info('setVolume - clickX:%o barLeftX:%o barWidth:%o', clickX, findPosX(volumeHolder), volumeHolder.offsetWidth);

            var newPercent = Math.max(0, Math.min(1, (clickX - findPosX(volumeHolder)) / volumeHolder.offsetWidth));
            messenger.sendMessage('volume', { 'volume': newPercent });
        };

        var updateVolume = function(_muted, _volume) {
            //logger.info('updateVolume - mute:%o vol:%o', _muted, _volume);
            muted = _muted;
            volume = _volume;

            //var vol = video.volume;
            if (muted || volume == 0) {
                volume = 0;
                muteBtn.innerHTML = "Unmute";
                muteBtn.setAttribute('data-state', 'active');
            } else {
                muteBtn.innerHTML = "Mute";
                muteBtn.setAttribute('data-state', '');
            }
            volumeBar.style.width = volume * 100 + "%";
        };

        /**
         * handling click on panel button
         *  -sends external event to let dom handling sizing/display
         */
        var panelClickHandler = function(event) {
            if (panelBtn.getAttribute('data-state') === 'active') {
                panelBtn.setAttribute('data-state', '');
            } 
            else {
                panelBtn.setAttribute('data-state', 'active');
            }

            var open = (panelBtn.getAttribute('data-state') === 'active');

            $(state.container).trigger('player:PanelEvent', { 'open': open });

            hideExtra();

            var measure = typeof event == 'object';
            //logger.info('panelClickHandler - event:%o measure', typeof event, measure);
            if (measure) {
                var action = open ? 'On' : 'Off';
                measureApp('panel' + action);
            }
        };

        /**
         * handling click on pop open button
         */
        var popOpenClickHandler = function() {
            $(state.container).trigger('player:ClickEvent', { 'type': 'popOpen' });
            measureApp('popOpen');
        }

        /**
         * open share controls
         */
        var shareClickHandler = function() {
            var shareParent = $(shareBtn).parent();
            //logger.info('shareClickHandler this:%o par:%o', this, shareParent);

            socialShare.toggleShare();

            hideExtra();
        };

        /**
         * show extra controls view view
         */
        var extraClickHandler = function(e) {
            logger.info('extraClickHandler - %o', $(extraBtn).siblings('.colRow'));
            if (extraBtn.getAttribute('data-state') === 'active') {
                hideExtra();
            } 
            else {
                extraBtn.setAttribute('data-state', 'active');
                $(extraBtn).siblings('.colRow')[0].setAttribute('data-state', 'active');
            }
        }

        var hideExtra = function() {
            extraBtn.setAttribute('data-state', '');
            $(extraBtn).siblings('.colRow')[0].setAttribute('data-state', '');
        }

        /**
         * setup social button handlers
         */
        var setupShareHandlers = function() {
            $(shareBtn).on('video.deselect', function(e) {
                $(this).parent().removeClass('active');
                $videoContainer.find('.share_overlay .socialOverlay').removeClass('active');
                this.setAttribute('data-state', '');
            });

            $(state.wrapper).find('.share_overlay, .share').on('share.close', function(e) {
                $(state.wrapper).find('.social_services .link.open').removeClass('open')
                    .find('.link_url.open').removeClass('open');
                $(shareBtn).attr('data-state', '');
                $(shareBtn).parent().removeClass('active');
            });
        };

        /**
         * handle button presses
         */
        var setupButtonPressHandlers = function() {
            //logger.info('setupButtonPressHandlers - share:%o playBtn:%o panel:%o', shareBtn, playBtn, panelBtn);

            // When the video or play button is clicked, play/pause the video.
            // video.addEventListener('click', this.playPause, false);
            playBtn.addEventListener('click', playPauseClick, false);
            if (rewindBtn)
                rewindBtn.addEventListener('click', rewindClickHandler, false);

            //panel/pip click
            if (panelBtn)
                panelBtn.addEventListener('click', panelClickHandler, false);

            //panel/pip click
            if (popOpenBtn)
                popOpenBtn.addEventListener('click', popOpenClickHandler, false);

            /*
            $(playBtn).bind('touchstart', function (event) {
                logger.info('touchstart');
                playPauseClick();
            }, false);
            */

            // (added) mute control listener
            muteBtn.addEventListener('click', videoMute, false);

            //fullscreen
            if (fullScreenToggleButton)
                fullScreenToggleButton.addEventListener('click', toggleFullScreen, false);

            //share button
            if (shareBtn)
                shareBtn.addEventListener('click', shareClickHandler, false);

            //live button
            if (liveBtn)
                liveBtn.addEventListener('click', liveClickHandler, false);

            //extra button
            if (extraBtn)
                extraBtn.addEventListener('click', extraClickHandler, false);

            /*
            // When the video has concluded, pause it.
            video.addEventListener('ended', function() {
                this.currentTime = 0;
                // show poster image
                this.load();
            }, false);

            */
        }

        /** 
         * Add handlers for showing controls on mouse move
         * - hide controls after half second on transition, allows us to use css transition delay for mouse move and hover
         */
        var addMoveHandlers = function() {
            var dist = 0;

            if (!Environment.isMobileDevice()) {
                $(videoControlsTouch).mousemove(function(event) {
                    //logger.info('addMoveHandler - mousemove lastX:%o', lastMouse.x);
                    if (lastMouse.x) {
                        dist = Math.round(Math.sqrt(Math.pow(lastMouse.y - event.clientY, 2) + Math.pow(lastMouse.x - event.clientX, 2)));

                        $(videoControlsTouch).removeClass('nocursor');
                        if (dist > 4) {
                            lastMouse.x = event.clientX;
                            lastMouse.y = event.clientY;

                            //logger.info('addMoveHandler - vis: %o', controlsVisible);

                            clearTimeout(cursorTimeout);

                            if (!controlsVisible) {
                                showControls(true, 'mouesmove');
                                resetMoveTimeout();
                            }
                            else {
                                resetMoveTimeout();
                            }

                            if (isVideoFullScreen) {
                                cursorTimeout = setTimeout(function() {
                                        $(videoControlsTouch).addClass('nocursor');
                                    }, CONTROLS_TIMEOUT + CONTROLS_TRANSITION);
                            }
                        }
                    } else {
                        lastMouse.x = event.clientX;
                        lastMouse.y = event.clientY;
                    }

                });

                $(controls).hover(
                    function(event){
                        //logger.info('addMoveHandler - controlsHover');
                        controlsHovered = true;
                        clearTimeout(moveTimeout);
                        if (!controlsVisible)
                            showControls(true, 'controlsHover');

                    },
                    function(event){
                        //logger.info('addMoveHandler - mouseleave');
                        controlsHovered = false;
                        moveTimeout = setTimeout(function() {
                                showControls(false, 'hoverTimeout');
                            }, CONTROLS_TIMEOUT);
                    });

            }
        };

        var resetMoveTimeout = function() {
            clearTimeout(moveTimeout);

            if (!controlsHovered) {
                moveTimeout = setTimeout(function() {
                    showControls(false, 'moveTimeout');
                }, CONTROLS_TIMEOUT);
            }
        };

        /**
         * Add handlers for touch controls, for making toolbar visible
         */
        var addMobileTouchHandlers = function() {
            //logger.info('addMobileTouchHandlers - wrapper:%o', $(state.wrapper));
            $(state.wrapper).on('touchstart', function(event) {
                //logger.info('addMobileTouchHandlers - touchstart');
                if (!controlsVisible) {
                    showControls(true, 'addMobile')
                    setTimeout(function() {
                        showControls(false, 'mobileTimeout');
                    }, CONTROLS_TIMEOUT + 2000);
                }
            });


            $(state.wrapper).on('touchend', function(e) {
                //logger.info('addMobileTouchHandlers - touchend');
            });
        };

        /**
         * add handler for seeking on scrubber interaction
         */
        var addScrubTouchHandlers = function() {
            $(progressHolder).on('mousedown touchstart', function(e) {
                playPause(false);

                //logger.info('mousedown - x:%o', e.pageX);

                $(document).on('mousemove.video', function(e) {
                    //logger.info('mousemove.video - x:%o', e.pageX);
                    setScrubPosition(e.pageX);
                }).on('touchmove.touchvideo', function(e) {
                    setScrubPosition(e.originalEvent.touches[0].pageX);
                })

                $(document).on('mouseup.video', function(e) {
                    $(document).off('.video');

                    play();
                    setScrubPosition(e.pageX);
                }).on('touchend.touchvideo', function(e) {
                    $(document).off('.touchvideo');

                    play();
                })

                measureApp('timeline');

                // use as substitue for useCapture = true
                e.stopPropagation();
            })
        };

        /**
         * handle volume scrubbing
         */
        var addVolumeScrubHandler = function() {
            $(volumeHolder).on('mousedown', function(e) {
                if (muted) {
                    messenger.sendMessage('volume', { 'volume': 0 })
                    videoMute();
                    muteBtn.innerHTML = "Mute";
                }

                //logger.info('addVolumeScrubHandler - mousedown - pageX:%o', e.pageX);
                $(document).on('mousemove.volume', function(e) {
                    setVolume(e.pageX);
                });

                $(document).on('mouseup.volume', function(e) {
                    $(document).off('.volume');
                    setVolume(e.pageX);
                });

                e.stopPropagation();
            });
        };

        /**
         * pass measurement data
         */
        var measureApp = function(value) {
            $(state.container).trigger('player:MeasureEvent', { 'prop': null, 'values': value });
        };

        /**
         * handle ad events
         */
        var onAdStart = function() {
            showLoader(false, 'adstart');
            setPoster(false);
            enableControls(false, 'onAdStart');
            showControlsTouch(false, 'onAdStart');
        };

        var onAdEnd = function(data) {
            //showLoader(false, 'adstart');
            //playerPoster.hide();
            enableControls(true, 'onAdEnd');
            showControlsTouch(true, 'onAdEnd');
            if (data.position === 'postroll')
                onComplete(true);
        };

        /**
         * handle setting different states of post and play button within poster
         */
        var setPoster = function(poster, button) {
            logger.info('setPoster - poster:%o button:%o', poster, button);
            if (poster) {
                $(playerPoster).show();
                showControlsTouch(false, 'poster');
                if (button) {
                    $(playerPoster).find('img').show();
                }
                else {
                    $(playerPoster).find('img').hide();
                }

                enableControls(false, 'poster');
                $(playerPoster).on('click', posterClickHandler);
            }
            else {
                $(playerPoster).hide();
                $(playerPoster).find('img').show();

                $(playerPoster).off('click', posterClickHandler);
            }
        }
        
        /**
         * return deep property or undefined
         */
        var getDeep = function() {
            var obj = arguments[0];

            for (var i = 1, j = arguments.length; i < j; i++){
                obj = _.propertyOf(obj)(arguments[i]);
            }

            return obj;
        };

        api.reset = function() {
            //logger.info('reset');
            currentTime = 0;
            showControls(false, 'reset');
            enableControls(false, 'reset');
        };

        api.resetToolbar = function() {
            panelBtn.setAttribute('data-state', '');
        };

        api.setStreamInfo = function(data) {
            streamInfo = data.info;
            logger.info('setStreamInfo - data:%o toolbar:%o', data, toolbar);

            sessionConfig = data.config || {};

            logger.info('setStreamInfo - sessionConfig:%o', sessionConfig);
            
            
            videoType = configVideoType = data.streamType;
            videoTypeFixed = data.typeFixed;
            showCaptionsButton = false;
            captionsOnDefault = false;

            // set track info from playObj, turn button on
            //  if no tracks, but data.captions is available, also initialize captions
             
            //else if (data.captions) {
            //    captionsSetting = data.captions;
            //}

            //enable captions by default and select track if specified,
            //  otherwise disable captions by defualt
            if (data.tracks) {
                logger.info('setStreamInfo - captionsEnabled:%o', data.captionsEnabled);

                if (data.tracks.length > 0) {
                    for (var i = 0; i < data.tracks.length; i++) {
                        if (data.tracks[0].type == 'captions')
                            showCaptionsButton = true;
                    }
                }

                if(data.captionsEnabled >= 1) {
                    api.enableTextTracks(true, data.captionsEnabled - 1);
                    captionsOnDefault = true;
                    turnCaptionsOn();
                }
                else if(data.captionsEnabled){
                    api.enableTextTracks(true, -1);
                    captionsOnDefault = true;
                    turnCaptionsOn();
                }
            }
            else if(data.captionsEnabled){
                captionsOnDefault = true;
                api.enableTextTracks(true, -1);
            }
            else {
                api.enableTextTracks(false, -1);
                turnCaptionsOff();
            }

            videoStarted = false;
            enableControls(false, 'setStreamInfo');

            initializeCaptions();
            setControlsType();

            logger.info('setStreamInfo - social - info:%o', streamInfo);
            socialShare.close();
            socialShare.loadSocialVideo(state.wrapper, streamInfo.link, streamInfo.type, streamInfo.title, streamInfo.title);

            autoPlay = data.autoPlay;

            if (autoPlay) {
                showLoader(true, 'setstream');
            }
            hideControlsTouch();
            setPoster(false);
            captionDisplay.disable();

            if (data.poster)
                $(playerPoster).css('background-image', 'url(' + data.poster + ')');
        };

        api.enable = function(value) {
            enableControls(value, 'enable');
        };

        api.seekTime = function(time) {
            if (time < 0)
                time = 0;
            setSeekTime(time);
        };

        api.pause = function(measure) {
            playPause(measure);
        };

        api.resume = function(measure) {
            playPause(measure);
        };

        api.mute = function(_muted) {
            if (muted && !_muted) {
                videoMute();
            } 
            else if (!muted && _muted) {
                videoMute();
            }
        };

        /**
         * enable text tracks based on parsed track data in playObj (in Main)
         *  - allows to turn on by default if Main find track with state of 'enabled'
         *  - trackIndex sent as -1 if captions should be enabled, but not turned on
         */
        api.enableTextTracks = function(enabled, _trackIndex) {
            trackIndex = _trackIndex;
            logger.info('enableTextTracks - enabled:%o index:%o capOn:%o', enabled, trackIndex, captionsOn);

            if (!enabled) {
                captions.setAttribute('data-state', 'disabled');
            } 
            else {
                if (trackIndex >= 0) {
                    turnCaptionsOn();
                } 
                else {
                    if (captionsOn) {
                        trackIndex = 0;
                        turnCaptionsOn();
                    }
                    else if (trackIndex != -1){
                        trackIndex = 0;
                        turnCaptionsOff();
                    }
                }
            }
        };

        api.buttonClick = function(button) {
            if (button == 'panelBtn') {
                panelClickHandler(false);
            }
        };

        api.keyEntry = function(e) {
            //logger.info('keyEntry - e:%o', e);
            if (e.key === ' ' && keyboard['space'] == 'pause'){
                api.pause(true);
            }
        };

        init();
        return api;
    }

    //console.log('PlayerManager: par:%o', window.eventsPlayer.player);
    window.eventsPlayer.view.PlayerControls = PlayerControls;
}(jQuery));;

/*
	Source: build/PlayerHlsjs.js
*/
function PlayerHlsjs(_holder, _controls, _namespace) {
    var api = new Object();
    var self = this;
    var localport = (location.port !== '80') ? ':' + location.port : '';
    var namespace = _namespace;
    var localorigin = location.protocol + '//' + document.domain + localport + '/' + namespace;
    var controls = _controls;
    var logger = new eventsCore.util.Logger('PlayerHlsjs');

    var techName = 'hlsjs';
    var playerId = 'events-video-obj';
    var holder = _holder;
    var constants = eventsPlayer.PlayerConstants;

    var playObj;
    var player; //player object
    var hls;

    var qosData;
    var subtitles; //array of subtitles

    var activeUri;
    var streamType; //Live or Vod
    var segmentsLength; //number of segments
    var tech;
    var detectedStreamType;
    var detectedTech;
    var fullscreenManager;
    var analyticsConviva;
    var analyticsAkamai;
    var analyticsYoubora;
    var ima;
    var currentCues = [];
    var curCue;

    var captionsEnabled = false;
    var captions608display = false;
    var useInbandTrack = true;
    var curVolume;
    var muted;
    var defaultVolume = .8;
    var endIncrement = 0;
    var videoEnded = false;
    var firstPlay = false;
    var adPlaying = false;
    var isLive = false;
    var currentTime = 0;
    var previousCurrentTime = 0;
    var duration = 0;
    var lastDuration = 0;
    var targetOffset = 0;
    var previousDuration = 0;
    var adjustedDuration = 0;
    var previousadjustedDuration = 0;
    var hlsjsDuration = 0;
    var syncCount = 3;
    var errorCount = 0;
    var errorLevelCount = 0;
    var errorMax = 1;
    var dvrStart;
    var dvrEnd;
    var trackList;
    var trackIndex;
    var currentTrack;
    var forceNativeCaption = false; //until pass captions to our custom display, force native display
    var minDvrStreamLength = 180;
    var maWrapper;
    var quicCount;
    var httpCount;
    var deliveryMode;

    var BASE_CUE_LINE = 12;

    var hlsConfigDefault = {
        capLevelToPlayerSize: true
        //debug: true,
        //maxBufferHole: 20,
        //lowBufferWatchdogPeriod: 0,
        //highBufferWatchdogPeriod: 10
        //nudgeMaxRetry: 10
    };
    var hlsConfig = {

    };

    var counters = {};
    // Configuration object for the MediaAccelerationHlsJsWrapper. 
    var maConfig = {};

    logger.info('constructor:%o holder:%o player:%o', self, holder, player);

    $(window).resize(function() {
        onResize();
    });

    var init = function() {

        $('#' + holder).html();
        setPoster(false);

        resetVideo();

        setTimeout(sendReady, 100);

        onResize();
    };

    var load = function(_playObj) {
        subtitles = [];
        qosData = null;
        detectedStreamType = null;
        useInbandTrack = true;
        endIncrement = 0;
        videoEnded = false;
        firstPlay = false;

        isLive = false;
        currentTime = 0;
        previousCurrentTime = 0;
        duration = 0;
        adjustedDuration = 0;
        previousadjustedDuration = 0;
        hlsjsDuration = 0;
        lastDuration = 0;
        previousDuration = 0
        dvrStart = null;
        dvrEnd = null;
        trackList = null;
        currentTrack = null;
        trackIndex = null;
        errorCount = 0;
        errorLevelCount = 0;
        quicCount = 0;
        httpCount = 0;
        deliveryMode = '';

        playObj = _playObj;

        hlsConfig = _.clone(hlsConfigDefault);
        hlsConfig = _.extend(hlsConfig, playObj.hlsjsConfig);
        counters = {
          quicResponses: 0,
          httpResponses: 0,
        };

        // Configuration object for the MediaAccelerationHlsJsWrapper.
        maConfig = {
          counters: counters,
          countersCallback: countersCallback
        };

        logger.info('********************');
        logger.info('load - playObj:%o auto:%o hlsjsConfig:%o', playObj, playObj.autoPlay, hlsConfig);

        if (typeof hls !== 'undefined') {
            hls.destroy();
        }

        resetVideo();

        if (playObj.poster) {
            $('.poster').css("background-image", "url(" + playObj.poster + ")");  
        }

        if (playObj.autoPlay) {
        	setPoster(false);
        	initAnalytics();
        	continueLoad();
        }
        else {
        	setPoster(true, true);
            continueLoad();
        	$('.wrapper').on('click', function(event) {
                logger.info('wrapper click');
                $('.wrapper').off('click');
                setPoster(false);
                initAnalytics();
                video.play();
            });
        }

    };

    var continueLoad = function() {
    	if (Hls.isSupported() && playObj.mimeType == 'application/x-mpegURL') {
            
            if (!playObj.akamaiAcceleration || playObj.cdn.toLowerCase() != 'akamai') {
            	logger.info('continueLoad - using standard hls.js - akAcc:%o cdn:%o', playObj.akamaiAcceleration, playObj.cdn);
            	hls = new Hls(hlsConfig);
            }
            else {
            	logger.info('continueLoad - using akamai media acceleration - akAcc:%o cdn:%o maConfig:%o', playObj.akamaiAcceleration, playObj.cdn, maConfig);
	            try {
	                // Initialize the MediaAccelerationHlsJsWrapper. 
	                maWrapper = new MediaAccelerationHlsJsWrapper(maConfig, hlsConfig);
	                hls = maWrapper.getPlayer();   
	            } catch (e) {
	                // The MediaAccelerationHlsJsWrapper throws a MediaAccelerationPlayerWrapperError in case of 
	                // an incompatible player setup, e.g., missing `Hls` object in the environment. 
	                // If such an error is thrown, please fix the setup.
	                // Please contact the Akamai MAE team for more details.
	                logger.error("An error occurred while initializing the MediaAccelerationHlsJsWrapper: ", e);
	                throw e;
	                return;
	            };
	        }

	        logger.info('continueLoad - hlsConfig:%o loader:%o', hlsConfig, hlsConfig.loader);
            //video.src = playObj.url;
            hls.attachMedia(video);

            hls.on(Hls.Events.MEDIA_ATTACHED, function() {
                logger.info("video and hls.js are now bound together !");

                hls.loadSource(playObj.url);

                hls.on(Hls.Events.MANIFEST_PARSED, function(event, data) {
                    logger.info('MANIFEST_PARSED - data:%o autoplay:%o adPlaying:%o', data, playObj.autoPlay, adPlaying);
                    if (!adPlaying && playObj.autoPlay){
                        logger.info('MANIFEST_PARSED - play');
                        video.play();
                    }
                });
            });

            hls.on(Hls.Events.LEVEL_LOADED, function(event, data) {
                isLive = data.details.live;

                //targetOffset is the target # numer of fragments from the live edge (3) times the fragment duration
                //  i.e. - 3 * 10 = 30
                targetOffset = syncCount * data.details.targetduration;

                //duration as reported from hlsjs fragment load
                hlsjsDuration = data.details.totalduration;
                adjustedDuration = hlsjsDuration - targetOffset;

                errorLevelCount = 0;

                logger.info('LEVEL_LOADED - data:%o adjustedDuration:%o targetOffset:%o', data, adjustedDuration, targetOffset);
            });

            hls.on(Hls.Events.FRAG_PARSING_USERDATA, function(event, data) {
                //logger.info('FRAG_PARSING_USERDATA - data:%o tracks:%o', data, $('video')[0].textTracks);

                for (var i = 0; i < data.samples.length; i++) {
                    var ccdatas = extractCea608Data(data.samples[i].bytes);
                    if (ccdatas.length > 0)
                        receive608(data.samples[i].pts, ccdatas);
                }
            });

            hls.on(Hls.Events.ERROR, function(event, data) {
                var errorType = data.type;
                var errorDetails = data.details;
                var errorFatal = data.fatal;

                if (data.fatal) {
                	if (errorCount < errorMax){
	                    switch (data.type) {
	                        case Hls.ErrorTypes.NETWORK_ERROR:
	                            // try to recover network error
	                            logger.error('ERROR - recover - type:%o detail:%o fatal:%o', errorType, errorDetails, errorFatal);
	                            hls.startLoad();
	                            errorCount++;

                                //force error report if manifest error
                                if (errorDetails == Hls.ErrorDetails.MANIFEST_LOAD_ERROR) {
                                    //logger.error('ERROR - recover - response:%o', data.response.code);
                                    errorCount = 0;
                                    onError(data);
                                }
	                            break;
	                        case Hls.ErrorTypes.MEDIA_ERROR:
	                            logger.error('ERROR - recover - type:%o detail:%o fatal:%o', errorType, errorDetails, errorFatal);
	                            hls.recoverMediaError();
	                            errorCount++;
	                            break;
	                        default:
	                            logger.error('ERROR - fail - type:%o detail:%o fatal:%o', errorType, errorDetails, errorFatal);
	                            onError(data);
	                            break;
	                    }
	                }
	                else {
	                	logger.error('ERROR - fail_max - type:%o detail:%o fatal:%o', errorType, errorDetails, errorFatal);
	                	errorCount = 0;
	                	onError(data);
	                }
                }
                else {
                	logger.warn('ERROR - type:%o detail:%o', errorType, errorDetails);

                    //check for more than 10 level load errors and consider fatal
                    if (errorDetails == Hls.ErrorDetails.LEVEL_LOAD_ERROR) {
                        errorLevelCount++;
                        if (errorLevelCount > 10) {
                            errorLevelCount = 0;
                            onError(data);
                        }
                    }
                }
            });

        } 
        else if (playObj.mimeType == 'video/mp4') {
            $(video).attr("src", playObj.url);
            if (!adPlaying && playObj.autoPlay){
                video.play();
            }
        } 
        else if (!Hls.isSupported()) {
            logger.error('continueLoad - hls not supported by hlsjs on this platform');

            var playerEvent = new eventsPlayer.commons.ErrorEvent();
            playerEvent.message = 'hls not supported by hlsjs on this platform';
            playerEvent.stack = '';
            playerEvent.code = '100';

            sendMessage(playerEvent, localorigin);
            playerEvent = null;
        }
    };

    var resetVideo = function() {
        var ctrls = (controls === 'default') ? 'controls' : '';

        $('#' + holder).children().filter("video").each(function() {
            this.pause();
            delete this;
            $(this).remove();
            video = null;
        });

        var trackTags = '';
        if (playObj && playObj.tracks && playObj.tracks.length >= 1) {
            trackTags += '<track kind="' + playObj.tracks[0]['type'] + '" srclang="en" src="' + playObj.tracks[0]['file'] + '" label="' + playObj.tracks[0]['label'] + '"></track>';
            //force to default display if using track elem with vtt file.  may be possible to do custom display with text from cuechange event for custom display eventually
            playObj.captions = 'default';
        }

        $('#' + holder).append(
            '<video id="' + playerId + '" class="video-responsive" ' + ctrls + '>' +
            trackTags +
            '</video>'
        );

        video = $('#' + playerId)[0];

        logger.info('resetVideo - holder:%s video:%o', $('#' + holder), video);

        video.addEventListener('resize', handleVideoEvent);
        video.addEventListener('seeking', onSeeking);
        video.addEventListener('seeked', onSeeked);
        video.addEventListener('canplay', handleVideoEvent);
        video.addEventListener('canplaythrough', handleVideoEvent);
        video.addEventListener('ended', onEnded);
        video.addEventListener('playing', onPlaying);
        video.addEventListener('error', onError);
        video.addEventListener('loadeddata', handleVideoEvent);
        video.addEventListener('durationchange', handleVideoEvent);

        video.addEventListener('pause', onPaused);
        video.addEventListener('play', onPlay);
        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('volumechange', onVolumeChange);
    };

    var initAnalytics = function() {
        var analytics = playObj.analytics;
        var touchstone = eventsCore.util.getUrlParam('touchstone') && eventsCore.util.getUrlParam('touchstone').length >= 0;

        logger.info('initAnalytics - analytics:%o conviva:%o elem:%o', analytics, playObj.streamType, video);

        if (!analyticsConviva && analytics.convivaData && analytics.convivaData.enable[playObj.streamType]) {
            logger.info('initAnalytics - Conviva enabled:%o', analytics.convivaData.enable[playObj.streamType]);
            //analytics values
            analyticsConviva = new eventsPlayer.control.AnalyticsConvivaHtml5(analytics.convivaData, touchstone);
        }

        if (analyticsConviva && analytics.convivaData.enable[playObj.streamType]) {
            analytics.convivaData.name = playObj.title;
            analytics.convivaData.url = playObj.url;
            analytics.convivaData.video = video;
            analytics.convivaData.channelName = playObj.channel;
            analytics.convivaData.renderer = 'hlsjs';
            analytics.convivaData.cdn = playObj.cdn;
            analytics.convivaData.playerName = 'HTML5';
            analyticsConviva.startSession(analytics.convivaData);
        }

        if (!analyticsAkamai && analytics.akamaiData.enable[playObj.streamType]) {
            analyticsAkamai = new eventsPlayer.control.AnalyticsAkamai(player, analytics.akamaiData);
        }

        if (!analyticsYoubora && analytics.youboraData && analytics.youboraData.enable) {
            analyticsYoubora = new eventsPlayer.control.AnalyticsYoubora(player, analytics.youboraData);
        }
    };

    var recordEvent = function(data) {
        logger.info('recordEvent - conv:%o data:%o', analyticsConviva, data);
        if (data.service.toLowerCase() == 'conviva' && analyticsConviva) {
            analyticsConviva.sendEvent(data.name, data.data);
        }
    };

    var handleVideoEvent = function(evt) {
        var data = '';
        //logger.info('handleVideoEvent - event:%o type:%o', evt, event.type);

        switch (evt.type) {
            case 'durationchange':
                if (evt.target.duration - lastDuration <= 0.5) {
                    // some browsers reports several duration change events with almost the same value ... avoid spamming video events
                    return;
                }
                lastDuration = evt.target.duration;
                data = Math.round(evt.target.duration * 1000);
                break;
            case 'resize':
                data = evt.target.videoWidth + '/' + evt.target.videoHeight;
                break;
            case 'loadeddata':
            case 'canplay':
            case 'canplaythrough':
            case 'playing':
            case 'stalled':
            case 'error':
                
                // case 'progress':
                //   data = 'currentTime:' + evt.target.currentTime + ',bufferRange:[' + this.video.buffered.start(0) + ',' + this.video.buffered.end(0) + ']';
                //   break;
            default:
                break;
        }
    };

    /**
     * look for inband tracks/track elements and notify player controls
     */
    var setupTextTracks = function(src) {
        var inband = [];
        var textTrack;

        trackList = $('video')[0].textTracks;
        //logger.info('setupTextTracks - tracks:%o', trackList);

        for (var i = 0; i < trackList.length; i++) {
            //logger.info('setupTextTracks - index:%o', i);
            textTrack = trackList[i];

            if (textTrack.kind == 'captions') {
                logger.info('setupTextTracks - src:%o textTrack:%o', src, textTrack);

                //textTrack.mode = 'showing';

                inband.push({
                    'label': textTrack.label,
                    'language': textTrack.language,
                    'kind': textTrack.kind,
                    'index': i
                });

                textTrack.oncuechange = function() {
                    onCueChange(this);
                };
            }
        }

        if (inband.length > 0) {
            var playerEvent = new eventsPlayer.commons.TextTrackEvent();
            playerEvent.data = inband;

            sendMessage(playerEvent, localorigin);
            playerEvent = null;
        }

        if (trackIndex && !currentTrack) {
            enableTextTracks(trackIndex);
        }
    };

    /**
     * turns on text track with the index value specified
     *
     * PARAM values
     * index
     */
    var enableTextTracks = function(index) {
        trackIndex = index;

        if (trackList && trackList.length >= 1 && trackList[index]) {
            currentTrack = trackList[index];
        }

        if (forceNativeCaption || playObj.captions == 'default') {
            logger.info('enableTextTracks - default - trackIndex:%o', trackIndex);
            captions608display = false;
            if (currentTrack)
                currentTrack.mode = 'showing';
        }

        //set enabled flag and change display mode of first inband track if exists
        //  custom608 display only works for inband native 608
        else if (playObj.captions == 'custom') {
            logger.info('enableTextTracks - custom - trackIndex:%o', trackIndex);
            captions608display = true;
            if (currentTrack)
                currentTrack.mode = 'hidden';
        }
    };

    /**
     * disable text track
     */
    var disableTextTracks = function() {
        logger.info('disableTextTracks');
        var textTrack;

        if (playObj.captions == 'default') {
            trackIndex = null;
            if (currentTrack) {
                currentTrack.mode = 'hidden';
                currentTrack = null;
            }
        } else if (playObj.captions == 'custom') {
            captions608display = false;
        }
    };

    var onCueChange = function() {
        try {
            var cue = $('video')[0].textTracks[0].activeCues[0];
            var text = '';

            //logger.info('onCueChange - cur:%o cue:%o', curCue, cue);

            if (cue && (!curCue || cue.id != curCue.id)) {
                curCue = cue;
                text = cue.text;
                $('video')[0].textTracks[0].activeCues[0].line = BASE_CUE_LINE;
                $('video')[0].textTracks[0].activeCues[0].text = '';
                $('video')[0].textTracks[0].activeCues[0].text = text;
            }
        } catch (e) {

        }
    };

    var receive608 = function(time, data) {
        //logger.info('receive608 - time:%o data:%o id:%o', time, data, adjustedDuration);

        if (detectedStreamType == constants.DVR) {
            //time += adjustedDuration;
        }

        if (playObj.captions == 'custom') {
            var playerEvent = new eventsPlayer.commons.CaptionEvent();
            playerEvent.time = time;
            playerEvent.data = data;
            sendMessage(playerEvent, localorigin);
            playerEvent = null;
        }
    };

    var onPlaying = function() {
        setPoster(false);

        if (analyticsAkamai) {
            analyticsAkamai.onBufferEnd();
        }
    };

    var onPlay = function(data) {
        videoEnded = false;

        if (!firstPlay) {
            firstPlay = true;

            var playerEvent = new eventsPlayer.commons.PlayEvent();
            sendMessage(playerEvent, localorigin);

            if (muted) {
                video.muted = muted;
            }

            if (!curVolume) {
                video.volume = defaultVolume;
                curVolume = defaultVolume;
            } else {
                video.volume = curVolume;
            }
        }

        var playerEvent = new eventsPlayer.commons.PauseEvent();
        playerEvent.paused = false;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;

        if (analyticsAkamai) {
            analyticsAkamai.onPlay();
        }
    };

    var onPaused = function(data) {
        var playerEvent = new eventsPlayer.commons.PauseEvent();
        playerEvent.paused = true;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;

        if (analyticsAkamai) {
            analyticsAkamai.onPause();
        }
    };

    var onTimeUpdate = function(time) {
        var playerEvent = new eventsPlayer.commons.TimeUpdateEvent();

        //logger.info('onTimeUpdate - video.dur:%o reportedDur:%o video.cur:%o', round(video.duration), adjustedDuration, round(video.currentTime));

        if (isLive) {
            //set initial previousDuration
            if (previousDuration == 0) {
                previousDuration = video.duration;
            }


            if (previousDuration > hlsjsDuration) {
                dvrEnd = previousDuration - targetOffset;
                dvrStart = previousDuration - hlsjsDuration;
            }
            //or expanding window
            else {
                dvrEnd = previousDuration - targetOffset;
                dvrStart = 0;
            }

            //if current is greate then end, adjust end
            if (dvrEnd < video.currentTime) {
                dvrEnd = video.currentTime;
            }

            //calculate duration sent to controls for display
            duration = dvrEnd - dvrStart;
            //use video currentTime
            currentTime = video.currentTime;

            //account for times outside bounds
            if (currentTime < 0) {
                currentTime = dvrEnd;
            } else if (currentTime < dvrStart) {
                currentTime = dvrStart;
            }

            // logger.info('onTimeUpdate -' +
            // 	//'seekEnd:' + video.seekable.end(video.seekable.length-1) + 
            // 	' video.duration:' + round(video.duration) + 
            // 	' video.current:' + round(video.currentTime) + 
            // 	' hlsjsDur:' + round(hlsjsDuration) + 
            // 	//' duration:' + round(duration) + 
            // 	//' adjDur:' + round(adjustedDuration) + 
            // 	' start:' + round(dvrStart) + 
            // 	' end:' + round(dvrEnd) + 
            // 	' curr:' + round(currentTime) + 
            // 	//'pcur:' + round(previousCurrentTime) + 
            // 	//'perc:' + round(currentTime/duration) + 
            // 	''
            // );

            if (previousDuration < video.duration && previousCurrentTime > 0) {
                previousDuration += (currentTime - previousCurrentTime);
                //logger.info('onTimeUpdate - prev:%o', previousDuration);
            }
            previousCurrentTime = currentTime;

        } else {
            currentTime = video.currentTime;
            duration = video.duration;
        }

        //logger.info('onTimeUpdate - cur:%o dvrStart:%o dvrEnd:%o  ', currentTime, dvrStart, dvrEnd  );
        //logger.info('onTimeUpdate - cur:%o dvrStart:%o dvrEnd:%o  ', relCurrentTime, relDvrStart, relDvrEnd  );

        if (!detectedStreamType && currentTime > 0) {
            if (isLive && currentTime > minDvrStreamLength) {
                detectedStreamType = constants.DVR;
            } else if (isLive) {
                detectedStreamType = constants.LIVE;
            } else if (isFinite(video.duration)) {
                detectedStreamType = constants.VOD;
            }

            if (analyticsYoubora) {
                analyticsYoubora.setStreamType((detectedStreamType != constants.VOD));
            }

            logger.info('onTimeUpdate - type:%o isLive:%o current:%o', detectedStreamType, isLive, currentTime);
        }

        playerEvent.start = 0;

        if (detectedStreamType == constants.DVR) {
            playerEvent.time = currentTime;
            playerEvent.duration = duration;
            playerEvent.start = dvrStart;
            playerEvent.loadedTime = dvrEnd;
            //if (playerEvent.time > playerEvent.duration)
            //    playerEvent.time = playerEvent.duration;
            //adjustedDuration = playerEvent.duration;
        } else {
            playerEvent.time = currentTime;
            playerEvent.duration = duration;
        }

        //update player event with addtl info
        var buffered = [];
        for (var i = 0; i < video.buffered.length; i++) {
            buffered.push({ 'start': video.buffered.start(i), 'end': video.buffered.end(i) })
        }
        playerEvent.buffered = buffered;
        playerEvent.detectedStreamType = detectedStreamType;
        //playerEvent.programDateTime = player.currentProgramDateTime;

        try {
            var rendition = hls.levels[hls.currentLevel];
            if (activeUri !== rendition.url[0]) {
                //logger.info('onTimeUpdate - active:%o', rendition.url[0]);
                updateQosData();
            }
        } catch (e) {
            //logger.error('onTimeUpdate - %o', e);
        }
        //logger.info('onTimeUpdate - qos:%o', qosData);
        playerEvent.qos = qosData;

        //send the playerEvent message
        sendMessage(playerEvent, localorigin);
        playerEvent = null;

        //check for end of stream if don't get ended event for vod
        if (detectedStreamType == constants.VOD && duration - currentTime < 0.05) {
            if (endIncrement > 10) {
                onEnded();
            } else {
                endIncrement++;
            }
        }
    };

    var countersCallback = function(counters) {
        logger.info("countersCallback - quic:%o http:%o", counters.quicResponses, counters.httpResponses);
        if (counters.quicResponses > quicCount && deliveryMode != 'quic') {
            quicCount = counters.quicResponses;
            deliveryMode = 'quic';
            var data = {
                'service': 'conviva',
                'name': 'delivery',
                'data': {'type':'quic'}
            }
            recordEvent(data);
        }
        else if (counters.httpResponses > httpCount && deliveryMode != 'http') {
            httpCount = counters.httpResponses;
            deliveryMode = 'http';
            var data = {
                'service': 'conviva',
                'name': 'delivery',
                'data': {'type':'http'}
            }
            recordEvent(data);
        }
      }

    var sendMetadata = function() {
        var playerEvent = new eventsPlayer.commons.MetadataEvent();
        //playerEvent.aspect = player.aspectRatio();
        // playerEvent.live = player.live;
        // playerEvent.dvr = player.dvr;
        //playerEvent.width = player.videoWidth();
        //playerEvent.height = player.videoHeight();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var updateQosData = function() {
        var data = new eventsPlayer.commons.QosData();
        //data.frameRate = player.frameRate;
        data.playRate = 'NA';

        var activeRendition = hls.levels[hls.currentLevel];
        var qos = {};
        qos.renderer = 'html5';

        //logger.info('updateQosData - activeRendition:%o activeLevel:%o', activeRendition, hls.currentLevel);
        if (activeRendition) {
            activeUri = activeRendition.url[0];
            var path = activeUri.substring(0, activeUri.lastIndexOf('/') + 1);
            var manifest = activeUri.replace(path, '');

            qos.path = path;
            qos.manifest = manifest;
            qos.activeRendition = hls.currentLevel + 1;
            qos.totalRenditions = hls.levels.length;
            qos.bandwidth = activeRendition.bitrate;
            qos.resolution = activeRendition.width + 'x' + activeRendition.height;
            qos.codecVideo = activeRendition.videoCodec;
            qos.codecAudio = activeRendition.audioCodec;

            if (analyticsConviva) {
            	analyticsConviva.reportBitrate(activeRendition.bitrate/1000);
            }
            if (analyticsAkamai) {
                analyticsAkamai.onBitrate(activeRendition.bitrate/1000);
            }
        }

        //var timeRange = player.buffered();
        //logger.info('buffer - buffered start:%o end:%o', timeRange.start(0), timeRange.end(0));
        //logger.info('updateQosData - Qos framerate:%o playrate:%o qos:%o', data.frameRate, data.playRate, data);
        qosData = qos;
    };

    var getPlaylist = function() {
        var master = hls.playlists.master;
        var renditions = [];
        var data;
        var codecs;

        logger.info('getPlaylist - master:%o playerHls:%o', master, hls.playlists);

        masterUri = master.uri;
        if (master.playlists[0].playlistType)
            streamType = master.playlists[0].playlistType;
        if (master.playlists[0].segments)
            segmentsLength = master.playlists[0].segments.length;

        for (var i = 0; i < master.playlists.length; i++) {
            data = {};
            data.id = master.playlists[i].attributes['PROGRAM-ID'];
            data.bandwidth = master.playlists[i].attributes.BANDWIDTH;
            data.uri = master.playlists[i].uri;
            data.resolution = {};
            data.codecs = {};

            if (master.playlists[i].attributes.RESOLUTION) {
                data.resolution.width = master.playlists[i].attributes.RESOLUTION.width;
                data.resolution.height = master.playlists[i].attributes.RESOLUTION.height;
            } else {
                data.resolution.width = 0;
                data.resolution.height = 0;
            }

            if (master.playlists[i].attributes.CODECS) {
                codecs = master.playlists[i].attributes.CODECS.split(',');
                data.codecs.video = codecs[0];
                data.codecs.audio = codecs[1];
            } else {
                data.codecs.video = 'N/A';
                data.codecs.audio = 'N/A';
            }

            renditions.push(data);

            if (data.uri === activeUri) {
                activeRenditionIndex = i;
            }
        }

        return renditions;
    };


    var onCanPlay = function(data) {
        logger.info('onCanPlay - ');
    };

    var onLoadedMetadata = function(data) {
        logger.info('onLoadedMetadata - %o tracks:%o', data, $('video')[0].textTracks);

        if ($('video')[0].textTracks) {
            setupTextTracks('video');
        }

        $('video')[0].textTracks.onaddtrack = function() {
            setupTextTracks('added');
        };

        sendMetadata();

        if (analyticsAkamai) {
            analyticsAkamai.loadedmetadata(playObj.title, 'hlsjs', 'testId');
        }
    }

    var onLoadedData = function(data) {
        logger.info('onLoadedData - data:%o', data);
        //logger.info('onLoadedMetadata - tracks:%o remtracks:%o', player.textTracks(), player.remoteTextTracks());
        updateQosData();

    };

    var onVolumeChange = function(data) {
        //logger.info('onVolumeChange - muted:%o vol:%o', player.muted(), player.volume());

        muted = video.muted;
        curVolume = video.volume;

        var playerEvent = new eventsPlayer.commons.VolumeEvent();
        playerEvent.muted = muted;
        playerEvent.volume = curVolume;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onWaiting = function(data) {
        //logger.info('onWaiting - %o buffered:%o start:%o', data, player.buffered);
        var playerEvent = new eventsPlayer.commons.BufferingEvent();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;

        if (analyticsAkamai) {
            analyticsAkamai.onBufferStart();
        }
    };

    var onEnded = function(data) {
        //setPoster(true, true);

        var playerEvent = new eventsPlayer.commons.CompleteEvent();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;

        //allow play event if restart after end
        firstPlay = false;

        if (analyticsAkamai) {
            analyticsAkamai.onEnded();
        }
    };

    var onStalled = function(data) {
        //logger.info('onStalled - %o', data);
    };

    var onSeeking = function(data) {
        previousCurrentTime = 0;
        logger.info('onSeeking - data.%o cur:%o', data, video.currentTime);
    };

    var onSeeked = function(data) {
        logger.info('onSeeked - data.%o cur:%o', data, video.currentTime);
    };

    var onError = function(data) {
    	var errorType = data.type;
        var errorDetails = data.details;
        var errorFatal = data.fatal;

        hls.destroy();

        logger.info('onError - type:%o detail:%o', errorType, errorDetails);

        //logger.info('onError - %o', data);
        var playerEvent = new eventsPlayer.commons.ErrorEvent();
        playerEvent.message = errorType;
        playerEvent.stack = errorDetails;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;

        if (analyticsConviva){
        	analyticsConviva.reportError(errorType);
        }
        if (analyticsAkamai) {
            analyticsAkamai.onError();
        }
    };

    var seek = function(time) {
        //logger.info('seek - live:%o time:%o duration:%o seekable:%o', isLive, time, duration, video.seekable);

        var newtime;

        //look into handling live as -1
        if (isLive && time >= duration - 2) {
            newtime = video.duration - targetOffset;
        } else if (isLive) {
            newtime = time + dvrStart;
        } else {
            newtime = time;
        }

        video.currentTime = newtime;
        logger.info('seek - cur:%o target:%o adjsTarget:%o', currentTime, time, newtime);

        var playerEvent = new eventsPlayer.commons.SeekEvent();
        playerEvent.time = video.currentTime;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    }

    var extractCea608Data = function(byteArray) {
        var count = byteArray[0] & 31;
        var position = 2;
        var tmpByte, ccbyte1, ccbyte2, ccValid, ccType;
        var actualCCBytes = [];

        for (var j = 0; j < count; j++) {
            tmpByte = byteArray[position++];
            ccbyte1 = 0x7F & byteArray[position++];
            ccbyte2 = 0x7F & byteArray[position++];
            ccValid = (4 & tmpByte) === 0 ? false : true;
            ccType = 3 & tmpByte;

            if (ccbyte1 === 0 && ccbyte2 === 0) {
                continue;
            }

            if (ccValid) {
                if (ccType === 0) // || ccType === 1
                {
                    actualCCBytes.push(ccbyte1);
                    actualCCBytes.push(ccbyte2);
                }
            }
        }
        return actualCCBytes;
    }

    var onResize = function() {
        //logger.info('onResize - holder:%o width:%o', holder, $('#' + holder).width());
        var playerEvent = new eventsPlayer.commons.ResizeEvent();
        playerEvent.width = $('#' + holder).width();
        playerEvent.height = $('#' + holder).height();
        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    /**
     * handle setting different states of post and play button within poster
     */
    var setPoster = function(poster, button) {
        logger.info('setPoster - poster:%o button:%o', poster, button);
        if (poster) {
            $('.poster').show();
            if (button) {
                $('.poster').find('img').show();
            } else {
                $('.poster').find('img').hide();
            }
        } else {
            $('.poster').hide();
            $('.poster').find('img').show();
        }
    }

    //******************************
    //postMessage Handling
    //******************************
    var receiveMessage = function(event) {
        var eventData = event.data;
        //logger.info('receiveMessage msg:%o from:%s', eventData, event.origin);

        switch (eventData.name) {
            case 'load':
                load(eventData.data);
                break;

            case 'stop':
                if (video) {
                    logger.info('receiveMessage msg:%o conviva:%s', eventData, analyticsConviva);
                    video.pause();
                    if (ima) {
                        ima.pause();
                    }
                    if (analyticsConviva) {
                        analyticsConviva.cleanUpSession();
                    }
                    if (hls)
                        hls.destroy();
                }
                break;

            case 'play':
                if (video) video.play();
                break;

            case 'pause':
                if (video) video.pause();
                break;

            case 'seek':
                if (video)
                    seek(eventData.data.time);
                break;

            case 'mute':
                muted = eventData.data.mute;
                if (video) {
                    $(video).prop('muted', muted);
                }
                break;

            case 'volume':
                if (video)
                    video.volume = eventData.data.volume;
                break;

            case 'fullscreenOn':
                //browsers using hlsjs can generally turn on fullscreen fromt he element
                break;

            case 'updateTextTrack':
                updateTrackData(eventData.data);
                break;

            case 'captionsOn':
                enableTextTracks(eventData.data.index);
                break;

            case 'captionsOff':
                disableTextTracks();
                break;

            case 'recordEvent':
                recordEvent(eventData.data);
                break;

            default:
                break;
        }
    };

    var sendMessage = function(message, origin) {
        //logger.info('sendMessage - send msg:%o origin:%o', message, origin);
        var localMessage = message;

        message.type = namespace + ':' + message.type;
        window.parent.postMessage(message, origin);

        var type = 'tech:' + localMessage.type;
        //$(document).trigger(type, [localMessage]);
    };

    var addListeners = function() {
        window.addEventListener("message", receiveMessage);
    };


    var sendReady = function() {
        var playerEvent = new eventsPlayer.commons.PlayerReadyEvent();
        playerEvent.tech = techName;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var round = function(num) {
        return Math.round(num * 1000) / 1000;
    };

    // api functions
    api.load = function(obj) {
        load(obj);
    };

    init();
    addListeners();

    return api;
}
;

/*
	Source: build/PlayerManager.js
*/
/**
 * Create a core player object for namespacing
 */
(function($) {
function PlayerManager(_state, _iframe, _messenger, _config, _toolbar) {
        var api = new Object();
        var self = this;
        var state = _state;
        var iframe = _iframe;
        var curTech = null;
        var playObjCache = null;
        var defaultTech;
        var urlTech;
        var techPaths = _config.techPaths;
        var vjsOrder = _config.defaultVjsOrder;
        var vjsTechs;
        var uiConfig = _config.uiConfig;
        var toolbar = _toolbar;
        var qs;
        var startMeasureSent = false;

        var platform;
        var browser;

        //if using tech within same page instead of iframe
        //var tech = new eventsPlayer.player.PlayerVideojs(_holder);
        //tech = new eventsPlayer.player.PlayerTHEOplayer(_holder);

        var logger = new eventsCore.util.Logger('PlayerManager');
        logger.info('constructor - defTech:%o vjs:%o config:%o state:%o techs:%o', defaultTech, vjsOrder, vjsTechs, state, techPaths);   
        var messenger = _messenger;

        $(state.container).on( "player:PlayerReadyEvent",  function( event, data ) {
            logger.info('player:PlayerReadyEvent - ev:%o data:%o', event, data);  
            continueLoad(data.tech);
        });

        $(state.container).on( "player:PlayEvent",  function( event, data ) {
            if (!startMeasureSent) {
                startMeasureSent = true;
                //logger.info('player:PlayEvent - ev:%o data:%o', event, data);  
                $(state.container).trigger('player:MeasureEvent', {'props':null, 'values':'start'});
                
            }
        });

        $(state.container).on( "player:CompleteEvent",  function( event, data ) {
            //logger.info('player:CompleteEvent - ev:%o data:%o', event, data);  
           $(state.container).trigger('player:MeasureEvent', {'props':null, 'values':'complete'});
        });

        var init = function() {
            //var fullQs = location.search || '?';
            setQs();

            platform = Environment.getPlatform();
            browser = Environment.getBrowser();
            
            if (typeof _config.players[platform] == "undefined") {
                platform = 'default';
            }
            if (typeof _config.players[platform][browser] == "undefined") {
                browser = 'default';
            }

            logger.info('init - platform:%o browser:%o', platform, browser);
            defaultTech = _config.players[platform][browser]['application/x-mpegURL'];
            vjsTechs = _config.players[platform][browser]['vjsTechs'];

            //if tech set on url, override other settings
            urlTech = eventsCore.util.getUrlParam('tech') || eventsCore.util.getUrlParam('t');
            if (urlTech) {   
                switch (urlTech) {
                    case 't':
                    case 'theoplayer':
                        defaultTech = 'theoplayer';
                        break;
                    case 'v':
                    case 'videojs':
                        defaultTech = 'videojs';
                        break;
                    case 'h':
                    case 'hlsjs':
                        defaultTech = 'hlsjs';
                        break;
                    case 'b':
                    case 'bitmovin':
                        defaultTech = 'bitmovin';
                        break;
                    default: 
                        defaultTech = defaultTech;
                        break;
                }
            }

            logger.info('init - defTech:%o vjsTechs:%o', defaultTech, vjsTechs);

            if (defaultTech)
                switchTech(defaultTech);
        };

        var setQs = function() {
            qs = '?';

            if (toolbar != 'custom')
                qs += '&controls=' + toolbar;
            if (state.namespace) 
                qs += '&ns=' + state.namespace;
            
            if (eventsCore.util.getUrlParam('loglevel')) {
                qs += '&loglevel=' + eventsCore.util.getUrlParam('loglevel');
            }
        };

        var switchTech = function(name) {
            if (name !== curTech) {
                var initEvent = new eventsPlayer.commons.InitializingEvent(name);
                messenger.sendEvent(initEvent);
                initEvent = null;

                logger.info('switchTech - name:%s iframe:%o state:%o', name, iframe, state);
                for (var i = 0; i < techPaths.length; i++) {
                    if (techPaths[i].type === name) {
                        var path = state.path + techPaths[i].uri + qs;
                        logger.info('switchTech - name:%s type:%o', $(iframe), path);
                         $(iframe).attr('src', path);
                         break;
                    }
                }
                
                curTech = name;
            }
            else {
                continueLoad(name);
            }
        };

        var continueLoad = function(tech) {
            logger.info('continueLoad: obj:%o tech:%o curTech:%o convivaDataL%o', playObjCache, tech, curTech);   
            if (playObjCache !== null && tech === curTech) {
                $(state.container).trigger('player:LoadEvent', {'playObj':playObjCache, 'tech':curTech});
                messenger.sendMessage('load', playObjCache);
                playObjCache = null;
            }
            else if (tech !== curTech && curTech !== 'reset') {
                logger.error('continueLoad - wrong tech ready curTech:%s readyTech:%s', curTech, tech);
            }
        };

        api.stop = function() {
            try{
                messenger.sendMessage('stop');
            }
            catch(e) {
                //logger.error('stop - %o', e);
            }
            
        };

        api.play = function() {
            try{
                messenger.sendMessage('play');
            }
            catch(e) {
                //logger.error('stop - %o', e);
            }
        };

        api.load = function(playObj, cdnGroup, retryLimit){
            //if tech order not set from load call, use config file
            if (!playObj.techOrder)
                playObj.techOrder = vjsTechs;

            //if not set from qs or load call, set playerTech based on config
            if (urlTech) {
                playObj.playerTech = defaultTech;
                logger.info('load - changing tech based url - tech:%o', playObj.playerTech);
            }
            else if (!playObj.playerTech) {
                playObj.playerTech = _config.players[platform][browser][playObj.mimeType]
                logger.info('load - changing tech based on mime:%o tech:%o', playObj.mimeType, playObj.playerTech);
            }

            logger.info('********************');

            startMeasureSent = false;

            logger.info('load - obj:%o curTech:%o playerTech:%o vjsTechs:%o', playObj, curTech, playObj.playerTech, playObj.techOrder);
  
            if (playObj.playerTech == 'videojs') {
                playObj.sourceOrder = (vjsOrder === 'source');
            }

        	//tech.load(playObj); //if calling tech within same page
            playObjCache = playObj;
            if ((!playObj.playerTech && curTech !== '')){
                //curTech = playObj.playerTech;
                continueLoad(curTech);
            } else {
                switchTech(playObj.playerTech);
            }
        };

        api.updateTextTrack = function(obj) {
            messenger.sendMessage('updateTextTrack', obj);
        };

        api.reset = function(_state) {
            if (_state) {
                state = _state;
                setQs();
            }
            //logger.info('reset');
            curTech = 'reset';
        };

        init();
        return api;
    }

    //console.log('PlayerManager: par:%o', window.eventsPlayer.player);
   	window.eventsPlayer.control.PlayerManager = PlayerManager;
}(jQuery));
;

/*
	Source: build/PlayerRadiant.js
*/
function PlayerRadiant(_holder, _controls, _namespace) {
    var api = new Object();
    var self = this;
    var localport = (location.port !== '80') ? ':' + location.port : '';
    var namespace = _namespace;
    var localorigin = 'http://' + document.domain + localport + '/' + namespace;
    var controls = _controls;
    var logger = new eventsCore.util.Logger('PlayerRadiant');
    
    var techName = 'radiant';
    var playerId = 'events-video-obj';
    var holder = _holder;
    var constants = eventsPlayer.PlayerConstants;

    var playObj;
    var player;                 //player object from bitmovin

    var qosData;                
    var renditions;             //array of renditions
    var subtitles;              //array of subtitles

    var activeRenditionIndex;   //the current rendition index
    var activeUri;
    var streamType;             //Live or Vod
    var segmentsLength;          //number of segments
    var masterUri;
    var tech;
    var detectedStreamType;
    var detectedTech;
    var fullscreenManager;
    var analyticsConviva;
    var analyticsYoubora;
    var ima;
    var currentCues = [];
    var trackIndex;
    var currentTrack;
    var captionsEnabled = false;
    var captions608display = false;
    var useInbandTrack = true;
    var curVolume;
    var muted;
    var defaultVolume = .8;
    var endIncrement = 0;
    var videoEnded = false;
    var firstPlay = false;

    var initialDuration = 0;

    logger.info('constructor:%o holder:%o player:%o controls:%o ns:%o', self, holder, player, controls, namespace);   


    var init = function() {
        fullscreenManager = new eventsPlayer.utils.FullscreenManager($('#events-video-obj_html5_api')[0]);
        $('.poster').hide();
        logger.info('init - fs:%o', fullscreenManager.isFullscreenEnabled());

        //to allow communication back to any page loading the ecp player
        localorigin = '*';

        //playObj.playbackRates
        //(controls === 'default')

        
    };

    var load = function(_playObj) {
        playObj = _playObj;

        // Then we set our player settings
        var settings = {
          licenseKey: 'Y2lxa29xYW1jcSEqXyVjZXk9Y3p2OTJ5ZWk/cm9tNWRhc2lzMzBkYjBBJV8q',
          bitrates: {
            hls: playObj.url
          },  
          delayToFade: 3000,
          width: 640,
          height: 360,
          isLive: true,
          poster: 'https://www.radiantmediaplayer.com/images/poster-rmp-showcase.jpg'
        };

        // Create an object based on RadiantMP constructor
        player = new RadiantMP(holder);
        // First we specify bitrates to feed to the player
        // The player will attempt first to render HLS with HTML5 video (modern mobile & desktop devices)
        // if it cannot it will fallback to HLS to Flash (older desktop devices)
        var bitrates = {
          hls: 'https://streamingrmp-1479.kxcdn.com/testlive/smil:live.smil/playlist.m3u8'
        };
        
        // Initialization ... test your page and done!
        player.init(settings);

        return;

        var tracksTags = '';
        hls = null;
        renditions = null;
        subtitles = [];
        activeRenditionIndex = null;
        qosData = null;
        detectedStreamType = null;
        useInbandTrack = true;
        endIncrement = 0;
        videoEnded = false;
        firstPlay = false;

        playObj = _playObj;

        logger.info('********************');
        logger.info('load - playObj:%o', playObj);

        player.unload();

        var source = {
            hls: playObj.url,
            poster: playObj.poster,
            // tracks: [{
            //     file: 'http://path/to/thumbnail/vtt/file.vtt',
            //     kind: 'thumbnails'
            // }],
        };

        player.load(source);

        if (playObj.poster) {
            $('.poster').css("background-image", "url(" + playObj.poster + ")");
            $('.poster').show();
        }

		logger.info('load - holder:%s playObj:%o nativett:%o', holder, playObj, playObj.useNativeTextTracks);

        initAnalytics(playObj.analytics);

        //player.userActive(false);
        //player.playbackRate(3);

        //$('.vjs-tech').on('contextmenu', function(e) {
        //    e.preventDefault();
        //});

        if (playObj.autoPlay){
            $('.poster').hide();
        } 
        else {
            $('.poster').show();
            $('.wrapper').on('click', function (event) {
                //logger.info('wrapper click');
                $('.wrapper').off('click');
                $('.poster').hide();
                player.play();
            });
        }
    };


    var initAnalytics = function(analytics) {
        logger.info('initAnalytics - analytics:%o', analytics);

        if (!analyticsConviva && analytics.convivaData && analytics.convivaData.enable) {
            analyticsConviva = new eventsPlayer.control.AnalyticsConviva(analytics.convivaData);
        }
                
        if (analyticsConviva) {
            analyticsConviva.startSession(analytics.convivaData, player.src, $(player.element).find('video')[0]);
        }

        if (!analyticsYoubora && analytics.youboraData && analytics.youboraData.enable) {
            analyticsYoubora = new eventsPlayer.control.AnalyticsYoubora(player, analytics.youboraData);
        }
    };

    var onReady = function(data) {
        logger.info('onReady - data:%o vq:%o', data, player.getAvailableVideoQualities());

        renditions = player.getAvailableVideoQualities();

        return;
        var playerEvent = new eventsPlayer.commons.MetadataEvent();
        playerEvent.aspect = player.aspectRatio();
        // playerEvent.live = player.live;
        // playerEvent.dvr = player.dvr;
        playerEvent.width = player.videoWidth();
        playerEvent.height= player.videoHeight();
        playerEvent.fullscreenEnabled = fullscreenManager.isFullscreenEnabled();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onLoadedMetadata = function(data) {
        logger.info('onLoadedMetadata - data:%o', data);

        return;

        
    };

    var onLoadedData = function(data) {
        //logger.info('onLoadedData - data:%o', data);
        //logger.info('onLoadedMetadata - tracks:%o remtracks:%o', player.textTracks(), player.remoteTextTracks());
        updateQosData();
        logger.info('onLoadedData - send meta, tracks:%o len:%o rs:%o', player.textTracks(), player.textTracks().length, player.readyState());
        

        setupTextTracks();
    };

    var onPlay = function(data) {
        videoEnded = false;

        if (!firstPlay) {
            firstPlay = true;

            var playerEvent = new eventsPlayer.commons.PlayEvent();
            sendMessage(playerEvent, localorigin);

            if (muted) {
                player.muted(muted);
            }

            if (!curVolume) {
                player.setVolume(defaultVolume);
                curVolume = defaultVolume;
            }
            else {
               player.setVolume(curVolume); 
            }
        }

        var playerEvent = new eventsPlayer.commons.PauseEvent();
        playerEvent.paused = false;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onPaused = function(data) {
        var playerEvent = new eventsPlayer.commons.PauseEvent();
        playerEvent.paused = true;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onDurationChange = function(data) {
        //onLoadedMetadata(null);
    };

    var onTimeUpdate = function(time) {
        var playerEvent = new eventsPlayer.commons.TimeUpdateEvent();
        

        if (!detectedStreamType && time > 0) {
            if (!isFinite(player.getDuration()) && time > 30) {
                detectedStreamType = constants.DVR;
            }
            else if (!isFinite(player.getDuration())) {
                detectedStreamType = constants.LIVE;
            }
            else if (isFinite(player.getDuration())) {
                detectedStreamType = constants.VOD;
            }

            if (analyticsYoubora) {
                analyticsYoubora.setStreamType((detectedStreamType != constants.VOD));
            }
        }

        /*
        if (detectedStreamType === 'dvr') {
            playerEvent.duration = playerEvent.loadedTime - 10;
        }
        */

        //logger.info('onTimeUpdate - dt:%o type:%o duration:%s current:%s bufferEnd:%o seekEnd:%o', player.currentProgramDateTime, detectedStreamType, player.duration(), player.currentTime(), player.bufferedEnd(), player.seekable().end(0));
        //logger.info('onTimeUpdate - textTracks:%o band:%o hls.segmentXhrTime:%o', player.textTracks().length, hls.bandwidth, hls.stats);
        //logger.info('onTimeUpdate - tracks:%o', player.textTracks());
        
        playerEvent.start = 0;

        if (detectedStreamType == constants.DVR) {
            playerEvent.time = time;
            playerEvent.duration = player.getMaxTimeShift() * -1;
            //playerEvent.start = player.seekable().start(0);
            //if (playerEvent.time > playerEvent.duration)
            //    playerEvent.time = playerEvent.duration;
            initialDuration = playerEvent.duration;
        }
        else {
            playerEvent.time = time;
            playerEvent.duration = player.getDuration();
        }
        
        //playerEvent.loadedTime = player.bufferedEnd();
        playerEvent.detectedStreamType = detectedStreamType;
        playerEvent.qos = qosData;
        //playerEvent.programDateTime = player.currentProgramDateTime;

        /*
        try{
            var activeMedia = hls.playlists.media();
            if (activeUri !== activeMedia.uri) {
                logger.info('onTimeUpdate - active:%o', activeMedia.uri);
                activeUri = activeMedia.uri;
                updateQosData();
            }
        }
        catch (e) {
            //logger.error('onTimeUpdate - %o', e);
        }
        */
        sendMessage(playerEvent, localorigin);
        playerEvent = null;

    };

    var onSubtitles = function(data) {
        //logger.info('onSubtitles - avail:%o', player.getAvailableSubtitles());
        subtitles.push(data.subtitle);

        logger.info('onSubtitles - list:%o', subtitles);

        if (subtitles.length > 0){
            var tracks = {};
            tracks = [];
            for (var i=0; i<subtitles.length; i++) {
                tracks.push({
                    kind: subtitles[i].kind,
                    language: subtitles[i].lang,
                    label: subtitles[i].label
                });
            }

            var playerEvent = new eventsPlayer.commons.TextTrackEvent();
            playerEvent.data = tracks;

            sendMessage(playerEvent, localorigin);
            playerEvent = null;
        }
    };

    var onWaiting = function(data) {
        //logger.info('onWaiting - %o buffered:%o start:%o', data, player.buffered);
        var playerEvent = new eventsPlayer.commons.BufferingEvent();

        sendMessage(playerEvent , localorigin);
        playerEvent = null;
    };

    var onEnded = function(data) { 
        logger.info('onEnded - ');
        var playerEvent = new eventsPlayer.commons.CompleteEvent();

        if (!videoEnded){
            videoEnded = true;
            sendMessage(playerEvent, localorigin);
            playerEvent = null;
        }
    };

    var onStalled = function(data) {
        //logger.info('onStalled - %o', data);
    };

    var onError = function(data) {
        //logger.error('onError - %o', data);
        var playerEvent = new eventsPlayer.commons.ErrorEvent();
        if (data.error) {
            playerEvent.message = data.error.message;
            playerEvent.stack = data.error.stack; 
        }
        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onVolumeChange = function(data) {
        //logger.info('onVolumeChange - muted:%o vol:%o', player.muted(), player.volume());

        muted = player.muted();

        var playerEvent = new eventsPlayer.commons.VolumeEvent();
        playerEvent.muted = player.muted();
        playerEvent.volume = player.volume();
        curVolume = player.volume();

        sendMessage(playerEvent, localorigin);
    };

    var updateQosData = function() {
        var data = new eventsPlayer.commons.QosData();
        var qos = {};

        //data.frameRate = player.frameRate;
        data.playRate = player.playbackRate();
        qos.renderer = detectedTech;
        
        logger.info('updateQosData - hls:%o', hls);

        if (hls) {
            renditions = getPlaylist();
            logger.info('updateQosData - Qos renditions:%o activeInd:%o', renditions, activeRenditionIndex);
            var activeRendition = renditions[activeRenditionIndex];

            if (activeRendition) {
                var path = masterUri.substring(0, masterUri.lastIndexOf('/') + 1);
                var shortUri = activeRendition.uri.replace(path, '');

                qos.stream = masterUri;
                qos.activeRendition = activeRenditionIndex + 1;
                qos.totalRenditions = renditions.length;
                qos.uri = shortUri;
                qos.bandwidth = activeRendition.bandwidth;
                qos.resolution = activeRendition.resolution.width + 'x' + activeRendition.resolution.height;
                qos.codecVideo = activeRendition.codecs.video;
                qos.codecAudio = activeRendition.codecs.audio;
            }
            else {
                qos.stream = masterUri;
                qos.activeRendition = 1;
                qos.totalRenditions = 1;
                qos.uri = 'm3u8 rendition';
                qos.bandwidth = '';
                qos.resolution = '';
                qos.codecVideo = '';
                qos.codecAudio = '';
            }
        }
        
        //var timeRange = player.buffered();
        //logger.info('buffer - buffered start:%o end:%o', timeRange.start(0), timeRange.end(0));
        
        //logger.info('renditions - total:%o current:%o ', renditions.length, activeRendition);

        //logger.info('onTimeUpdate - Qos framerate:%o playrate:%o', data.frameRate, data.playRate);
        //logger.info('onTimeUpdate - Qos network:%o', player.networkState());
        //logger.info('onTimeUpdate - Qos buffer:%o', player.bufferedPercent());

        //logger.info('updateQosData - Qos framerate:%o playrate:%o qos:%o', data.frameRate, data.playRate, data);

        qosData = qos;
    };

    var getPlaylist = function() {
        var master = hls.playlists.master;
        var renditions = [];
        var data = {};
        var codecs;

        logger.info('getPlaylist - master:%o playerHls:%o active:%o', master, hls.playlists.media(), activeUri);

        if (master.playlists.length > 1) {
           masterUri = master.uri; 

           for (var i = 0; i < master.playlists.length; i++) {
                data = {};
                try{
                    data.id = master.playlists[i].attributes['PROGRAM-ID'];
                }
                catch(e){
                    data.id = 'unknown';
                }
                data.bandwidth = master.playlists[i].attributes.BANDWIDTH;
                data.uri = master.playlists[i].uri;
                data.resolution = {};
                data.codecs = {};

                if (master.playlists[i].attributes.RESOLUTION) {
                    data.resolution.width = master.playlists[i].attributes.RESOLUTION.width;
                    data.resolution.height = master.playlists[i].attributes.RESOLUTION.height;
                }
                else {
                    data.resolution.width = 0;
                    data.resolution.height = 0;
                }

                if (master.playlists[i].attributes.CODEC) {
                    codecs = master.playlists[i].attributes.CODEC.split(',');
                    data.codecs.video = codecs[0];
                    data.codecs.audio = codecs[1];
                }
                else {
                    data.codecs.video = 'N/A';
                    data.codecs.audio = 'N/A';
                }

                renditions.push(data);

                if (data.uri === activeUri) {
                    activeRenditionIndex = i;
                }
            } 

        }
        else {
            masterUri = playObj.url;
            data.id = 'unknown';
            data.bandwidth = '';
            data.uri = '';
            data.resolution = '';
            data.codecs = '';

            renditions.push(data);
        }
        
        //logger.info('getPlaylist - uri:%o', masterUri);
        logger.info('getPlaylist - index:%o active:%o', activeRenditionIndex, renditions[activeRenditionIndex]);

        return renditions;
    };

    var seek = function(time) {
        logger.info('seek - time:%o', time);

        player.timeShift(time);
        player.seek(time);
        return;

        if (time >= player.duration()) {
            time = player.duration() - .001;
        }

        var seekTime = time;

        if (detectedStreamType === constants.DVR) {
            if (seekTime < player.currentTime()) {
                seekTime = time + player.seekable().start(0) + 5;
            }
            else {
                seekTime = time + player.seekable().start(0);
            }
        }

        logger.info('seek - type:%o time:%o seekTime:%o dur:%o', detectedStreamType, time, seekTime, player.duration());

        if (player){
            player.currentTime(seekTime);
        }
        
    }

    /**
     * setup texttracks
     */
    var setupTextTracks = function() {
        var inbandTracks = player.textTracks();
        var tracks = [];
        var addedTrack;
        logger.info('setupTextTracks - inbandTrackLen:%o trackIndex:%o', inbandTracks.length, trackIndex);

        if (playObj.captions == 'default' && playObj.tracks && inbandTracks.length == 0) {
            useInbandTrack = false;
            for (var i = 0; i < playObj.tracks.length; i++) {
                //tracksTags += '<track kind="' + playObj.tracks[i]['type'] + '" srclang="en" src="' + playObj.tracks[i]['file'] + '" label="' + playObj.tracks[i]['label'] + '"></track>'
                addedTrack = player.addRemoteTextTrack({
                    kind: playObj.tracks[i]['type'],
                    language: 'en',
                    label: playObj.tracks[i]['label'],
                    src: playObj.tracks[i]['file'],
                    id: 'added',
                    mode: 'hidden'
                  });

                tracks.push(addedTrack);

                addedTrack.addEventListener('load', function() {
                    logger.info('setupTextTracks - onload');
                    updateCueList(player.textTracks()[trackIndex]);
                });

                logger.info('setupTextTracks - track:%o', tracks[i]);
            }
        }
        else if (inbandTracks.length > -1){
            var inband = [];
            for (var i=0; i<inbandTracks.length; i++) {
                inbandTracks[i].mode = 'disabled';
                logger.info('setupTextTracks - inbandTrack:%o kind:%o lang:%o label:%o', inbandTracks[i], inbandTracks[i].kind, inbandTracks[i].language, inbandTracks[i].label);
                inband.push({
                    'label': inbandTracks[i].label,
                    'language': inbandTracks[i].language,
                    'kind': inbandTracks[i].kind
                });
            }

            if (inband.length > 0){
                var playerEvent = new eventsPlayer.commons.TextTrackEvent();
                playerEvent.data = inband;

                sendMessage(playerEvent, localorigin);
                playerEvent = null;
            }
        }

        //if track index has been set, and the track exists
        //  go head and enable it
        if (trackIndex >= 0 && (tracks.length > 0 || inbandTracks.length > 0)) {
            if (player.textTracks().length) {
                enableTextTracks(trackIndex);
            }
            else {
                setTimeout(enableTextTracks, 200, trackIndex);
            }
        }
        //else if using native 608 and captions enabled
        else if (playObj.captionsEnabled && playObj.captions == 'custom') {
            if (player.textTracks().length) {
                enableTextTracks();
            }
            else {
                setTimeout(enableTextTracks, 200);
            }
        }

        //listen for inband cue changes (default controls?)
        if (inbandTracks.length > 0) {
            var currentTrack = player.textTracks()[0];
            var cue; 

            currentTrack.oncuechange = function() {
                if(currentTrack.activeCues[0] !== undefined){
                    cue = currentTrack.activeCues[0];
                    //logger.info('activeCue - cue:%o', cue);
                } 
            }
        }
    };

    /**
     * turns on text track with the index value specified
     *  - if using default VTT display
     *
     * PARAM values
     * index
     */
    var enableTextTracks = function(index) {
        if (playObj.captions == 'default') {
            logger.info('enableTextTracks - index:%o subtitles:%o', index, subtitles);

            player.setSubtitle(subtitles[index].id);
        }

        //set enabled flag and change display mode of first inband track if exists
        //  custom608 display only works for inband native 608
        else if (playObj.captions == 'custom'){
            captions608display = true;
            
        }
    };

    /**
     * disable text track
     *  - if using default VTT display
     */
    var disableTextTracks = function(){
        if (playObj.captions == 'default') {
            captionsEnabled = false;
            trackIndex = null;
        }
        else if (playObj.captions == 'custom'){
            captions608display = false;
        }
        updateCaptionsDisplay();
    };

    /**
     * toggle the display of captions based on if 'captions' on and if a currentTrack is set
     */
    var updateCaptionsDisplay = function() {
        logger.info('updateCaptionsDisplay - track:%o captionsEnabled:%o', currentTrack, captionsEnabled);

        if ((captions608display || captionsEnabled) && currentTrack) {
            currentTrack.mode = 'showing';
        }
        else if (currentTrack){
            currentTrack.mode = 'disabled';
        }
    };

    /**
     * update and dispatch the cue list if it has changed
     */
    var updateCueList = function(tt) {
        var cues = [];
        
        if (tt.cues && tt.cues.length > 0) {
            //logger.info('updateCueList - cue:%o len:%o', tt.cues, tt.cues.length);
            for (var i = 0; i < tt.cues.length; i++) {
                cues.push(getCueData(tt.cues[i]));
            }
        }

        logger.info('updateCueList - new:%o', (JSON.stringify(cues) !== JSON.stringify(currentCues)));
        if (JSON.stringify(cues) !== JSON.stringify(currentCues)) {
            currentCues = cues;
            //logger.info('updateCueList - cues:%o', currentCues);

            var playerEvent = new eventsPlayer.commons.TrackLoadedEvent();
            playerEvent.data = currentCues;

            sendMessage(playerEvent, localorigin);
            playerEvent = null;
        }
    };

    /**
     * get formatted data object representing a text track cue
     */
    var getCueData = function(cue) {
        var data = {};
        var text = '';
        var id = cue.id.split(',');
        
        text = cue.text.replace(/(<.*?>)/g, '');
        text = text.replace(/(\r\n|\n|\r)/gm, '');

            //confidence = text.match(/(Watson Confidence: .*%)/g);
            //logger.info('updateCueList - cue:%o', tt.cues[i]);
            //if (confidence)
            //    confidence = confidence[0].substr(confidence[0].indexOf(': ') + 2);

        text = text.replace(/(Watson Confidence: .*%)/g, '');

        data.id = id[0];
        data.start = cue.startTime;
        data.end = cue.endTime;
        data.text = text;
        data.confidence = (id.length >= 2) ? id[1].replace(' ', '') : '0%';
        data.status = (id.length >= 3) ? id[2].replace(' ', '') : '';

        return data;
    };

    /**
     * update track cues
     */
    var updateTrackData = function(data) {
        var id;
        var cue;
        var perc;

        if (trackIndex >= 0) {
            var tt = player.textTracks()[trackIndex];
            var data = data.subtitle;
            logger.info('updateTrackData - length:%o cuelen:%o', data.length, tt.cues.length);

            for (var j = tt.cues.length-1; j >= 0; j--) {
                tt.removeCue(tt.cues[j]);
            }
            
            for (var i = 0; i < data.length; i++) {
                //logger.info('updateTrackData - entry:%o', data[i]);
                var cue = new window.VTTCue(data[i].startTime, data[i].endTime, data[i].transcript);
                perc = Math.round(data[i].confidence * 1000)/10;
                cue.id = data[i].index + ', ' + perc + '%, ' + data[i].status;;
                //logger.info('updateTrackData - i:%o cuelen:%o new:%o', i, tt.cues.length, cue);
                tt.addCue(cue);
            }

            updateCueList(tt);
        }
    };

    

    //******************************
    // Ad Event Handlers
    //******************************
    var onAdStart = function(position) {
        logger.info('onAdStart - pos:%o', position);
        var playerEvent = new eventsPlayer.commons.AdStartEvent();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onAdEnd = function(position) {
        logger.info('onAdEnd - pos:%o', position);
        var playerEvent = new eventsPlayer.commons.AdEndEvent();
        playerEvent.position = position;
        sendMessage(playerEvent, localorigin);
        playerEvent = null;

        if (position === constants.postroll) {
            var playerEvent = new eventsPlayer.commons.CompleteEvent();
            sendMessage(playerEvent, localorigin);
            playerEvent = null;
        }
    };

    //******************************
    //postMessage Handling
    //******************************
    var receiveMessage = function(event) {
        var eventData = event.data;
        //logger.info('receiveMessage msg:%o from:%s player:%o', eventData, event.origin, player);

        switch(eventData.name) {
            case 'load': 
                load(eventData.data);
                break;

            case 'stop':
                if (player) {
                    player.pause();
                    if (ima) {
                        ima.pause();
                    }
                    //player.dispose();
                }
                break;

            case 'play': 
                if (player) player.play();
                break;

            case 'pause': 
                if (player) player.pause();
                break;

            case 'seek': 
                if (player) 
                    seek(eventData.data.time);
                break;

            case 'mute': 
                muted = eventData.data.mute;
                if (player) player.muted(muted);
                break;

            case 'volume': 
                if (player) player.volume(eventData.data.volume);
                break;

            case 'fullscreenOn': 
                fullscreenManager.fullScreenOnVideo(player);
                break;

            case 'updateTextTrack': 
                updateTrackData(eventData.data);
                break;

            case 'captionsOn': 
                enableTextTracks(eventData.data.index);
                break;

            case 'captionsOff': 
                disableTextTracks();
                break;

            default:
                break;
        }
    };
    
    var sendMessage = function(message, origin) {
        //logger.info('sendMessage - send msg:%o origin:%o', message, origin);
        var localMessage = message;

        message.type = namespace + ':' + message.type;
        window.parent.postMessage(message, origin);

        var type = 'tech:' + localMessage.type;
        //$(document).trigger(type, [localMessage]);
    };
    
    var addListeners = function() {
        window.addEventListener("message", receiveMessage);
    };


    var sendReady = function() {
        logger.info('sendReady - ns:%o', namespace);

        var playerEvent = new eventsPlayer.commons.PlayerReadyEvent();
        playerEvent.tech = techName;
        playerEvent.fullscreenEnabled = fullscreenManager.isFullscreenEnabled();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    api.receive608 = function(time, data){
        //logger.info('receive608 - time:%o data:%o cur:%o', time, data, player.currentTime(), player.dur);
   
        if (detectedStreamType == constants.DVR) {
            time += initialDuration;
        }

        var playerEvent = new eventsPlayer.commons.CaptionEvent();
        playerEvent.time = time;
        playerEvent.data = data;
        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };
    
    // api functions
    api.load = function(obj) {
        load(obj);
    };

    api.forceError = function() {
        player.error({code:'2'});
        
    };

    init();
    addListeners();
    setTimeout(sendReady,100);
    return api;
};

/*
	Source: build/PlayerTHEOplayer.js
*/
function PlayerTHEOplayer(_holder, _controls) {
    var api = new Object();
    var self = this;
    var localport = (location.port !== '80') ? ':' + location.port : '';
    var localorigin = 'http://' + document.domain + localport;
    var controls = _controls;
    var logger = new eventsCore.util.Logger('PlayerTHEOplayer');
    //console.log('core:%o logger:%o', eventsCore, logger);
    
    var video;
    var holder = _holder;
    var constants = eventsPlayer.PlayerConstants;
    var player;
    var qosData;
    var renditionController;
    var renditions;
    var activeRenditionIndex;
    var masterPlaylist;
    var curType = '';
    var duration;
    var ccTrack;
    var captions = false;

    var fullscreenManager;
    var analyticsConviva;

    logger.info('constructor:%o holder:%o player:%o', self, holder, player);   

    $( window ).resize(function() {
        var playerEvent = new eventsPlayer.commons.ResizeEvent();
        playerEvent.width = $(holder).width();
        playerEvent.height = $(holder).height();
        logger.info('resize w:%o h:%o', playerEvent.width, playerEvent.height);
        sendMessage(playerEvent, localorigin);
    });

    theoplayer.onReady = function () {
        $('.poster').hide();

        video = document.createElement('video');
        video.id = 'main';
        if (controls === 'default')
            video.controls = controls;
        else 
            video.controls = null;
        video.src = '';
        video.className = 'video-player';
        //video.poster = 'http://cdn.theoplayer.com/video/big_buck_bunny/poster.jpg';
        video.preload = 'none';
        holder.append(video);

        logger.info('onReady - theo:%o', theoplayer.configuration);

        initPlayer();

        if ($('.vjs-loading-spinner'))
            $('.vjs-loading-spinner').css('opacity', '0');
            //$('.vjs-loading-spinner').css('top', '-10000px');
    };
    

    var initPlayer = function() {
        //logger.info('initPlayer - theo:%o video:%o', theoplayer, video);
        fullscreenManager = new eventsPlayer.utils.FullscreenManager(video);

        player = theoplayer(video);
        logger.info('initPlayer - obj:%o fs:%o', player, fullscreenManager.isFullscreenEnabled());

        if (player) {
            player.autoplay = false;
            player.addEventListener('initialized', onInitialized);
            player.addEventListener('canplay', onCanPlay);
            player.addEventListener('loadedmetadata', onLoadedMetadata);
            player.addEventListener('loadeddata', onLoadedData);
            player.addEventListener('play', onPlay);
            player.addEventListener('pause', onPause);
            player.addEventListener('playing', onPlaying);
            player.addEventListener('timeupdate', onTimeUpdate);
            player.addEventListener('durationchange', onDurationChange);
            player.addEventListener('waiting', onWaiting);
            player.addEventListener('ended', onEnded);
            player.addEventListener('stalled', onStalled);
            player.addEventListener('unsupportedPlatform', onUnsupported)
            player.addEventListener('error', onError);
            player.addEventListener('volumechange', onVolumeChange);

            
        }
        else {
            logger.error('initPlayer - error creating THEOplayer');
            sendError();
        }
        //player.playbackRate = 3;


    };

    var load = function(playObj) {
        logger.info('********************');
        logger.info('load - obj:%o video:%o', playObj, video);

        if (playObj.poster) {
            $('.poster').css("background-image", "url(" + playObj.poster + ")");
            $('.poster').show();
        }
        
        if (!player)
            initPlayer();

        if ($('.vjs-loading-spinner'))
            $('.vjs-loading-spinner').css('opacity', '0');

        var playerEvent = new eventsPlayer.commons.LoadingEvent();
        playerEvent.playObject = playObj;
        sendMessage(playerEvent, localorigin);
        playerEvent = null;

        renditions = [];
        activeRenditionIndex = null;
        qosData = null;

        curType = '';

        //check if player created before assigning src
        if (player) {
            //player.src = playObj.url;

            var tracks = [];
            if (playObj.tracks) {
                for (var i = 0; i < playObj.tracks.length; i++) {
                    tracks.push({
                        label: playObj.tracks[i]['label'],
                        kind: playObj.tracks[i]['type'],
                        srclang: 'en',
                        src: playObj.tracks[i]['file']
                    });
                }
            }

            //logger.info('load - tracks:%o', tracksObj);

            player.setSource({
                sources: playObj.url,
                textTracks: tracks
            });

            initAnalytics(playObj.analytics);

            if (playObj.autoPlay){
                player.play();   
                $('.poster').hide();
            } 
            else {
                $('.poster').show();
                $('.wrapper').on('click', function (event) {
                    //logger.info('wrapper click');
                    $('.wrapper').off('click');
                    $('.poster').hide();
                    player.play();
                });
            }
        }    
    };

    var initAnalytics = function(analytics) {
        if (!analyticsConviva && analytics.convivaData && analytics.convivaData.enable) {
            analyticsConviva = new eventsPlayer.control.AnalyticsConviva(analytics.convivaData);
        }
                
        if (analyticsConviva) {
            analyticsConviva.startSession(analytics.convivaData, player.src, $(player.element).find('video')[0]);
        }
    };

    var sendMetadata = function() {
        var playerEvent = new eventsPlayer.commons.MetadataEvent();
        playerEvent.aspect = player.aspectRatio;
        playerEvent.live = player.live;
        playerEvent.dvr = player.dvr;
        playerEvent.width = player.videoWidth;
        playerEvent.height = player.videoHeight;
        playerEvent.renditions = renditions;
        playerEvent.fullscreenEnabled = fullscreenManager.isFullscreenEnabled();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var updateQosData = function() {
        var data = new eventsPlayer.commons.QosData();
        data.frameRate = player.frameRate;
        data.playRate = player.playbackRate;
        
        var activeRendition = renditions[activeRenditionIndex];
        var qos = {};
        if (activeRendition) {
            var path = masterPlaylist.substring(0, masterPlaylist.lastIndexOf('/') + 1);
            var shortUri = activeRendition.uri.replace(path, '');

            qos.stream = masterPlaylist;
            qos.activeRendition = activeRenditionIndex + 1;
            qos.totalRenditions = renditions.length;
            qos.uri = shortUri;
            qos.bandwidth = activeRendition.bandwidth;
            qos.resolution = activeRendition.resolution.width + 'x' + activeRendition.resolution.height;
            qos.codecVideo = activeRendition.codecs.video;
            qos.codecAudio = activeRendition.codecs.audio;
        }
        //logger.info('buffer - buffered:%o ', player.buffered);
        //logger.info('renditions - total:%o current:%o ', renditions.length, activeRendition);

        logger.info('updateQosData - Qos framerate:%o playrate:%o qos:%o', data.frameRate, data.playRate, data);

        qosData = qos;
    };

    //******************************
    //player event handlers
    //******************************
    var onInitialized = function(data) {
        renditionController = theoplayer.controller(0, 'renditionController');
        renditionController.addEventListener('qualitychanged', onRenditionChange);

        sendReady();
    };

    var onCanPlay = function(data) {
        //logger.info('onCanPlay - ');
    };

    var onLoadedMetadata = function(data) {
        logger.info('onLoadedMetadata - %o tracks:%o', data, video.textTracks);
        //logger.info('onLoadedMetadata - tracks:%o remtracks:%o', player.textTracks(), player.remoteTextTracks());
        if(player.textTracks) {
            player.textTracks.addEventListener('addtrack', onAddTrack);
        }

        if(video.textTracks) {

        }
    };

    var onLoadedData = function(data) {
        logger.info('onLoadedData - %o ', data);
        masterPlaylist = player.currentSrc;
        logger.info('onLoadedData - master:%o', masterPlaylist);

        renditions = renditionController.renditions;
        for (var i = 0; i < renditions.length; i++) {
            logger.info('onLoadedData - rendition id:%o name:%o b:%o res:%o cod:%o', renditions[i].id, renditions[i].name, renditions[i].bandwidth, renditions[i].resolution, renditions[i].codecs);
        }
        
        updateQosData();
        sendMetadata();
    };

    var onPlay = function(data) {
        var playerEvent = new eventsPlayer.commons.PauseEvent();
        playerEvent.paused = false;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onPause = function(data) {
        var playerEvent = new eventsPlayer.commons.PauseEvent();
        playerEvent.paused = true;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onPlaying = function(data) {
        var playerEvent = new eventsPlayer.commons.PlayEvent();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onDurationChange = function(data) {
        //onLoadedMetadata(null);
    };

    var onTimeUpdate = function(data) {
       // logger.info('onTimeUpdate - tracks:%o len:%o', player.textTracks, player.textTracks.item(0));
         /*
        if (player.textTracks.item(0)) {
            //logger.info('onTimeUpdate - tracks:%o %o', player.textTracks.item(0).kind, player.textTracks.item(0).cues);
            var track = player.textTracks.item(0);
            _.each(track.cues, function(value, key){
                logger.info('onTimeUpdate - cue id:%o line:%o start:%o track:%o', value.id, value.line, value.startTime, value.track);
            });
        }

       
        logger.info('onTimeUpdate - tracks:%o len:%o', player.textTracks, player.textTracks.item(0));
        if (player.textTracks.item(0)) {
            //logger.info('onTimeUpdate - tracks:%o %o', player.textTracks.item(0).kind, player.textTracks.item(0).cues);
            var track = player.textTracks.item(0);
            _.each(track.cues, function(value, key){
                logger.info('onTimeUpdate - %o id:%o data:%o', value, value.id, value.data);
            });
        }
        */

        if(player.textTracks) {
            //player.textTracks.addEventListener('addtrack', onAddTrack);
        }
        //logger.info('onTimeUpdate - %o dateTime:%s duration:%s current:%s', data, player.currentProgramDateTime, player.duration, player.currentTime);
        var playerEvent = new eventsPlayer.commons.TimeUpdateEvent();
        playerEvent.time = player.currentTime;
        playerEvent.duration = player.duration;
        playerEvent.programDateTime = player.currentProgramDateTime;
        playerEvent.loadedTime = player.buffered.end(0);

        //adjust for dvr
        if (player.duration < 0) {
            playerEvent.time = (player.duration * -1) + player.currentTime;
            playerEvent.duration = player.duration * -1;
            curType = constants.DVR;
            duration = player.duration;
        }

        playerEvent.qos = qosData;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onWaiting = function(data) {
        logger.info('onWaiting - %o buffered:%o start:%o', data, player.buffered);
        var playerEvent = new eventsPlayer.commons.BufferingEvent();

        sendMessage(playerEvent , localorigin);
        playerEvent = null;
    };

    var onEnded = function(data) {
        var playerEvent = new eventsPlayer.commons.CompleteEvent();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onStalled = function(data) {
        logger.info('onStalled - %o', data);
    };

    var onUnsupported = function(data) {
        logger.info('onUnsupported - %o', data);

        var playerEvent = new eventsPlayer.commons.ErrorEvent();
        playerEvent.message = 'Unsupported Platform';
        playerEvent.stack = '';

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onError = function(data) {
        //logger.info('onError - %o', data);
        var playerEvent = new eventsPlayer.commons.ErrorEvent();
        playerEvent.message = data.error.message;
        playerEvent.stack = data.error.stack;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onRenditionChange = function(data) {
        data = data.rendition;
        logger.info('onRenditionChange - id:%o', data);

        if (data) {
            for (var i = 0; i < renditions.length; i++) {
                if (renditions[i].id === data.id)
                    activeRenditionIndex = i;
            }
        }
        logger.info('onRenditionChange - index:%o', activeRenditionIndex);

        updateQosData();
    };

    var onVolumeChange = function(data) {
        //logger.info('onVolumeChange - muted:%o vol:%o', player.muted, player.volume);

        var playerEvent = new eventsPlayer.commons.VolumeEvent();
        playerEvent.muted = player.muted;
        playerEvent.volume = player.volume;

        sendMessage(playerEvent, localorigin);
    };

    var onAddTrack = function (addTrackEvent) {
        var track = addTrackEvent.track;
        logger.info('onAddTrack - kind:%o cues:%o obj:%o mode:%o', track.kind, track.cues, track, track.mode);

        if (track.kind === 'captions') {
            ccTrack = track;
            updateCaptions();
        }

        _.each(track.cues, function(value, key){
            logger.info('onAddTrack - cue:%o', value);
        });

        track.addEventListener('cuechange', function (cueChangeEvent) {
            // here you can access the cue and other properties of the track and display the metadata to the outside
            logger.info('onAddTrack - cuechange %o', cueChangeEvent);
        });
    };

    var updateCaptions = function() {
        if (captions && ccTrack) {
            ccTrack.mode = 'showing';
        }
        else if (ccTrack){
            ccTrack.mode = 'disabled';
        }
    };

    //******************************
    //postMessage Handling
    //******************************
     var receiveMessage = function(event) {
        var eventData = event.data;
        //logger.info('receiveMessage msg:%o name:%o from:%s player:%o', eventData, eventData.name, event.origin, player);

        switch(eventData.name) {
            case 'load': 
                load(eventData.data);
                break;

            case 'stop':
                if (player) player.src = '';
                break;

            case 'play': 
                if (player) player.play();
                break;

            case 'pause': 
                if (player) player.pause();
                break;

            case 'seek': 
                if (player) {
                    if (curType === '') {
                        player.currentTime = eventData.data.time;
                    }
                    else if (curType === constants.DVR) {
                        player.currentTime = duration + eventData.data.time ;
                    }
                }
                break;

            case 'mute': 
                if (player) player.muted = eventData.data.mute;
                break;

            case 'volume': 
                if (player) player.volume = eventData.data.volume;
                break;

            case 'fullscreenOn': 
                fullscreenManager.fullScreenOnVideo();
                break;

            case 'captionsOn': 
                captions = true;
                updateCaptions();
                break;

            case 'captionsOff': 
                captions = false;
                updateCaptions();
                break;

            default:
                break;
        }
    };
    
    var sendMessage = function(message, origin) {
        //logger.info('communicator - send msg:%s data:%s post:%o', message, data,  window.parent.postMessage);
        window.parent.postMessage(message, origin);
    };
    
    /**
     * send error type
     */
    var sendError = function() {

    };

    var init = function() {
        window.addEventListener("message", receiveMessage);
    };

    /**
     * send player ready event
     */
    var sendReady = function() {
        var playerEvent = new eventsPlayer.commons.PlayerReadyEvent();
        playerEvent.tech = 'theoplayer';
        playerEvent.fullscreenEnabled = fullscreenManager.isFullscreenEnabled();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    // api functions
    api.load = function(obj) {
        load(obj);
    };
    
    
    init();
    return api;
}

;

/*
	Source: build/PlayerVideojs.js
*/
function PlayerVideojs(_holder, _controls, _namespace) {
    var api = new Object();
    var self = this;
    var localport = (location.port !== '80') ? ':' + location.port : '';
    var namespace = _namespace;
    var localorigin = location.protocol + '//' + document.domain + localport + '/' + namespace;
    var controls = _controls;
    var logger = new eventsCore.util.Logger('PlayerVideojs');
    
    var techName = 'videojs';
    var playerId = 'events-video-obj';
    var holder = _holder;
    var constants = eventsPlayer.PlayerConstants;

    var playObj;
    var player;                 //player object from videojs
    var hls;                    //the hls object from videojs-contrib-hls
    var qosData;                
    var renditions;             //array of renditions
    var activeRenditionIndex;   //the current rendition index
    var activeUri;
    var streamType;             //Live or Vod
    var segmentsLength;          //number of segments
    var masterUri;
    var tech;
    var detectedStreamType;
    var detectedTech;
    var fullscreenManager;
    var analyticsConviva;
    var analyticsAkamai;
    var analyticsYoubora;
    var ima;
    var currentCues = [];
    var trackIndex;
    var currentTrack;
    var paused = false;
    var waiting = false;
    var captionsDisplayEnabled = false;
    var captions608display = false;
    var useInbandTrack = true;
    var curVolume;
    var muted;
    var defaultVolume = .8;
    var endIncrement = 0;
    var videoEnded = false;
    var fullscreenMeasure = true;
    var initialDuration = 0;

    var minDvrStreamLength = 180;

    logger.info('constructor:%o holder:%o player:%o controls:%o ns:%o minDvr:%o', self, holder, player, controls, namespace, minDvrStreamLength);   

    var newSettings = {
         'backgroundOpacity': '1',
         'textOpacity': '1',
         //'windowOpacity': '0.5',
         //'edgeStyle': 'depressed',
         //'fontFamily': 'monospaceSansSerif',
         'color': '#FFF',
         'backgroundColor': '#000',
         //'windowColor': '#000',
         'fontPercent': 1
        };
    //vjs-caption-settings vjs-modal-overlay vjs-hidden

    $( window ).resize(function() {
       onResize();
    });

    var init = function() {
        fullscreenManager = new eventsPlayer.utils.FullscreenManager($('#events-video-obj_html5_api')[0], null);
        setPoster(false);
        logger.info('init - fs:%o', fullscreenManager.isFullscreenEnabled());

        //to allow communication back to any page loading the ecp player
        localorigin = '*';

        onResize();
    };

    var load = function(_playObj) {
        var tracksTags = '';
        hls = null;
        renditions = null;
        activeRenditionIndex = null;
        qosData = null;
        detectedStreamType = null;
        useInbandTrack = true;
        endIncrement = 0;
        videoEnded = false;
        captionsDisplayEnabled = false;

        playObj = _playObj;
        logger.info('********************');
        logger.info('load - playObj:%o', playObj);

    	if (player)
			player.dispose();
		
        if (playObj.poster) {
            $('.poster').css("background-image", "url(" + playObj.poster + ")");
            if (!playObj.autoplay)
                setPoster(true,true);
        }

		logger.info('load - holder:%s playObj:%o nativett:%o', holder, playObj, playObj.useNativeTextTracks);

        if (playObj.tracks) {
            for (var i = 0; i < playObj.tracks.length; i++) {
                //tracksTags += '<track kind="' + playObj.tracks[i]['type'] + '" srclang="en" src="' + playObj.tracks[i]['file'] + '" label="' + playObj.tracks[i]['label'] + '"></track>'
            }

            //force captions to default display (for now), if tracks specified in playObj
            playObj.captions = 'default';
        }

        /**
         * empty fill needed at some pt for proper sizing
         * at 2017 masters used trans image without issue
         * remove in future?
         */
        $(holder).prepend('<video id="videoElem" class="video-js" poster="fill"><source src="' + playObj.url + '" type="' + playObj.mimeType + '"></video>');

        var settings = {
            'sourceOrder': playObj.sourceOrder,
            'techOrder': playObj.techOrder,
            'loadingSpinner': false,
            'loop': false,
            'html5': {
                nativeTextTracks: playObj.useNativeTextTracks,
                textTrackSettings: true, //for settings dialog with native controls
                withCredentials: true,
                useCueTags: true,
            }
        };

        if (playObj.playbackRates) {
            settings['playbackRates'] = playObj.playbackRates;
            //settings['playbackRates'] = [0.5, 0.75, 1, 1.25, 1.5];
        }

		player = videojs(
			'videoElem', 
			settings,
			function() {
				logger.info("load - player ready - src:%s", this.currentSrc());
                onInitialized();
			}
        );
        
        //player.poster(playObj.poster);
        if (controls === 'default')
            player.controls(true);
        else 
            player.controls(false);
      
        //player.userActive(false);
        //player.playbackRate(3);

        $('.vjs-tech').on('contextmenu', function(e) {
            e.preventDefault();
        });
    };

    var onInitialized = function(data) {
        //var videoid = $(".vjs-control-bar");
        //videoid[0].style.setProperty("display", "none", "important");

        logger.info('onInitialized - data:%o hls:%o', data, hls);


        logger.info('onInitialized - video:%o', $(player.el()).find('video')[0]);

        if ($(player.el()).find('video').length >= 1) {
            $(player.el()).find('video')[0].addEventListener('webkitbeginfullscreen', function(){
                    //logger.info('webkitbeginfullscreen');
                    videoFullscreenOn();
                }, false);
            $(player.el()).find('video')[0].addEventListener('webkitendfullscreen', function(){
                    //logger.info('webkitbeginfullscreen');
                    videoFullscreenOff();
                    //onFinish();
                }, false);
        }
        //player.playbackRate(0.5);

        player.autoplay(playObj.autoPlay);
        player.one('loadedmetadata', onLoadedMetadata);
        player.on('canplay', onCanPlay);
        player.on('loadeddata', onLoadedData);
        player.on('play', onPlay);
        player.on('pause', onPause);
        player.on('playing', onPlaying);
        player.on('timeupdate', onTimeUpdate);
        player.on('durationchange', onDurationChange);
        player.on('waiting', onWaiting);
        player.on('ended', onEnded);
        player.on('stalled', onStalled);
        player.on('error', onError);
        player.on('volumechange', onVolumeChange);

        var reloadOptions = {};
        reloadOptions.errorInterval = 10;
        //player.reloadSourceOnError(reloadOptions);
        

       // tech = player.tech({ IWillNotUseThisInPlugins: true });
        //logger.info('onInitialized - tech:%o', tech);
        
        if (playObj.autoPlay){
            setPoster(false);
            continueLoad();
        } 
        else {
            setPoster(true, true);
            $('.wrapper').on('click', function (event) {
                //logger.info('wrapper click');
                $('.wrapper').off('click');
                setPoster(false);
                continueLoad();
            });
        }
    };

    var continueLoad = function() {
        setupHls();
        initAnalytics();

        logger.info('continueLoad - src:%o', player.currentSrc());

        if (analyticsYoubora) {
            analyticsYoubora.setStreamInfo(playObj.title, playObj.streamType, playObj.url, playObj.cdn);
        }

        if (playObj.ads){
            initIma();
            if (ima)
                ima.setAds(playObj.ads);
        }

        if (ima){
            logger.info('onInitialized - ima:%o ads:%o autoplay:%o', ima, playObj.ads, playObj.autoPlay);
            logger.info('onInitialized - hasVastPreroll:%o', ima.hasAd('vast', constants.preroll));
        }
        

        if (ima && ima.hasAd('vmap')){
            ima.play('vmap', null, {type: playObj.mimeType, src:playObj.url});
        }
        else if (ima && ima.hasAd('vast', constants.preroll)){
            ima.play('vast', constants.preroll, player, playerId, playObj.ads, {type: playObj.mimeType, src:playObj.url});
        }
        else {
            //player.src({type: playObj.mimeType, src:playObj.url});
            logger.info('continueLoad - src:%o', player.currentSrc());
            //setTimeout(startPlay, 2000);
            player.play();
        }
            
        logger.info('continueLoad - tech:%o - %o', $('.vjs-tech'), $('.vjs-tech')[0].id);

        detectedTech = '';
        if ($('.vjs-tech')[0].id.toLowerCase().indexOf('html5') > -1)
            detectedTech = 'html5';
        else if($('.vjs-tech')[0].id.toLowerCase().indexOf('flash') > -1)
            detectedTech = 'flash';
    };

    var startPlay = function() {
        player.play();
    };

    var initAnalytics = function() {
        var analytics = playObj.analytics;
        logger.info('initAnalytics - analytics:%o conviva, elem:%o', analytics, analytics.convivaData.enable[playObj.streamType], $(player.el()).find('video')[0]);

        if (!analyticsConviva && analytics.convivaData && analytics.convivaData.enable[playObj.streamType]) {
            logger.info('initAnalytics - Conviva enabled:%o', analytics.convivaData.enable[playObj.streamType] );
            //analytics values
            analyticsConviva = new eventsPlayer.control.AnalyticsConviva(analytics.convivaData);
        }
                
        if (analyticsConviva && analytics.convivaData.enable[playObj.streamType]) {
            analytics.convivaData.name = playObj.title;
            analytics.convivaData.url = playObj.url;
            analytics.convivaData.player = player;
            analytics.convivaData.renderer = 'videojs';
            analytics.convivaData.cdn = playObj.cdn;
            analytics.convivaData.playerName = 'HTML5';
            analytics.convivaData.channelName = playObj.channel;
            analyticsConviva.startSession(analytics.convivaData);
        }

        if (!analyticsAkamai && analytics.akamaiData.enable[playObj.streamType]) {
            analyticsAkamai = new eventsPlayer.control.AnalyticsAkamai(player, analytics.akamaiData);
        }

        if (!analyticsYoubora && analytics.youboraData && analytics.youboraData.enable) {
            analyticsYoubora = new eventsPlayer.control.AnalyticsYoubora(player, analytics.youboraData);
        }
    };

    var recordEvent = function(data) {
        //logger.info('recordEvent - data:%o', data );
        if (data.service.toLowerCase() == 'conviva' && analyticsConviva){
            analyticsConviva.sendEvent(data.name, data.data);
        }
    };

    var initIma = function() {
        try {
            if (!ima) {
                ima = new eventsPlayer.ads.Ima(playObj.adConfig);
                ima.on('AdStart', onAdStart);
                ima.on('AdEnd', onAdEnd);
            };
        }
        catch(e) {
            logger.error('initIma - %o', e);
        }
    };

    var sendMetadata = function() {
        var playerEvent = new eventsPlayer.commons.MetadataEvent();
        playerEvent.aspect = player.aspectRatio();
        // playerEvent.live = player.live;
        // playerEvent.dvr = player.dvr;
        playerEvent.width = player.videoWidth();
        playerEvent.height= player.videoHeight();
        playerEvent.fullscreenEnabled = fullscreenManager.isFullscreenEnabled();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var updateQosData = function() {
        var data = new eventsPlayer.commons.QosData();
        var qos = {};

        //data.frameRate = player.frameRate;
        data.playRate = player.playbackRate();
        qos.renderer = detectedTech;
        
        logger.info('updateQosData - hls:%o', hls);

        if (hls) {
            renditions = getPlaylist();
            logger.info('updateQosData - Qos renditions:%o activeInd:%o', renditions, activeRenditionIndex);
            var activeRendition = renditions[activeRenditionIndex];

            if (activeRendition) {
                var path = masterUri.substring(0, masterUri.lastIndexOf('/') + 1);
                var shortUri = activeRendition.uri.replace(path, '');

                qos.path = path;
                qos.manifest = shortUri;
                qos.activeRendition = activeRenditionIndex + 1;
                qos.totalRenditions = renditions.length;
                qos.bandwidth = activeRendition.bandwidth;
                qos.resolution = activeRendition.resolution.width + 'x' + activeRendition.resolution.height;
                qos.codecVideo = activeRendition.codecs.video;
                qos.codecAudio = activeRendition.codecs.audio;
            }
            else {
                qos.stream = masterUri;
                qos.activeRendition = 1;
                qos.totalRenditions = 1;
                qos.uri = 'm3u8 rendition';
                qos.bandwidth = '';
                qos.resolution = '';
                qos.codecVideo = '';
                qos.codecAudio = '';
            }
        }
        
        //var timeRange = player.buffered();
        //logger.info('buffer - buffered start:%o end:%o', timeRange.start(0), timeRange.end(0));
        
        //logger.info('renditions - total:%o current:%o ', renditions.length, activeRendition);

        //logger.info('onTimeUpdate - Qos framerate:%o playrate:%o', data.frameRate, data.playRate);
        //logger.info('onTimeUpdate - Qos network:%o', player.networkState());
        //logger.info('onTimeUpdate - Qos buffer:%o', player.bufferedPercent());

        //logger.info('updateQosData - Qos framerate:%o playrate:%o qos:%o', data.frameRate, data.playRate, data);

        qosData = qos;
    };

    var getPlaylist = function() {
        var master = hls.playlists.master;
        var renditions = [];
        var data = {};
        var codecs;

        logger.info('getPlaylist - master:%o playerHls:%o active:%o', master, hls.playlists.media(), activeUri);

        if (master.playlists.length > 1) {
           masterUri = master.uri; 

           for (var i = 0; i < master.playlists.length; i++) {
                data = {};
                try{
                    data.id = master.playlists[i].attributes['PROGRAM-ID'];
                }
                catch(e){
                    data.id = 'unknown';
                }
                data.bandwidth = master.playlists[i].attributes.BANDWIDTH;
                data.uri = master.playlists[i].uri;
                data.resolution = {};
                data.codecs = {};

                if (master.playlists[i].attributes.RESOLUTION) {
                    data.resolution.width = master.playlists[i].attributes.RESOLUTION.width;
                    data.resolution.height = master.playlists[i].attributes.RESOLUTION.height;
                }
                else {
                    data.resolution.width = 0;
                    data.resolution.height = 0;
                }

                if (master.playlists[i].attributes.CODEC) {
                    codecs = master.playlists[i].attributes.CODEC.split(',');
                    data.codecs.video = codecs[0];
                    data.codecs.audio = codecs[1];
                }
                else {
                    data.codecs.video = 'N/A';
                    data.codecs.audio = 'N/A';
                }

                renditions.push(data);

                if (data.uri === activeUri) {
                    activeRenditionIndex = i;
                    if (analyticsConviva) {
                        analyticsConviva.reportBitrate(data.bandwidth/1000);
                    }
                    if (analyticsAkamai) {
                        analyticsAkamai.onBitrate(data.bandwidth/1000);
                    }
                }
            } 

        }
        else {
            masterUri = playObj.url;
            data.id = 'unknown';
            data.bandwidth = '';
            data.uri = '';
            data.resolution = '';
            data.codecs = '';

            renditions.push(data);
        }
        
        //logger.info('getPlaylist - uri:%o', masterUri);
        logger.info('getPlaylist - index:%o active:%o', activeRenditionIndex, renditions[activeRenditionIndex]);

        return renditions;
    };

    var setupHls = function() {
        //hls = player.hls;
        var tech = player.tech({ IWillNotUseThisInPlugins: true });
        logger.info('setupHls - tech:%o', tech);
        hls = tech.hls;

        logger.info('setupHls - tech:%o hls:%o', tech, hls);
        if (hls) {
            logger.info('setupHls -addlis %o', hls);
            hls.on('loadedmetadata', onHlsLoadedMetadata);
            hls.on('mediachange', onMediaChange);
        };
        
    };

    var seek = function(time) {
        if (time >= player.duration()) {
            time = player.duration() - .001;
        }

        var seekTime = time;

        if (detectedStreamType === constants.DVR) {
            if (seekTime < player.currentTime()) {
                seekTime = time + player.seekable().start(0) + 5;
            }
            else {
                seekTime = time + player.seekable().start(0);
            }
        }

        logger.info('seek - type:%o time:%o seekTime:%o dur:%o', detectedStreamType, time, seekTime, player.duration());

        if (player){
            player.currentTime(seekTime);
        }
        
    }

    var videoFullscreenOn = function() {
        logger.info('videoFullscreenOn -');
        var playerEvent = new eventsPlayer.commons.VideoFullscreenEvent;
        playerEvent.fullscreen = true;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var videoFullscreenOff = function(measure) {
        logger.info('videoFullscreenOff -');
        //fullscreenManager.sendFullscreenOffCallback();

        var playerEvent = new eventsPlayer.commons.VideoFullscreenEvent;
        playerEvent.fullscreen = false;
        playerEvent.measure = fullscreenMeasure;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;

        fullscreenMeasure = true;
    };

    /**
     * setup texttracks
     */
    var setupTextTracks = function() {
        var inbandTracks = player.textTracks();
        var tracks = [];
        var addedTrack;
        logger.info('setupTextTracks - inbandTrackLen:%o trackIndex:%o captionDisp:%o', inbandTracks.length, trackIndex, playObj.captions);

        if (playObj.captions == 'default' && playObj.tracks && inbandTracks.length == 0) {
            useInbandTrack = false;
            for (var i = 0; i < playObj.tracks.length; i++) {
                //tracksTags += '<track kind="' + playObj.tracks[i]['type'] + '" srclang="en" src="' + playObj.tracks[i]['file'] + '" label="' + playObj.tracks[i]['label'] + '"></track>'
                addedTrack = player.addRemoteTextTrack({
                    kind: playObj.tracks[i]['type'],
                    language: 'en',
                    label: playObj.tracks[i]['label'],
                    src: playObj.tracks[i]['file'],
                    id: 'added',
                    mode: 'hidden'
                  });

                tracks.push(addedTrack);

                addedTrack.addEventListener('load', function() {
                    logger.info('setupTextTracks - onload - trackIndex:%o tracks:%o', trackIndex, player.textTracks());
                    updateCueList(player.textTracks()[trackIndex]);
                });

                //logger.info('setupTextTracks - track:%o', tracks[i]);
            }
        }
        else if (inbandTracks.length > -1){
            var inband = [];
            for (var i=0; i<inbandTracks.length; i++) {
                if(inbandTracks[i].kind == 'captions') {
                    inbandTracks[i].mode = 'disabled';
                    logger.info('setupTextTracks - inband - track:%o kind:%o lang:%o label:%o', inbandTracks[i], inbandTracks[i].kind, inbandTracks[i].language, inbandTracks[i].label);
                    inband.push({
                        'label': inbandTracks[i].label,
                        'language': inbandTracks[i].language,
                        'kind': inbandTracks[i].kind,
                        'index': i
                    });
                }
            }

            if (inband.length > 0){
                var playerEvent = new eventsPlayer.commons.TextTrackEvent();
                playerEvent.data = inband;

                sendMessage(playerEvent, localorigin);
                playerEvent = null;
            }
        }

        //if track index has been set, and the track exists
        //  go head and enable it
        if (trackIndex >= 0 && (tracks.length > 0 || inbandTracks.length > 0)) {
            if (player.textTracks().length) {
                enableTextTracks(trackIndex);
            }
            else {
                setTimeout(enableTextTracks, 200, trackIndex);
            }
        }

        //else if using native 608 and captions enabled
        else if (playObj.captionsEnabled && playObj.captions == 'custom') {
            if (player.textTracks().length) {
                enableTextTracks();
            }
            else {
                setTimeout(enableTextTracks, 200);
            }
        }

        //listen for inband cue changes (default controls?)
        if (inbandTracks.length > 0) {
            var currentTrack = player.textTracks()[0];
            var cue; 

            currentTrack.oncuechange = function() {
                if(currentTrack.activeCues[0] !== undefined){
                    cue = currentTrack.activeCues[0];
                    //logger.info('activeCue - cue:%o', cue);
                } 
            }
        }
    };

    /**
     * turns on text track with the index value specified
     *  - if using default VTT display
     *
     * PARAM values
     * index
     */
    var enableTextTracks = function(index) {
        if (playObj.captions == 'default') {
            firstCue = true;
            captionsDisplayEnabled = true;
            trackIndex = index;
            
            /*
            if (playObj.useNativeTextTracks && player.textTracks().length && !index) {
                for (var i = 0; i < player.textTracks().length; i++) {
                    if (player.textTracks()[i].kind == 'captions') {
                        trackIndex = i;
                        break;
                    }
                }
            }
            */

            //logger.info('enableTextTracks - index:%o tracks:%o remtracks:%o', trackIndex, player.textTracks(), player.remoteTextTracks());

            if (trackIndex >= 0 && player.textTracks().length) {
                logger.info('enableTextTracks - default - trackIndex:%o trackLen:%o', trackIndex, player.textTracks().length);

                currentTrack = player.textTracks()[trackIndex];
                var cue;
                
                //logger.info('enableTextTracks - default - curTrack:%o mode:%o', currentTrack, currentTrack.mode);

                updateCaptionsDisplay();
                player.textTrackSettings.setValues(newSettings);
                //$('.vjs-caption-settings.vjs-modal-overlay').removeClass("vjs-hidden");

                currentTrack.oncuechange = function() {
                    if (firstCue) {
                        firstCue = false;
                    }

                    if(currentTrack.activeCues[0] !== undefined){
                        cue = getCueData(currentTrack.activeCues[0]);
                        //logger.info('activeCue - cue:%o raw:%o', cue);

                        var playerEvent = new eventsPlayer.commons.CueChangeEvent;
                        playerEvent.data = cue;

                        sendMessage(playerEvent, localorigin);
                        playerEvent = null;
                    } 
                }
            }
        }

        //set enabled flag and change display mode of first inband track if exists
        //  custom608 display only works for inband native 608
        else if (playObj.captions == 'custom'){
            captions608display = true;

            logger.info('enableTextTracks - custom - native:%o len:%o', playObj.useNativeTextTracks, player.textTracks().length);

            if (playObj.useNativeTextTracks && player.textTracks().length) {
                for (var i = 0; i < player.textTracks().length; i++) {
                    if (player.textTracks()[i].kind == 'captions') {
                        trackIndex = i;
                        break;
                    }
                }
                currentTrack = player.textTracks()[trackIndex];
                updateCaptionsDisplay();

                //logger.info('enableTextTracks - trackIndex:%o', trackIndex);
                logger.info('enableTextTracks - curTrack:%o mode:%o', currentTrack, currentTrack.mode);
            }
        }
    };

    /**
     * disable text track
     *  - if using default VTT display
     */
    var disableTextTracks = function(){
        logger.info('disableTextTracks');

        if (playObj.captions == 'default') {
            captionsDisplayEnabled = false;
            captions608display = false;
            trackIndex = null;
        }
        else if (playObj.captions == 'custom'){
            captions608display = false;
        }
        updateCaptionsDisplay();
    };

    /**
     * toggle the display of captions based on if 'captions' on and if a currentTrack is set
     *  - check 608 as well for safari native caption 608
     */
    var updateCaptionsDisplay = function() {
        logger.info('updateCaptionsDisplay - track:%o captionsDisplayEnabled:%o', currentTrack, captionsDisplayEnabled);

        if ((captions608display || captionsDisplayEnabled) && currentTrack) {
            currentTrack.mode = 'showing';
        }
        else if (currentTrack){
            currentTrack.mode = 'disabled';
        }
    };

    /**
     * update and dispatch the cue list if it has changed
     */
    var updateCueList = function(tt) {
        var cues = [];
        
        if (tt.cues && tt.cues.length > 0) {
            //logger.info('updateCueList - cue:%o len:%o', tt.cues, tt.cues.length);
            for (var i = 0; i < tt.cues.length; i++) {
                cues.push(getCueData(tt.cues[i]));
            }
        }

        logger.info('updateCueList - new:%o', (JSON.stringify(cues) !== JSON.stringify(currentCues)));
        if (JSON.stringify(cues) !== JSON.stringify(currentCues)) {
            currentCues = cues;
            //logger.info('updateCueList - cues:%o', currentCues);

            var playerEvent = new eventsPlayer.commons.TrackLoadedEvent();
            playerEvent.data = currentCues;

            sendMessage(playerEvent, localorigin);
            playerEvent = null;
        }
    };

    /**
     * get formatted data object representing a text track cue
     */
    var getCueData = function(cue) {
        var data = {};
        var text = '';
        var id = cue.id.split(',');
        
        text = cue.text.replace(/(<.*?>)/g, '');
        text = text.replace(/(\r\n|\n|\r)/gm, '');

            //confidence = text.match(/(Watson Confidence: .*%)/g);
            //logger.info('updateCueList - cue:%o', tt.cues[i]);
            //if (confidence)
            //    confidence = confidence[0].substr(confidence[0].indexOf(': ') + 2);

        text = text.replace(/(Watson Confidence: .*%)/g, '');

        data.id = id[0];
        data.start = cue.startTime;
        data.end = cue.endTime;
        data.text = text;
        data.confidence = (id.length >= 2) ? id[1].replace(' ', '') : '0%';
        data.status = (id.length >= 3) ? id[2].replace(' ', '') : '';

        return data;
    };

    /**
     * update track cues
     */
    var updateTrackData = function(data) {
        var id;
        var cue;
        var perc;

        if (trackIndex >= 0) {
            var tt = player.textTracks()[trackIndex];
            var data = data.subtitle;
            logger.info('updateTrackData - length:%o cuelen:%o', data.length, tt.cues.length);

            for (var j = tt.cues.length-1; j >= 0; j--) {
                tt.removeCue(tt.cues[j]);
            }
            
            for (var i = 0; i < data.length; i++) {
                //logger.info('updateTrackData - entry:%o', data[i]);
                var cue = new window.VTTCue(data[i].startTime, data[i].endTime, data[i].transcript);
                perc = Math.round(data[i].confidence * 1000)/10;
                cue.id = data[i].index + ', ' + perc + '%, ' + data[i].status;;
                //logger.info('updateTrackData - i:%o cuelen:%o new:%o', i, tt.cues.length, cue);
                tt.addCue(cue);
            }

            updateCueList(tt);
        }
    };

    var onHlsLoadedMetadata = function() {
        logger.info('onHlsLoadedMetadata - %o select:%o');

        if (analyticsAkamai) {
            analyticsAkamai.loadedmetadata(playObj.title, 'videojs', 'testId');
        }
    };

    var onMediaChange = function() {
        logger.info('onMediaChange - %o select:%o');

        //player.hls.playlists.media()
    };

    var onCanPlay = function(data) {
        //logger.info('onCanPlay - ');
    };

    var onLoadedMetadata = function(data) {
        checkState();
		logger.info('onLoadedMetadata - %o rs:%o dur:%o cur:%o seekLen:%o seekStart:%o seekEnd:%o buffer:%o', data, player.readyState(), player.duration(), player.currentTime(), player.seekable().length, player.seekable().start(0), player.seekable().end(0), player.bufferedEnd());

        //setInterval(checkState, 1000)
	}

    var onLoadedData = function(data) {
        //logger.info('onLoadedData - data:%o', data);
        //logger.info('onLoadedMetadata - tracks:%o remtracks:%o', player.textTracks(), player.remoteTextTracks());
        updateQosData();
        logger.info('onLoadedData - send meta, tracks:%o len:%o rs:%o', player.textTracks(), player.textTracks().length, player.readyState());
        sendMetadata();

        setupTextTracks();
    };

    var checkState = function() {
        logger.info('checkState - rs:%o dur:%o cur:%o seekLen:%o seekStart:%o seekEnd:%o bufferEnd:%o', player.readyState(), player.duration(), player.currentTime(), player.seekable().length, player.seekable().start(0), player.seekable().end(0), player.bufferedEnd());
    };

    var onPlay = function(data) {
        paused = false;
        waiting = false;

        var playerEvent = new eventsPlayer.commons.PauseEvent();
        playerEvent.paused = false;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;

        if (analyticsAkamai) {
            analyticsAkamai.onPlay();
        }
    };

    var onPause = function(data) {
        paused = true;

        var playerEvent = new eventsPlayer.commons.PauseEvent();
        playerEvent.paused = true;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;

        if (analyticsAkamai) {
            analyticsAkamai.onPause();
        }
    };

    var onPlaying = function(data) {
        logger.info('onPlaying - data:%o curVolume:%o muted:%o dur:%o time:%o', data, curVolume, player.muted(), player.duration(), player.currentTime());
        
        waiting = false;
        videoEnded = false;
        var playerEvent = new eventsPlayer.commons.PlayEvent();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;

        if (muted) {
            player.muted(muted);
        }

        if (!curVolume) {
            player.volume(defaultVolume);
            curVolume = defaultVolume;
        }
        else {
           player.volume(curVolume); 
        }

        if (analyticsAkamai) {
            analyticsAkamai.onBufferEnd();
        }
    };

    var onDurationChange = function(data) {
        //onLoadedMetadata(null);
    };

    var onTimeUpdate = function(data) {
        var playerEvent = new eventsPlayer.commons.TimeUpdateEvent();
        

        if (!detectedStreamType && player.currentTime() > 0) {
            if (!isFinite(player.duration()) && player.currentTime() > minDvrStreamLength) {
                detectedStreamType = constants.DVR;
            }
            else if (!isFinite(player.duration())) {
                detectedStreamType = constants.LIVE;
            }
            else if (isFinite(player.duration())) {
                detectedStreamType = constants.VOD;
            }

            if (analyticsYoubora) {
                analyticsYoubora.setStreamType((detectedStreamType != constants.VOD));
            }

            logger.info('onTimeUpdate - type:%o duration:%o current:%o', detectedStreamType, player.duration(), player.currentTime());
        }

        /*
        if (detectedStreamType === 'dvr') {
            playerEvent.duration = playerEvent.loadedTime - 10;
        }
        */

        //logger.info('onTimeUpdate - type:%o duration:%o current:%o', detectedStreamType, player.duration(), player.currentTime());
        //logger.info('onTimeUpdate - textTracks:%o band:%o hls.segmentXhrTime:%o', player.textTracks().length, hls.bandwidth, hls.stats);
        //logger.info('onTimeUpdate - tracks:%o', player.textTracks());
        
        playerEvent.start = 0;

        if (detectedStreamType == constants.DVR) {
            playerEvent.time = player.currentTime();
            playerEvent.duration = player.seekable().end(0) - player.seekable().start(0);
            playerEvent.start = player.seekable().start(0);
            //if (playerEvent.time > playerEvent.duration)
            //    playerEvent.time = playerEvent.duration;
            initialDuration = playerEvent.duration;
        }
        else {
            playerEvent.time = player.currentTime();
            playerEvent.duration = player.seekable().end(0) - player.seekable().start(0);
            playerEvent.start = player.seekable().start(0);
            initialDuration = playerEvent.duration;
        }

        var buffered = [];
        for (var i=0; i<player.buffered().length; i++) {
            buffered.push({'start':player.buffered().start(i), 'end':player.buffered().end(i)})
        }
        playerEvent.buffered = buffered;
        
        playerEvent.loadedTime = player.seekable().end(0);
        playerEvent.detectedStreamType = detectedStreamType;
        playerEvent.qos = qosData;
        playerEvent.programDateTime = player.currentProgramDateTime;
        //logger.info('onTimeUpdate - playerEvent:%o', playerEvent);

        try{
            var activeMedia = hls.playlists.media();
            if (activeUri !== activeMedia.uri) {
                logger.info('onTimeUpdate - active:%o', activeMedia.uri);
                activeUri = activeMedia.uri;
                updateQosData();
            }
        }
        catch (e) {
            //logger.error('onTimeUpdate - %o', e);
        }

        sendMessage(playerEvent, localorigin);
        playerEvent = null;

        if (player.duration() - player.currentTime() < 0.05) {
            if (endIncrement > 10) {
                onEnded();
            }
            else {
                endIncrement++;
            }
        }
    };

    var onWaiting = function(data) {
        waiting = true;

        //logger.info('onWaiting - %o buffered:%o start:%o', data, player.buffered);
        var playerEvent = new eventsPlayer.commons.BufferingEvent();

        sendMessage(playerEvent , localorigin);
        playerEvent = null;

        if (analyticsAkamai) {
            analyticsAkamai.onBufferStart();
        }
    };

    var onEnded = function(data) {

        //player.posterImage.show();  
        //player.src();  
        //player.controlBar.hide();  
        //player.bigPlayButton.show();  
        //player.cancelFullScreen();  
        logger.info('onEnded - ');
        var playerEvent = new eventsPlayer.commons.CompleteEvent();

        if (ima) {
            logger.info('onEnded - hasPostroll:%o isPlaying:%o pos:%o', ima.hasAd('vast', constants.postroll), ima.isPlayingAd(), ima.getPosition());
            if (ima.isPlayingAd()) {
                onAdEnd(ima.getPosition());
                return;
            }

            if (ima.hasAd('vmap') || ima.hasAd('vast', constants.postroll)) {
                playerEvent.postroll = true;
                sendMessage(playerEvent, localorigin);
                playerEvent = null;
                if (!ima.hasAd('vmap') && ima.hasAd('vast', constants.postroll)) {
                    ima.play('vast', constants.postroll, null);
                }
                else {
                    //if not playing postroll, set to postroll for vmap
                    ima.setPosition(constants.postroll);
                }
            }
            else if (!videoEnded){
                videoEnded = true;
                sendMessage(playerEvent, localorigin);
                playerEvent = null;
            }
        }
        else if (!videoEnded){
            videoEnded = true;
            sendMessage(playerEvent, localorigin);
            playerEvent = null;

            if (analyticsConviva) {
                analyticsConviva.cleanUpSession();
            }

            //force exit ios fullscreen on complete
            logger.info('fullScreenOffVideo - player:%o', player);
            fullscreenMeasure = false;
            player.exitFullscreen();
        }

        //allow play event if restart after end
        firstPlay = false;

        if (analyticsAkamai) {
            analyticsAkamai.onEnded();
        }
    };

    /**
     * cleanup and reset
     *  - usueful for ios when exiting fullscreen with "done"
     */
    var onFinish = function() {
        logger.info('onFinish - ended:%o paused:%o waiting:%o', videoEnded, paused, waiting);

        if (waiting && detectedStreamType == constants.VOD) {
            seek(0);

            var playerEvent = new eventsPlayer.commons.CompleteEvent();
            videoEnded = true;
            sendMessage(playerEvent, localorigin);
            playerEvent = null;

            if (analyticsConviva) {
                analyticsConviva.cleanUpSession();
            }

            firstPlay = false;
        }

        return;
    };

    var onStalled = function(data) {
        //logger.info('onStalled - %o', data);
        waiting = true;
    };

    var onError = function(data) {
        var err = player.error();
        logger.error('onError - err:%o', err);
        var playerEvent = new eventsPlayer.commons.ErrorEvent();
        if (err) {
            playerEvent.message = err.code + '|' + err.type + '|' + err.message;
            playerEvent.stack = ''; 
        }
        sendMessage(playerEvent, localorigin);
        playerEvent = null;

        if (analyticsConviva) {
            analyticsConviva.reportError(err.message || 'unspecified');
            analyticsConviva.cleanUpSession();
        }

        if (analyticsAkamai) {
            analyticsAkamai.onError();
        }
    };

    var onVolumeChange = function(data) {
        //logger.info('onVolumeChange - muted:%o vol:%o', player.muted(), player.volume());

        muted = player.muted();

        var playerEvent = new eventsPlayer.commons.VolumeEvent();
        playerEvent.muted = player.muted();
        playerEvent.volume = player.volume();
        curVolume = player.volume();

        sendMessage(playerEvent, localorigin);
    };

    //******************************
    // Ad Event Handlers
    //******************************
    var onAdStart = function(position) {
        logger.info('onAdStart - pos:%o', position);
        var playerEvent = new eventsPlayer.commons.AdStartEvent();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onAdEnd = function(position) {
        logger.info('onAdEnd - pos:%o', position);
        var playerEvent = new eventsPlayer.commons.AdEndEvent();
        playerEvent.position = position;
        sendMessage(playerEvent, localorigin);
        playerEvent = null;

        if (position === constants.postroll) {
            var playerEvent = new eventsPlayer.commons.CompleteEvent();
            sendMessage(playerEvent, localorigin);
            playerEvent = null;
        }
    };

    var onResize = function() {
        logger.info('onResize - holder:%o width:%o', holder, $(holder).width());
        var playerEvent = new eventsPlayer.commons.ResizeEvent();
        playerEvent.width = $(holder).width();
        playerEvent.height = $(holder).height();
        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    //******************************
    //postMessage Handling
    //******************************
    var receiveMessage = function(event) {
        var eventData = event.data;
        //logger.info('receiveMessage msg:%o from:%s player:%o', eventData, event.origin, player);

        switch(eventData.name) {
            case 'load': 
                load(eventData.data);
                break;

            case 'stop':
                if (player) {
                    player.pause();
                    if (ima) {
                        ima.pause();
                    }
                    if (analyticsConviva) {
                        analyticsConviva.cleanUpSession();
                    }
                    //player.dispose();
                }
                break;

            case 'play': 
                if (player) player.play();
                break;

            case 'pause': 
                if (player) player.pause();
                break;

            case 'seek': 
                if (player) 
                    seek(eventData.data.time);
                break;

            case 'mute': 
                muted = eventData.data.mute;
                if (player) player.muted(muted);
                break;

            case 'volume': 
                if (player) player.volume(eventData.data.volume);
                break;

            case 'fullscreenOn':
                //logger.info('receiveMessage msg:%o from:%s', eventData, event.origin);
                player.requestFullscreen();
                break;

            case 'updateTextTrack': 
                updateTrackData(eventData.data);
                break;

            case 'captionsOn': 
                enableTextTracks(eventData.data.index);
                break;

            case 'captionsOff': 
                disableTextTracks();
                break;

            case 'recordEvent':
                recordEvent(eventData.data);
                break;

            default:
                break;
        }
    };
    
    var sendMessage = function(message, origin) {
        //logger.info('sendMessage - send msg:%o origin:%o', message, origin);
        var localMessage = message;

        message.type = namespace + ':' + message.type;
        window.parent.postMessage(message, origin);

        var type = 'tech:' + localMessage.type;
        //$(document).trigger(type, [localMessage]);
    };
    
    var addListeners = function() {
        window.addEventListener("message", receiveMessage);
    };


    var sendReady = function() {
        logger.info('sendReady - ns:%o', namespace);

        var playerEvent = new eventsPlayer.commons.PlayerReadyEvent();
        playerEvent.tech = techName;
        playerEvent.fullscreenEnabled = fullscreenManager.isFullscreenEnabled();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    /**
     * handle setting different states of post and play button within poster
     */
    var setPoster = function(poster, button) {
        logger.info('setPoster - poster:%o button:%o', poster, button);
        if (poster) {
            $('.poster').show();
            if (button) {
                $('.poster').find('img').show();
            }
            else {
                $('.poster').find('img').hide();
            }
        }
        else {
            $('.poster').hide();
            $('.poster').find('img').show();
        }
    }

    api.receive608 = function(time, data){
        //logger.info('receive608 - time:%o data:%o cur:%o', time, data, player.currentTime(), player.dur);

        if (detectedStreamType == constants.DVR || detectedStreamType == constants.LIVE) {
            time += initialDuration;
        }

        var playerEvent = new eventsPlayer.commons.CaptionEvent();
        playerEvent.time = time;
        playerEvent.data = data;
        sendMessage(playerEvent, localorigin);
        playerEvent = null;
     
    };
    
    // api functions
    api.load = function(obj) {
        load(obj);
    };

    api.forceError = function() {
        player.error({code:'2'});
        
    };

    init();
    addListeners();
    setTimeout(sendReady,100);
    return api;
};

/*
	Source: build/PlayerVideojsHlsjs.js
*/
function PlayerVideojsHlsjs(_holder, _techname) {
    var api = new Object();
    var self = this;
    var localport = (location.port !== '80') ? ':' + location.port : '';
    var localorigin = 'http://' + document.domain + localport;
    var logger = new eventsCore.util.Logger('PlayerVideojsHlsjs');
    
    var techName = 'videojs_hlsjs';
    var techOverride = {"techOrder":["html5","Hlsjs"]};
    var holder = _holder;
    var constants = eventsPlayer.PlayerConstants;

    var playObj;
    var player;                 //player object from videojs
    var hls;                    //the hls object from videojs-contrib-hls
    var qosData;                
    var renditions;             //array of renditions
    var activeRenditionIndex;   //the current rendition index
    var activeUri;
    var streamType;             //Live or Vod
    var segmentsLength;          //number of segments
    var masterUri;
    var tech;

    logger.info('constructor:%o holder:%o player:%o', self, holder, player);   

    var load = function(_playObj) {
        holder.html();
        hls = null;
        renditions = null;
        activeRenditionIndex = null;
        qosData = null;

        playObj = _playObj;
        logger.info('********************');
        logger.info('load - obj:%o', playObj);

    	if (player)
			player.dispose();
		
		logger.info('load - holder:%s obj:%o', holder, playObj);

		holder.html(
			'<video id="events-video-obj" class="video-js vjs-default-skin" controls></video>'
		);

        if (techOverride)
            playObj.techOrder = techOverride;

		player = videojs(
			'events-video-obj', 
			playObj.techOrder,
			function() {
				logger.info("load - player ready - src:%s", this.currentSrc());
                onInitialized();
			});

        player.controls(true);
        //player.playbackRate(3);
       
    };

    var sendMetadata = function() {
        var playerEvent = new eventsPlayer.commons.MetadataEvent();
        playerEvent.aspect = player.aspectRatio();
        // playerEvent.live = player.live;
        // playerEvent.dvr = player.dvr;
        playerEvent.width = player.videoWidth();
        playerEvent.height= player.videoHeight();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var updateQosData = function() {
        var data = new eventsPlayer.commons.QosData();
        //data.frameRate = player.frameRate;
        data.playRate = player.playbackRate();
        
        logger.info('updateQosData - hls:%o', hls);

        renditions = getPlaylist();
        logger.info('updateQosData - Qos renditions:%o activeInd:%o', renditions, activeRenditionIndex);
        var activeRendition = renditions[activeRenditionIndex];
        var qos = {};

        if (activeRendition) {
            var path = masterUri.substring(0, masterUri.lastIndexOf('/') + 1);
            var shortUri = activeRendition.uri.replace(path, '');

            qos.stream = masterUri;
            qos.activeRendition = activeRenditionIndex + 1;
            qos.totalRenditions = renditions.length;
            qos.uri = shortUri;
            qos.bandwidth = activeRendition.bandwidth;
            qos.resolution = activeRendition.resolution.width + 'x' + activeRendition.resolution.height;
            qos.codecVideo = activeRendition.codecs.video;
            qos.codecAudio = activeRendition.codecs.audio;
        }
        
        //var timeRange = player.buffered();
        //logger.info('buffer - buffered start:%o end:%o', timeRange.start(0), timeRange.end(0));
        
        //logger.info('renditions - total:%o current:%o ', renditions.length, activeRendition);

        //logger.info('onTimeUpdate - Qos framerate:%o playrate:%o', data.frameRate, data.playRate);
        //logger.info('onTimeUpdate - Qos network:%o', player.networkState());
        //logger.info('onTimeUpdate - Qos buffer:%o', player.bufferedPercent());

        //logger.info('updateQosData - Qos framerate:%o playrate:%o qos:%o', data.frameRate, data.playRate, data);

        qosData = qos;
    };

    var getPlaylist = function() {
        var master = hls.playlists.master;
        var renditions = [];
        var data;
        var codecs;

        logger.info('getPlaylist - master:%o playerHls:%o', master, hls.playlists);

        masterUri = master.uri;
        if (master.playlists[0].playlistType)
            streamType = master.playlists[0].playlistType;
        if (master.playlists[0].segments)
            segmentsLength = master.playlists[0].segments.length;

        for (var i = 0; i < master.playlists.length; i++) {
            data = {};
            data.id = master.playlists[i].attributes['PROGRAM-ID'];
            data.bandwidth = master.playlists[i].attributes.BANDWIDTH;
            data.uri = master.playlists[i].uri;
            data.resolution = {};
            data.codecs = {};

            if (master.playlists[i].attributes.RESOLUTION) {
                data.resolution.width = master.playlists[i].attributes.RESOLUTION.width;
                data.resolution.height = master.playlists[i].attributes.RESOLUTION.height;
            }
            else {
                data.resolution.width = 0;
                data.resolution.height = 0;
            }

            if (master.playlists[i].attributes.CODECS) {
                codecs = master.playlists[i].attributes.CODECS.split(',');
                data.codecs.video = codecs[0];
                data.codecs.audio = codecs[1];
            }
            else {
                data.codecs.video = 'N/A';
                data.codecs.audio = 'N/A';
            }

            renditions.push(data);

            if (data.uri === activeUri) {
                activeRenditionIndex = i;
            }
        } 

        return renditions;
    };

    var setupHls = function() {
        logger.info('setupHls - tech: %o', player.tech({ IWillNotUseThisInPlugins: true }));
        hls = player.tech({ IWillNotUseThisInPlugins: true }).hls;

        logger.info('setupHls - tech:%o hls:%o', tech, hls);
        if (hls) {
            logger.info('setupHls -addlis %o', hls);
            hls.on('loadedmetadata', onHlsLoadedMetadata);
            hls.on('mediachange', onMediaChange);
        };
        
    };

    //******************************
    //player event handlers
    //******************************
    var onInitialized = function(data) {
        logger.info('onInitialized - %o', data);

        player.autoplay(true);
        //player.on('loadedmetadata', onLoadedMetadata);
        player.on('canplay', onCanPlay);
        player.on('loadeddata', onLoadedData);
        player.on('play', onPlay);
        player.on('pause', onPause);
        player.on('playing', onPlaying);
        player.on('timeupdate', onTimeUpdate);
        player.on('durationchange', onDurationChange);
        player.on('waiting', onWaiting);
        player.on('ended', onEnded);
        player.on('stalled', onStalled);
        player.on('error', onError);

       // tech = player.tech({ IWillNotUseThisInPlugins: true });
        //logger.info('onInitialized - tech:%o', tech);
        
        player.src({type: playObj.mimeType, src:playObj.url});
        //setTimeout(setupHls,100);
        setupHls();
    };

    var onHlsLoadedMetadata = function() {
        logger.info('onHlsLoadedMetadata - %o select:%o');
    };

    var onMediaChange = function() {
        logger.info('onMediaChange - %o select:%o');

        //player.hls.playlists.media()
    };

    var onCanPlay = function(data) {
        logger.info('onCanPlay - ');
    };

    var onLoadedMetadata = function(data) {
		logger.info('onLoadedMetadata - %o', data);
		//logger.info('onLoadedMetadata - tracks:%o remtracks:%o', player.textTracks(), player.remoteTextTracks());
		//player.play();
        
	}

    var onLoadedData = function(data) {
        logger.info('onLoadedData - data:%o', data);
        //logger.info('onLoadedMetadata - tracks:%o remtracks:%o', player.textTracks(), player.remoteTextTracks());
        updateQosData();
        sendMetadata();
    };

    var onPlay = function(data) {
        var playerEvent = new eventsPlayer.commons.PauseEvent();
        playerEvent.paused = false;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onPause = function(data) {
        var playerEvent = new eventsPlayer.commons.PauseEvent();
        playerEvent.paused = true;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onPlaying = function(data) {
        var playerEvent = new eventsPlayer.commons.PlayEvent();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onDurationChange = function(data) {
        //onLoadedMetadata(null);
    };

    var onTimeUpdate = function(data) {
        //logger.info('onTimeUpdate - %o dateTime:%s duration:%s current:%s', data, player.currentProgramDateTime, player.duration, player.currentTime);
        var playerEvent = new eventsPlayer.commons.TimeUpdateEvent();
        playerEvent.time = player.currentTime();
        playerEvent.duration = player.duration();
        // playerEvent.programDateTime = player.currentProgramDateTime;
        playerEvent.loadedTime = player.bufferedEnd();

        playerEvent.qos = qosData;

        try{
            var activeMedia = hls.playlists.media();
            if (activeUri !== activeMedia.uri) {
                activeUri = activeMedia.uri;
                updateQosData();
            }
        }
        catch (e) {
            //logger.error('onTimeUpdate - %o', e);
        }

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onWaiting = function(data) {
        //logger.info('onWaiting - %o buffered:%o start:%o', data, player.buffered);
        var playerEvent = new eventsPlayer.commons.BufferingEvent();

        sendMessage(playerEvent , localorigin);
        playerEvent = null;
    };

    var onEnded = function(data) {
        var playerEvent = new eventsPlayer.commons.CompleteEvent();

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    var onStalled = function(data) {
        //logger.info('onStalled - %o', data);
    };

    var onError = function(data) {
        //logger.info('onError - %o', data);
        var playerEvent = new eventsPlayer.commons.ErrorEvent();
        playerEvent.message = data.error.message;
        playerEvent.stack = data.error.stack;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    //******************************
    //postMessage Handling
    //******************************
    var receiveMessage = function(event) {
        var eventData = event.data;
        logger.info('receiveMessage msg:%o from:%s', eventData, event.origin);
        if (eventData.name === 'load') {
            load(eventData.data)
        }
        else if (eventData.name === 'stop') {
            player.stop();
        }
    };
    
    var sendMessage = function(message, origin) {
        //logger.info('communicator - send msg:%s data:%s post:%o', message, data,  window.parent.postMessage);
        window.parent.postMessage(message, origin);
    };
    
    var addListeners = function() {
        window.addEventListener("message", receiveMessage);
    };


    var sendReady = function() {
        var playerEvent = new eventsPlayer.commons.PlayerReadyEvent();
        playerEvent.tech = techName;

        sendMessage(playerEvent, localorigin);
        playerEvent = null;
    };

    // api functions
    // api functions
    api.load = function(obj) {
        load(obj);
    };

    addListeners();
    setTimeout(sendReady,100);
    return api;
};

/*
	Source: build/QosDisplay.js
*/
/**
 * Create a core player object for namespacing
 */
(function($) {
function QosDisplay(_state, _version, _showQos) {
        var api = new Object();
        var self = this;
        var logger = new eventsCore.util.Logger('QosDisplay');
        var state = _state;
        var version = _version;
        var overlayQos;

        var showQosDefault = _showQos;
        var statkeys = '';
        var showCode = 'videostat';
        var currentTech = 'unknown';
        var streamType = 'unknown';

        //logger.info('constructor - wrapper:%o show:%o', wrapper, showQosDefault);

        var setupDisplayElements = function() {
            $(state.wrapper).append('<div class="overlayQos"></div>');
            //logger.info('setupDisplayElements - container:%o overlay:%o', $(state.container), overlayQos);
            overlayQos = $(state.container).find('.overlayQos')[0];

            if (!showQosDefault)
                $(overlayQos).hide();
            else
                $(overlayQos).show();
        };

        api.keyEntry = function(e) {
            logger.info('keyEntry - key:%o tag:%o', e);

            if (e.key === 'Escape'){
                statkeys = '';
                $(overlayQos).hide();
            }
            else if (e.target.tagName.toLowerCase() === 'div') {
                statkeys += String.fromCharCode(e.keyCode);
                if (statkeys.length > showCode.length)
                    statkeys = statkeys.substr(1);

                //logger.info('keyEntry - key:%o tag:%o', statkeys, e.target.tagName);
                if (statkeys.toLowerCase() === showCode) {
                    $(overlayQos).show();
                }
            }
        };

        api.update = function(data) {
            //logger.info('updateQos - data:%o', data);

            if (!data)
                return;
            
            var bwString = (data.bandwidth / 1000) + ' Kbps';

            if (data){
                //logger.info('updateQos - uri:%o', data.uri);
                var table = '' +
                    '<table>' +
                        '<tr><td class="qosText">ECP version:</td><td class="qosText"> ' + version + '</td></tr>' +
                        '<tr><td class="qosText">Path:</td><td class="qosText"> ' + data.path + '</td></tr>' +
                        '<tr><td class="qosText">Manifest:</td><td class="qosText"> ' + data.manifest + '</td></tr>' +
                        '<tr><td class="qosText">Rendition:</td><td class="qosText"> ' + data.activeRendition + '/' + data.totalRenditions + '</td></tr>' +
                        '<tr><td class="qosText">Bitrate:</td><td class="qosText"> ' + bwString + '</td></tr>' +
                        '<tr><td class="qosText">Resolution:</td><td class="qosText"> ' + data.resolution + '</td></tr>' +
                        '<tr><td class="qosText">Video:</td><td class="qosText"> ' + data.codecVideo + '</td></tr>' +
                        '<tr><td class="qosText">Audio:</td><td class="qosText"> ' + data.codecAudio + '</td></tr>' +
                        '<tr><td class="qosText">Video Type:</td><td class="qosText"> ' + streamType + '</td></tr>' +
                        '<tr><td class="qosText">Tech:</td><td class="qosText"> ' + currentTech + '</td></tr>' +
                        '<tr><td class="qosText">Renderer:</td><td class="qosText"> ' + data.renderer + '</td></tr>' +
                    '</table>';

                if ($('.overlayQos').is(':visible')) {
                    $('.overlayQos').html(table);
                }
                
            }
        };

        api.setTech = function(tech) {
            currentTech = tech;
        };

        api.setStreamType = function(type) {
            streamType = type;
        }

        api.reset = function() {
            //logger.info('reset - %o', $('.overlayQos'));
            $(overlayQos).empty();
        };

        setupDisplayElements();
        return api;
    }

    //console.log('PlayerManager: par:%o', window.eventsPlayer.player);
   	window.eventsPlayer.view.QosDisplay = QosDisplay;
}(jQuery));

;

/*
	Source: build/SocialShare.js
*/
/**
 * Create a core player object for controlling social sharing functions
 */
(function($) {
function SocialShare(_state, _controls, _config) {
        var api = new Object();
        var self = this;
        var logger = new eventsCore.util.Logger('SocialShare');

        var state = _state;
        var config = _config.socialShare;
        var videoTitle = '';
        var videoType = '';

        var strip_domain = false;
        var addSocial = undefined;
        var loadSocialBox = undefined;
        var loadSocialVideo = undefined;
        var loadSocialOverlay = undefined;
        var activate_metrics = false;

        var shareOverlayWrap = $(_controls).find('.ecp-shareOverlayWrap')[0]
        var shareOverlay = $(_controls).find('.ecp-shareOverlay')[0];
        var shareClose = $(shareOverlayWrap).find('.ecp-shareClose')[0];

        var line_break = '%0D%0A';
        var app_strings = '';
        for (var i = 0; i < config.appStrings.length; i++) {
            app_strings += config.appStrings[i][0] + encodeURIComponent(config.appStrings[i][1]) + line_break;
        }
        var share_footer = app_strings;

        var init = function() {
            //logger.info('init - config:%o footer:%o', config, share_footer);

            if (!window.location.origin) {
                window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
            }

            $(shareClose).on('click', function() {
                closeShare(true);
            });

            $(shareOverlayWrap).hide();
        };

        var openSocialWindow = function(href) {
            //logger.info('openSocialWindow - url:%o', href);
            var win = window.open(href, '_blank', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');

            var checkBlank = function(openWin) {
                try {
                    if (openWin.location.hostname !== undefined && openWin.location.hostname === '') {
                        // means empty frame, can close
                        openWin.close();
                    }
                } catch (e) {
                    // do nothing
                }
            };

            setTimeout(checkBlank.bind(this, win), 4000);
        };

        /**
         * populate video share popup bar with proper links
         */
        api.loadSocialVideo = function(container, url, type, title, disp_title) {
            videoTitle = title.toUpperCase();
            videoType = type.toUpperCase();
            populateShareOverlay(url, type, title, disp_title);
        };


        /****
         * new social functions
         ****/

        var measureShare = function(value) {
            $(state.container).trigger('player:MeasureEvent', { 'prop': null, 'values': value });
        };

        var populateShareOverlay = function(url, type, title, disp_title) {
            //logger.info('populateShareOverlay disp:%o', disp_title);
            $(shareOverlay).empty();

            if (strip_domain) {
                // remove domain if it exists
                if (url.indexOf('://') > -1) {
                    url = url.replace(/https?:\/\/[^/]+/, '');
                }
                // prepend user location domain
                url = location.protocol + '//' + 'www.masters.com' + options.url;
            } else {
                if (url.indexOf('://') === -1) {
                    url = location.origin + url;
                }
            }

            var elem = '';
            var track_string = '';
            var share_path = '';

            var enc_url = encodeURIComponent(url);
            var enc_title = encodeURIComponent(title);
            var enc_email_title = encodeURIComponent(disp_title);
            var email_text = enc_email_title + line_break + line_break + enc_url + line_break + line_break;

            _.each(config.services, function(item, key) {
                //get string variables
                track_string = 'Share:' + key;

                href = item.path.replace('<url>', enc_url);
                href = href.replace('<title>', enc_title);
                href = href.replace('<email_title>', enc_email_title);
                href = href.replace('<email_text>', email_text);
                href = href.replace('<email_footer>', share_footer);
                href = href.replace('<share_url>', url);

                //logger.info('populateShareOverlay - href:%o disp:%o', href); 
                //create DOM elements
                elem = '<span class="ecp-' + key + ' ecp-shareItem"><a id="link_' + key + '" href="' + href + '" data-track="' + track_string + '" data-bypass><img src="' + item.image + '" alt="' + item.label + '"></a></span>';

                if (key === 'Copy') {
                    elem = elem.replace('</span>', '<span class="link_url"><input type="text" readonly="readonly" value=""></span></span>');
                }

                $(shareOverlay).append(elem);

                $(shareOverlay).find('.ecp-shareItem').hover(
                    function() { $(this).addClass('hover') },
                    function() { $(this).removeClass('hover') }
                );

                // add openSocialWindow click handlers
                if (key !== 'Email' && key !== 'Copy') {
                    $(shareOverlay).find('#link_' + key).on('click', function(e) {
                        e.preventDefault();
                        logger.info('shareOverlayClick - this:%o', $(this).parent().find('.link_url'));
                        $(shareOverlay).find('.link_url').removeClass('open');
                        $(shareOverlay).find('.ecp-Copy').removeClass('highlight');
                        closeShare();

                        openSocialWindow(this.href);
                        measureShare($(this).data('track'));
                    });
                } else if (key === 'Copy') {
                    $(shareOverlay).find('#link_' + key).on('click', function(e) {
                        e.preventDefault();
                        //logger.info('shareOverlayClick - Copy, link:%o', $(this).siblings('.link_url'));

                        $(this).siblings('.link_url').find('input').prop('value', url).data('track', track_string);
                        $(this).siblings('.link_url').toggleClass('open');
                        $(this).parent('.ecp-Copy').toggleClass('highlight');

                        $(this).siblings('.link_url').find('input').on('focus', function() {
                            //logger.info('shareOverlayClick - CopyFocus, metrics:%o link:%o', activate_metrics, $(this).get(0));
                            // select() doesn't work on iOS. use setSelectionRange() instead
                            $(this).get(0).setSelectionRange(0, 9999);
                        }).on('copy', function() {
                            if (activate_metrics) {
                                measureShare($(this).data('track'));
                                activate_metrics = false;
                            }
                        });
                    });
                } else if (key === 'Email') {
                    $(shareOverlay).find('#link_' + key).on('click', function(e) {
                        e.preventDefault();
                        //logger.info('shareOverlayClick - this:%o', this);
                        closeShare();

                        $(shareOverlay).find('.link_url').removeClass('open');
                        $(shareOverlay).find('.ecp-Copy').removeClass('highlight');
                        measureShare($(this).data('track'));
                    });
                }
            });
        };

        var openShare = function() {
            //logger.info('openShare');
            activate_metrics = true;
            $(shareOverlay).attr('data-state', 'active');
            $(shareOverlayWrap).show();

            measureShare('Share:Open');
        };

        var closeShare = function(measure) {
            //logger.info('closeShare');
            activate_metrics = false;
            $(shareOverlay).find('.link_url').removeClass('open');
            $(shareOverlay).find('.ecp-Copy').removeClass('highlight');
            $(shareOverlayWrap).hide();
            $(shareOverlay).attr('data-state', '');

            if (measure)
                measureShare('Share:Close');
        };

        api.close = function() {
            closeShare();
        };

        api.clear = function() {
            closeShare();
        };

        api.positionUpdate = function(buttonX) {
            //logger.info('positionUpdate overlay:%o', buttonX);
            $(shareOverlay).css({ left: buttonX - 10 });
        };

        api.sizeUpdate = function(w, h) {
            //logger.info('sizeUpdate w:%o h:%o overlay:%o', w, h);
            $(shareOverlayWrap).width(w);
            $(shareOverlayWrap).height(h);
        };

        api.toggleShare = function() {
            if ($(shareOverlay).attr('data-state') === 'active') {
                $(shareOverlay).attr('data-state', '');
                closeShare();
            } else {
                $(shareOverlay).attr('data-state', 'active');
                openShare();
            }
        };

        init();
        return api;
    }



    window.eventsPlayer.view.SocialShare = SocialShare;
}(jQuery));
;

/*
	Source: build/State.js
*/


/**
 * Create a state object
 */
(function($) {
function State() {
        var api = new Object();
        var self = this;
        var logger = new eventsCore.util.Logger('State');

        var container = null;
        var wrapper = null;
        var namespace = null;
        var path = null;

        Object.defineProperty(api, "container", {
          get: function() {return container || false },
          set: function(val) {container = val}
        });

        Object.defineProperty(api, "wrapper", {
          get: function() {return wrapper || false },
          set: function(val) {wrapper = val}
        });

        Object.defineProperty(api, "namespace", {
          get: function() {return namespace || false },
          set: function(val) {namespace = val}
        });

        Object.defineProperty(api, "path", {
          get: function() {return path || '' },
          set: function(val) {path = val}
        });

        return api;
    }

    //console.log('PlayerManager: par:%o', window.eventsPlayer.player);
    window.eventsPlayer.control.State = State;
}(jQuery));
;

/*
	Source: build/StringUtil.js
*/
/**
 * Create a static class with Environment values
 */
var StringUtil = (function($) {
var api = new Object();
    var logger = new eventsCore.util.Logger('StringUtil');

    api.contains = function(str, match) {
        if (str.toLowerCase().indexOf(match) > -1)
            return true;
        else
            return false;
    };

    return api;

}(jQuery));
;

/*
	Source: build/Strings.js
*/
/**
 * Create a static class with string values
 */
var Strings = (function($) {
var api = new Object();

    var buttonStrings = {
    	'fullscreen': '<button class="icon ecp-fullScreenBtn" title="FullScreen">FS</button>',
    	'captions': '<button class="icon ecp-captionsBtn" data-state="disabled" title="CC">CC</button>',
    	'quality': '<button class="icon ecp-qualitysBtn" data-state="disabled" title="Quality">Quality</button>',
    	'sharing': '<button class="icon ecp-shareBtn" data-state="disabled" title="Share">Share</button>',
    	'panel': '<button class="icon ecp-panelBtn" data-state="disabled" title="Picture-in-Picture"> Panel </button>',
    	'pop_open': '<button class="icon ecp-popOpenBtn" data-state="disabled" title="Pop-Out">Open</button>'
    };

    var wrapperHtml = '<div class="playerwrapper" data-fullscreen="false"><iframe id="playertech" class="playerFrame" src="" frameborder="0" allowfullscreen="true" scrolling="no"><p>Your browser does not support iframes.</p></iframe><div class="loaderContainer spinner"><div class="loader">Loading...</div></div><div class="playerPoster"><img alt="Play" class="center" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3BpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDY3IDc5LjE1Nzc0NywgMjAxNS8wMy8zMC0yMzo0MDo0MiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo3ZTFmZDU1OS0zZjVhLTRkZWEtYTcwMi1kNDAyZTdlZjAwMTEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MjcwRjNERkFDNDdCMTFFNUI3MkQ4NzYyMkRCNzRBM0MiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MjcwRjNERjlDNDdCMTFFNUI3MkQ4NzYyMkRCNzRBM0MiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo5OUFFREVDOUMzNzExMUU1OTdFOEQ3QTU2NDNBNDREQyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo5OUFFREVDQUMzNzExMUU1OTdFOEQ3QTU2NDNBNDREQyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PoOqTUcAAA/mSURBVHja7F0JUFRHGn4z3CCgiByuAgpGBEQxGMy6xqqYTTzQ0kBEQXNtKtkkZk2ZJRoFPJC4JFJZK4mpHMYolwcoScRjE8wmWdeLFTXcAQfEDSCIIJfI4fb36DfbPkcFHGfem5m/qmvmPQZ4/X3Tf/ff/R8KTuJy8+bNweTFlTRn0pxIw7U9aTa0mYt+pYu0dtqaSWskrYG0etJqFQpFo5T7q5AgAS7kxYc0T9JGkmar5X/RRloVaZWklRGCLpsIuZUAPIMHaf6k+ZLmoONHuEZaMWn5IIoQdNMoCSFEQO0E0TbkTp+rvXzZoqCg4ObZs2ctiktKrFQVFXbV1dV2DQ0NNi0tLRbt7e097OdtbGyUgwYN6nRycmp3d3dvHeXl1eo7dmzHxIkTO/39/RWuLi6dd3msq6TloRFimo2CEEIE5oOpdESYiX9eV19vnpOTozx46JD9yZMnXQgBNuR3tNNZhYIjBLWHhIRcnj1rVvOMGTN6hjk7d2n4aDdpBaQdI79Ta5CEEFCHkZcZVC2JR4F5Zmamxa7du11O5+Y6d3V16URtmJubKyYHB9cvioi4HBYW1klGjyZyoM5yCDF1BkEIIWIQeXmcqqZb/t9PP/9s+eFHHw05dPjwiI6ODr3qbisrK8WsmTMvvbFs2dXHpk27Ie4GVWVHCTEtsiSETtaPUDKshPs9PT2KvRkZVu9t3vy78+fPO0px6RkYGNi0Mjr6UnhY2A2lUsl+UTpACmmnHtTkr3hAZAwlL/PpslUtB7KzrdbExnoUFhbaczIQPz+/5oT4+Iuhc+Z0iH6EZXMWIeWK5AkhZEwiLzNJsxTuEQLM31i+fDhRUc6cDIWosPoPt2z5jRDEzjFQa4cJKWckSQghwoK8hJI2Qbh3/fp1ZXxCgv3ft2zxvnHjBidnsbS05N5cvrw8ds2aZmtra3apfQ6DnxDTKRlCCBmYCxaT5ibcy8/Pt4hcutSrqKjInjMgGTduXPOu1FSVaLTUkJZOSGm637+v1AIZ7uTlJZaMTz/7zO7306aNNzQyIOjTlKlTA9FH5jb6/hLFQn8jhDwA9psihVUUVNRrr7/unJyaOoIzAlkaFXVp68cf1zMqDJN/GhkplTonhJAxipKBuYO70tCgnL9ggceJkyedOCOSKSEhDVn7918c6uQkkNJJSVHpjBA6MpYIZFTX1Jg9/sQTPmVlZXacEYqPj0/r0e+/L3N3c+tmSEkZyEhRDoAMd3ZkVFRUmE2bPv0hYyUDgr4DA2BBbwGbyIHMKYp+kuFIJ3B7YWTgQSorK204k3Cenp7tP//4YykzUrBj/EV/Vl/KfpBhQZe29sKcATVlIuP/AiyACbCht4DVYoqd1lVWqLC0xWoKE7gxq6m7qS9gA4yYJXGoVgmh2yFqCxxLW2NbTfVHgA0wYm5NoBjePyF0o3Ama/QZi51xPwKMRMbjTIrlwCd1uoX+Ikd3bbEdAgu8vb3dhHgfxMbGhjtx7Nh5ZpsFu8Rf3m3r/l4j5BGBDOhE7E2ZyOi7AKtFUVGjmPlkJMW0/yqLOenjBbu2hrg39aAFmAE75tbjFNv+qSzyS/PICz8R4Txj8pQpgXLfQteXYOv+9IkTrOo6Q9TWN30eIdQhIUi4xuGSiYyBC7ADhsytIIpxn1XWDGH04NhVrid9UhJgCCwZzTSjTyqL+k29ivdwSAgKDvaRyxm41AVn9Hm5uWWM48QnYr8vTSNkqvAmIzPT0kSG9gRYAlNNWGskhLp3+gvXie+/bzIAtSwiTP0p5nccIZjIzajOs9S339TsmTOdnnryySGGRAgwBbb00oxdPN1CCLXK1T+ER6G+H959+HDLD5KSxu/Yvt3f29vb2lBIEWEbRLG/bYTAiuQ/CF9buHdKpQOTg4OHZu7ZE7z6nXc84N0ud0KALTCml0M4xqGQ7VyA8AaOz/r2tdVgXCmXREZ6HczOfnhuaKisd5qBLTDWhD1LiNorHV7oEjOsekpLSxFYw7kOG2aTuGlTQMrOnQFjxoyRrRoTYex7CyE0jIyPXEJ8BkICpPTwXV1dPQvCw8++t3lz6bXmZn7LYFJQkNPeXbuCY2NiPG1tbWWnxoAxsKaXDpQD9QjxET6IYBldxWf0RxC089WOHTWhc+fmfpud/V9yfRNqbHFEhCdRY8Hz5s4dKidCgDGwZm75sIR4CncRuSTljtRfudK1ctWq8qXPPXempLSUdx5wcXa2/tu77/qnpaQE+Pr6yuaMX4S1J0uIepZHGJkcOnMmL6/16fDwc5sSE0uuXbvGq7GJEyY47UlPf3htbKyXnZ2d5NWYCGueAyWNA7ely10LxPTJ5RsGNZacklI7a86c3KxvvrkENWZubq6MWLjQ49DBg8FhTz8t6U1RYA3M6aUtuMC3yFX4AKJdtRVgqUu52tjYtXrNmguLlyw5U1hUxKsxZycn6/j16/3SU1PH+/n52Ur1CwXMmVuuIET9LULoscy3JVqfiYg4l7BpU3FjUxOvxiYEBg7ZnZY2acO6daPs7e3NpPbMIsydQYjayEIcuNytYHzrUtPSLhM1dnr/119fwmrGzMxMGR4WNjL7wIHgZ8LDh0npeUWYO4GQwYxOMxjHt6ampu41MTEXopYu/U9+QUEjVWNW69euHbc7PT1wfECAJNSYCHN+DlEvvZAhgTMw+SU/v23hokXnN2zcWNTQ2MgHbxIyBqcmJz8cv2HDaAcHB72qMRHm9iBEvapCugrOQGXX7t11s8lqLGPfvqru7u4eJA0IW7BgBIzKRRERelNjIsxtbiEEuUM4AxZir3THrV2rioiMPENGzlVeaQ8ebBUXEzMuY88eMv8H6lxDiDDnCVHnmxIncjFUKSwsbItYvPiXtevXF9U3NPBqzG/cOMf0lJRJ7yYkjHZ0dNSZGhNhbq7kjFj2ZmTUzQkNzc3IzKzCBqaCyPx580Ycys6eHBUZqZcdC6MmBNLc3Nwdt26d6qsdOyrUSx1HR8vnn3/ew2nIEHNdP4+5sRPi7u5uuTE+3ufRkBDeQIbdspeMmM1JSRf1ocJBSJdADI5HjWUeQe6s55591u31V18dbWdnx/e//MKF5ti4uNKz58616uo5REfSXXiQdsEWQSY2QoiZoZPh4+NjnRAfP4bYI7wPQWdnZ/eX27dXfLR1629kSazTzTxgzs7xtxCCtHh1dXWDDJUIMzMzxbLXXhv+4gsveFlYWJhRw/Hq6piYX8vLy6/r45mAuZgQRIq6UH3aWlJSYpCEBE2caLdh/fqHvEeP5r98La2tnVs/+US1Y+fOGn3ucANzdo0BQtR5bJEw8p8GRgR09F/fesvjmbCwkbDOce/Y8eN1xEAsr66u1rtLPzBnLhtBSINwheydhkTG9Mcec4iLjX3I3c2N30jEXlZSUlLZ/qysK1J5RhHmDSCkXrhCKlVDIAKWdszq1aNmz5rlDmMP9w4fOVIdv3GjCodZUnpWEea8G4raHR55bfH8cjw1FAROdNHR0WOw1Y7r6tra9oSEhNKjP/zQJLVnBdbAnLlVa45c6IQApN+2RZJh5LW9oFLJbtfXzdXVgkza3n+YOpVfoOAsOnPfvkubEhMrpWpbAWsmsXMbuBAsdYTrjsUbJBkmhHjKiYwlUVEuf1m2zJus6XsT4lRWtqxdt670dG5ui5SfG1gzl+BAvZelTiOEjM9yIcLLy8sqNTk5YPWqVb4gAy6n27ZvV82bPz9P6mRowLpS2DqBlJH2JN4g/TaWh1L0XmQNvD+/8srwPxEDz9ramjfw4G0SExdXWlxcLItAemAMrJlbZWpCULKBqFw4MzsgFzrSbx8/cUKSrpk4C48nBh4R3he5ra2t69PPP1d9sW1btZwWI8CYyTt/TSibwe72Isc5n2UAudClRoiVlZXyrRUrRi5auBAGHq9qT+XmXomNiyurqqqSnf0EjEXYc2JC8gVCkJj+7VWrFFKJEQEB32ZlBY0YMYI/YoXraNIHH5Ttzciol+PSHHnmgTFzq0B4oxTN8vw5M6oEIDG9VDoAL3eBjJyjR2tC583LlSsZEGDLVGIA5hdvI4RmqMkTrlElQEqduFxff/3NFSvOv7F8eSk84OW8kyDCNo/NDiQ+wgUhfL5AlGxAlQB9PzwMPDhS4+z7H99918jJXIApUw6jmx0EtxFCy/yo9RlKNujz4VUqVTviQOBI3draahAnmSJMC8SllUypNXQoA0qtQT/AL8Pwi6ifYYJSOwIsGTKKNdW3upMbUA7XW+aHQzET1M8wwXl/AgyZwjA3KcZcnwihBbDUkw2KmSAJl0kGvGznMRStrOr6TAgV1FrqoLqvC8VMTNAOTIAdk01OqGOlUe6VlTQEdgzeI5HjI48+6m3Ku9g/QQGYU8ePlzMlLQ6R0XHyTp+/lyvpKWrBc/iDacnJFUh9apK+CbACZgwZVRRTbkCEUAsyi+stgMUFBAR0vp+YWGKCum8CrIAZvQSGWfcqt3dPZ2taGu6wcP3Kyy+3orKMCe67CzACVsytw30ps9fnchVkPlnA0fzvmE/++NRTHqb875oFVXe+O3LkIqOqzhEy9vfld/sTjnCA661Gxs8nKPODyjIm+G8VYAJsGDJqKHacVgmhdfrSuV7XUw41l1DmB0VMTDT0CrAAJkw9KmCV3p8ah/0K2KGVYtIE+wSVZL4/cqTUREovGcCCqa4jVGzr1465qSiYltSU3oqC0ZFSSUdKpzBS/vXTT79iMjPGCRx9F5Ex4FqGA44xpHX6UgT1Bb2JlYUxLYnRV/SZmTM66MhQDRjX+30opoyeeksFlWWiV64ca6i1RmCBw+gT2RnNdGRU38/fNhUn7qdIvjgxs/raxvWWsuaEbRZsqr0dHV1uCFv36AP6gj6JyECft2mDDK2NENFoMdQC99WECNaekHaBexEp8HqczzG5HHlTPzvbak1srIdczuhxBo5jV+akTxDs2mb1ZW9KEoRQUvC34QmJOlbqJF1wnEDJBlQJ0Hey/zsJXHXgHRIeFnaDOQMXVlE4XDp1r11byRHCECMUFwsS/z9UCUBieuRC17fbKtw74VEIJzbGb0rdDa73SPsoIeKBhjkodNVhWnMJZX58xT9DYnrkQkf6bWR81lUoBEIC4IUOx2f42jLunazAAyfnTmfgsiWEIQZ+X6gsg8Ixt2WNQPptZHxGkmHktUUqVW2FGSCmD2FkiFxCsAziM5iQAFZgdcP5/N+aXHUMihCGGHuqxtDuWKsEeW2RShXZO5EwEjkKkRYPmdiQ/EscP4i4dKSrQIYEBOUjDhyhx4h2RYAlE9OnSa5S1ZQn9ig0eEJEkz9WYwFUnTno+BGuUbWEEVH1oCZr2RCigSBE0SIxvSclStvZQ9voshWbf2VC5JJURHKEaCAIaWwx78CoxJExrqHubGgT5/zCnNBOG9QOPOaxCw3vy1qEHku5v/8TYAAsNlN4MKTeiQAAAABJRU5ErkJggg=="></div><div class="videoControlsTouch" tabindex="0"></div><div class="videoControls hidden"><div class="centerholder"><div class="centercol"><div class="progress"><div class="progress_box"><div class="progress_cover"></div><div class="progress_bar"><span class="play_progress"><span class="progress_marker"></span></span></div></div></div></div></div><div class="leftcol"><div class="colRow"><button class="icon ecp-playBtn" title="Play">&nbsp;</button> <button class="icon ecp-rewindBtn" title="Skip Back">&nbsp;</button> <button class="icon ecp-liveBtn" title="Live">&nbsp;</button><div class="timeText"><span class="curTimeText"></span><span class="durTimeText"></span></div><div class="volume"><button class="icon ecp-muteBtn" title="Volume">Mute</button><div class="volume_box"><div class="volume_bar"><span class="volume_progress"><span class="volume_marker"></span></span></div></div></div></div></div><div class="rightcol"><div id="rightSideButtons" class="colRow"><button class="icon ecp-panelBtn" data-state="disabled" title="Picture-in-Picture">Panel</button> <button class="icon ecp-popOpenBtn" data-state="disabled" title="Pop-Out">Open</button> <button class="icon ecp-captionsBtn" data-state="disabled" title="CC">CC</button> <button class="icon ecp-shareBtn" data-state="disabled" title="Share">Share</button> <button class="icon ecp-fullScreenBtn" title="FullScreen">FS</button></div><button class="icon ecp-extraBtn" title="Extra">Extra</button></div><div class="ecp-shareOverlayWrap"><div class="ecp-shareOverlay"></div><a class="ecp-shareClose"></a></div></div></div>';

    api.getWrapper = function() {
        return wrapperHtml;
    };

    api.getButton = function(name) {
    	return buttonStrings[name];
    }

    return api;

}(jQuery));
;

/*
	Source: build/StyledCharacter.js
*/
/**
 * Unicode character with styling and background.
 * @constructor
 */

 (function($) {
function StyledCharacter(uchar, foreground, underline, italics, background, flash) {
        var uchar = uchar || ' '; // unicode character
        var api = {
            get uchar() {
                return uchar;
            }
        };
        
       
        api.penState = new eventsPlayer.control.caption.PenState(foreground, underline,italics, background, flash);
        
        api.reset = function() {
            uchar = ' ';
            api.penState.reset();
        };
        
        api.setChar = function(_uchar, newPenState) {
            uchar = _uchar;
            api.penState.copy(newPenState);
            //logger.info('setChar - uchar:%o', uchar);
        };
        
        api.setPenState = function(newPenState) {
            api.penState.copy(newPenState);
        };
        
        api.equals = function(other) {
            return uchar === other.uchar && api.penState.equals(other.penState);
        };
        
        api.copy = function(newChar) {
            uchar = newChar.uchar;
            api.penState.copy(newChar.penState);
        };
        
        api.isEmpty = function() {
            return uchar === ' ' && api.penState.isDefault();
        };

        api.getChar = function() {
            return uchar;
        };

        return api;
    };

    window.eventsPlayer.control.caption.StyledCharacter = StyledCharacter;
}(jQuery));
//# sourceMappingURL=eventsCorePlayer.js.map;
define("eventsCorePlayer", ["eventsCore"], function(){});

