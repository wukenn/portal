'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Broadcast = function () {
  function Broadcast() {
    _classCallCheck(this, Broadcast);

    this.controller = null;
    this.peer = null;
    this.outConns = [];
    this.inConns = [];
    this.outgoingBuffer = [];
    this.MAX_BUFFER_SIZE = 40;
    this.currentStream = null;
  }

  _createClass(Broadcast, [{
    key: 'send',
    value: function send(operation) {
      var operationJSON = JSON.stringify(operation);
      if (operation.type === 'insert' || operation.type === 'delete') {
        this.addToOutgoingBuffer(operationJSON);
      }
      this.outConns.forEach(function (conn) {
        return conn.send(operationJSON);
      });
    }
  }, {
    key: 'addToOutgoingBuffer',
    value: function addToOutgoingBuffer(operation) {
      if (this.outgoingBuffer.length === this.MAX_BUFFER_SIZE) {
        this.outgoingBuffer.shift();
      }

      this.outgoingBuffer.push(operation);
    }
  }, {
    key: 'processOutgoingBuffer',
    value: function processOutgoingBuffer(peerId) {
      var connection = this.outConns.find(function (conn) {
        return conn.peer === peerId;
      });
      this.outgoingBuffer.forEach(function (op) {
        connection.send(op);
      });
    }
  }, {
    key: 'bindServerEvents',
    value: function bindServerEvents(targetPeerId, peer) {
      this.peer = peer;
      this.onOpen(targetPeerId);
      this.heartbeat = this.startPeerHeartBeat(peer);
    }
  }, {
    key: 'startPeerHeartBeat',
    value: function startPeerHeartBeat(peer) {
      var timeoutId = 0;
      var heartbeat = function heartbeat() {
        timeoutId = setTimeout(heartbeat, 20000);
        if (peer.socket._wsOpen()) {
          peer.socket.send({ type: 'HEARTBEAT' });
        }
      };

      heartbeat();

      return {
        start: function start() {
          if (timeoutId === 0) {
            heartbeat();
          }
        },
        stop: function stop() {
          clearTimeout(timeoutId);
          timeoutId = 0;
        }
      };
    }
  }, {
    key: 'onOpen',
    value: function onOpen(targetPeerId) {
      var _this = this;

      this.peer.on('open', function (id) {
        _this.controller.updateShareLink(id);
        _this.onPeerConnection();
        _this.onError();
        _this.onDisconnect();
        if (targetPeerId == 0) {
          _this.controller.addToNetwork(id, _this.controller.siteId);
        } else {
          _this.requestConnection(targetPeerId, id, _this.controller.siteId);
        }
      });
    }
  }, {
    key: 'onError',
    value: function onError() {
      var _this2 = this;

      this.peer.on("error", function (err) {
        var pid = String(err).replace("Error: Could not connect to peer ", "");
        _this2.removeFromConnections(pid);
        console.log(err.type);
        if (!_this2.peer.disconnected) {
          _this2.controller.findNewTarget();
        }
        _this2.controller.enableEditor();
      });
    }
  }, {
    key: 'onDisconnect',
    value: function onDisconnect() {
      var _this3 = this;

      this.peer.on('disconnected', function () {
        _this3.controller.lostConnection();
      });
    }
  }, {
    key: 'requestConnection',
    value: function requestConnection(target, peerId, siteId) {
      var conn = this.peer.connect(target);
      this.addToOutConns(conn);
      conn.on('open', function () {
        conn.send(JSON.stringify({
          type: 'connRequest',
          peerId: peerId,
          siteId: siteId
        }));
      });
    }
  }, {
    key: 'evaluateRequest',
    value: function evaluateRequest(peerId, siteId) {
      if (this.hasReachedMax()) {
        this.forwardConnRequest(peerId, siteId);
      } else {
        this.acceptConnRequest(peerId, siteId);
      }
    }
  }, {
    key: 'hasReachedMax',
    value: function hasReachedMax() {
      var halfTheNetwork = Math.ceil(this.controller.network.length / 2);
      var tooManyInConns = this.inConns.length > Math.max(halfTheNetwork, 5);
      var tooManyOutConns = this.outConns.length > Math.max(halfTheNetwork, 5);

      return tooManyInConns || tooManyOutConns;
    }
  }, {
    key: 'forwardConnRequest',
    value: function forwardConnRequest(peerId, siteId) {
      var connected = this.outConns.filter(function (conn) {
        return conn.peer !== peerId;
      });
      var randomIdx = Math.floor(Math.random() * connected.length);
      connected[randomIdx].send(JSON.stringify({
        type: 'connRequest',
        peerId: peerId,
        siteId: siteId
      }));
    }
  }, {
    key: 'addToOutConns',
    value: function addToOutConns(connection) {
      if (!!connection && !this.isAlreadyConnectedOut(connection)) {
        this.outConns.push(connection);
      }
    }
  }, {
    key: 'addToInConns',
    value: function addToInConns(connection) {
      if (!!connection && !this.isAlreadyConnectedIn(connection)) {
        this.inConns.push(connection);
      }
    }
  }, {
    key: 'addToNetwork',
    value: function addToNetwork(peerId, siteId) {
      this.send({
        type: "add to network",
        newPeer: peerId,
        newSite: siteId
      });
    }
  }, {
    key: 'removeFromNetwork',
    value: function removeFromNetwork(peerId) {
      this.send({
        type: "remove from network",
        oldPeer: peerId
      });
      this.controller.removeFromNetwork(peerId);
    }
  }, {
    key: 'removeFromConnections',
    value: function removeFromConnections(peer) {
      this.inConns = this.inConns.filter(function (conn) {
        return conn.peer !== peer;
      });
      this.outConns = this.outConns.filter(function (conn) {
        return conn.peer !== peer;
      });
      this.removeFromNetwork(peer);
    }
  }, {
    key: 'isAlreadyConnectedOut',
    value: function isAlreadyConnectedOut(connection) {
      if (connection.peer) {
        return !!this.outConns.find(function (conn) {
          return conn.peer === connection.peer;
        });
      } else {
        return !!this.outConns.find(function (conn) {
          return conn.peer.id === connection;
        });
      }
    }
  }, {
    key: 'isAlreadyConnectedIn',
    value: function isAlreadyConnectedIn(connection) {
      if (connection.peer) {
        return !!this.inConns.find(function (conn) {
          return conn.peer === connection.peer;
        });
      } else {
        return !!this.inConns.find(function (conn) {
          return conn.peer.id === connection;
        });
      }
    }
  }, {
    key: 'onPeerConnection',
    value: function onPeerConnection() {
      var _this4 = this;

      this.peer.on('connection', function (connection) {
        _this4.onConnection(connection);
        _this4.onVideoCall(connection);
        _this4.onData(connection);
        _this4.onConnClose(connection);
      });
    }
  }, {
    key: 'acceptConnRequest',
    value: function acceptConnRequest(peerId, siteId) {
      var connBack = this.peer.connect(peerId);
      this.addToOutConns(connBack);
      this.controller.addToNetwork(peerId, siteId);

      var initialData = JSON.stringify({
        type: 'syncResponse',
        siteId: this.controller.siteId,
        peerId: this.peer.id,
        initialStruct: this.controller.crdt.struct,
        initialVersions: this.controller.vector.versions,
        network: this.controller.network
      });

      if (connBack.open) {
        connBack.send(initialData);
      } else {
        connBack.on('open', function () {
          connBack.send(initialData);
        });
      }
    }
  }, {
    key: 'videoCall',
    value: function videoCall(id, ms) {
      if (!this.currentStream) {
        var callObj = this.peer.call(id, ms);
        this.onStream(callObj);
      }
    }
  }, {
    key: 'onConnection',
    value: function onConnection(connection) {
      this.controller.updateRootUrl(connection.peer);
      this.addToInConns(connection);
    }
  }, {
    key: 'onVideoCall',
    value: function onVideoCall() {
      var _this5 = this;

      this.peer.on('call', function (callObj) {
        _this5.controller.beingCalled(callObj);
      });
    }
  }, {
    key: 'answerCall',
    value: function answerCall(callObj, ms) {
      if (!this.currentStream) {
        callObj.answer(ms);
        this.controller.answerCall(callObj.peer);
        this.onStream(callObj);
      }
    }
  }, {
    key: 'onStream',
    value: function onStream(callObj) {
      var _this6 = this;

      callObj.on('stream', function (stream) {
        if (_this6.currentStream) {
          _this6.currentStream.close();
        }
        _this6.currentStream = callObj;

        _this6.controller.streamVideo(stream, callObj);

        callObj.on('close', function () {
          return _this6.onStreamClose(callObj.peer);
        });
      });
    }
  }, {
    key: 'onStreamClose',
    value: function onStreamClose(peerId) {
      this.currentStream.localStream.getTracks().forEach(function (track) {
        return track.stop();
      });
      this.currentStream = null;

      this.controller.closeVideo(peerId);
    }
  }, {
    key: 'onData',
    value: function onData(connection) {
      var _this7 = this;

      connection.on('data', function (data) {
        var dataObj = JSON.parse(data);

        switch (dataObj.type) {
          case 'connRequest':
            _this7.evaluateRequest(dataObj.peerId, dataObj.siteId);
            break;
          case 'syncResponse':
            _this7.processOutgoingBuffer(dataObj.peerId);
            _this7.controller.handleSync(dataObj);
            break;
          case 'syncCompleted':
            _this7.processOutgoingBuffer(dataObj.peerId);
            break;
          case 'add to network':
            _this7.controller.addToNetwork(dataObj.newPeer, dataObj.newSite);
            break;
          case 'remove from network':
            _this7.controller.removeFromNetwork(dataObj.oldPeer);
            break;
          default:
            _this7.controller.handleRemoteOperation(dataObj);
        }
      });
    }
  }, {
    key: 'randomId',
    value: function randomId() {
      var _this8 = this;

      var possConns = this.inConns.filter(function (conn) {
        return _this8.peer.id !== conn.peer;
      });
      var randomIdx = Math.floor(Math.random() * possConns.length);
      if (possConns[randomIdx]) {
        return possConns[randomIdx].peer;
      } else {
        return false;
      }
    }
  }, {
    key: 'onConnClose',
    value: function onConnClose(connection) {
      var _this9 = this;

      connection.on('close', function () {
        _this9.removeFromConnections(connection.peer);
        if (connection.peer == _this9.controller.urlId) {
          var id = _this9.randomId();
          if (id) {
            _this9.controller.updatePageURL(id);
          }
        }
        if (!_this9.hasReachedMax()) {
          _this9.controller.findNewTarget();
        }
      });
    }
  }]);

  return Broadcast;
}();

exports.default = Broadcast;