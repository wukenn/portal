'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _crdt = require('./crdt');

var _crdt2 = _interopRequireDefault(_crdt);

var _remoteCursor = require('./remoteCursor');

var _remoteCursor2 = _interopRequireDefault(_remoteCursor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Editor = function () {
  function Editor(mde) {
    _classCallCheck(this, Editor);

    this.controller = null;
    this.mde = mde;
    this.remoteCursors = {};
    this.customTabBehavior();
  }

  _createClass(Editor, [{
    key: 'customTabBehavior',
    value: function customTabBehavior() {
      this.mde.codemirror.setOption("extraKeys", {
        Tab: function Tab(codemirror) {
          codemirror.replaceSelection("\t");
        }
      });
    }
  }, {
    key: 'bindButtons',
    value: function bindButtons() {
      if (this.controller.urlId == 0) {
        this.bindUploadButton();
      } else {
        this.hideUploadButton();
      }

      this.bindDownloadButton();
    }
  }, {
    key: 'bindDownloadButton',
    value: function bindDownloadButton() {
      var _this = this;

      var dlButton = document.querySelector('#download');

      dlButton.onclick = function () {
        var textToSave = _this.mde.value();
        var textAsBlob = new Blob([textToSave], { type: "text/plain" });
        var textAsURL = window.URL.createObjectURL(textAsBlob);
        var fileName = "Portal-" + Date.now();
        var downloadLink = document.createElement("a");

        downloadLink.download = fileName;
        downloadLink.innerHTML = "Download File";
        downloadLink.href = textAsURL;
        downloadLink.onclick = _this.afterDownload;
        downloadLink.style.display = "none";

        document.body.appendChild(downloadLink);
        downloadLink.click();
      };
    }
  }, {
    key: 'afterDownload',
    value: function afterDownload(e) {
      var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

      doc.body.removeChild(e.target);
    }
  }, {
    key: 'hideUploadButton',
    value: function hideUploadButton() {
      var doc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;

      var ulButton = doc.querySelector('#upload');
      var fileInput = doc.querySelector('#file');
      ulButton.style.display = 'none';
      fileInput.style.display = 'none';
    }
  }, {
    key: 'bindUploadButton',
    value: function bindUploadButton() {
      var _this2 = this;

      var doc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;

      var fileSelect = doc.querySelector('#file');
      fileSelect.onchange = function () {
        var file = doc.querySelector("#file").files[0];
        var fileReader = new FileReader();
        fileReader.onload = function (e) {
          var fileText = e.target.result;
          _this2.controller.localInsert(fileText, { line: 0, ch: 0 });
          _this2.replaceText(_this2.controller.crdt.toText());
          _this2.hideUploadButton();
        };
        fileReader.readAsText(file, "UTF-8");
      };
    }
  }, {
    key: 'bindChangeEvent',
    value: function bindChangeEvent() {
      var _this3 = this;

      this.mde.codemirror.on("change", function (_, changeObj) {
        if (changeObj.origin === "setValue") return;
        if (changeObj.origin === "insertText") return;
        if (changeObj.origin === "deleteText") return;

        switch (changeObj.origin) {
          case 'redo':
          case 'undo':
            _this3.processUndoRedo(changeObj);
            break;
          case '*compose':
          case '+input':
          case 'paste':
            _this3.processInsert(changeObj);
            break;
          case '+delete':
          case 'cut':
            _this3.processDelete(changeObj);
            break;
          default:
            throw new Error("Unknown operation attempted in editor.");
        }
      });
    }
  }, {
    key: 'processInsert',
    value: function processInsert(changeObj) {
      this.processDelete(changeObj);
      var chars = this.extractChars(changeObj.text);
      var startPos = changeObj.from;

      this.updateRemoteCursorsInsert(chars, changeObj.to);
      this.controller.localInsert(chars, startPos);
    }
  }, {
    key: 'isEmpty',
    value: function isEmpty(textArr) {
      return textArr.length === 1 && textArr[0].length === 0;
    }
  }, {
    key: 'processDelete',
    value: function processDelete(changeObj) {
      if (this.isEmpty(changeObj.removed)) return;
      var startPos = changeObj.from;
      var endPos = changeObj.to;
      var chars = this.extractChars(changeObj.removed);

      this.updateRemoteCursorsDelete(chars, changeObj.to, changeObj.from);
      this.controller.localDelete(startPos, endPos);
    }
  }, {
    key: 'processUndoRedo',
    value: function processUndoRedo(changeObj) {
      if (changeObj.removed[0].length > 0) {
        this.processDelete(changeObj);
      } else {
        this.processInsert(changeObj);
      }
    }
  }, {
    key: 'extractChars',
    value: function extractChars(text) {
      if (text[0] === '' && text[1] === '' && text.length === 2) {
        return '\n';
      } else {
        return text.join("\n");
      }
    }
  }, {
    key: 'replaceText',
    value: function replaceText(text) {
      var cursor = this.mde.codemirror.getCursor();
      this.mde.value(text);
      this.mde.codemirror.setCursor(cursor);
    }
  }, {
    key: 'insertText',
    value: function insertText(value, positions, siteId) {
      var localCursor = this.mde.codemirror.getCursor();
      var delta = this.generateDeltaFromChars(value);

      this.mde.codemirror.replaceRange(value, positions.from, positions.to, 'insertText');
      this.updateRemoteCursorsInsert(positions.to, siteId);
      this.updateRemoteCursor(positions.to, siteId, 'insert', value);

      if (localCursor.line > positions.to.line) {
        localCursor.line += delta.line;
      } else if (localCursor.line === positions.to.line && localCursor.ch > positions.to.ch) {
        if (delta.line > 0) {
          localCursor.line += delta.line;
          localCursor.ch -= positions.to.ch;
        }

        localCursor.ch += delta.ch;
      }

      this.mde.codemirror.setCursor(localCursor);
    }
  }, {
    key: 'removeCursor',
    value: function removeCursor(siteId) {
      var remoteCursor = this.remoteCursors[siteId];

      if (remoteCursor) {
        remoteCursor.detach();

        delete this.remoteCursors[siteId];
      }
    }
  }, {
    key: 'updateRemoteCursorsInsert',
    value: function updateRemoteCursorsInsert(chars, position, siteId) {
      var positionDelta = this.generateDeltaFromChars(chars);

      for (var cursorSiteId in this.remoteCursors) {
        if (cursorSiteId === siteId) continue;
        var remoteCursor = this.remoteCursors[cursorSiteId];
        var newPosition = Object.assign({}, remoteCursor.lastPosition);

        if (newPosition.line > position.line) {
          newPosition.line += positionDelta.line;
        } else if (newPosition.line === position.line && newPosition.ch > position.ch) {
          if (positionDelta.line > 0) {
            newPosition.line += positionDelta.line;
            newPosition.ch -= position.ch;
          }

          newPosition.ch += positionDelta.ch;
        }

        remoteCursor.set(newPosition);
      }
    }
  }, {
    key: 'updateRemoteCursorsDelete',
    value: function updateRemoteCursorsDelete(chars, to, from, siteId) {
      var positionDelta = this.generateDeltaFromChars(chars);

      for (var cursorSiteId in this.remoteCursors) {
        if (cursorSiteId === siteId) continue;
        var remoteCursor = this.remoteCursors[cursorSiteId];
        var newPosition = Object.assign({}, remoteCursor.lastPosition);

        if (newPosition.line > to.line) {
          newPosition.line -= positionDelta.line;
        } else if (newPosition.line === to.line && newPosition.ch > to.ch) {
          if (positionDelta.line > 0) {
            newPosition.line -= positionDelta.line;
            newPosition.ch += from.ch;
          }

          newPosition.ch -= positionDelta.ch;
        }

        remoteCursor.set(newPosition);
      }
    }
  }, {
    key: 'updateRemoteCursor',
    value: function updateRemoteCursor(position, siteId, opType, value) {
      var remoteCursor = this.remoteCursors[siteId];
      var clonedPosition = Object.assign({}, position);

      if (opType === 'insert') {
        if (value === '\n') {
          clonedPosition.line++;
          clonedPosition.ch = 0;
        } else {
          clonedPosition.ch++;
        }
      } else {
        clonedPosition.ch--;
      }

      if (remoteCursor) {
        remoteCursor.set(clonedPosition);
      } else {
        this.remoteCursors[siteId] = new _remoteCursor2.default(this.mde, siteId, clonedPosition);
      }
    }
  }, {
    key: 'deleteText',
    value: function deleteText(value, positions, siteId) {
      var localCursor = this.mde.codemirror.getCursor();
      var delta = this.generateDeltaFromChars(value);

      this.mde.codemirror.replaceRange("", positions.from, positions.to, 'deleteText');
      this.updateRemoteCursorsDelete(positions.to, siteId);
      this.updateRemoteCursor(positions.to, siteId, 'delete');

      if (localCursor.line > positions.to.line) {
        localCursor.line -= delta.line;
      } else if (localCursor.line === positions.to.line && localCursor.ch > positions.to.ch) {
        if (delta.line > 0) {
          localCursor.line -= delta.line;
          localCursor.ch += positions.from.ch;
        }

        localCursor.ch -= delta.ch;
      }

      this.mde.codemirror.setCursor(localCursor);
    }
  }, {
    key: 'findLinearIdx',
    value: function findLinearIdx(lineIdx, chIdx) {
      var linesOfText = this.controller.crdt.text.split("\n");

      var index = 0;
      for (var i = 0; i < lineIdx; i++) {
        index += linesOfText[i].length + 1;
      }

      return index + chIdx;
    }
  }, {
    key: 'generateDeltaFromChars',
    value: function generateDeltaFromChars(chars) {
      var delta = { line: 0, ch: 0 };
      var counter = 0;

      while (counter < chars.length) {
        if (chars[counter] === '\n') {
          delta.line++;
          delta.ch = 0;
        } else {
          delta.ch++;
        }

        counter++;
      }

      return delta;
    }
  }]);

  return Editor;
}();

exports.default = Editor;