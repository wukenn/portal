'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _editor = require('./editor');

var _editor2 = _interopRequireDefault(_editor);

var _crdt = require('./crdt');

var _crdt2 = _interopRequireDefault(_crdt);

var _char = require('./char');

var _char2 = _interopRequireDefault(_char);

var _identifier = require('./identifier');

var _identifier2 = _interopRequireDefault(_identifier);

var _versionVector = require('./versionVector');

var _versionVector2 = _interopRequireDefault(_versionVector);

var _version = require('./version');

var _version2 = _interopRequireDefault(_version);

var _broadcast = require('./broadcast');

var _broadcast2 = _interopRequireDefault(_broadcast);

var _v = require('uuid/v1');

var _v2 = _interopRequireDefault(_v);

var _hashAlgo = require('./hashAlgo');

var _cssColors = require('./cssColors');

var _cssColors2 = _interopRequireDefault(_cssColors);

var _featherIcons = require('feather-icons');

var _featherIcons2 = _interopRequireDefault(_featherIcons);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ANIMALS = ["Aardvark", "Albatross", "Alligator", "Alpaca", "Ant", "Anteater", "Antelope", "Ape", "Armadillo", "Donkey", "Baboon", "Badger", "Barracuda", "Bat", "Bear", "Beaver", "Bee", "Bison", "Boar", "Buffalo", "Butterfly", "Camel", "Crocodile", "Crow", "Curlew", "Deer", "Dinosaur", "Dog", "Dogfish", "Dolphin", "Dotterel", "Dove", "Dragonfly", "Duck", "Dugong", "Dunlin", "Eagle", "Echidna", "Eel", "Eland", "Elephant", "Elk", "Emu", "Falcon", "Ferret", "Finch", "Hamster", "Hare", "Hawk", "Hedgehog", "Heron", "Herring", "Hippopotamus", "Hornet", "Horse", "Human", "Hummingbird", "Hyena", "Ibex", "Ibis", "Jackal", "Jaguar", "Jay", "Jellyfish", "Kangaroo", "Kingfisher", "Koala", "Kookabura", "Kouprey", "Kudu", "Lapwing", "Mouse", "Mule", "Narwhal", "Newt", "Nightingale", "Octopus", "Okapi", "Opossum", "Oryx", "Ostrich", "Otter", "Owl", "Oyster", "Quetzal", "Rabbit", "Raccoon", "Rail", "Ram", "Rat", "Raven", "Reindeer", "Rhinoceros", "Rook", "Salamander", "Salmon", "Sandpiper", "Sardine", "Scorpion", "Squid", "Squirrel", "Starling", "Stingray", "Stinkbug", "Stork", "Swallow", "Swan", "Tapir", "Tarsier", "Termite", "Tiger", "Toad", "Trout", "Turkey", "Turtle", "Viper", "Vulture", "Worm", "Wren", "Yak", "Zebra"];

var Controller = function () {
  function Controller(targetPeerId, host, peer, broadcast, editor) {
    var doc = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : document;
    var win = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : window;

    _classCallCheck(this, Controller);

    this.siteId = (0, _v2.default)();
    this.host = host;
    this.buffer = [];
    this.calling = [];
    this.network = [];
    this.urlId = targetPeerId;
    this.makeOwnName(doc);

    if (targetPeerId == 0) this.enableEditor();

    this.broadcast = broadcast;
    this.broadcast.controller = this;
    this.broadcast.bindServerEvents(targetPeerId, peer);

    this.editor = editor;
    this.editor.controller = this;
    this.editor.bindChangeEvent();

    this.vector = new _versionVector2.default(this.siteId);
    this.crdt = new _crdt2.default(this);
    this.editor.bindButtons();
    this.bindCopyEvent(doc);

    // Commented out because video editor is not working on newest version of Chrome
    // IF POSSIBLE: fix editor bug and uncomment
    // this.attachEvents(doc, win);
  }

  _createClass(Controller, [{
    key: 'bindCopyEvent',
    value: function bindCopyEvent() {
      var _this = this;

      var doc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;

      doc.querySelector('.copy-container').onclick = function () {
        _this.copyToClipboard(doc.querySelector('#myLinkInput'));
      };
    }
  }, {
    key: 'copyToClipboard',
    value: function copyToClipboard(element) {
      var temp = document.createElement("input");
      document.querySelector("body").appendChild(temp);
      temp.value = element.textContent;
      temp.select();
      document.execCommand("copy");
      temp.remove();

      this.showCopiedStatus();
    }
  }, {
    key: 'showCopiedStatus',
    value: function showCopiedStatus() {
      document.querySelector('.copy-status').classList.add('copied');

      setTimeout(function () {
        return document.querySelector('.copy-status').classList.remove('copied');
      }, 1000);
    }
  }, {
    key: 'attachEvents',
    value: function attachEvents() {
      var doc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;
      var win = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window;

      var xPos = 0;
      var yPos = 0;
      var modal = doc.querySelector('.video-modal');
      var dragModal = function dragModal(e) {
        xPos = e.clientX - modal.offsetLeft;
        yPos = e.clientY - modal.offsetTop;
        win.addEventListener('mousemove', modalMove, true);
      };
      var setModal = function setModal() {
        win.removeEventListener('mousemove', modalMove, true);
      };
      var modalMove = function modalMove(e) {
        modal.style.position = 'absolute';
        modal.style.top = e.clientY - yPos + 'px';
        modal.style.left = e.clientX - xPos + 'px';
      };

      doc.querySelector('.video-modal').addEventListener('mousedown', dragModal, false);
      win.addEventListener('mouseup', setModal, false);

      this.bindCopyEvent(doc);
    }
  }, {
    key: 'lostConnection',
    value: function lostConnection() {
      console.log('disconnected');
    }
  }, {
    key: 'updateShareLink',
    value: function updateShareLink(id) {
      var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

      var shareLink = this.host + '?' + id;
      var aTag = doc.querySelector('#myLink');
      var pTag = doc.querySelector('#myLinkInput');

      pTag.textContent = shareLink;
      aTag.setAttribute('href', shareLink);
    }
  }, {
    key: 'updatePageURL',
    value: function updatePageURL(id) {
      var win = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window;

      this.urlId = id;

      var newURL = this.host + '?' + id;
      win.history.pushState({}, '', newURL);
    }
  }, {
    key: 'updateRootUrl',
    value: function updateRootUrl(id) {
      var win = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window;

      if (this.urlId == 0) {
        this.updatePageURL(id, win);
      }
    }
  }, {
    key: 'enableEditor',
    value: function enableEditor() {
      var doc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;

      doc.getElementById('portal').classList.remove('hide');
    }
  }, {
    key: 'populateCRDT',
    value: function populateCRDT(initialStruct) {
      var struct = initialStruct.map(function (line) {
        return line.map(function (ch) {
          return new _char2.default(ch.value, ch.counter, ch.siteId, ch.position.map(function (id) {
            return new _identifier2.default(id.digit, id.siteId);
          }));
        });
      });

      this.crdt.struct = struct;
      this.editor.replaceText(this.crdt.toText());
    }
  }, {
    key: 'populateVersionVector',
    value: function populateVersionVector(initialVersions) {
      var _this2 = this;

      var versions = initialVersions.map(function (ver) {
        var version = new _version2.default(ver.siteId);
        version.counter = ver.counter;
        ver.exceptions.forEach(function (ex) {
          return version.exceptions.push(ex);
        });
        return version;
      });

      versions.forEach(function (version) {
        return _this2.vector.versions.push(version);
      });
    }
  }, {
    key: 'addToNetwork',
    value: function addToNetwork(peerId, siteId) {
      var doc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : document;

      if (!this.network.find(function (obj) {
        return obj.siteId === siteId;
      })) {
        this.network.push({ peerId: peerId, siteId: siteId });
        if (siteId !== this.siteId) {
          this.addToListOfPeers(siteId, peerId, doc);
        }

        this.broadcast.addToNetwork(peerId, siteId);
      }
    }
  }, {
    key: 'removeFromNetwork',
    value: function removeFromNetwork(peerId) {
      var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

      var peerObj = this.network.find(function (obj) {
        return obj.peerId === peerId;
      });
      var idx = this.network.indexOf(peerObj);
      if (idx >= 0) {
        var deletedObj = this.network.splice(idx, 1)[0];
        this.removeFromListOfPeers(peerId, doc);
        this.editor.removeCursor(deletedObj.siteId);
        this.broadcast.removeFromNetwork(peerId);
      }
    }
  }, {
    key: 'makeOwnName',
    value: function makeOwnName() {
      var doc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;

      var listItem = doc.createElement('li');
      var node = doc.createElement('span');
      var textnode = doc.createTextNode("(You)");
      var color = (0, _hashAlgo.generateItemFromHash)(this.siteId, _cssColors2.default);
      var name = (0, _hashAlgo.generateItemFromHash)(this.siteId, ANIMALS);

      node.textContent = name;
      node.style.backgroundColor = color;
      node.classList.add('peer');

      listItem.appendChild(node);
      listItem.appendChild(textnode);
      doc.querySelector('#peerId').appendChild(listItem);
    }
  }, {
    key: 'addToListOfPeers',
    value: function addToListOfPeers(siteId, peerId) {
      var doc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : document;

      var listItem = doc.createElement('li');
      var node = doc.createElement('span');

      // // purely for mock testing purposes
      //   let parser;
      //   if (typeof DOMParser === 'object') {
      //     parser = new DOMParser();
      //   } else {
      //     parser = {
      //       parseFromString: function() {
      //         return { firstChild: doc.createElement('div') }
      //       }
      //     }
      //   }

      var parser = new DOMParser();

      var color = (0, _hashAlgo.generateItemFromHash)(siteId, _cssColors2.default);
      var name = (0, _hashAlgo.generateItemFromHash)(siteId, ANIMALS);

      // COMMENTED OUT: Video editor does not work
      // const phone = parser.parseFromString(Feather.icons.phone.toSvg({ class: 'phone' }), "image/svg+xml");
      // const phoneIn = parser.parseFromString(Feather.icons['phone-incoming'].toSvg({ class: 'phone-in' }), "image/svg+xml");
      // const phoneOut = parser.parseFromString(Feather.icons['phone-outgoing'].toSvg({ class: 'phone-out' }), "image/svg+xml");
      // const phoneCall = parser.parseFromString(Feather.icons['phone-call'].toSvg({ class: 'phone-call' }), "image/svg+xml");

      node.textContent = name;
      node.style.backgroundColor = color;
      node.classList.add('peer');

      // this.attachVideoEvent(peerId, listItem);

      listItem.id = peerId;
      listItem.appendChild(node);
      // listItem.appendChild(phone.firstChild);
      // listItem.appendChild(phoneIn.firstChild);
      // listItem.appendChild(phoneOut.firstChild);
      // listItem.appendChild(phoneCall.firstChild);
      doc.querySelector('#peerId').appendChild(listItem);
    }
  }, {
    key: 'getPeerElemById',
    value: function getPeerElemById(peerId) {
      var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

      return doc.getElementById(peerId);
    }
  }, {
    key: 'beingCalled',
    value: function beingCalled(callObj) {
      var _this3 = this;

      var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

      var peerFlag = this.getPeerElemById(callObj.peer);

      this.addBeingCalledClass(callObj.peer);

      navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(function (ms) {
        peerFlag.onclick = function () {
          _this3.broadcast.answerCall(callObj, ms);
        };
      });
    }
  }, {
    key: 'getPeerFlagById',
    value: function getPeerFlagById(peerId) {
      var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

      var peerLi = doc.getElementById(peerId);
      return peerLi.children[0];
    }
  }, {
    key: 'addBeingCalledClass',
    value: function addBeingCalledClass(peerId) {
      var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

      var peerLi = doc.getElementById(peerId);

      peerLi.classList.add('beingCalled');
    }
  }, {
    key: 'addCallingClass',
    value: function addCallingClass(peerId) {
      var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

      var peerLi = doc.getElementById(peerId);

      peerLi.classList.add('calling');
    }
  }, {
    key: 'streamVideo',
    value: function streamVideo(stream, callObj) {
      var doc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : document;

      var peerFlag = this.getPeerFlagById(callObj.peer, doc);
      var color = peerFlag.style.backgroundColor;
      var modal = doc.querySelector('.video-modal');
      var bar = doc.querySelector('.video-bar');
      var vid = doc.querySelector('.video-modal video');

      this.answerCall(callObj.peer, doc);

      modal.classList.remove('hide');
      bar.style.backgroundColor = color;
      vid.srcObject = stream;
      vid.play();

      this.bindVideoEvents(callObj, doc);
    }
  }, {
    key: 'bindVideoEvents',
    value: function bindVideoEvents(callObj) {
      var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

      var exit = doc.querySelector('.exit');
      var minimize = doc.querySelector('.minimize');
      var modal = doc.querySelector('.video-modal');
      var bar = doc.querySelector('.video-bar');
      var vid = doc.querySelector('.video-modal video');

      minimize.onclick = function () {
        bar.classList.toggle('mini');
        vid.classList.toggle('hide');
      };
      exit.onclick = function () {
        modal.classList.add('hide');
        callObj.close();
      };
    }
  }, {
    key: 'answerCall',
    value: function answerCall(peerId) {
      var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

      var peerLi = doc.getElementById(peerId);

      if (peerLi) {
        peerLi.classList.remove('calling');
        peerLi.classList.remove('beingCalled');
        peerLi.classList.add('answered');
      }
    }
  }, {
    key: 'closeVideo',
    value: function closeVideo(peerId) {
      var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

      var modal = doc.querySelector('.video-modal');
      var peerLi = this.getPeerElemById(peerId, doc);

      modal.classList.add('hide');
      peerLi.classList.remove('answered', 'calling', 'beingCalled');
      this.calling = this.calling.filter(function (id) {
        return id !== peerId;
      });

      this.attachVideoEvent(peerId, peerLi);
    }
  }, {
    key: 'attachVideoEvent',
    value: function attachVideoEvent(peerId, node) {
      var _this4 = this;

      node.onclick = function () {
        if (!_this4.calling.includes(peerId)) {
          navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(function (ms) {
            _this4.addCallingClass(peerId);
            _this4.calling.push(peerId);
            _this4.broadcast.videoCall(peerId, ms);
          });
        }
      };
    }
  }, {
    key: 'removeFromListOfPeers',
    value: function removeFromListOfPeers(peerId) {
      var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

      doc.getElementById(peerId).remove();
    }
  }, {
    key: 'findNewTarget',
    value: function findNewTarget() {
      var _this5 = this;

      var connected = this.broadcast.outConns.map(function (conn) {
        return conn.peer;
      });
      var unconnected = this.network.filter(function (obj) {
        return connected.indexOf(obj.peerId) === -1;
      });

      var possibleTargets = unconnected.filter(function (obj) {
        return obj.peerId !== _this5.broadcast.peer.id;
      });

      if (possibleTargets.length === 0) {
        this.broadcast.peer.on('connection', function (conn) {
          return _this5.updatePageURL(conn.peer);
        });
      } else {
        var randomIdx = Math.floor(Math.random() * possibleTargets.length);
        var newTarget = possibleTargets[randomIdx].peerId;
        this.broadcast.requestConnection(newTarget, this.broadcast.peer.id, this.siteId);
      }
    }
  }, {
    key: 'handleSync',
    value: function handleSync(syncObj) {
      var _this6 = this;

      var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;
      var win = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : window;

      if (syncObj.peerId != this.urlId) {
        this.updatePageURL(syncObj.peerId, win);
      }

      syncObj.network.forEach(function (obj) {
        return _this6.addToNetwork(obj.peerId, obj.siteId, doc);
      });

      if (this.crdt.totalChars() === 0) {
        this.populateCRDT(syncObj.initialStruct);
        this.populateVersionVector(syncObj.initialVersions);
      }
      this.enableEditor(doc);

      this.syncCompleted(syncObj.peerId);
    }
  }, {
    key: 'syncCompleted',
    value: function syncCompleted(peerId) {
      var completedMessage = JSON.stringify({
        type: 'syncCompleted',
        peerId: this.broadcast.peer.id
      });

      var connection = this.broadcast.outConns.find(function (conn) {
        return conn.peer === peerId;
      });

      if (connection) {
        connection.send(completedMessage);
      } else {
        connection = this.broadcast.peer.connect(peerId);
        this.broadcast.addToOutConns(connection);
        connection.on('open', function () {
          connection.send(completedMessage);
        });
      }
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
      this.broadcast.send(operation);
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
    key: 'localDelete',
    value: function localDelete(startPos, endPos) {
      this.crdt.handleLocalDelete(startPos, endPos);
    }
  }, {
    key: 'localInsert',
    value: function localInsert(chars, startPos) {
      for (var i = 0; i < chars.length; i++) {
        if (chars[i - 1] === '\n') {
          startPos.line++;
          startPos.ch = 0;
        }
        this.crdt.handleLocalInsert(chars[i], startPos);
        startPos.ch++;
      }
    }
  }, {
    key: 'broadcastInsertion',
    value: function broadcastInsertion(char) {
      var operation = {
        type: 'insert',
        char: char,
        version: this.vector.getLocalVersion()
      };

      this.broadcast.send(operation);
    }
  }, {
    key: 'broadcastDeletion',
    value: function broadcastDeletion(char, version) {
      var operation = {
        type: 'delete',
        char: char,
        version: version
      };

      this.broadcast.send(operation);
    }
  }, {
    key: 'insertIntoEditor',
    value: function insertIntoEditor(value, pos, siteId) {
      var positions = {
        from: {
          line: pos.line,
          ch: pos.ch
        },
        to: {
          line: pos.line,
          ch: pos.ch
        }
      };

      this.editor.insertText(value, positions, siteId);
    }
  }, {
    key: 'deleteFromEditor',
    value: function deleteFromEditor(value, pos, siteId) {
      var positions = void 0;

      if (value === "\n") {
        positions = {
          from: {
            line: pos.line,
            ch: pos.ch
          },
          to: {
            line: pos.line + 1,
            ch: 0
          }
        };
      } else {
        positions = {
          from: {
            line: pos.line,
            ch: pos.ch
          },
          to: {
            line: pos.line,
            ch: pos.ch + 1
          }
        };
      }

      this.editor.deleteText(value, positions, siteId);
    }
  }]);

  return Controller;
}();

exports.default = Controller;