"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Char = function () {
  function Char(value, counter, siteId, identifiers) {
    _classCallCheck(this, Char);

    this.position = identifiers;
    this.counter = counter;
    this.siteId = siteId;
    this.value = value;
  }

  _createClass(Char, [{
    key: "compareTo",
    value: function compareTo(otherChar) {
      var comp = void 0,
          id1 = void 0,
          id2 = void 0;
      var pos1 = this.position;
      var pos2 = otherChar.position;

      for (var i = 0; i < Math.min(pos1.length, pos2.length); i++) {
        id1 = pos1[i];
        id2 = pos2[i];
        comp = id1.compareTo(id2);

        if (comp !== 0) {
          return comp;
        }
      }

      if (pos1.length < pos2.length) {
        return -1;
      } else if (pos1.length > pos2.length) {
        return 1;
      } else {
        return 0;
      }
    }
  }]);

  return Char;
}();

exports.default = Char;