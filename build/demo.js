'use strict';

var _peerjs = require('peerjs');

var _peerjs2 = _interopRequireDefault(_peerjs);

var _simplemde = require('simplemde');

var _simplemde2 = _interopRequireDefault(_simplemde);

var _v = require('uuid/v1');

var _v2 = _interopRequireDefault(_v);

var _controller = require('./controller');

var _controller2 = _interopRequireDefault(_controller);

var _broadcast = require('./broadcast');

var _broadcast2 = _interopRequireDefault(_broadcast);

var _editor = require('./editor');

var _editor2 = _interopRequireDefault(_editor);

var _userBot = require('./userBot');

var _userBot2 = _interopRequireDefault(_userBot);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var id = Math.floor(Math.random() * 100000);

var demo = new _controller2.default(location.search.slice(1) || '0', location.origin, new _peerjs2.default('conclave-demo-' + id, {
  host: location.hostname,
  port: location.port || (location.protocol === 'https:' ? 443 : 80),
  path: '/peerjs',
  debug: 3
}), new _broadcast2.default(), new _editor2.default(new _simplemde2.default({
  placeholder: "Share the link to invite collaborators to your document.",
  spellChecker: false,
  toolbar: false,
  autofocus: true,
  indentWithTabs: true,
  tabSize: 4,
  indentUnit: 4,
  lineWrapping: false,
  shortCuts: []
})));

var script1 = 'Conclave is a private and secure real-time collaborative text editor. Conclave\nallows you to create and edit documents with multiple people all at the same time.\n\n### How Do I Use It?\n\nTo start editing, click the *New Document* link above, and then click the blue\nboxes icon to copy the *Sharing Link* to your clipboard. Share the link however\nyou\'d like with your collaborators.\n\n### Doesn\'t Google Already Do This?\n\nKind of, but Conclave is decentralized and therefore private. Google stores your\ndocuments on their servers where they and the government could access them. With\nConclave, your document is stored only on your computer and any changes you make\nare sent only to the people collaborating with you. Also Google is pretty big.\nWe\'re just three engineers who created Conclave in a month. Click *Our Team* above\nto learn more about us.\n\n### What Else Can Conclave Do?\n\n- Upload a document from your computer to continue editing\n- Save the document to your computer at any time\n\nHappy Typing!';

var bot1 = new _userBot2.default('conclave-bot' + id, 'conclave-demo-' + id, script1, demo.editor.mde);
bot1.runScript(75);