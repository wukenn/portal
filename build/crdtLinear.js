'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _identifier = require('./identifier');

var _identifier2 = _interopRequireDefault(_identifier);

var _char = require('./char');

var _char2 = _interopRequireDefault(_char);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CRDT = function () {
  function CRDT(controller) {
    var base = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 32;
    var boundary = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 10;
    var strategy = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'random';
    var mult = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 2;

    _classCallCheck(this, CRDT);

    this.controller = controller;
    this.vector = controller.vector;
    this.struct = [];
    this.siteId = controller.siteId;
    this.text = "";
    this.base = base;
    this.boundary = boundary;
    this.strategy = strategy;
    this.strategyCache = [];
    this.mult = mult;
  }

  _createClass(CRDT, [{
    key: 'handleLocalInsert',
    value: function handleLocalInsert(val, index) {
      this.vector.increment();

      var char = this.generateChar(val, index);
      this.insertChar(index, char);
      this.insertText(char.value, index);

      this.controller.broadcastInsertion(char);
      console.log(value, pos);
    }
  }, {
    key: 'handleRemoteInsert',
    value: function handleRemoteInsert(char) {
      var index = this.findInsertIndex(char);

      this.insertChar(index, char);
      this.insertText(char.value, index);

      this.controller.insertIntoEditor(char.value, index, char.siteId);
    }
  }, {
    key: 'insertChar',
    value: function insertChar(index, char) {
      this.struct.splice(index, 0, char);
    }
  }, {
    key: 'handleLocalDelete',
    value: function handleLocalDelete(idx) {
      this.vector.increment();

      var char = this.struct.splice(idx, 1)[0];
      this.deleteText(idx);

      this.controller.broadcastDeletion(char);
    }
  }, {
    key: 'handleRemoteDelete',
    value: function handleRemoteDelete(char, siteId) {
      var index = this.findIndexByPosition(char);
      this.struct.splice(index, 1);

      this.controller.deleteFromEditor(char.value, index, siteId);
      this.deleteText(index);
    }
  }, {
    key: 'findInsertIndex',
    value: function findInsertIndex(char) {
      var left = 0;
      var right = this.struct.length - 1;
      var mid = void 0,
          compareNum = void 0;

      if (this.struct.length === 0 || char.compareTo(this.struct[left]) < 0) {
        return left;
      } else if (char.compareTo(this.struct[right]) > 0) {
        return this.struct.length;
      }

      while (left + 1 < right) {
        mid = Math.floor(left + (right - left) / 2);
        compareNum = char.compareTo(this.struct[mid]);

        if (compareNum === 0) {
          return mid;
        } else if (compareNum > 0) {
          left = mid;
        } else {
          right = mid;
        }
      }

      return char.compareTo(this.struct[left]) === 0 ? left : right;
    }
  }, {
    key: 'findIndexByPosition',
    value: function findIndexByPosition(char) {
      var left = 0;
      var right = this.struct.length - 1;
      var mid = void 0,
          compareNum = void 0;

      if (this.struct.length === 0) {
        throw new Error("Character does not exist in CRDT.");
      }

      while (left + 1 < right) {
        mid = Math.floor(left + (right - left) / 2);
        compareNum = char.compareTo(this.struct[mid]);

        if (compareNum === 0) {
          return mid;
        } else if (compareNum > 0) {
          left = mid;
        } else {
          right = mid;
        }
      }

      if (char.compareTo(this.struct[left]) === 0) {
        return left;
      } else if (char.compareTo(this.struct[right]) === 0) {
        return right;
      } else {
        throw new Error("Character does not exist in CRDT.");
      }
    }
  }, {
    key: 'generateChar',
    value: function generateChar(val, index) {
      var posBefore = this.struct[index - 1] && this.struct[index - 1].position || [];
      var posAfter = this.struct[index] && this.struct[index].position || [];
      var newPos = this.generatePosBetween(posBefore, posAfter);
      var localCounter = this.vector.localVersion.counter;

      return new _char2.default(val, localCounter, this.siteId, newPos);
    }
  }, {
    key: 'retrieveStrategy',
    value: function retrieveStrategy(level) {
      if (this.strategyCache[level]) return this.strategyCache[level];
      var strategy = void 0;

      switch (this.strategy) {
        case 'plus':
          strategy = '+';
          break;
        case 'minus':
          strategy = '-';
          break;
        case 'random':
          strategy = Math.round(Math.random()) === 0 ? '+' : '-';
          break;
        case 'every2nd':
          strategy = (level + 1) % 2 === 0 ? '-' : '+';
          break;
        case 'every3rd':
          strategy = (level + 1) % 3 === 0 ? '-' : '+';
          break;
        default:
          strategy = (level + 1) % 2 === 0 ? '-' : '+';
          break;
      }

      this.strategyCache[level] = strategy;
      return strategy;
    }
  }, {
    key: 'generatePosBetween',
    value: function generatePosBetween(pos1, pos2) {
      var newPos = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
      var level = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

      var base = Math.pow(this.mult, level) * this.base;
      var boundaryStrategy = this.retrieveStrategy(level);

      var id1 = pos1[0] || new _identifier2.default(0, this.siteId);
      var id2 = pos2[0] || new _identifier2.default(base, this.siteId);

      if (id2.digit - id1.digit > 1) {

        var newDigit = this.generateIdBetween(id1.digit, id2.digit, boundaryStrategy);
        newPos.push(new _identifier2.default(newDigit, this.siteId));
        return newPos;
      } else if (id2.digit - id1.digit === 1) {

        newPos.push(id1);
        return this.generatePosBetween(pos1.slice(1), [], newPos, level + 1);
      } else if (id1.digit === id2.digit) {
        if (id1.siteId < id2.siteId) {
          newPos.push(id1);
          return this.generatePosBetween(pos1.slice(1), [], newPos, level + 1);
        } else if (id1.siteId === id2.siteId) {
          newPos.push(id1);
          return this.generatePosBetween(pos1.slice(1), pos2.slice(1), newPos, level + 1);
        } else {
          throw new Error("Fix Position Sorting");
        }
      }
    }
    /*
    Math.random gives you a range that is inclusive of the min and exclusive of the max
    so have to add and subtract ones to get them all into that format
    
    if max - min <= boundary, the boundary doesn't matter
        newDigit > min, newDigit < max
        ie (min+1...max)
        so, min = min + 1
    if max - min > boundary and the boundary is negative
        min = max - boundary
        newDigit >= min, newDigit < max
        ie (min...max)
    if max - min > boundary and the boundary is positive
        max = min + boundary
        newDigit > min, newDigit <= max
        ie (min+1...max+1)
        so, min = min + 1 and max = max + 1
    
    now all are (min...max)
    */

  }, {
    key: 'generateIdBetween',
    value: function generateIdBetween(min, max, boundaryStrategy) {
      if (max - min < this.boundary) {
        min = min + 1;
      } else {
        if (boundaryStrategy === '-') {
          min = max - this.boundary;
        } else {
          min = min + 1;
          max = min + this.boundary;
        }
      }
      return Math.floor(Math.random() * (max - min)) + min;
    }
  }, {
    key: 'insertText',
    value: function insertText(val, index) {
      this.text = this.text.slice(0, index) + val + this.text.slice(index);
    }
  }, {
    key: 'deleteText',
    value: function deleteText(index) {
      this.text = this.text.slice(0, index) + this.text.slice(index + 1);
    }
  }, {
    key: 'populateText',
    value: function populateText() {
      this.text = this.struct.map(function (char) {
        return char.value;
      }).join('');
    }
  }]);

  return CRDT;
}();

exports.default = CRDT;