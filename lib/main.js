import Peer from 'peerjs';
import SimpleMDE from 'simplemde';

import Controller from './controller';
import Broadcast from './broadcast';
import Editor from './editor';

if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {

} else {
  new Controller(
    (location.search.slice(1) || '0'),
    location.origin,
    new Peer({
        host: location.hostname,
        port: location.port || (location.protocol === 'https:' ? 443 : 80),
        path: '/peerjs',
        debug: 1
      }),
    new Broadcast(),
    new Editor(new SimpleMDE({
      placeholder: "Share the link to invite collaborators to your document.  \n\n" +
      "Portal is a decentralized and private real-time collaborative text editor. Portal allows you to create and edit documents \nwith multiple people all at the same time.\n\n" +
      "How to use Portal?\n" +
      "New Document - to start editing\n" + 
      "Save - save the document to your computer at any time\n" +
      "Upload - upload a document from your computer to continue editing",
      spellChecker: false,
      toolbar: false,
      autofocus: false,
      indentWithTabs: true,
      tabSize: 4,
      indentUnit: 4,
      lineWrapping: false,
      shortCuts: []
    }))
  );
}
