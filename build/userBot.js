'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _crdt = require('./crdt');

var _crdt2 = _interopRequireDefault(_crdt);

var _versionVector = require('./versionVector');

var _versionVector2 = _interopRequireDefault(_versionVector);

var _peerjs = require('peerjs');

var _peerjs2 = _interopRequireDefault(_peerjs);

var _broadcast = require('./broadcast');

var _broadcast2 = _interopRequireDefault(_broadcast);

var _identifier = require('./identifier');

var _identifier2 = _interopRequireDefault(_identifier);

var _char = require('./char');

var _char2 = _interopRequireDefault(_char);

var _v = require('uuid/v1');

var _v2 = _interopRequireDefault(_v);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UserBot = function () {
  function UserBot(peerId, targetPeerId, script, mde) {
    _classCallCheck(this, UserBot);

    this.siteId = 'bot-1';
    this.peer = new _peerjs2.default(peerId, {
      host: location.hostname,
      port: location.port || (location.protocol === 'https:' ? 443 : 80),
      path: '/peerjs',
      debug: 3
    });
    this.vector = new _versionVector2.default(this.siteId);
    this.crdt = new _crdt2.default(this);
    this.buffer = [];
    this.mde = mde;
    this.script = script;

    this.connectToUser(targetPeerId);
    this.onConnection();
  }

  _createClass(UserBot, [{
    key: 'connectToUser',
    value: function connectToUser(targetPeerId) {
      var _this = this;

      this.connection = this.peer.connect(targetPeerId);

      this.connection.on('open', function () {
        var message = JSON.stringify({
          type: "add to network",
          newPeer: _this.peer.id,
          newSite: _this.siteId
        });
        _this.connection.send(message);
      });
    }
  }, {
    key: 'runScript',
    value: function runScript(interval) {
      this.counter = 0;
      var self = this;
      var line = 0;
      var ch = 0;

      self.intervalId = setInterval(function () {
        var index = self.counter;
        var val = self.script[self.counter++];
        var pos = { line: line, ch: ch };
        ch++;

        if (!val) {
          clearInterval(self.intervalId);
          return;
        } else if (val === '\n') {
          line++;
          ch = 0;
        }

        self.crdt.handleLocalInsert(val, pos);
      }, interval);
    }
  }, {
    key: 'onConnection',
    value: function onConnection() {
      var _this2 = this;

      this.peer.on('connection', function (connection) {
        connection.on('data', function (data) {
          var dataObj = JSON.parse(data);

          _this2.handleRemoteOperation(dataObj);
        });
      });
    }
  }, {
    key: 'processDeletionBuffer',
    value: function processDeletionBuffer() {
      var i = 0;
      var deleteOperation = void 0;

      while (i < this.buffer.length) {
        deleteOperation = this.buffer[i];

        if (this.hasInsertionBeenApplied(deleteOperation)) {
          this.applyOperation(deleteOperation);
          this.buffer.splice(i, 1);
        } else {
          i++;
        }
      }
    }
  }, {
    key: 'hasInsertionBeenApplied',
    value: function hasInsertionBeenApplied(operation) {
      var charVersion = { siteId: operation.char.siteId, counter: operation.char.counter };
      return this.vector.hasBeenApplied(charVersion);
    }
  }, {
    key: 'handleRemoteOperation',
    value: function handleRemoteOperation(operation) {
      if (this.vector.hasBeenApplied(operation.version)) return;

      if (operation.type === 'insert') {
        this.applyOperation(operation);
      } else if (operation.type === 'delete') {
        this.buffer.push(operation);
      }

      this.processDeletionBuffer();
    }
  }, {
    key: 'applyOperation',
    value: function applyOperation(operation) {
      var char = operation.char;
      var identifiers = char.position.map(function (pos) {
        return new _identifier2.default(pos.digit, pos.siteId);
      });
      var newChar = new _char2.default(char.value, char.counter, char.siteId, identifiers);

      if (operation.type === 'insert') {
        this.crdt.handleRemoteInsert(newChar);
      } else if (operation.type === 'delete') {
        this.crdt.handleRemoteDelete(newChar, operation.version.siteId);
      }

      this.vector.update(operation.version);
    }
  }, {
    key: 'broadcastInsertion',
    value: function broadcastInsertion(char) {
      var _this3 = this;

      var operation = JSON.stringify({
        type: 'insert',
        char: char,
        version: this.vector.getLocalVersion()
      });

      if (this.connection.open) {
        this.connection.send(operation);
      } else {
        this.connection.on('open', function () {
          _this3.connection.send(operation);
        });
      }
    }
  }, {
    key: 'broadcastDeletion',
    value: function broadcastDeletion(char) {
      var _this4 = this;

      var operation = JSON.stringify({
        type: 'delete',
        char: char,
        version: this.vector.getLocalVersion()
      });

      if (this.connection.open) {
        this.connection.send(operation);
      } else {
        this.connection.on('open', function () {
          _this4.connection.send(operation);
        });
      }
    }
  }, {
    key: 'insertIntoEditor',
    value: function insertIntoEditor() {}
  }, {
    key: 'deleteFromEditor',
    value: function deleteFromEditor() {}
  }]);

  return UserBot;
}();

exports.default = UserBot;