import CSS_COLORS from './cssColors';
import { generateItemFromHash } from './hashAlgo';

const ANIMALS = [
  "Aardvark",
  "Albatross",
  "Alligator",
  "Alpaca",
  "Ant",
  "Anteater",
  "Antelope",
  "Ape",
  "Armadillo",
  "Donkey",
  "Baboon",
  "Badger",
  "Barracuda",
  "Bat",
  "Bear",
  "Beaver",
  "Bee",
  "Bison",
  "Boar",
  "Buffalo",
  "Butterfly",
  "Camel",
  "Crocodile",
  "Crow",
  "Curlew",
  "Deer",
  "Dinosaur",
  "Dog",
  "Dogfish",
  "Dolphin",
  "Dotterel",
  "Dove",
  "Dragonfly",
  "Duck",
  "Dugong",
  "Dunlin",
  "Eagle",
  "Echidna",
  "Eel",
  "Eland",
  "Elephant",
  "Elk",
  "Emu",
  "Falcon",
  "Ferret",
  "Finch",
  "Hamster",
  "Hare",
  "Hawk",
  "Hedgehog",
  "Heron",
  "Herring",
  "Hippopotamus",
  "Hornet",
  "Horse",
  "Human",
  "Hummingbird",
  "Hyena",
  "Ibex",
  "Ibis",
  "Jackal",
  "Jaguar",
  "Jay",
  "Jellyfish",
  "Kangaroo",
  "Kingfisher",
  "Koala",
  "Kookabura",
  "Kouprey",
  "Kudu",
  "Lapwing",
  "Mouse",
  "Mule",
  "Narwhal",
  "Newt",
  "Nightingale",
  "Octopus",
  "Okapi",
  "Opossum",
  "Oryx",
  "Ostrich",
  "Otter",
  "Owl",
  "Oyster",
  "Quetzal",
  "Rabbit",
  "Raccoon",
  "Rail",
  "Ram",
  "Rat",
  "Raven",
  "Reindeer",
  "Rhinoceros",
  "Rook",
  "Salamander",
  "Salmon",
  "Sandpiper",
  "Sardine",
  "Scorpion",
  "Squid",
  "Squirrel",
  "Starling",
  "Stingray",
  "Stinkbug",
  "Stork",
  "Swallow",
  "Swan",
  "Tapir",
  "Tarsier",
  "Termite",
  "Tiger",
  "Toad",
  "Trout",
  "Turkey",
  "Turtle",
  "Viper",
  "Vulture",
  "Worm",
  "Wren",
  "Yak",
  "Zebra"
];

export default class RemoteCursor {
  constructor(mde, siteId, position) {
    this.mde = mde;

    const color = generateItemFromHash(siteId, CSS_COLORS);
    const name = generateItemFromHash(siteId, ANIMALS);

    this.createCursor(color);
    this.createFlag(color, name);

    this.cursor.appendChild(this.flag);
    this.set(position);
  }

  createCursor(color) {
    const textHeight = this.mde.codemirror.defaultTextHeight();

    this.cursor = document.createElement('div');
    this.cursor.classList.add('remote-cursor');
    this.cursor.style.backgroundColor = color;
    this.cursor.style.height = textHeight + 'px';
  }

  createFlag(color, name) {
    const cursorName = document.createTextNode(name);

    this.flag = document.createElement('span');
    this.flag.classList.add('flag');
    this.flag.style.backgroundColor = color;
    this.flag.appendChild(cursorName)
  }

  set(position) {
    this.detach();

    const coords = this.mde.codemirror.cursorCoords(position, 'local');
    this.cursor.style.left = (coords.left >= 0 ? coords.left : 0) + 'px';
    this.mde.codemirror.getDoc().setBookmark(position, { widget: this.cursor });
    this.lastPosition = position;
  }

  detach() {
    if (this.cursor.parentElement) {
        this.cursor.parentElement.remove();
    }
  }
}
