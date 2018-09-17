/* eslint-disable indent */

const { Component, wire } = require('hypermorphic');

const Volume = require('./Volume');
const Duration = require('./Duration');
const Slice = require('./Slice');
const getDisplayName = require('../helpers/getDisplayName');

function isMediaLoaded(media) {
  const seekable = !!media && media.seekable;
  return (
    seekable &&
    seekable.length > 0 &&
    media.seekable.start(0) === 0 &&
    seekable.end(0) === media.duration
  );
}

function humanizeFileSize(bytes) {
  if (bytes < 1024) {
    return bytes + 'bytes';
  } else if (bytes >= 1024 && bytes < 1048576) {
    return (bytes / 1024).toFixed(1) + 'KB';
  } else if (bytes >= 1048576) {
    return (bytes / 1048576).toFixed(1) + 'MB';
  }
}

function Buttons(audio, handleLoopClick, handlePlay, handlePause) {
  return wire()`
    <p class="button-container">
      <button type="button"
        onclick=${handleLoopClick}
      >
        ${!audio.loop ? 'Set loop mode' : 'Unset loop mode'}
      </button>
      <button type="button"
              onClick=${handlePlay}
      >
        Play
      </button>
      <button type="button"
              onClick=${handlePause}
      >
        Pause
      </button>
    </p>
  `;
}

class LocalPlay extends Component {
  constructor(file) {
    super();
    this.file = file;
    this.handlePlay = this.handlePlay.bind(this);
    this.handlePause = this.handlePause.bind(this);
    this.handleLoop = this.handleLoop.bind(this);
  }

  onconnected() {
    this.objectURL = URL.createObjectURL(this.file);
    this.audio = new Audio(this.objectURL);
    this.interval = setInterval(() => {
      if (isMediaLoaded(this.audio)) {
        this.volume = new Volume(this.audio);
        this.duration = new Duration(this.audio);
        this.slice = new Slice(this.audio, this.file);
        URL.revokeObjectURL(this.objectURL);
        clearInterval(this.interval);
      }
      this.render();
    }, 100);
  }

  ondisconnected() {
    this.audio.pause();
    this.audio = undefined;
    this.file = undefined;
    URL.revokeObjectURL(this.objectURL);
    clearInterval(this.interval);
  }

  handleLoop(evt) {
    evt.preventDefault();
    this.audio.loop = !this.audio.loop;
    this.render();
  }

  handlePlay() {
    this.audio.play();
  }

  handlePause() {
    this.audio.pause();
  }

  render() {
    const humanizedSize = humanizeFileSize(this.file.size);
    const mediaIsLoaded = isMediaLoaded(this.audio);
    const fullDisplayName = `${getDisplayName(this.file.name) ||
      'Untitled file'} (${humanizedSize})`;

    return this.html`
      <div class="LocalPlay" onconnected=${this} ondisconnected=${this}>
        <h3>Play source file</h3>
        <h6>${fullDisplayName}</h6>
        ${
          mediaIsLoaded
            ? [
                this.volume,
                this.duration,
                Buttons(
                  this.audio,
                  this.handleLoop,
                  this.handlePlay,
                  this.handlePause
                ),
                this.slice,
              ]
            : ''
        }
      </div>
    `;
  }
}

module.exports = LocalPlay;
