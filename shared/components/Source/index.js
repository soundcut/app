/* eslint-disable indent */

const { Component, wire } = require('hypermorphic');

const Slice = require('../Slice');
const ErrorMessage = require('../ErrorMessage');
const SharedAlert = require('../SharedAlert');
const SavedAlert = require('../SavedAlert');
const SourceActions = require('./SourceActions');
const SavedDisclaimer = require('./SavedDisclaimer');

const getDisplayName = require('../../helpers/getDisplayName');
const getDownloadName = require('../../helpers/getDownloadName');
const getFileHash = require('../../helpers/getFileHash');
const { setItem, deleteItem } = require('../../helpers/indexedDB');
const shareSlice = require('../../helpers/shareSlice');

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
  loading: undefined,
};

class Source extends Component {
  constructor({ file, type, saved, disconnectCallback }) {
    super();
    this.state = Object.assign({}, initialState, { type, saved });
    this.type = type;
    this.saved = saved;
    this.file = file;
    // upload | link | slice | sound | shared
    this.handleDownload = this.handleDownload.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleShare = this.handleShare.bind(this);
    this.setSliceComponent = this.setSliceComponent.bind(this);
    this.handleSliceSubmit = this.handleSliceSubmit.bind(this);
    this.handleSliceDismiss = this.handleSliceDismiss.bind(this);
    this.disconnectCallback = disconnectCallback;
  }

  onconnected() {
    this.objectURL = URL.createObjectURL(this.file);
    this.audio = new Audio(this.objectURL);
    this.audio.loop = true;
    this.audio.volume = 0.5;
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

  get justSaved() {
    return this.state.saved && !this.saved;
  }

  setSliceComponent(audio, file) {
    this.slice = new Slice({
      audio,
      file,
      onSubmit: this.handleSliceSubmit,
      onDismiss: this.handleSliceDismiss,
    });
    this.render();
  }

  handleSliceSubmit() {
    this.setState({ submitted: true });
  }

  handleSliceDismiss() {
    this.setState({ submitted: false });
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

  async handleShare(evt) {
    evt.preventDefault();

    this.setState({ loading: true, sharing: true, error: false });
    try {
      const shared = await shareSlice(this.file);
      this.setState({
        loading: false,
        sharing: false,
        shared,
      });
    } catch (err) {
      const error = [
        'Unable to share this slice :(',
        !err.response && 'Is this device connected to the internet?',
        err.message,
      ];
      this.setState({
        loading: false,
        sharing: false,
        error,
      });
    }
  }

  render() {
    const humanizedSize = humanizeFileSize(this.file.size);
    const mediaIsLoaded = isMediaLoaded(this.audio);
    const displayName = getDisplayName(this.file.name);

    const source = wire()`
      ${this.state.saved ? SavedDisclaimer(this.type) : ''}
      <div class="flex flex-wrap flex-justify-between flex-items-center margin-bottom">
        <h2 class="flex flex-items-center flex-grow1 no-margin-bottom margin-right-small">
          <span class="margin-right-small">${displayName}</span>
          <small class="text-white">(${humanizedSize})</small>
        </h2>
        ${SourceActions({
          mediaIsLoaded,
          sharing: this.state.sharing,
          disabled: this.state.loading,
          type: this.type,
          saved: this.state.saved,
          shared: this.state.shared,
          handleShare: this.handleShare,
          handleDownload: this.handleDownload,
          handleSave: this.handleSave,
          handleDelete: this.handleDelete,
        })}
      </div>
      ${this.state.error ? ErrorMessage(this.state.error) : ''}
      ${this.justSaved ? SavedAlert(this.state.saved) : ''}
      ${this.state.shared ? SharedAlert(this.state.shared) : ''}
    `;

    return this.html`
      <div onconnected=${this} ondisconnected=${this}>
        ${!this.state.submitted ? source : ''}
        ${this.slice || ''}
      </div>
    `;
  }
}

module.exports = Source;
