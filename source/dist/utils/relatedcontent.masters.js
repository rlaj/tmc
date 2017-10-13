define('utils/relatedcontent.masters',['require','relatedcontent','models/news-item'],function(require) {
  var RelatedContent = require('relatedcontent'),
      NewsItem = require('models/news-item')
      ;

  RelatedContent.List.prototype.convertContentItem = function(rc) {
    var date = new Date(rc.date);
    var yr = date.getFullYear();
    // IE8 returns NaN because it can't parse '2014-04-03' correctly
    // so we have to manually get the year.
    if(isNaN(date)) {
      yr = parseInt(rc.date.substring(0,4), 10);
    }

    var size = 'half';
    if(this.layout === 'player') {
      size = 'third';
    }

    var img = rc.thumb;
    var match = img.match(/\/[ha]_(.*)$/);
    var folder;
    if(match !== null) {
      var suffix = match[1];
      folder = '/images/pics/';
      if(size !== 'third') {
        img = {
          small: folder + 'large/b_' + suffix,    // 720x405
          medium: folder + 'thumbs/a_' + suffix,   // 480x270
          large: folder + 'large/b_' + suffix    // 720x405
        };
      } else {
        img = {
          small: folder + 'large/b_' + suffix,
          medium: folder + 'thumbs/a_' + suffix,
          large: folder + 'thumbs/a_' + suffix
        };
      }
    } else {
      match = img.match(/(.*\/)([a-zA-Z]+_.*)1280x720\.jpg$/);
      if(match !== null) {
        var prefix = match[2];
        folder = match[1];
        if(size !== 'third') {
          img = {
            small: folder + prefix + '748x420.jpg',
            medium: folder + prefix + '492x277.jpg',
            large: folder + prefix + '748x420.jpg'
          };
        } else {
          img = {
            small: folder + prefix + '748x420.jpg',
            medium: folder + prefix + '236x133.jpg',
            large: folder + prefix + '492x277.jpg'
          };
        }
      } else {
        // fall back to use +img+ path for all sizes
        img = {
          small: img,
          medium: img,
          large: img
        };
      }
    }

    var type = '',
        icon = '';
    switch(rc.type) {
      case 'articles': type = 'article'; icon = 'news'; break;
      case 'video':
      case 'video_leaderboard':
      case 'video_replay':
      case 'video_shot_highlight':
        type = 'video'; icon = 'video'; break;
      case 'photo': type = 'photo'; icon = 'photo'; break;
      case 'galleries': type = 'galleries'; icon = 'gallery'; break;
      default: break;
    }

    // in case extradata doesn't exist
    // so we don't error out on the return statement below
    if(rc.extradata === undefined) {
      rc.extradata = {};
    }

    return new NewsItem({
      year: yr,
      size: size,
      type: type,
      label: '',
      icon: icon,
      caption: rc.title,
      image: img,
      link: rc.url,
      cmsId: rc.cmsId,
      published: rc.published,
      photo_count: rc.extradata.photo_count,
      sort: rc.extradata.sort
    });
  };

  RelatedContent.List.prototype.convertContent = function() {
    // given RelatedContent.result, convert to NewsItem objects usable by ContentList
    var i = 0,
        l = this.result.length;

    for(i; i < l; i++) {
      var nc = this.convertContentItem(this.result[i]);
      if(!nc || nc === false) {
        continue;
      }

      // auto-assign ID in descending order
      nc.set('id', l - i);

      // process any link suffixes if applicable
      var link = nc.get('link');

      // only attach suffix if type matches, and url is not fully qualified
      if(this.link_suffix[nc.get('type')] !== undefined && link.search(/^https?:\/\//) === -1) {
        link += (link.search(/\\\?/) === -1) ? '?' : '&';
        link += 'promo=' + this.link_suffix[nc.get('type')];
        nc.set('link', link);
      }

      this.content.push(nc);
    }
  };

  // unnecessary since API now allows date boundaries, but that wasn't
  // avaialble when this was originally written
  RelatedContent.List.prototype.fetchContentFromYear = function(year) {
    year = parseInt(year, 10);
    if(!isNaN(year)) {
      return _.filter(this.content, function(c) {
        return c.year === year;
      });
    } else {
      return [];
    }
  };
});
