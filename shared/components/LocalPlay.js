const { decode } = require('punycode');
const { Component } = require('hypermorphic');

const Volume = require('./Volume');
const Duration = require('./Duration');
const Slice = require('./Slice');

function isMediaLoaded(media) {
  const seekable = !!media && media.seekable;
  return (
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

class LocalPlay extends Component {
  constructor(file) {
    super();
    this.state = {
      file,
      audio: undefined,
    };
    this.interval = undefined;
    this.handlePlay = this.handlePlay.bind(this);
    this.handlePause = this.handlePause.bind(this);
  }

  onconnected() {
    this.setState({ audio: new Audio(URL.createObjectURL(this.state.file)) });
    this.interval = setInterval(() => {
      if (isMediaLoaded(this.state.audio)) {
        clearInterval(this.interval);
      }
      this.render();
    }, 100);
  }

  ondisconnected() {
    this.state.audio.pause();
    this.state.audio = undefined;
    clearInterval(this.interval);
    this.interval = undefined;
  }

  handlePlay() {
    this.state.audio.play();
  }

  handlePause() {
    this.state.audio.pause();
  }

  render() {
    const state = this.state;
    const humanizedSize = humanizeFileSize(state.file.size);

    return this.html`
      <div class="LocalPlay" onconnected=${this} ondisconnected=${this}>
        <h3>Play source file</h3>
        <h6>${decode(state.file.name) ||
          'Untitled file'} (${humanizedSize})</h6>
        ${[isMediaLoaded(state.audio) ? new Volume(state.audio) : '']}
        ${[isMediaLoaded(state.audio) ? new Duration(state.audio) : '']}
        <p class="button-container">
          <button type="button"
                  onClick=${this.handlePlay}
                  disabled="${state.audio ? false : true}"
          >
            Play
          </button>
          <button type="button"
                  onClick=${this.handlePause}
                  disabled="${state.audio ? false : true}"
          >
            Pause
          </button>
        </p>
        ${[
    isMediaLoaded(state.audio) ? new Slice(state.audio, state.file) : '',
  ]}
      </div>
    `;
  }
}

module.exports = LocalPlay;
