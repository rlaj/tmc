define('controllers/panel-display',['require','jquery','backbone','utils/metrics','utils/browser','utils/common','utils/video-player','utils/pubsub','utils/channel-controller','utils/title-selector','jquery.ui'],function(require) {
    var $ = require('jquery'),
        Backbone = require('backbone'),
        Metrics = require('utils/metrics'),
        Browser = require('utils/browser'),
        Common = require('utils/common'),
        VideoPlayer = require('utils/video-player'),
        PubSub = require('utils/pubsub'),
        ChannelController = require('utils/channel-controller'),
        TitleSelector = require('utils/title-selector')
        ;

    require('jquery.ui');

    var TOP_MENUBAR_HEIGHT = 50; //used as a marker for the panel's top boundary
    var LEFT_OR_RIGHT_PADDING = 5; //left or right padding between overlay wrapper and video
    var TOP_OR_BOTTOM_PADDING = 5; //top or bottom padding between overlay wrapper and video
    var ASPECT_RATIO = 16/9;

    var PanelDisplay = Backbone.View.extend({
        events: {
            'click .panelExit': 'onPanelExit'
        },

        indirect: false,
        enabled: false,
        panelOn: false,
        videoMode: '',
        videoVod: false,
        minWidth: 320,
        minHeight: 180,
        leftLimit: 100,
        topLimit: 100,
        offset: 10,
        border: 5,
        exitBtn: null,
        slate: null,
        positionHistory: [],

        initialize: function() {
            Browser.checkMobileTabletDevice();
            this.panelId = this.$el[0].id;
            this.$('.masters-ecp').attr('id', 'wrapper_' + this.panelId);

            this.slate = this.$('.panelSlate');
            this.slate.hide();

            this.logger = new eventsCore.util.Logger('PanelDisplay_' + this.panelId);

            //this.logger.info('initialize - el:%o slate:%o', this.$el, $(this.slate));

            //_.bindAll(this, 'positionHero');
            PubSub.on('resize', this.keepPanelWithinViewport.bind(this), this);
            PubSub.on('ratio:resize', this.onRatioResize, this);
            PubSub.on(this.panelId + ':change', this.channelChange, this);

            this.listenTo(VideoPlayer, 'player:complete', this.onCompleteEvent);
            this.listenTo(VideoPlayer, 'player:start', this.onStartEvent);
            this.listenTo(VideoPlayer, 'player:play', this.onPlayEvent);
            this.listenTo(VideoPlayer, 'player:stop', this.onStopEvent);
            this.listenTo(VideoPlayer, 'player:controls', this.onControlsEvent);
            this.listenTo(VideoPlayer, 'player:click', this.onClickEvent);
            this.listenTo(VideoPlayer, 'player:video_mode', this.onVideoModeEvent);
            this.listenTo(VideoPlayer, 'player:fullscreen', this.onFullscreenEvent);

            VideoPlayer.initPlayer(this.panelId);

            this.listenTo(PubSub, 'livevideo:reset', this.refreshChannels);
            //this.channel = eventsCore.util.getUrlParam('videoChannel');
        },

        render: function() {
            //this.logger.info('render -');

            var self = this;

            var left = this.$el.position().left;
            var top = this.$el.position().top;
            var width = this.$el.width();
            var height = this.$el.height();
            var maxWidth = $( window ).width() - this.leftLimit;
            var maxHeight = $( window ).height() - this.topLimit;

            //this.logger.info('initialize - x1:%o y1:%o x2:%o y2:%o', this.leftLimit, this.topLimit, $( window ).width() - this.minWidth - this.offset, $( window ).height());

            this.$el
            .draggable({
                containment: 'window',
                scroll: false,
                start: function() {
                    PubSub.trigger('whats-new:close', 'floatVideo');
                },
                stop: function(event, ui){
                    this.keepPanelWithinViewport();
                    this.savePanelPosition(ui.position.top, ui.position.left);
                    //self.recordPosition();
                }.bind(this)
            })
            .resizable({
                handles: {
                    'nw': '.ui-resizable-nw',
                    'ne': '.ui-resizable-ne',
                    'sw': '.ui-resizable-sw',
                    'se': '.ui-resizable-se'
                },
                //autoHide: true,
                aspectRatio: ASPECT_RATIO,
                minWidth: this.minWidth,
                minHeight: this.minHeight,
                //maxWidth: $( window ).width() - this.leftLimit,
                //maxHeight: $( window ).height() - self.topLimit,
                //ghost: true,
                resize: function(){
                    // self.updateDragResize();
                },
                start: function(){
                    PubSub.trigger('whats-new:close', 'floatVideo');
                    self.$el.css({'position': ''});
                },
                stop: function(){
                    this.savePanelSize(this.$el.width(), this.$el.height());
                    self.$el.css({'position': ''});
                }.bind(this)
            });

            this.$el.draggable('disable');
            this.$el.resizable('disable');

            // this.updateDragResize();

            this.titleSelector = new TitleSelector({
                el: this.$('.panelVideo'),
                max: 1,
                measure_key: ['Watch','Live','Channel Change'],
                sendPanel: this.panelId
            });

            // FIXME: Is there a reason this needs to be set on initialize? Isn't this only needed
            // when the panel is not in the hero state?
            // this.titleSelector.setNav(false);

            return this;
        },

        onDispose: function() {
            this.logger.info('dispose - state:%o',  this.$el[0].getAttribute('data-state'));
            VideoPlayer.dispose();
            PubSub.off('resize', undefined, this);
        },

        /**
         * return current panel state, hero or float
         */
        state: function() {
            if (this.$el[0].hasAttribute('data-state'))
                return this.$el[0].getAttribute('data-state');
            else
                return '';
        },

        /**
         * return current panel channel
         */
        channelId: function() {
            return this.channel;
        },

        /**
         * mute or unmute the video player in this panel
         * @param muted - tru or false indicating mute status
         */
        mute: function(muted) {
            //this.logger.info('mute - muted:%o', muted);
            VideoPlayer.mute(muted, this.panelId);
        },

        /**
         * initiates video playback in this panel
         * @param data - video information
         * @param channel - video channel id
         * @param options - options to be passed to video player, consisting of:
         *        floated - boolean indicating if request is to play/open directly in floated panel
         *        vod - whether this is a VOD or not
         *        metrics_prefix - value to use, if not Metrics.page_section, when recording metrics for this video
         */
        playPanel: function(data, channel, options) {
            this.options = _.extend({ floated: undefined, vod: undefined }, options);

            this.logger.info('playPanel - panelId:%o data:%o channel:%o float:%o state:%o',  this.panelId, data[0], channel, this.options.float, this.state());

            this.videoMode = '';
            this.channel = channel;
            this.videoData = data[0];
            this.$el[0].setAttribute('data-state', 'heroVideo');

            this.videoVod = options.vod;

            //only play if verified on air
            if (!this.videoVod) {
                var onair = ChannelController.checkChannelStatus(this.channel);
                if (onair) {
                    this.enableLiveVideo();
                    this.options.forceType = false;
                    VideoPlayer.loadVideo(data[0], this.panelId, this.options);
                }
                else {
                    this.logger.info('playPanel - not playing since off-air');
                }
            }
            else {
                this.disableSlate();
                this.options.forceType = false;
                VideoPlayer.loadVideo(data[0], this.panelId, this.options);
            }

            if (this.options.floated) {
                this.indirect = true;
                VideoPlayer.buttonClick(this.panelId, 'panelBtn');
            }


            if(!this.videoVod) {
                this.$el.find('section.panelTitle').removeClass('vod');
                this.refreshChannels();
            } else {
                this.$el.find('section.panelTitle').addClass('vod');
            }
        },

        /**
         * replace video in panel with new channel
         */
        replaceVideo: function(data, channel) {
            this.options.forceType = false;
            this.options.floated = true;
            VideoPlayer.loadVideo(data[0], this.panelId, this.options);

            this.channel = channel;
            this.videoData = data[0];
        },

        /**
         * handle play event from video player
         * @param data - player info with id
         */
        onPlayEvent: function(data) {
            if(data.id != this.panelId)
                return;

            this.logger.info('onPlayEvent - data:%o', data);
        },

        /**
         * handle start event from video player
         * @param data - player info with id
         */
        onStartEvent: function(data) {
            if(data.id != this.panelId)
                return;

            //this.logger.info('onStartEvent - data:%o', data);
        },

        /**
         * handle complete event from video player
         * @param data - player info with id
         */
        onCompleteEvent: function(data) {
            if(data.id != this.panelId)
                return;

            this.logger.info('onCompleteEvent - data:%o', data);

            if(this.videoVod) {
                if(this.state() === 'floatVideo') {
                    // close panel immediately once VOD completes playing
                    this.onPanelExit();
                }
            } else {
                var onair = ChannelController.checkChannelStatus(this.channel);
                if (!onair) {
                     this.disableLiveVideo();
                }
            }
        },

        /**
         * handle stop event from video player
         * @param data - player info with id
         */
        onStopEvent: function(data) {
            if(data.id != this.panelId)
                return;

            //this.logger.info('onStopEvent - data:%o', data);
        },

        /**
         * handle controls event from video player
         * @param data - player info with id
         */
        onControlsEvent: function(data) {
           //this.logger.info('onControlsEvent - data:%o', data);
            if(data.id != this.panelId)
                return;

            if (data.visible) {
                this.$('.panelTitle').removeClass('hidden').addClass('visible');
            }
            else if (this.state() == 'floatVideo'){
                this.$('.panelTitle').removeClass('visible').addClass('hidden');
            }

            if(this.state() === 'heroVideo') {
                if(data.visible) {
                    PubSub.trigger('whats-new:show', 'heroVideo');
                    this.repositionWhatsNewForHeroVideo();
                } else {
                    PubSub.trigger('whats-new:hide', 'heroVideo');
                }
            }
        },

        /**
         * handle click event from the player
         * @param data - player info with id and click type
         */
        onClickEvent: function(data) {
            if(data.id != this.panelId)
                return;

            if (data.type === 'popOpen') {
                this.logger.info('onClickEvent - type:%o data:%o', data.type, this.videoData);

                var url = '/en_US/watch/standalone.html?' + $.param(this.videoData);
                var windowName = 'popUp';
                var windowSize = 'width=' + this.$el.width() + ',height=' + this.$el.height();

                window.open(url, windowName, windowSize);

                this.onPanelExit();

                var log = eventsCore.util.getUrlParam('loglevel');
                var url = '/en_US/watch/index.html';
                if (log) {
                    url += '&loglevel=' + log;
                }
                Backbone.history.navigate(url, true);
            }
        },

        /**
         * handle video mode changes
         */
        onVideoModeEvent: function(data) {
            if(data.id != this.panelId)
                return;

            this.videoMode = data.mode;
            this.logger.info('onVideoModeEvent - mode:%o', data.mode);
        },

        /**
         * handle fullscreen state changes
         */
        onFullscreenEvent: function(data) {
            if(data.id != this.panelId)
                return;

            this.logger.info('onFullscreenEvent id:%o data:%o state:%o', this.panelId, data.id, data.state);

            if (data.state == 'enter'){
                this.recordPosition();
                //this.logger.info('onFullscreenEvent - data:%o left:%o top:%o', data.state, this.$el.position().left, this.$el.position().top);
            }
            else if (data.state == 'exit' && this.positionHistory.length >= 1) {
                //this.logger.info('onFullscreenEvent - data:%o pos:%o', data.state, this.positionHistory);

                this.$el.css({'left': this.positionHistory[0].left});
                this.$el.css({'top': this.positionHistory[0].top});

                this.positionHistory = [];
            }
        },

        /**
         * handle panel open call from panel view
         * transitions panel to float state
         * send event notifying view pages with data indicating if opened from direct call
         *   - direct call will prevent live page from moving to half-height hero
         * @param data -
         */
        panelOpen: function(data) {
            this.logger.info('panelOpen - data:%o indirect:%o', data, this.indirect);

            positionHistory = [];

            this.$el.removeAttr( 'style' );
            this.$el[0].setAttribute('data-state', 'floatVideo');

            //Set the width and height of the panel with the value retrieved from the cookie
            var panelSize = this.getPanelSize();
            if(panelSize) {
                this.$el.css('width', panelSize.width);
                this.$el.css('height', panelSize.height);
            }

            //Set the top and left position of the panel with the value retrieved from the cookie
            var panelPosition = this.getPanelPosition();
            if(panelPosition) {
                this.$el.css('top', panelPosition.top);
                this.$el.css('left', panelPosition.left);
            }

            this.$el.draggable('enable');
            this.$el.resizable('enable');

            this.panelOn = true;
            PubSub.trigger('panel:open', this, !this.indirect);
            Common.video_panel_float = true;
            // this.updateDragResize();

            if(!this.videoVod) {
                this.titleSelector.setNav(false);

                this.listenTo(this.titleSelector, 'list:open', function() {
                    this.$('.panelTitle').addClass('open');
                });
                this.listenTo(this.titleSelector, 'list:close', function() {
                    this.$('.panelTitle').removeClass('open');
                });
            }

            PubSub.trigger('whats-new:close', 'heroVideo');
            PubSub.trigger('whats-new:show', 'floatVideo');
            this.keepPanelWithinViewport();
        },

        /**
         * handle panel close call from panel view
         * transitions panel to hero state
         *
         * @param data - player info with id
         * @param direct - indicates if call trigger by user action to close, or because other panel opened
         */
        panelClose: function(data, direct) {
            var route = Backbone.history.getFragment();
            var channel = eventsCore.util.getUrlParam('videoChannel');
            var log = eventsCore.util.getUrlParam('loglevel');
            var vod_link;

            PubSub.trigger('whats-new:hide', 'floatVideo');

            if(this.videoVod) {
                channel = this.videoData.id;
                vod_link = this.videoData.link;
                // remove leading / to match history fragment value
                if(vod_link[0] === '/') {
                    vod_link = vod_link.substring(1);
                }
            }

            //this.logger.info('panelClose - route:%o channel:%o nav:%o', route, this.channel, direct);

            // if clicked on toolbar close and already on live page for this channel
            // or this is vod and already on vod page
            //  just move position
            if (direct && channel === this.channel &&
                ((!this.videoVod && route.indexOf('en_US/watch/live.html') >= 0) ||
                (this.videoVod && route.indexOf(vod_link) >= 0))
                ) {
                this.$el[0].setAttribute('data-state', 'heroVideo');
                //PubSub.trigger('panel:close');
                VideoPlayer.onMeasureEvent({
                    id: this.panelId,
                    type: 'panelOff'
                });
            }
            // if clicked on toolbar close and not on the live page for this channel
            // or this is vod and not already on vod page
            //  navigate to page and move to hero
            else if (direct &&
                        (channel !== this.channel ||
                            ((!this.videoVod && route.indexOf('en_US/watch/live.html') < 0) ||
                             (this.videoVod && route.indexOf(vod_link) < 0))
                        )
                    ) {
                var url = '/en_US/watch/live.html?videoChannel=' + this.channel;
                if (this.videoVod) {
                    url = this.videoData.link;
                }

                if (log) {
                    url += (url.indexOf('?') > -1 ? '&' : '?') + 'loglevel=' + log;
                }
                Backbone.history.navigate(url, true);

                this.$el[0].setAttribute('data-state', 'heroVideo');
                //PubSub.trigger('panel:close');
            }
            //if closing because opening same channel (or vod) that is in panel, move to hero and tell player to update button state
            //  (generally when navigating back to live/vod page)
            else if (!direct) {
                // make sure we don't just want to close panel no questions asked (data is null)
                if (data !== null && channel == this.channel) {
                    VideoPlayer.buttonClick(this.panelId, 'panelBtn');
                }
                //if close because other panel opened just close the panel
                else {
                    VideoPlayer.close(this.panelId);
                    this.$el[0].setAttribute('data-state', '');
                }
            }

            this.$el.draggable('disable');
            this.$el.resizable('disable');

            this.indirect = false;
            this.panelOn = false;
            PubSub.trigger('panel:close', this);
            Common.video_panel_float = false;
            this.positionHero();

            if(!this.videoVod) {
                this.titleSelector.setNav(true);
                this.stopListening(this.titleSelector, 'list:open');
                this.stopListening(this.titleSelector, 'list:close');
            }
        },

        /**
         * handle direct exit call from panel
         */
        onPanelExit: function(e) {
            //this.logger.info('onPanelExit');
            VideoPlayer.close(this.panelId);
            this.channel = '';
            this.indirect = false;
            this.$el[0].setAttribute('data-state', '');
            this.panelOn = false;
            Common.video_panel_float = false;
            PubSub.trigger('panel:exit', this);
            PubSub.trigger('whats-new:hide', 'floatVideo');
            // if this was a user triggered event
            if(e) {
                VideoPlayer.onMeasureEvent({
                    id: this.panelId,
                    type: 'panelOff'
                });
            }
        },

        /**
         * reposition to hero
         */
        positionHero: function() {
            var fullWidth = $('#welcome').width();

            //this.logger.info('positionHero - heroHeight:%o', this.heroHeight);

            if (this.$el[0].getAttribute('data-state') != 'floatVideo') {
                this.$el.width(this.heroWidth);
                this.$el.height(this.heroHeight);
                this.$el.css({'top':'', 'left':''});
                positionHistory = [];

                this.repositionWhatsNewForHeroVideo();
            }
        },

        repositionWhatsNewForHeroVideo: function() {
            var controlsHeight = 40;
            var top = this.heroHeight - TOP_MENUBAR_HEIGHT - controlsHeight - 5; //add margin of y for vertical alignment
            if (Common.alert && Common.alert.on) {
              top += Common.alert.height;
            }
            var right = ((document.body.clientWidth - this.heroWidth) / 2) + 80;  //add margin of x to align with open panel control

            // if VOD, no popout
            if(this.videoVod) {
                right -= 40;

                // check to see if CC icon exists, if not, subtract another 40px
                if(this.videoData.contentType !== 'replay') {
                    right -= 40;
                }
            }
            PubSub.trigger('whats-new:heroVideo:reposition', {top: top, right: right});
        },

        /**
         * handle dragging and resizing settings in float
         */
        updateDragResize: function() {
            var curWidth = this.$el.width();
            var curHeight = this.$el.height();
           // this.logger.info('updateDragResize - w:%o h:%o left:%o', curWidth, curHeight, this.$el.position().left);


            var rightLimit = $(window).width() - curWidth - this.offset - this.border;
            var bottomLimit = $( window ).height();

            var widthLimit = $(window).width() - this.offset - this.border - this.leftLimit;
            var heightLimit = $( window ).height() - this.topLimit;

            this.$el.resizable('option', 'maxWidth', widthLimit);
            this.$el.resizable('option', 'maxHeight', heightLimit);

            //this.$el.draggable('option', 'containment', [ this.leftLimit, this.topLimit, rightLimit,  bottomLimit]);

            //this.logger.info('updateDragResize - on:%o left:%o limit:%o', this.panelOn, this.$el.position().left, this.leftLimit);

            if (this.panelOn && this.$el.position().left < this.leftLimit){
                this.$el.css({'left': this.leftLimit});
            }
            this.recordPosition();
        },

        /**
         * listen for ratio resize events and update the size of the panelView if in hero mode
         * @param el - the dom element
         * @param w - the new width
         * @param h - the new height
         */
        onRatioResize: function(el, w, h){
            //this.logger.info('onRatioResize - el:%o w:%o h:%o elW:%o elH:%o', $(el), w, h, $(el).width(), $(el).height());

            //this.heroWidth = $(el).width();
            //this.heroHeight = $(el).height();
            this.heroWidth = w;
            this.heroHeight = h;

            this.positionHero();
            // this.updateDragResize();
        },

        recordPosition: function() {
            this.positionHistory.push({left:this.$el.position().left, top:this.$el.position().top});
            //this.logger.info('recordPosition - positions:%o', this.positionHistory);
        },

        savePanelPosition: function(top, left) {
            this.savePanelAttributes({position: {top: top, left: left}});
            // $.cookie('pippos', JSON.stringify({top: top, left: left}), { expires: 5, path: '/en_US/' });
        },

        savePanelSize: function(width, height) {
            this.savePanelAttributes({size: {width: width, height: height}});
            // $.cookie('pipsize', JSON.stringify({width: width, height: height}), { expires: 5, path: '/en_US/' });
        },

        getPanelPosition: function() {
         var obj = this.getPanelAttributes();
         return (obj && obj.position) ? obj.position : null;
          // var jsonStr = $.cookie('pippos');
          // return (jsonStr ? $.parseJSON(jsonStr) : null);
        },

        getPanelSize: function() {
         var obj = this.getPanelAttributes();
         return (obj && obj.size) ? obj.size : null;
          // var jsonStr = $.cookie('pipsize');
          // return (jsonStr ? $.parseJSON(jsonStr) : null);
        },

        savePanelAttributes: function(attrs) {
            var obj = this.getPanelAttributes() || {};
            if(attrs.position) {
                obj.position = attrs.position;
            }
            if(attrs.size) {
                obj.size = attrs.size;
            }

            $.cookie('pipAttrs', JSON.stringify(obj), { expires: 5, path: '/en_US/' });
        },

        getPanelAttributes: function() {
          var jsonStr = $.cookie('pipAttrs');
          return (jsonStr ? $.parseJSON(jsonStr) : null);
        },

        /**
         * check the current route and if not the live video page, and live video is playing in hero,
         * stop the video and hide the panel view
         * @param route - the new url location
         */
        checkPage: function(route){
            //this.logger.info('checkPage - route:%o state:%o', route, this.state());
            if (route.indexOf('en_US/watch/live.html') < 0 && this.$el[0].getAttribute('data-state') == 'heroVideo') {
                //this.logger.info('checkPage - click - route:%o state:%o', route, this.$el[0].getAttribute('data-state'));
                //VideoPlayer.buttonClick(this.panelId, 'panelBtn');

                this.onPanelExit();
            }
        },

        disableSlate: function() {
            this.slate.empty().hide();
        },

        checkLiveVideoState: function() {
            if(this.channel_object) {
                // check if video is on air
                var onair = this.channel_object.get('live');
                if (onair) {
                    this.enableLiveVideo();
                }
                else {
                    this.disableLiveVideo();
                }
            } else {
                this.disableLiveVideo();
            }
        },

        /**
         * enable live video
         */
        enableLiveVideo: function() {
            if(!this.enabled) {
                this.logger.info('enableLiveVideo - hide slate');

                this.disableSlate();
                this.enabled = true;
            }
        },

        /**
         * disable live video
         */
        disableLiveVideo: function() {
            if (this.enabled && this.videoMode != 'dvr') {
                this.logger.info('disableLiveVideo 1 - display slate - enabled:%o', this.enabled);
                this.enabled = false;

                if(this.state() === 'heroVideo') {
                    this.onPanelExit();
                    PubSub.trigger('panel:live:disable', this);
                } else {
                    this.slate.html('<div>' + this.videoData.title + ' is now off air.</div>')
                        .show();
                    VideoPlayer.stop(this.panelId);

                    // set timeout to exit panel
                    this.timeoutId = setTimeout(function() {
                        this.onPanelExit();
                    }.bind(this), 60000);
                }
            }
        },

        /**
         * channel change from title changer
         */
        channelChange: function(channel, panel) {
            var data = ChannelController.getChannel(channel).attributes;
            this.logger.info('channelChange - channel:%o panel:%o data:%o', channel, panel, data);

            var video = ChannelController.getVideoObject(channel);

            this.replaceVideo([video], channel);
            this.refreshChannels();

            // clear any previous timeout to auto-exit panel
            clearTimeout(this.timeoutId);
        },

        refreshChannels: function() {
            // update channel selector
            var page = this.$('.channel_selector');
            var list = page.find('.option_wrapper ul');
            var list_html = [];

            ChannelController.collection.forEach(function(channel, index, collection) {
                //this.logger.info('refreshChannels - channel:%o id:%o live:%o this.ch:%o', channel, channel.get('channelId'), channel.get('live'), this.channel);

                var channel_html = '';
                if (channel.get('live')) {
                    channel_html = $('<a id="' + channel.get('channelId') + '" href="/en_US/watch/live.html?videoChannel=' + channel.get('channelId') + '&changer">' + channel.get('name') + '</a>');
                }

                var klass = '';
                if (channel.get('channelId') === this.channel) {
                    var sel_channel = $('<a href="#">' + channel.get('name') + '</a>');

                    klass = 'selected';
                    var sel = page.find('.selector');
                    if (sel.find('a').hasClass('open')) {
                        sel_channel.addClass('open');
                    }
                    sel.html(sel_channel);
                }

                if (channel.get('live') && channel.get('channelId') !== 'radio') {
                    list_html.push($('<li class="' + klass + '"></li>').append(channel_html));
                }
            }.bind(this));

            // if all channels off air
            if (list_html.length === 0) {
                list_html = ['<li class="disabled">All Channels Off Air</li>'];
            }
            list.html(list_html);

            // set up video object
            this.channel_object = ChannelController.getChannel(this.channel);

            if (this.channel_object) {
                this.video = ChannelController.getVideoObject(this.channel);
            }

            //this.logger.info('refreshChannels - video:%o', this.video);

            // don't overwrite Video object with Array, just update the attributes
            // var channel = inlineVideo.videos[WatchDetail.channel];
            // if(channel === undefined || typeof channel['init'] !== 'function') {
            //   inlineVideo.videos[WatchDetail.channel] = vid_params;
            // } else {
            //   channel.init(vid_params);
            // }

            if(!this.videoVod) {
                this.checkLiveVideoState();
            }
        },


        keepPanelWithinViewport: function() {
            if(Common.video_panel_float && this.panelOn){
                var isNewPosition = false;
                var isNewSize = false;
                var currentWidth = this.$el.outerWidth();
                var currentHeight = this.$el.outerHeight();
                var currentPosition = this.$el.position();

                //horizontal boundary
                var left = currentPosition.left - LEFT_OR_RIGHT_PADDING;
                var right = left + currentWidth + (LEFT_OR_RIGHT_PADDING * 2);
                if(right > document.body.clientWidth) { //passed right edge
                    if(left <= 0) {
                        //resize to fit panel within available space if it's width is still greater than min width
                        if(currentWidth > this.minWidth) {
                            var newWidth = currentWidth - (right - document.body.clientWidth);
                            var newHeight = newWidth / ASPECT_RATIO;
                            this.$el.css('width', newWidth);
                            this.$el.css('height', newHeight);
                            isNewSize = true;
                        }
                    } else { //move panel to the left
                        var newLeft = left - (right - LEFT_OR_RIGHT_PADDING - document.body.clientWidth);
                        this.$el.css({left: newLeft});
                        isNewPosition = true;
                    }
                } else if(left <= 0) { //passed left edge, move panel to the right
                    this.$el.css('left', LEFT_OR_RIGHT_PADDING);
                    isNewPosition = true;
                }

                //vertical boundary
                var top = currentPosition.top - TOP_OR_BOTTOM_PADDING;
                var bottom = top + currentHeight + (TOP_OR_BOTTOM_PADDING * 2);
                if(bottom > document.body.clientHeight) { //passed bottom edge
                    if(top <= TOP_MENUBAR_HEIGHT) {
                        //resize to fit panel within available space if it's height is still greater than min height
                        if(currentHeight > this.minHeight) {
                            var newHeight = currentHeight - (bottom - document.body.clientHeight);
                            var newWidth = newHeight * ASPECT_RATIO;
                            this.$el.css('width', newWidth);
                            this.$el.css('height', newHeight);
                            isNewSize = true;
                        }
                    } else { //move panel upwards
                        var newTop = top - (bottom - TOP_OR_BOTTOM_PADDING - document.body.clientHeight);
                        this.$el.css({top: newTop});
                        isNewPosition = true;
                    }
                } else if(top <= TOP_MENUBAR_HEIGHT) { //passed top edge, move panel downwards
                    this.$el.css('top', TOP_MENUBAR_HEIGHT + TOP_OR_BOTTOM_PADDING);
                    isNewPosition = true;
                }

                if(isNewPosition) {
                    var newPosition = this.$el.position();
                    this.savePanelPosition(newPosition.top, newPosition.left);
                }

                if(isNewSize) {
                    this.savePanelSize(this.$el.width(), this.$el.height());
                }
            }
        },

    });

    return PanelDisplay;
})
;
