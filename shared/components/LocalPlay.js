/* eslint-disable indent */

const { Component, wire } = require('hypermorphic');
const { encode } = require('punycode');

const Slice = require('./Slice');
const ErrorMessage = require('./ErrorMessage');
const Download = require('./Icons/Download');
const Floppy = require('./Icons/Floppy');
const getDisplayName = require('../helpers/getDisplayName');
const getDownloadName = require('../helpers/getDownloadName');
const getFileHash = require('../helpers/getFileHash');
const { setItem } = require('../helpers/indexedDB');

function Buttons({ mediaIsLoaded, handleSave, handleDownload }) {
  return wire()`
    <div class="button-container padding-y-xsmall flex flex-grow1 flex-justify-content-end">
      <button
        disabled=${!mediaIsLoaded}
        onClick=${handleDownload}
        title="Download file."
        class="button--xsmall button--withicon"
      >
        ${Download()} <span>Download</span>
      </button>
      <button
        onClick=${handleSave}
        title="Save in the browser."
        class="button--xsmall button--withicon"
      >
        ${Floppy()} <span>Save</span>
      </button>
    </div>
  `;
}

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

const initialState = {
  error: undefined,
};

class LocalPlay extends Component {
  constructor({ file, source }) {
    super();
    this.state = Object.assign({}, initialState);
    this.file = file;
    this.source = source;
    this.handleDownload = this.handleDownload.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.setSliceComponent = this.setSliceComponent.bind(this);
  }

  onconnected() {
    const filename = this.file.name;
    const newTitle = `${getDisplayName(filename)} | Sound Slice`;
    document.title = newTitle;

    if (this.source) {
      const encodedName = encode(filename);
      const historyState = { filename: encodedName };
      const pathname = `/play?title=${encodedName}`;
      history.pushState(historyState, document.title, pathname);
    }

    this.objectURL = URL.createObjectURL(this.file);
    this.audio = new Audio(this.objectURL);
    this.interval = setInterval(() => {
      if (isMediaLoaded(this.audio)) {
        clearInterval(this.interval);
        this.setSliceComponent(this.audio, this.file);
        URL.revokeObjectURL(this.objectURL);
      }
    }, 100);
  }

  ondisconnected() {
    this.audio = undefined;
    this.file = undefined;
    URL.revokeObjectURL(this.objectURL);
    clearInterval(this.interval);
  }

  setSliceComponent(audio, file) {
    this.slice = new Slice({ audio, file });
    this.render();
  }

  handleDownload(evt) {
    evt.preventDefault();

    // generate a one-time use ObjectURL for the download
    const src = URL.createObjectURL(this.file);
    const link = document.createElement('a');
    link.style = 'display: none;';
    link.href = src;
    const displayName = getDisplayName(this.file.name);
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

  async handleSave(evt) {
    evt.preventDefault();

    try {
      const hash = await getFileHash(this.file);
      await setItem({
        key: hash,
        file: this.file,
      });
    } catch (err) {
      const error = [
        'Unable to save slice in indexedDB :(',
        'Please try again using a different browser.',
        err.message,
      ];
      this.setState({
        error,
      });
    }
  }

  render() {
    const humanizedSize = humanizeFileSize(this.file.size);
    const mediaIsLoaded = isMediaLoaded(this.audio);
    const displayName = getDisplayName(this.file.name);

    return this.html`
      <div class="LocalPlay" onconnected=${this} ondisconnected=${this}>
        <div class="flex flex-wrap flex-justify-between flex-items-center">
          <h1 class="flex-grow1">
            ${displayName} <small>(${humanizedSize})</small>
          </h1>
          ${Buttons({
            mediaIsLoaded,
            handleDownload: this.handleDownload,
            handleSave: this.handleSave,
          })}
        </div>
        ${this.state.error ? ErrorMessage(this.state.error) : ''}
        ${this.slice || ''}
      </div>
    `;
  }
}

module.exports = LocalPlay;
