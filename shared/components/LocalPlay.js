/* eslint-disable indent */

const { Component, wire } = require('hypermorphic');

const Volume = require('./Volume');
const Duration = require('./Duration');
const getDisplayName = require('../helpers/getDisplayName');
const getDownloadName = require('../helpers/getDownloadName');

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

function Buttons(
  audio,
  handleLoopClick,
  handlePlay,
  handlePause,
  handleDownload
) {
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
      <button type="button"
              onClick=${handleDownload}
              title="Your browser's download dialog should open instantly."
      >
        Download
      </button>
    </p>
  `;
}

class LocalPlay extends Component {
  constructor({ file, autoplay, onMediaLoaded }) {
    super();
    this.file = file;
    this.autoplay = !!autoplay;
    this.onMediaLoaded = onMediaLoaded;
    this.handlePlay = this.handlePlay.bind(this);
    this.handlePause = this.handlePause.bind(this);
    this.handleLoop = this.handleLoop.bind(this);
    this.handleDownload = this.handleDownload.bind(this);
  }

  onconnected() {
    this.objectURL = URL.createObjectURL(this.file);
    this.audio = new Audio(this.objectURL);
    this.audio.autoplay = this.autoplay;
    this.interval = setInterval(() => {
      if (isMediaLoaded(this.audio)) {
        clearInterval(this.interval);
        this.volume = new Volume(this.audio);
        this.duration = new Duration(this.audio);
        if (typeof this.onMediaLoaded === 'function') {
          this.onMediaLoaded(this.audio);
        }
        URL.revokeObjectURL(this.objectURL);
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

  handleDownload(evt) {
    evt.preventDefault();

    // generate a one-time use ObjectURL for the download
    const src = URL.createObjectURL(this.file);
    const link = document.createElement('a');
    link.style = 'display: none;';
    link.href = src;
    const displayName = getDisplayName(this.file.name) || 'Untitled';
    link.download = getDownloadName(displayName, 'mp3');
    // Firefox appears to require appending the element to the DOM..
    // but FileSaver.js does not need to and it still works for some reason.
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(src);
    }, 0);
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
                  this.handlePause,
                  this.handleDownload
                ),
              ]
            : ''
        }
      </div>
    `;
  }
}

module.exports = LocalPlay;
