(function() {
  window.DTM_ExactMatcher = (function() {
    function DTM_ExactMatcher() {
      this.distinct = true;
      this.caseSensitive = false;
    }

    DTM_ExactMatcher.prototype.setDistinct = function(value) {
      return this.distinct = value;
    };

    DTM_ExactMatcher.prototype.setCaseSensitive = function(value) {
      return this.caseSensitive = value;
    };

    DTM_ExactMatcher.prototype.search = function(text, pattern) {
      var i, index, pLen, results,
        _this = this;
      pLen = pattern.length;
      results = [];
      index = 0;
      if (!this.caseSensitive) {
        text = text.toLowerCase();
        pattern = pattern.toLowerCase();
      }
      while ((i = text.indexOf(pattern)) > -1) {
        (function() {
          results.push({
            start: index + i,
            end: index + i + pLen
          });
          if (_this.distinct) {
            text = text.substr(i + pLen);
            return index += i + pLen;
          } else {
            text = text.substr(i + 1);
            return index += i + 1;
          }
        })();
      }
      return results;
    };

    return DTM_ExactMatcher;

  })();

  window.DTM_RegexMatcher = (function() {
    function DTM_RegexMatcher() {
      this.caseSensitive = false;
    }

    DTM_RegexMatcher.prototype.setCaseSensitive = function(value) {
      return this.caseSensitive = value;
    };

    DTM_RegexMatcher.prototype.search = function(text, pattern) {
      var m, re, _results;
      re = new RegExp(pattern, this.caseSensitive ? "g" : "gi");
      _results = [];
      while (m = re.exec(text)) {
        _results.push({
          start: m.index,
          end: m.index + m[0].length
        });
      }
      return _results;
    };

    return DTM_RegexMatcher;

  })();

  window.DTM_DMPMatcher = (function() {
    function DTM_DMPMatcher() {
      this.dmp = new diff_match_patch;
      this.dmp.Diff_Timeout = 0;
      this.caseSensitive = false;
    }

    DTM_DMPMatcher.prototype._reverse = function(text) {
      return text.split("").reverse().join("");
    };

    DTM_DMPMatcher.prototype.getMaxPatternLength = function() {
      return this.dmp.Match_MaxBits;
    };

    DTM_DMPMatcher.prototype.setMatchDistance = function(distance) {
      return this.dmp.Match_Distance = distance;
    };

    DTM_DMPMatcher.prototype.getMatchDistance = function() {
      return this.dmp.Match_Distance;
    };

    DTM_DMPMatcher.prototype.setMatchThreshold = function(threshold) {
      return this.dmp.Match_Threshold = threshold;
    };

    DTM_DMPMatcher.prototype.getMatchThreshold = function() {
      return this.dmp.Match_Threshold;
    };

    DTM_DMPMatcher.prototype.getCaseSensitive = function() {
      return caseSensitive;
    };

    DTM_DMPMatcher.prototype.setCaseSensitive = function(value) {
      return this.caseSensitive = value;
    };

    DTM_DMPMatcher.prototype.search = function(text, pattern, expectedStartLoc, options) {
      var endIndex, endLen, endLoc, endPos, endSlice, found, matchLen, maxLen, pLen, result, startIndex, startLen, startPos, startSlice;
      if (expectedStartLoc == null) {
        expectedStartLoc = 0;
      }
      if (options == null) {
        options = {};
      }
      if (expectedStartLoc < 0) {
        throw new Error("Can't search at negative indices!");
      }
      if (!this.caseSensitive) {
        text = text.toLowerCase();
        pattern = pattern.toLowerCase();
      }
      pLen = pattern.length;
      maxLen = this.getMaxPatternLength();
      if (pLen <= maxLen) {
        result = this.searchForSlice(text, pattern, expectedStartLoc);
      } else {
        startSlice = pattern.substr(0, maxLen);
        startPos = this.searchForSlice(text, startSlice, expectedStartLoc);
        if (startPos != null) {
          startLen = startPos.end - startPos.start;
          endSlice = pattern.substr(pLen - maxLen, maxLen);
          endLoc = startPos.start + pLen - maxLen;
          endPos = this.searchForSlice(text, endSlice, endLoc);
          if (endPos != null) {
            endLen = endPos.end - endPos.start;
            matchLen = endPos.end - startPos.start;
            startIndex = startPos.start;
            endIndex = endPos.end;
            if ((pLen * 0.5 <= matchLen && matchLen <= pLen * 1.5)) {
              result = {
                start: startIndex,
                end: endPos.end
              };
            }
          }
        }
      }
      if (result == null) {
        return [];
      }
      if (options.withLevenhstein || options.withDiff) {
        found = text.substr(result.start, result.end - result.start);
        result.diff = this.dmp.diff_main(pattern, found);
        if (options.withLevenshstein) {
          result.lev = this.dmp.diff_levenshtein(result.diff);
        }
        if (options.withDiff) {
          this.dmp.diff_cleanupSemantic(result.diff);
          result.diffHTML = this.dmp.diff_prettyHtml(result.diff);
        }
      }
      return [result];
    };

    DTM_DMPMatcher.prototype.compare = function(text1, text2) {
      var result;
      if (!((text1 != null) && (text2 != null))) {
        throw new Error("Can not compare non-existing strings!");
      }
      result = {};
      result.diff = this.dmp.diff_main(text1, text2);
      result.lev = this.dmp.diff_levenshtein(result.diff);
      result.errorLevel = result.lev / text1.length;
      this.dmp.diff_cleanupSemantic(result.diff);
      result.diffHTML = this.dmp.diff_prettyHtml(result.diff);
      return result;
    };

    DTM_DMPMatcher.prototype.searchForSlice = function(text, slice, expectedStartLoc) {
      var dneIndex, endIndex, expectedDneLoc, expectedEndLoc, nrettap, r1, r2, result, startIndex, txet;
      r1 = this.dmp.match_main(text, slice, expectedStartLoc);
      startIndex = r1.index;
      if (startIndex === -1) {
        return null;
      }
      txet = this._reverse(text);
      nrettap = this._reverse(slice);
      expectedEndLoc = startIndex + slice.length;
      expectedDneLoc = text.length - expectedEndLoc;
      r2 = this.dmp.match_main(txet, nrettap, expectedDneLoc);
      dneIndex = r2.index;
      endIndex = text.length - dneIndex;
      return result = {
        start: startIndex,
        end: endIndex
      };
    };

    return DTM_DMPMatcher;

  })();

}).call(this);
