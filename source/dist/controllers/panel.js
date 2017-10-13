define('controllers/panel',['require','jquery','backbone','utils/metrics','utils/browser','utils/video-player','utils/pubsub','controllers/panel-display'],function(require) {
    var $ = require('jquery'),
        Backbone = require('backbone'),
        Metrics = require('utils/metrics'),
        Browser = require('utils/browser'),
        VideoPlayer = require('utils/video-player'),
        PubSub = require('utils/pubsub'),
        PanelDisplay = require('controllers/panel-display')
        ;


    var PanelView = Backbone.View.extend({
        events: {

        },

        panelOn: false,
        minWidth: 320,
        minHeight: 180,
        leftLimit: 100,
        topLimit: 100,
        offset: 10,
        border: 5,

        initialize: function() {
            Browser.checkMobileTabletDevice();

            this.logger = new eventsCore.util.Logger('PanelView');

            this.panel1 = new PanelDisplay({el: '#panel1'}).render();
            this.panel2 = new PanelDisplay({el: '#panel2'}).render();

            //this.logger.info('initialize - panel1:%o panel2:%o', this.panel1, this.panel2);

            this.on('route:change', this.checkPage);

            this.listenTo(PubSub, 'video:playPanel', this.onPlayPanel);
            this.listenTo(PubSub, 'video:exitPanel', this.onExitPanel);
            this.listenTo(PubSub, 'video:resetHero', this.onResetHero);
            this.listenTo(PubSub, 'video:resetVod', this.onResetVod);

            this.listenTo(VideoPlayer, 'player:play', this.onPlayEvent);
            this.listenTo(VideoPlayer, 'player:panelOpen', this.onPanelOpenEvent);
            this.listenTo(VideoPlayer, 'player:panelClosed', this.onPanelClosedEvent);
        },


        render: function() {
            return this;
        },

        /**
         * checks state/position of each panel and updates initial mute status
         * executes on play and route change
         */
        checkVolume: function() {
            this.logger.info('checkVolume - panel1:%o panel2:%o', this.panel1.state(), this.panel2.state());

            if (this.panel1.state() != '' && this.panel2.state() == '') {
                this.panel1.mute(false);
                this.panel2.mute(true);
            }
            else if (this.panel2.state() != '' && this.panel1.state() == '') {
                this.panel2.mute(false);
                this.panel1.mute(true);
            }
            else if (this.panel1.state() == 'floatVideo' && this.panel2.state() == 'heroVideo') {
                this.panel2.mute(false);
                this.panel1.mute(true);
            }
            else if (this.panel1.state() == 'heroVideo' && this.panel2.state() == 'floatVideo') {
                this.panel1.mute(false);
                this.panel2.mute(true);
            }
        },

        /**
         * close any open hero panel
         *  - used for mobile internal ref to a different watch live channel
         */
        onResetHero: function() {
            if(this.panel1.state() === 'heroVideo') {
                this.panel1.onPanelExit();
            } else if(this.panel2.state() === 'heroVideo') {
                this.panel2.onPanelExit();
            }
        },

        /**
         * close any open vod floated panel
         */
        onResetVod: function() {
            if(this.panel1.state() === 'floatVideo') {
                this.panel1.onPanelExit();
            } else if(this.panel2.state() === 'floatVideo') {
                this.panel2.onPanelExit();
            }
        },

        /**
         * play video in a panel, check for channel existing in panel first and use existing if playing
         * @param data - panel video data
         * @param channel - this live video data
         * @param options - options to be passed to video player, consisting of:
         *        floated - optional boolean indicating if should start in float mode
         *        vod - indicates if playing a vod
         */
        onPlayPanel: function(data, channel, options) {
            options = _.extend({ floated: false, vod: false }, options);

            this.logger.info('onPlayPanel - panel1:%o chan1:%o panel2:%o chan2:%o data:%o', this.panel1.state(), this.panel1.channelId(), this.panel2.state(), this.panel2.channelId(), data);

            //if panel1 floating and opening the same channel, close to hero (to force back to hero when return to live channel page)
            //  do not close if float is true, call is trying to open same channel in already open float panel
            if (this.panel1.channelId() == data[0].id) {
                // if panel has no state, reset it to play channel
                if(this.panel1.state() === '') {
                    this.panel1.playPanel(data, channel, options);
                } else if (this.panel1.state() == 'floatVideo' && !options.floated)
                    this.panel1.panelClose(data, false);
                else
                    this.logger.warn('onPlayPanel - ignoring call, attempted to open same channel already active');
            }
            //if panel2 floating and opening the same channel, close to hero (to force back to hero when return to live channel page)
            //  do not close if float is true, call i trying to open same channel in already open float panel
            else if (this.panel2.channelId() == data[0].id){
                // if panel has no state, reset it to play channel
                if(this.panel2.state() === '') {
                    this.panel2.playPanel(data, channel, options);
                } else if (this.panel2.state() == 'floatVideo' && !options.floated)
                    this.panel2.panelClose(data, false);
                else
                    this.logger.warn('onPlayPanel - ignoring call, attempted to open same channel to floating panel');
            }
            //if panel1 in hero use it, (if not playing this channel)
            else if ((this.panel1.state() == 'heroVideo' || this.panel1.state() == '') && this.panel1.channelId() != data[0].id) {
                this.panel1.playPanel(data, channel, options);
            }
            //else use panel2 (if not playing this channel)
            else if (this.panel2.channelId() != data[0].id){
                this.panel2.playPanel(data, channel, options);
            }
        },

        /**
         * exit video playing in panel, whichever panel is open
         */
        onExitPanel: function() {
            this.logger.info('onExitPanel - panel1:%o chan1:%o panel2:%o chan2:%o', this.panel1.state(), this.panel1.channelId(), this.panel2.state(), this.panel2.channelId());
            // close whichever one is floated
            if(this.panel1.state() === 'floatVideo') {
                this.panel1.onPanelExit();
            } else if(this.panel2.state() === 'floatVideo') {
                this.panel2.onPanelExit();
            }
        },

        /**
         * on play, initiates check for setting initial mute
         * @param data - event data with panel id
         */
        onPlayEvent: function(data) {
            //this.logger.info('onPlayEvent - data:%o', data.id);
            if (data.id == 'panel1' || data.id == 'panel2')
                this.checkVolume();
        },

        /**
         * handle panel open event from video player
         * triggers panel to transition to float state
         * @param data - event data with panel id
         */
        onPanelOpenEvent: function(data) {
            this.logger.info('onPanelOpenEvent - panel1:%o panel2:%o id:%o', this.panel1.state(), this.panel2.state(), data.id);

            if(data.id == 'panel1') {
                if (this.panel2.state() == 'floatVideo') {
                    this.panel2.panelClose(null, false);
                }
                this.panel1.panelOpen();
            }
            else if(data.id == 'panel2') {
                if (this.panel1.state() == 'floatVideo') {
                    this.panel1.panelClose(null, false);
                }
                this.panel2.panelOpen();
            }
        },

        /**
         * handle panel close event from video player
         * triggers panel to return to hero state
         * @param data - event data with panel id
         */
        onPanelClosedEvent: function(data) {
            this.logger.info('onPanelClosedEvent - panel1:%o panel2:%o id:%o', this.panel1.state(), this.panel2.state(), data.id);

            if(data.id == 'panel1') {
                this.panel1.panelClose(data, true);
                if (this.panel2.state() == 'heroVideo') {
                    this.panel2.panelClose(data, false);
                    this.checkVolume();
                }
            }
            else if(data.id == 'panel2') {
                this.panel2.panelClose(data, true);
                if (this.panel1.state() == 'heroVideo') {
                    this.panel1.panelClose(data, false);
                    this.checkVolume();
                }
            }
        },

        /**
         * initiate page check for closing hero on route change
         *   also check volume on route change
         */
        checkPage: function(){
            var route = Backbone.history.getFragment();
            this.panel1.checkPage(route);
            this.panel2.checkPage(route);

            this.checkVolume();
        }

    });

    return PanelView;
})
;
