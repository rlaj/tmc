define('controllers/search',['require','jquery','backbone','baseview','views/secondary-dropdown','utils/common','utils/metrics','jquery.paging'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      BaseView = require('baseview'),
      SecondaryDropdown = require('views/secondary-dropdown'),
      Common = require('utils/common'),
      Metrics = require('utils/metrics')
      ;

  require('jquery.paging');

  function IBMSolrSearch(options) {
    this.searchUrl = '/slsearch/cmmast/select?indent=on&version=2.2&q=%searchText%~0.5%fq%&start=%start%&rows=12&fl=title,url,tstamp,mtime,htsearch,metatag.description,metatag.resulttype,metatag.resultthumb,metatag.resultduration,metatag.resultcaption,metatag.resultlink,metatag.resultwidth,metatag.resultheight&qt=&wt=json&explainOther=&facet=true&facet.query=metatag.resulttype:"A"&facet.query=metatag.resulttype:"P"&facet.query=metatag.resulttype:"V"';
    this.currentSort = '';
    this.currentType = '';
    this.searchText = '';
    this.start = 0;
    this.pageSize = 12;
    this.newSearch = true;
    this.pageInit = false;
    this.curPage = 0;
    this.$el = $('body');

    if(options && options.container) {
      this.$el = options.container;
    }
  }

  IBMSolrSearch.prototype = {
    search: function() {
      var url = this.searchUrl;
      if(this.currentSort !== '') {
        url = this.searchUrl + '&sort=' + this.currentSort + ' desc';
      }
      url = url.replace('%searchText%', this.searchText);
      url = url.replace('%start%', this.start);
      url = url.replace('%fq%', this.currentType);
      if(this.searchText === '') {
        this.solrSetMessage('emptyTerm');
      } else {
        $.ajax({
          url: encodeURI(url),
          type: 'GET',
          timeout: 10000,
          dataType: 'json',
          contentType: 'application/json'
        }).done(function(data) {
          this.updateTabCounts(data);
          this.renderResults(data);
          if(this.newSearch) {
            this.renderPagination(data);
          }
          if(this.newSearch) {
            this.newSearch = false;
          }
          if(data.response.numFound === 0) {
            this.solrSetMessage('noResults');
          }
        }.bind(this)).fail(function(err) {
          console.log(err);
          this.solrSetMessage('requestError');
        }.bind(this));

        // populate search term text in the input field
        this.$el.find('#inlineSearch input:text').val(this.searchText);
      }
    },
    updateTabCounts: function(data) {
      if(this.currentType === '' || this.currentType === 'AR') {
        var numAll = data.response.numFound;
        this.$el.find('.search-tabs .tabs a').removeClass('disabled');

        this.$el.find('#tab-all .data').attr('data-count', numAll);

        var index;

        // set the counts for each category using the facet counts from the query results.
        index = 'metatag.resulttype:"A"';
        var numArticles = data.facet_counts.facet_queries[index];
        this.$el.find('#tab-news .data').attr('data-count', numArticles);
        if(numArticles === 0) {
          this.$el.find('#tab-news').addClass('disabled');
        }

        index = 'metatag.resulttype:"P"';
        var numPhotos = data.facet_counts.facet_queries[index];
        this.$el.find('#tab-photos .data').attr('data-count', numPhotos);
        if(numPhotos === 0) {
          this.$el.find('#tab-photos').addClass('disabled');
        }

        index = 'metatag.resulttype:"V"';
        var numVideo = data.facet_counts.facet_queries[index];
        this.$el.find('#tab-video .data').attr('data-count', numVideo);
        if(numVideo === 0) {
          this.$el.find('#tab-video').addClass('disabled');
        }
      }
    },
    renderResults: function(data) {
      var $resultsContainer = this.$el.find('.results-container .results');
      $resultsContainer.html('');
      var solrSearch = this;
      $.each(data.response.docs, function() {
        if(this.htsearch !== undefined) {
          var description = '';
          if(this['metatag.description'] !== undefined) {
            description = this['metatag.description'];
          }

          // strip any promo params it may have picked up
          var link = this.url;
          var pindex = link.indexOf('promo=');
          if(pindex > -1) {
            link = link.replace(/promo=[^&]/, '');
          }

          // don't append ? if one already exists and is last character in url
          var qindex = link.indexOf('?');
          if(qindex < link.length - 1) {
            link += (qindex > -1) ? '&' : '?';
          }
          link += 'promo=sitesearch';

          var className = '';
          if(link.indexOf('milestones/index.html') > -1) {
            className = 'milestones';
          }

          $resultsContainer.append('<div class="result"><a href="' + link + '" class="' + className + '">' + solrSearch.addImage(this) + '<h2>' + this.htsearch + '</h2><h3>' + solrSearch.formatDate(this) + '</h3>' +  solrSearch.addExtraFields(this) + '<p>' + description + '</p></a></div>');
        }
      });
    },
    renderPagination: function(data) {
      var total = data.response.numFound;
      var numRows = this.pageSize;
      var numPages = total % numRows === 0 ? parseInt(total / numRows) : parseInt(total / numRows) + 1;
      var self = this;

      try {
        this.pager = this.$el.find('.search-container .pagination').paging(total, {
          format: '< nnnnnnnnnn >',             // this format string gives me a next, previous and 10 page indexes at a time
          perpage: this.pageSize,               // number of rows to display on a page
          lapping: 0,                             // i have no idea!
          page: 1,                                // start at page 1.  The pagination code is a 1 based index.
          onClick: function(e) {
            e.preventDefault();

            var page = $(this).data('page');

            self.pager.setPage(page);

            if($(this).data('measure')) {
              Metrics.measureApp(Metrics.page_section, Metrics.page_title, $(this).data('measure'));
            }
          },
          onSelect: function(page) {
            // This is the handler function for selecting a page. remember that for the pagination the page index starts at 1 and solr results index starts at 0
            this.curPage = page - 1; // set the current page. we will use a 0 base index
            this.start = this.curPage * numRows;  // set the start index for the solr query
            // only call the solr search if we are not initializing the pagination
            if(this.pageInit) {
              this.search();
            }
            this.pageInit = true;
            return false;
          }.bind(this),                            // callback function for selecting a page, next, prev
          onFormat: this.formatPagination          // callback function for formatting the format string in the format option
        });
      } catch (e) {
        console.info(e);
      }
    },
    formatPagination: function(type) {
      switch(type) {
        case 'block':
          // these are the page numbers
          var retVal = '';
          if(!this.active) {
            retVal =  '<a class="disabled">' + this.value + '</a>';
          } else if(this.value !== this.page) {
            retVal =  '<a href="#' + this.value + '" class="plink" data-measure="Page:' + this.value + '">' + this.value + '</a>';
          } else {
            retVal = '<a class="current">' + this.value + '</a>';
          }
          return retVal;

                 // if (this.last)  {return retVal;} else {return retVal+='<span class="divider">|</span>'};
        case 'next':
          // next link
          return '<a href="#' + this.value + '" data-measure="Next Page">></a>';
        case 'prev':
          // previous link
          return '<a href="#' + this.value + '" data-measure="Previous Page"><</a>';
        case 'fill':
          // not quite sure what fill is for
          return '';
        default:
          return '';
      }
    },
    addExtraFields: function(result) {
      var extraDataHtml = '';
      if(result['metatag.resultduration'] !== undefined && result['metatag.resultduration'] !== '') {
        extraDataHtml += '<h3>' + result['metatag.resultduration'] + '</h3>';
      }
      return extraDataHtml;
    },
    formatDate: function(result) {
      // result.mtime="20120209173006";
      if(result.mtime.length === 13) {
        var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
        d.setUTCSeconds(result.mtime.substring(0, 10));
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
      } else if(result.mtime !== '0') {
          // parse date and time
        var d = new Date(
                        result.mtime.substring(0, 4),
                        parseInt(result.mtime.substring(4, 6), 10) - 1,
                        parseInt(result.mtime.substring(6, 8), 10),
                        parseInt(result.mtime.substring(8, 10), 10),
                        parseInt(result.mtime.substring(10, 12), 10),
                        parseInt(result.mtime.substring(12, 14), 10)
                        );

              // console.info(d.toLocaleDateString() + " " + d.toLocaleTimeString());
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
      }
      return '';
    },
    addImage: function(result) {
      if(result['metatag.resultthumb'] !== undefined && result['metatag.resultthumb'].length > 4) {
        return '<img src="' + result['metatag.resultthumb'] + '" />';
      }
      return '';
    },
    updateType: function(type) {
      switch(type) {
        case 'video':
          this.currentType = '&fq=metatag.resulttype:"V"';
          break;
        case 'photos':
          this.currentType = '&fq=metatag.resulttype:"P"';
          break;
        case 'news':
          this.currentType = '&fq=metatag.resulttype:"A"';
          break;
        default:
          this.currentType = '';
      }
      this.search();
    },
    getParameterByName: function(name) {
      name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
      var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
          results = regex.exec(location.search);
      return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    },
    solrSetMessage: function(messageType) {
      var $resultsMsg = this.$el.find('#resultsMessage');
      var $pagination = this.$el.find('.pagination');
      var $searchSort = this.$el.find('.search-sort');
      switch(messageType) {
        case 'emptyTerm':
          $resultsMsg.html('You must enter a search term.');
          $resultsMsg.show();
          $pagination.addClass('hidden');
          $searchSort.addClass('hidden');
          break;
        case 'noResults':
          $resultsMsg.html("There were no search results for '" + this.searchText + "'. Please try your search again.");
          $resultsMsg.show();
          $pagination.addClass('hidden');
          $searchSort.addClass('hidden');
          break;
        case 'requestError':
          $resultsMsg.html('Unable to retrieve results. Please try again.');
          $resultsMsg.show();
          $pagination.addClass('hidden');
          $searchSort.addClass('hidden');
          break;
        default:
          $resultsMsg.html('Unable to retrieve results. Please try again.');
          $resultsMsg.show();
          $pagination.addClass('hidden');
          $searchSort.addClass('hidden');
          break;
      }
    }
  };


  var Search = BaseView.extend({
    events: {
      'click .search-sort span': 'sortResults',
      'submit form#inlineSearch': 'submitForm',
      'click .result a.milestones': 'openTimeline'
    },

    onInitialization: function() {
      BaseView.prototype.onInitialization.apply(this, arguments);

      this.ibmSolrSearch = new IBMSolrSearch({
        container: this.$el
      });

      this.dropdown = new SecondaryDropdown({
        el: this.$('.tabs'),
        callback: function(href) {
          this.ibmSolrSearch.newSearch = true;
          this.ibmSolrSearch.pageInit = false;
          this.ibmSolrSearch.updateType(href.replace('#', ''));
        },
        callback_context: this,
        metrics: 'Search Results:View'
      });
    },

    onRender: function() {
      BaseView.prototype.onRender.apply(this, arguments);

      this.ibmSolrSearch.searchText = this.ibmSolrSearch.getParameterByName('query').toLowerCase();
      this.$('#searchQuery').val(this.ibmSolrSearch.searchText);
      this.ibmSolrSearch.search();
    },

    onDispose: function() {
      this.dropdown.dispose();
    },

    submitForm: function(e) {
      e.preventDefault();

      var form = $(e.currentTarget);
      var query = form.find('input[name="query"]').val();
      var path = form.attr('action');

      Backbone.history.navigate(path + '?query=' + query, true);
    },

    sortResults: function(e) {
      e.preventDefault();

      var $this = $(e.currentTarget);
      if(!$this.hasClass('selected')) {
        if($this.text().toLowerCase() === 'date') {
          this.ibmSolrSearch.currentSort = 'mtime';
          this.ibmSolrSearch.search();
          $this.parent().find('span').removeClass('selected');
          $this.addClass('selected');
        } else {
          this.ibmSolrSearch.currentSort = '';
          this.ibmSolrSearch.search();
          $this.parent().find('span').removeClass('selected');
          $this.addClass('selected');
        }

        Metrics.measureApp(Metrics.page_section, Metrics.page_title, $this.text());
      }
    },

    openTimeline: function(e) {
      return Common.openTimeline(e);
    }
  });

  return Search;
});

