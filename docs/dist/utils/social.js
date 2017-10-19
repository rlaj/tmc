/**
 * Social is still set up in the same way as before. To use, create a
 * new Social object, then call loadSocial* with the appropriate params
 * as you've done in the past
 */
define('utils/social',['require','jquery','utils/metrics'],function(require) {
  var $ = require('jquery'),
      Metrics = require('utils/metrics')
      ;

  var Social = function() {
    this.strip_domain = false;

    this.loadSocialBox = undefined;
    this.loadSocialVideo = undefined;
    this.loadSocialOverlay = undefined;

    this.activate_metrics = false;

    var line_break = '%0D%0A';
    var app_strings = [
      'Download the Masters iOS App at ' + encodeURIComponent('https://itunes.apple.com/us/app/the-masters-tournament/id309025938?mt=8'),
      'Download the Masters Android App at ' + encodeURIComponent('https://play.google.com/store/apps/details?id=com.ibm.events.android.masters')
    ].join(line_break);

    var share_footer = app_strings;

    var social_api = this;

    //* **********************************
    // add social media buttons functions
    // data format:
    //  { "service":"facebook | pinterest | twitter | plusone",
    //    "element": "container name",
    //    "track_name": "formal name used for tracking purposes",
    //    "url": "full page url",
    //    "title": " page title",
    //    "display_title": "title to display in email share - optional",
    //    "photourl": "full image path - optional",
    //    "type": "shared content type",
    //    "url_only": true|false (default)    # just return the share path
    //
    // TODO: allow multiple services and elements to be identified in same order
    //       to avoid duplicating calls
    //* **********************************
    function addSocial(_options) {
      var options = $.extend({ url_only: false, type: 'Default', track_name: '', display_title: _options.title }, _options);

      var network = options.service;

      if(social_api.strip_domain) {
        // remove domain if it exists
        if(options.url.indexOf('://') > -1) {
          options.url = options.url.replace(/https?:\/\/[^/]+/, '');
        }

        // prepend user location domain
        options.url = location.protocol + '//' + 'www.masters.com' + options.url;
      } else {
        if(options.url.indexOf('://') === -1) {
          options.url = location.origin + options.url;
        }
      }

      var enc_url = encodeURIComponent(options.url);
      var enc_title = encodeURIComponent(options.display_title);

      var share_code = '',
          share_path = '',
          updateHTML = true,
          track_string = [options.type, options.title, 'Share', options.track_name].join('||');
      switch(network) {
        case 'facebook':
          share_path = 'https://www.facebook.com/sharer/sharer.php?u=' + enc_url;
          share_code = '<a href="' + share_path + '" data-track="' + track_string + '" data-title="' + options.type + ':' + options.display_title + '" data-bypass><img src="/images/now/share_fb.png" alt="Share on Facebook" /></a>';
          break;

        case 'twitter':
          share_path = 'https://twitter.com/share?url=' + enc_url + '&via=TheMasters&text=' + enc_title;
          share_code = '<a href="' + share_path + '" data-track="' + track_string + '" data-title="' + options.type + ':' + options.display_title + '" data-bypass><img src="/images/now/share_twitter.png" alt="Tweet" /></a>';
          break;

        case 'plusone':
          share_path = 'https://plus.google.com/share?url=' + enc_url;
          share_code = '<a href="' + share_path + '" data-track="' + track_string + '" data-title="' + options.type + ':' + options.display_title + '" data-bypass><img src="/images/now/share_gplus.png" alt="Share on Google+"/></a>';
          break;

        case 'email':
          var body_text = enc_title + line_break + line_break + enc_url + line_break + line_break;
          share_path = 'mailto:%20?subject=' + enc_title + '&body=' + body_text + share_footer;
          share_code = '<a href="' + share_path + '" data-track="' + track_string + '" data-title="' + options.type + ':' + options.display_title + '" data-bypass><img src="/images/now/share_mail.png" alt="Share via Email"/></a>';
          break;

        case 'link':
          share_path = options.url;
          if(options.url_only === false) {
            var elem = options.element;
            elem.off('click')
              .on('click.togglelink', 'a', function(e) {
                $(this).parent().toggleClass('open').find('.link_url').toggleClass('open');
              })
              .on('click', 'a', function(e) {
                e.preventDefault();
              })
              .find('input').prop('value', share_path)
                .data('track', track_string)
                .data('title', options.type + ':' + options.display_title)
                .off('focus').on('focus', function() {
                  // select() doesn't work on iOS. use setSelectionRange() instead
                  $(this).get(0).setSelectionRange(0, 9999);
                })
                .off('mouseup').on('mouseup', function(e) {
                  e.preventDefault();
                })
                .off('copy').on('copy', function(e) {
                  if(social_api.activate_metrics) {
                    social_api.measure($(this).data('track').split('||'), $(this).data('title'));
                    social_api.activate_metrics = false;
                  }
                });
          }
          updateHTML = false;
          break;

        default:
      }

      if(options.url_only === true) {
        return share_path;
      }

      if(updateHTML && options.url_only === false) {
        share_code = $(share_code).on('click', function(e) {
          social_api.measure($(this).data('track').split('||'), $(this).data('title'));
        });

        // add openSocialWindow call (even if email due to possiblity
        // that webmail client is default handler, would take user away
        // from site if that were the case)
        // if(network !== 'email') {
          $(share_code).on('click', function(e) {
            e.preventDefault();
            social_api.openSocialWindow(this.href);
          });
        // }

        options.element.html(share_code);
      }
    }


    // utility function to process all available sharing services
    function addSocialServices(container, url, type, title, disp_title) {
      // http://tosbourn.com/a-fix-for-window-location-origin-in-internet-explorer/
      if(!window.location.origin) {
        window.location.origin = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
      }

      // add URLs for all share services
      var boxes = [
        { service: 'email', element: '.mail', track_name: 'Mail' },
        { service: 'facebook', element: '.facebook', track_name: 'Facebook' },
        { service: 'twitter', element: '.twitter', track_name: 'Twitter' },
        { service: 'plusone', element: '.gplus', track_name: 'Google' },
        { service: 'link', element: '.link', track_name: 'Copy' }
      ];

      for(var i = 0, l = boxes.length; i < l; i++) {
        addSocial({
          service: boxes[i].service,
          element: container.find(' .social_services ' + boxes[i].element),
          track_name: boxes[i].track_name,
          url: url,
          type: type,
          title: title,
          display_title: disp_title
        });
      }
    }

    //* **********************************
    // function to call measureApp on social click
    // track_ary: array of tracking strings ['Article','Article Name','Share','Google Plus']
    // Article Name is expected to have apostrophes already escaped
    //* **********************************
    this.measure = function(track_ary, prop) {
      // if we only pass type and title, then add Share to end
      // otherwise we assume it's from sharing a service, in which case
      // Share already exists in track_ary
      if(track_ary.length < 3) {
        track_ary.push('Share');
      } else {
        // set s.prop50
        if(prop === undefined) {
          prop = track_ary[0] + ':' + track_ary[1];
        }
        prop = prop.split(':');
        if(track_ary[0].indexOf('Tournament Info') > -1 && track_ary[0].indexOf(':VOD') < 0) {
          // only use page title
          prop[0] = prop[1];
          prop.length = 1;
        } else if(track_ary[0].indexOf('Breaking News') > -1) {
          prop[0] = 'Breaking News';
        } else if(track_ary[0].indexOf('Photo Gallery') > -1) {
          // s.prop50 is <Gallery Title>
          prop[0] = 'Photo Gallery';
        } else if(track_ary[0] === 'Photo') {
          // prop should be Photo, metric call should still be Photo Gallery
          prop[0] = 'Photo'
          track_ary[0] = 'Photo Gallery';
        } else if(track_ary[0].indexOf('Leader Board') > -1 && track_ary[0].indexOf('Leader Board:Video') < 0) {
          prop[0] = 'Leader Board'
        } else if(track_ary[0].indexOf('Articles') > -1 && track_ary[0].indexOf(':Highlight') < 0 && track_ary[0].indexOf(':VOD') < 0) {
          prop[0] = 'Articles';
        } else if(track_ary[0].indexOf('Watch') > -1 || track_ary[0].indexOf(':VOD') > -1 || track_ary[0].indexOf('Articles:Highlight') > -1 || track_ary[0].indexOf('Leader Board:Video') > -1) {
          var parts = track_ary[0].split(':');
          if(parts[1] !== 'Live') {
            prop[0] = 'VOD';
          } else {
            prop[0] = parts[1];
          }
        }
        prop = prop.join(':');
        Metrics.trackS({prop50: prop});
      }
      Metrics.measureApp.apply(this, track_ary);
    };

    //* **********************************
    // function to populate social share box
    // container: jQuery selector for share link
    //       url: unencoded URL to be shared
    //* **********************************
    this.loadSocialBox = function(container, url, type, title, disp_title) {
      // close any open social boxes before populating
      $('.socialOverlay.active').removeClass('active');

      // add socialOverlay to container
      var first = false;
      var overlay = container.find('.socialOverlay');
      if(overlay.length === 0) {
        first = true;
        overlay = $('<div class="socialOverlay">'
          + '<div class="header">Share</div>'
          + '<div class="social_box social_services">'
            + '<div class="mail"></div>'
            + '<div class="facebook"></div>'
            + '<div class="twitter"></div>'
            + '<div class="gplus"></div>'
            + '<div class="link">'
              + '<div class="link_url">'
                + '<input type="text" readonly="readonly" value="" />'
              + '</div>'
              + '<img src="/images/now/share_anchor.png" alt="Share Link" />'
            + '</div>'
          + '</div>'
          + '<div class="close"></div>'
        + '</div>');
        container.append(overlay);
      }

      // social box in this case is called only when clicked, so fire load action immediately
      this.measure([type, title]);

      // set var to enable measureApp when copying link
      this.activate_metrics = true;

      if(title === undefined) {
        title = '';
      }
      if(disp_title === undefined) {
        disp_title = title;
      }
      addSocialServices(container, url, type, title, disp_title);

      if(type === 'Photo') {
        type = 'Photo Gallery';
      }

      // assign toggle for share link, allow clicking on share service to close box as well
      overlay.off('click').on('click', '.close', function(e) {
        e.preventDefault();
        $(this).parent().removeClass('active')
          .find('.link_url.open').removeClass('open');
        $(container).trigger('share.close');
        Metrics.measureApp(type, title, 'Share', 'Close');
      })
      .on('click', '> a, div a', function(e) {
        if(this.href.indexOf('mailto') === -1) {
          e.preventDefault();
        }

        if(this.getAttribute('href') !== '#') {
          var $box = $(this).parents('.socialOverlay');
          if($box.length === 0) {
            $box = $(this).siblings('.socialOverlay');
          }
          $box.toggleClass('active');
          container.trigger('share.close');
        }
      });

      if(first) {
        setTimeout(function() { overlay.addClass('active'); }, 100);
      } else {
        overlay.addClass('active');
      }
    };

    this.loadSocialOverlay = function(container, url, type, title, disp_title) {
      require(['utils/overlay'], function(Overlay) {
        addSocialServices(Overlay.$overlayShare, url, type, title, disp_title);

        if(type === 'Photo') {
          type = 'Photo Gallery';
        }

        // assign open command
        container.off('click.share').on('click.share', function(e) {
          e.preventDefault();

          // activate overlay
          Overlay.openShare();

          // set var to enable measureApp when copying link
          social_api.activate_metrics = true;

          Metrics.measureApp(type, title, 'Share');

          // allow clicking on background to hide overlay
          Overlay.$el.off('click.share').on('click.share', function(e) {
            var overlay = $(e.target).closest('.socialOverlay');
            if(overlay.length === 0) {
              Overlay.closeShare();
              Overlay.$el.off('click.share');
              Metrics.measureApp(type, title, 'Share', 'Close');
            }
          });
        });

        // assign toggle for share link, allow clicking on share service to close box as well
        var overlay = Overlay.$('.socialOverlay');
        overlay.off('click.close').on('click.close', '.close', function(e) {
          e.preventDefault();
          Overlay.closeShare();

          // disable measureApp when copying link
          social_api.activate_metrics = false;
          Metrics.measureApp(type, title, 'Share', 'Close');
        })
        .off('click.static').on('click.static', 'div a', function(e) {
          if(this.href.indexOf('mailto') === -1) {
            e.preventDefault();
          }

          if(this.getAttribute('href') !== '#') {
            Overlay.closeShare();
          }
        });
      });
    };

    // populate video share popup bar with proper links
    this.loadSocialVideo = function(container, url, type, title, disp_title) {
      // prep html container
      var share = $('#share').removeClass('active');

      if(title === undefined) {
        title = '';
      }
      if(disp_title === undefined) {
        disp_title = title;
      }

      // set var to enable measureApp when copying link
      this.activate_metrics = true;

      addSocialServices(container, url, type, title, disp_title);

      // attach handlers
      share.off('click', 'a').on('click', 'a', function(e) {
        if(this.href.indexOf('mailto') === -1) {
          e.preventDefault();
        }

        if(this.getAttribute('href') !== '#') {
          $(this).parent().siblings('.link.open').removeClass('open')
            .find('.link_url.open').removeClass('open');
          $(container).trigger('share.close');
        }
      });
    };

    this.openSocialWindow = function(href) {
      var win = window.open(href, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');

      var checkBlank = function(openWin) {
        try {
          if(openWin.location.hostname !== undefined && openWin.location.hostname === '') {
            // means empty frame, can close
            openWin.close();
          }
        } catch (e) {
          // do nothing
        }
      };

      setTimeout(checkBlank.bind(this, win), 4000);
    };
  };

  return new Social();
});

