/* @preserve
 *  Related Content module, v0.3.0 (2016-02-13)
 */

/*
 *  To use, call for each instance of related content:
 *
 *  RelatedContent.init({
 *    event_id: 'eventname_year';
 *  });
 *  var list = new RelatedContent.List({
 *    container: $('#container'), // jQuery object of container related content should live in
 *    type: 'player', // type of content item we're requesting related items for
 *    filter: 'video|photo|articles', // content types you can filter by, can by single value or array
 *    id: playerid, // id/tag
 *    title: true, // whether we show the title
 *    date: false, // whether we show the date
 *    layout: various, // if you need different layouts for different pages, define them here
 *    adIndex: adIndex, // if an ad is to be inserted, position it should inserted. if negative, starts from the end
 *    callback: function() { // callback passes +this+ as container specified above
 *      if(this.content.length === 0) {
 *        this.container.html('<div class="relatedContent stub"><div>No related content for this match. (id ' + this.id + ')</div></div>');
 *      }
 *    }
 *  });
 *  list.load();
 *
 *  See http://events-git.atl.dst.ibm.com/events/related-content-jsapi for more details and examples
 */

// RelatedContent module contains only static variables, functions
// all instance based objects are stored in the List object
var RelatedContent = (function($) {
  var settings = {
    event_id: '',
    lang: 'en' // optional parameter, default language is English
  };

  // replace this with the event specific related content endpoint
  var tag_path = '/relatedcontent/rest/#{event_id}/#{lang}/tags/';
  var content_path = '/relatedcontent/rest/#{event_id}/#{lang}/content';
  var content_mask = '/#{event_id}_#{id}_#{lang}';

  // initialize module by updating API paths, call any additional code supplied via callback
  var init = function(opts) {
    var vals = ['event_id','lang'];
    for(i=0;i<2;i++) {
      var key = vals[i];

      // store event_id/lang if provided
      if(opts[key] !== undefined) {
        settings[key] = opts[key];
      }
      // update paths with proper event_id/lang value
      if(settings[key] !== '' && tag_path.indexOf(key) > -1) {
        var reg = '#{' + key + '}';
        tag_path = tag_path.replace(reg,settings[key]);
        content_path = content_path.replace(reg,settings[key]);
        content_mask = content_mask.replace(reg,settings[key]);
      }
    }

    if(typeof opts.callback === 'function') {
      opts.callback.call(this);
    }
  };

  var List = function() {
    var _defaults = {
      type:           'tag',
      related:        true,
      filter:         '',
      limit:          0,
      start:          1,

      startdate:      '',
      enddate:        '',

      link_suffix:    {},
      normalize:      true,

      title:          true,
      date:           false,
      layout:         'single',
      open_in_new:    false,
      stub_text:      ''
    };
    var _init_settings;

    this.content = [];
    this.result = [];

    this.request = $.Deferred().resolve();
    this.events = $('<div>');
    this.container = undefined;

    this.create = function(opts) {
      this.container = opts.container;
      this.id = opts.id;
      this.url = (opts.url !== undefined) ? opts.url : ''; // fallback url of static file to request

      this.type = opts.type || _defaults.type;
      this.related = (opts.related !== undefined) ? opts.related : _defaults.related;
      this.filter = opts.filter || _defaults.filter;
      this.limit = opts.limit || _defaults.limit;
      this.start = opts.start || _defaults.start;

      this.startdate = opts.startdate || _defaults.startdate;
      this.enddate = opts.enddate || _defaults.enddate;

      this.adIndex = opts.adIndex;  // this is an integer for placement from the start. if value is negative, indicates x from end

      // format (each type is option):
      // { video : 'string', article : 'string', photo : 'string' }
      this.link_suffix = opts.link_suffix || _defaults.link_suffix;
      this.normalize = (opts.normalize !== undefined) ? opts.normalize : _defaults.normalize;

      this.title = (opts.title !== undefined) ? opts.title : _defaults.title;
      this.date = (opts.date !== undefined) ? opts.date : _defaults.date;
      this.layout = opts.layout || _defaults.layout;
      this.open_in_new = (opts.open_in_new !== undefined) ? opts.open_in_new : _defaults.open_in_new;
      this.stub_text = opts.stub_text || _defaults.stub_text;

      this.callback = opts.callback;

      // auto populate text/HTML if no results found, or JSON retrieval error
      if(this.stub_text !== '') {
        var matches = this.stub_text.match(/#{([^}]*)}/);
        if(matches !== null) {
          var l = matches.length - 1;
          if(l > 0) {
            for(var i=0; i<l; i++) {
              var prop = matches[i+1];
              // replace #{str} in stub_text string with properties of +this+
              var reg = new RegExp('#{' + prop + '}');
              this.stub_text = this.stub_text.replace(reg,this[prop]);
            }
          }
        }
      }

      _init_settings = $.extend(true, {}, _defaults, _init_settings, opts);
    };

    // reset List with original options, or with any individual options
    this.reinitialize = function(opts) {
      var update_settings = $.extend(true, {}, _init_settings, opts);
      this.create(update_settings);
    };

    // initialize on creation
    if (arguments.length > 0) {
      return this.create.apply(this, arguments);
    }
    return this;
  };

  // build tag query, or content query, based on desired request type
  List.prototype.load = function() {
    var path = '', query = '',
        i,l;
    var filter_start = 0; // index to start appending types=[filter] query params to filter by content type

    // id value is a straight URL path, simply request it and move on
    if(this.type === 'url') {
      if(this.url !== '') {
        return this.loadJSON(this.url);
      } else {
        return $.Deferred().reject();
      }
    }

    // make sure we leave path with a final character that can have additional query params added on
    // without worrying about the proper joining charater (?, &)
    if(this.type === 'tag') {
      path = tag_path;

      var tags = this.id;
      if(tags.push !== undefined) {
        l = tags.length;
        query = '';
        if(l > 0) {
          query = tags[0] + '?';
          if(l > 1) {
            for(i=1;i<l;i++) {
              query += 'tags=' + tags[i] + '&';
            }
          }
          path += query;
        } else {
          path += '?';
        }
      } else {
        path += tags + '?';
      }
    } else if (this.type === 'content') {
      var type_key = 'types';
      if(this.id) {
        var cms_id = content_mask.replace('#{id}',this.id);
        path = content_path + cms_id;
        if(this.related) {
          path += '/content/related';
          type_key = 'type';
        }
      } else {
        path = content_path;
      }

      // content query must use /type/[filter] format for first filter type
      if(this.filter !== '') {
        var filter = this.filter;
        if(filter.push !== undefined) {
          filter = filter[0];
        }
        path += '/' + type_key + '/' + filter;
        filter_start = 1;
      }

      path += '?';
    }

    if(this.filter !== '') {
      var filters = this.filter;
      if(filters.push !== undefined) {
        query = '';
        for(i=filter_start,l=filters.length;i<l;i++) {
          query += 'types=' + filters[i] + '&';
        }
        path += query;
      }
      // only add this if filter_start is 0, meaning we haven't added the first parameter yet
      else if(filter_start === 0) {
        path += 'types=' + filters + '&';
      }
    }

    if(this.start > 1) {
      path += 'start=' + this.start + '&';
    }
    if(this.limit > 0) {
      path += 'total=' + this.limit + '&';
    }
    if(this.startdate !== '') {
      path += 'startdate=' + this.startdate + '&';
    }
    if(this.enddate !== '') {
      path += 'enddate=' + this.enddate + '&';
    }

    return this.loadJSON(path);
  };

  // make JSON request for content, process content (convertContent), populate HTML (buildHTML)
  List.prototype.loadJSON = function(url) {
    var list = this;
    this.request = $.getJSON(url, function(data) {
      var obj_name = 'results';
      // data comes in newest to oldest
      list.result = data[obj_name];
      if(list.result !== undefined && list.result.length > 0) {
        // if requested flat URL file, scrub to remove instances of source content in results
        if(list.type === 'url') {
          for(var i=0,l=list.result.length;i<l;i++) {
            if(list.id === list.result[i].cmsId) {
              list.result.splice(i,1);
              break;
            }
          }
        }

        // if we want to normalize content, run convert
        if(list.normalize) {
          list.convertContent();
        }
        // else, clone result array to content
        else {
          list.content = list.result.slice(0);
        }
      }

      list.postProcess();

      list.buildHTML();
    })
    // purposefully separate callback execution for sucess/failure from content manipulation block
    .success(function() {
      if(typeof list.callback === 'function') {
        list.callback.call(list, {status: 'success'});
      }

      list.events.trigger('request.success');
    })
    .fail(function(e) {
      if(typeof list.callback === 'function') {
        list.callback.call(list, {status: 'error', error: e});
      }

      list.events.trigger('request.error');
    });

    return this.request;
  };

  // inject any post-processing of data set
  // ex. data sorting, subsetting data, etc before displaying
  List.prototype.postProcess = function() {
    // overload with custom code specific for usage
  };

  // build related content HTML
  List.prototype.buildHTML = function() {
    // overload with custom code specific for usage
  };

  List.prototype.convertContent = function() {
    // given RelatedContent.result, convert to objects parsable by Utilities.Content
    var i=0, l=this.result.length;

    for(i;i<l;i++) {
      var nc = this.convertContentItem(this.result[i]);

      // if convertContentItem returns false, indicates item should be discarded
      // and not included in content list
      if(nc === false) {
        continue;
      }

      // auto-assign ID in descending order
      nc.id = l - i;

      // process any link suffixes if applicable
      var link = nc.link;
      // only attach suffix if type matches, and url is not fully qualified
      if(this.link_suffix[nc.type] !== undefined && link.search(/^https?:\/\//) === -1) {
        link += (link.search(/\\\?/) === -1) ? '?' : '&';
        link += 'promo=' + this.link_suffix[nc.type];
        nc.link = link;
      }

      this.content.push(nc);
    }
  };

  // customizable method to normalize content for display
  List.prototype.convertContentItem = function(rc) {
    var nc = rc;
    nc.link = rc.url;
    return nc;
  };

  // return init method, List object, and date helpers
  return {
    init : init,
    List : List,

    daysInWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shortMonthsInYear : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    longMonthsInYear  : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  };
})($);
define("relatedcontent", ["jquery"], (function (global) {
    return function () {
        var ret, fn;
        return ret || global.RelatedContent;
    };
}(this)));

