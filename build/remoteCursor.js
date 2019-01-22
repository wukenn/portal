'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _cssColors = require('./cssColors');

var _cssColors2 = _interopRequireDefault(_cssColors);

var _hashAlgo = require('./hashAlgo');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ANIMALS = ["Aardvark", "Albatross", "Alligator", "Alpaca", "Ant", "Anteater", "Antelope", "Ape", "Armadillo", "Donkey", "Baboon", "Badger", "Barracuda", "Bat", "Bear", "Beaver", "Bee", "Bison", "Boar", "Buffalo", "Butterfly", "Camel", "Crocodile", "Crow", "Curlew", "Deer", "Dinosaur", "Dog", "Dogfish", "Dolphin", "Dotterel", "Dove", "Dragonfly", "Duck", "Dugong", "Dunlin", "Eagle", "Echidna", "Eel", "Eland", "Elephant", "Elk", "Emu", "Falcon", "Ferret", "Finch", "Hamster", "Hare", "Hawk", "Hedgehog", "Heron", "Herring", "Hippopotamus", "Hornet", "Horse", "Human", "Hummingbird", "Hyena", "Ibex", "Ibis", "Jackal", "Jaguar", "Jay", "Jellyfish", "Kangaroo", "Kingfisher", "Koala", "Kookabura", "Kouprey", "Kudu", "Lapwing", "Mouse", "Mule", "Narwhal", "Newt", "Nightingale", "Octopus", "Okapi", "Opossum", "Oryx", "Ostrich", "Otter", "Owl", "Oyster", "Quetzal", "Rabbit", "Raccoon", "Rail", "Ram", "Rat", "Raven", "Reindeer", "Rhinoceros", "Rook", "Salamander", "Salmon", "Sandpiper", "Sardine", "Scorpion", "Squid", "Squirrel", "Starling", "Stingray", "Stinkbug", "Stork", "Swallow", "Swan", "Tapir", "Tarsier", "Termite", "Tiger", "Toad", "Trout", "Turkey", "Turtle", "Viper", "Vulture", "Worm", "Wren", "Yak", "Zebra"];

var RemoteCursor = function () {
  function RemoteCursor(mde, siteId, position) {
    _classCallCheck(this, RemoteCursor);

    this.mde = mde;

    var color = (0, _hashAlgo.generateItemFromHash)(siteId, _cssColors2.default);
    var name = (0, _hashAlgo.generateItemFromHash)(siteId, ANIMALS);

    this.createCursor(color);
    this.createFlag(color, name);

    this.cursor.appendChild(this.flag);
    this.set(position);
  }

  _createClass(RemoteCursor, [{
    key: 'createCursor',
    value: function createCursor(color) {
      var textHeight = this.mde.codemirror.defaultTextHeight();

      this.cursor = document.createElement('div');
      this.cursor.classList.add('remote-cursor');
      this.cursor.style.backgroundColor = color;
      this.cursor.style.height = textHeight + 'px';
    }
  }, {
    key: 'createFlag',
    value: function createFlag(color, name) {
      var cursorName = document.createTextNode(name);

      this.flag = document.createElement('span');
      this.flag.classList.add('flag');
      this.flag.style.backgroundColor = color;
      this.flag.appendChild(cursorName);
    }
  }, {
    key: 'set',
    value: function set(position) {
      this.detach();

      var coords = this.mde.codemirror.cursorCoords(position, 'local');
      this.cursor.style.left = (coords.left >= 0 ? coords.left : 0) + 'px';
      this.mde.codemirror.getDoc().setBookmark(position, { widget: this.cursor });
      this.lastPosition = position;
    }
  }, {
    key: 'detach',
    value: function detach() {
      if (this.cursor.parentElement) {
        this.cursor.parentElement.remove();
      }
    }
  }]);

  return RemoteCursor;
}();

exports.default = RemoteCursor;