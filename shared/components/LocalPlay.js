/* eslint-disable indent */

const { Component, wire } = require('hypermorphic');

const Slice = require('./Slice');
const ErrorMessage = require('./ErrorMessage');
const Download = require('./Icons/Download');
const Floppy = require('./Icons/Floppy');
const Cross = require('./Icons/Cross');
const getDisplayName = require('../helpers/getDisplayName');
const getDownloadName = require('../helpers/getDownloadName');
const getFileHash = require('../helpers/getFileHash');
const { setItem, deleteItem } = require('../helpers/indexedDB');

function Buttons({
  saved,
  mediaIsLoaded,
  handleSave,
  handleDelete,
  handleDownload,
}) {
  const soundButton = saved
    ? wire()`
    <button
      onClick=${handleDelete}
      title="Delete from the browser."
      class="button--xsmall button--withicon button--danger"
    >
      ${Cross('sand')} <span>Delete</span>
    </button>
    `
    : wire()`
    <button
      onClick=${handleSave}
      title="Save in the browser."
      class="button--xsmall button--withicon"
    >
      ${Floppy()} <span>Save</span>
    </button>
    `;

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
      ${soundButton}
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
  type: undefined,
  error: undefined,
  saved: undefined,
};

class LocalPlay extends Component {
  constructor({ file, type, saved, disconnectCallback }) {
    super();
    this.state = Object.assign({}, initialState, { type, saved });
    this.file = file;
    // upload | link | slice | sound | shared
    this.handleDownload = this.handleDownload.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.setSliceComponent = this.setSliceComponent.bind(this);
    this.disconnectCallback = disconnectCallback;
  }

  onconnected() {
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
    if (typeof this.disconnectCallback === 'function') {
      this.disconnectCallback();
    }
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

  async handleDelete(evt) {
    evt.preventDefault();

    try {
      const hash = this.state.saved || (await getFileHash(this.file));
      await deleteItem({
        store: this.state.type,
        key: hash,
      });
      this.setState({
        saved: undefined,
      });
    } catch (err) {
      const error = ['Unable to delete sound from indexedDB :(', err.message];
      this.setState({
        error,
      });
    }
  }

  async handleSave(evt) {
    evt.preventDefault();

    try {
      const hash = await getFileHash(this.file);
      await setItem({
        store: 'sound',
        item: {
          key: hash,
          file: this.file,
        },
      });
      this.setState({
        type: 'sound',
        saved: hash,
      });
    } catch (err) {
      const error = [
        'Unable to save sound in indexedDB :(',
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
            saved: this.state.saved,
            handleDownload: this.handleDownload,
            handleSave: this.handleSave,
            handleDelete: this.handleDelete,
          })}
        </div>
        ${this.state.error ? ErrorMessage(this.state.error) : ''}
        ${this.slice || ''}
      </div>
    `;
  }
}

module.exports = LocalPlay;
