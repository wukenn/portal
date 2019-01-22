'use strict';

var _peerjs = require('peerjs');

var _peerjs2 = _interopRequireDefault(_peerjs);

var _simplemde = require('simplemde');

var _simplemde2 = _interopRequireDefault(_simplemde);

var _controller = require('./controller');

var _controller2 = _interopRequireDefault(_controller);

var _broadcast = require('./broadcast');

var _broadcast2 = _interopRequireDefault(_broadcast);

var _editor = require('./editor');

var _editor2 = _interopRequireDefault(_editor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {} else {
  new _controller2.default(location.search.slice(1) || '0', location.origin, new _peerjs2.default({
    host: location.hostname,
    port: location.port || (location.protocol === 'https:' ? 443 : 80),
    path: '/peerjs',
    debug: 1
  }), new _broadcast2.default(), new _editor2.default(new _simplemde2.default({
    placeholder: "Share the link to invite collaborators to your document.  \n\n" + "Portal is a decentralized and private real-time collaborative text editor. Portal allows you to create and edit documents \nwith multiple people all at the same time.\n\n" + "How to use Portal?\n" + "New Document - to start editing\n" + "Save - save the document to your computer at any time\n" + "Upload - upload a document from your computer to continue editing",
    spellChecker: false,
    toolbar: false,
    autofocus: false,
    indentWithTabs: true,
    tabSize: 4,
    indentUnit: 4,
    lineWrapping: false,
    shortCuts: []
  })));
}