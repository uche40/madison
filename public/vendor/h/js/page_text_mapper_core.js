(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  window.PageTextMapperCore = (function() {
    function PageTextMapperCore() {
      this._onPageRendered = __bind(this._onPageRendered, this);
    }

    PageTextMapperCore.prototype.CONTEXT_LEN = 32;

    PageTextMapperCore.prototype.getPageIndexForPos = function(pos) {
      var info, _i, _len, _ref;
      _ref = this.pageInfo;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        info = _ref[_i];
        if ((info.start <= pos && pos < info.end)) {
          return info.index;
          console.log("Not on page " + info.index);
        }
      }
      return -1;
    };

    PageTextMapperCore.prototype._onPageRendered = function(index) {
      var _this = this;
      if (!this._isPageRendered(index)) {
        setTimeout((function() {
          return _this._onPageRendered(index);
        }), 1000);
        return;
      }
      return this._mapPage(this.pageInfo[index]);
    };

    PageTextMapperCore.prototype.isPageMapped = function(index) {
      var _ref;
      return ((_ref = this.pageInfo[index]) != null ? _ref.domMapper : void 0) != null;
    };

    PageTextMapperCore.prototype._mapPage = function(info) {
      var renderedContent;
      info.node = this.getRootNodeForPage(info.index);
      info.domMapper = new DomTextMapper("d-t-m for page #" + info.index);
      info.domMapper.setRootNode(info.node);
      info.domMapper.documentChanged();
      if (this.requiresSmartStringPadding) {
        info.domMapper.setExpectedContent(info.content);
      }
      info.domMapper.scan();
      renderedContent = info.domMapper.getCorpus();
      if (renderedContent !== info.content) {
        console.log("Oops. Mismatch between rendered and extracted text, while mapping page #" + info.index + "!");
        console.trace();
        console.log("Rendered: " + renderedContent);
        console.log("Extracted: " + info.content);
      }
      return setTimeout(function() {
        var event;
        event = document.createEvent("UIEvents");
        event.initUIEvent("docPageMapped", false, false, window, 0);
        event.pageIndex = info.index;
        return window.dispatchEvent(event);
      });
    };

    PageTextMapperCore.prototype._updateMap = function(info) {
      return info.domMapper.scan();
    };

    PageTextMapperCore.prototype._unmapPage = function(info) {
      var event;
      delete info.domMapper;
      event = document.createEvent("UIEvents");
      event.initUIEvent("docPageUnmapped", false, false, window, 0);
      event.pageIndex = info.index;
      return window.dispatchEvent(event);
    };

    PageTextMapperCore.prototype._onScroll = function() {
      var event;
      event = document.createEvent("UIEvents");
      event.initUIEvent("docPageScrolling", false, false, window, 0);
      return window.dispatchEvent(event);
    };

    PageTextMapperCore.prototype.getInfoForNode = function(node) {
      var info, k, nodeData, pageData, v;
      pageData = this.getPageForNode(node);
      nodeData = pageData.domMapper.getInfoForNode(node);
      info = {};
      for (k in nodeData) {
        v = nodeData[k];
        info[k] = v;
      }
      info.start += pageData.start;
      info.end += pageData.start;
      info.pageIndex = pageData.index;
      return info;
    };

    PageTextMapperCore.prototype.getMappingsForCharRange = function(start, end, pages) {
      var endIndex, getSection, index, sections, startIndex, _i, _j, _len, _ref, _results,
        _this = this;
      startIndex = this.getPageIndexForPos(start);
      endIndex = this.getPageIndexForPos(end);
      getSection = function(index) {
        var info, mappings, realEnd, realStart;
        info = _this.pageInfo[index];
        realStart = (Math.max(info.start, start)) - info.start;
        realEnd = (Math.min(info.end, end)) - info.start;
        mappings = info.domMapper.getMappingsForCharRange(realStart, realEnd);
        return mappings.sections[0];
      };
      sections = {};
      _ref = pages != null ? pages : (function() {
        _results = [];
        for (var _j = startIndex; startIndex <= endIndex ? _j <= endIndex : _j >= endIndex; startIndex <= endIndex ? _j++ : _j--){ _results.push(_j); }
        return _results;
      }).apply(this);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        index = _ref[_i];
        sections[index] = getSection(index);
      }
      return {
        sections: sections
      };
    };

    PageTextMapperCore.prototype.getCorpus = function() {
      return this._corpus;
    };

    PageTextMapperCore.prototype.getContextForCharRange = function(start, end) {
      var prefix, prefixLen, prefixStart, suffix;
      prefixStart = Math.max(0, start - this.CONTEXT_LEN);
      prefixLen = start - prefixStart;
      prefix = this._corpus.substr(prefixStart, prefixLen);
      suffix = this._corpus.substr(end, this.CONTEXT_LEN);
      return [prefix.trim(), suffix.trim()];
    };

    PageTextMapperCore.prototype._onHavePageContents = function() {
      var info, pos,
        _this = this;
      this._corpus = ((function() {
        var _i, _len, _ref, _results;
        _ref = this.pageInfo;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          info = _ref[_i];
          _results.push(info.content);
        }
        return _results;
      }).call(this)).join(" ");
      pos = 0;
      return this.pageInfo.forEach(function(info, i) {
        info.index = i;
        info.len = info.content.length;
        info.start = pos;
        return info.end = (pos += info.len + 1);
      });
    };

    PageTextMapperCore.prototype._onAfterScan = function() {
      var _this = this;
      return this.pageInfo.forEach(function(info, i) {
        if (_this._isPageRendered(i)) {
          return _this._mapPage(info);
        }
      });
    };

    return PageTextMapperCore;

  })();

}).call(this);
