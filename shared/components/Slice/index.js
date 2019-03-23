const { Component, wire } = require('hypermorphic');
const { encode } = require('punycode');

const Loader = require('../Loader');
const ErrorMessage = require('../ErrorMessage');
const SavedAlert = require('../SavedAlert');
const SharedAlert = require('../SharedAlert');
const WaveForm = require('../WaveForm');
const PlayerActions = require('./PlayerActions');
const SliceActions = require('./SliceActions');
const Tutorial = require('./Tutorial');
const Ready = require('./Ready');
const Form = require('./Form');
const Reslice = require('./Reslice');

const getSliceName = require('../../helpers/getSliceName');
const getDisplayName = require('../../helpers/getDisplayName');
const formatTime = require('../../helpers/formatTime');
const decodeFileAudioData = require('../../helpers/decodeFileAudioData');
const getAudioSlice = require('../../helpers/getAudioSlice');
const shareSlice = require('../../helpers/shareSlice');
const getFileHash = require('../../helpers/getFileHash');
const { setItem, deleteItem } = require('../../helpers/indexedDB');

const initialState = {
  mounted: false,
  start: undefined,
  end: undefined,
  decoding: false,
  submitted: false,
  loading: false,
  sharing: false,
  saved: undefined,
  shared: undefined,
  error: undefined,
  file: undefined,
  audio: undefined,
  blob: undefined,
  sourceAudioBuffer: undefined,
};

class Slice extends Component {
  constructor({ audio, file, onSubmit, onDismiss }) {
    super();
    this.reset = [];
    this.state = Object.assign({}, initialState, { file, audio });

    this.onSubmit = onSubmit;
    this.onDismiss = onDismiss;
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
    this.handleDownloadClick = this.handleDownloadClick.bind(this);
    this.handlePlayPauseClick = this.handlePlayPauseClick.bind(this);
    this.handleShareClick = this.handleShareClick.bind(this);
    this.handleSubmitClick = this.handleSubmitClick.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleDismissClick = this.handleDismissClick.bind(this);
    this.setBoundary = this.setBoundary.bind(this);
  }

  async onconnected() {
    if (!this.state.sourceAudioBuffer) {
      this.setState({
        mounted: true,
        decoding: true,
      });

      try {
        this.state.sourceAudioBuffer = await decodeFileAudioData(
          this.state.file
        );
      } catch (err) {
        const error = [
          'Unable to decode audio data :(',
          'Please try again using a different browser.',
          err.message,
        ];

        this.setState({
          decoding: false,
          error,
        });
        return;
      }
      this.setState({
        decoding: false,
      });
    }

    this.setBoundary('start', 0);
    this.setBoundary('end', this.state.sourceAudioBuffer.duration);

    this.state.audio.addEventListener('timeupdate', this.handleTimeUpdate);

    this.waveform = new WaveForm({
      editable: true,
      audio: this.state.audio,
      audioBuffer: this.state.sourceAudioBuffer,
      setSliceBoundary: this.setBoundary,
      start: this.state.start,
      end: this.state.end,
    });
    document.querySelector('main').classList.add('has-waveform');
    this.render();
  }

  ondisconnected() {
    this.state.audio.pause();
    URL.revokeObjectURL(this.state.audio.currentSrc);
    document.querySelector('main').classList.remove('has-waveform');
  }

  setBoundary(name, value) {
    const parsedValue = Math.round(Number.parseFloat(value, 10) * 1e2) / 1e2;
    const current = this.state[name];
    const equal = current === parsedValue;

    let boundaries = { start: this.state.start, end: this.state.end };
    const update = {
      [name]: parsedValue,
    };

    if (equal) {
      return Object.assign({ swap: false }, boundaries);
    }

    this.setState(update);
    boundaries = { start: this.state.start, end: this.state.end };

    const swap =
      this.state.start !== undefined &&
      this.state.end !== undefined &&
      this.state.end - this.state.start < 0;
    if (swap) {
      boundaries = {
        start: this.state.end,
        end: this.state.start,
      };
      this.setState(boundaries);
    }

    return Object.assign({ swap }, boundaries);
  }

  handleTimeUpdate() {
    const { start, end } = this.state;
    const currentTime = this.state.audio.currentTime;
    if (currentTime > end || currentTime < start) {
      this.state.audio.currentTime = start;
    }
  }

  async createSlice() {
    return getAudioSlice(this.state.file, this.state.start, this.state.end);
  }

  async handleSubmitClick(evt) {
    evt.preventDefault();
    this.state.audio.pause();
    this.reset.push(Object.assign({}, this.state));
    const filename = getSliceName(
      this.state.file,
      this.state.start,
      this.state.end
    );
    this.onSubmit();
    const { audio, blob } = await this.createSlice();
    this.setState(
      Object.assign({}, initialState, {
        blob,
        audio,
        file: new File([blob], filename),
        submitted: true,
      })
    );
    this.onconnected();
  }

  handleDismissClick(evt) {
    evt.preventDefault();
    this.state.audio.pause();
    this.onDismiss();
    this.setState(Object.assign({}, this.reset.pop()));
    this.onconnected();
  }

  async handleSaveClick(evt) {
    evt.preventDefault();

    try {
      const hash = await getFileHash(this.state.file);
      await setItem({
        store: 'slice',
        item: {
          key: hash,
          file: this.state.file,
        },
      });
      this.setState({
        saved: hash,
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

  async handleDeleteClick(evt) {
    evt.preventDefault();

    try {
      const hash = this.state.saved || (await getFileHash(this.file));
      await deleteItem({
        store: 'slice',
        key: hash,
      });
      this.setState({
        saved: undefined,
      });
    } catch (err) {
      const error = ['Unable to delete slice from indexedDB :(', err.message];
      this.setState({
        error,
      });
    }
  }

  handlePlayPauseClick(evt) {
    evt.preventDefault();
    if (this.state.audio.paused) {
      this.state.audio.play();
    } else {
      this.state.audio.pause();
    }
    this.render();
  }

  handleDownloadClick(evt) {
    evt.preventDefault();

    const src = this.state.audio.currentSrc;
    const link = document.createElement('a');
    link.style = 'display: none;';
    link.href = src;
    const filename = getDisplayName(this.state.file.name);
    link.download = `${filename}.mp3`;
    // Firefox appears to require appending the element to the DOM..
    // but FileSaver.js does not need to and it still works for some reason.
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 0);
  }

  async handleShareClick(evt) {
    evt.preventDefault();

    this.setState({ loading: true, sharing: true, error: false });
    try {
      const shared = await shareSlice(this.state.file);
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

  handleNameChange(evt) {
    const filename = evt.target.textContent;
    this.state.file = new File([this.state.blob], encode(filename));
  }

  decorateContent(...children) {
    return this.html`
      <div id="Slice" onconnected=${this} ondisconnected=${this}>
        ${children}
      </div>
    `;
  }

  render() {
    const state = this.state;
    const disabled = this.state.loading || this.state.sharing;
    const duration = state.end - state.start;

    if (!this.state.mounted) {
      return this.decorateContent('');
    }

    if (this.state.decoding) {
      return this.decorateContent(
        Loader('Decoding audio data... Please wait.')
      );
    }

    if (!this.waveform && state.error) {
      return this.decorateContent(ErrorMessage(state.error));
    }

    /* eslint-disable indent */
    if (this.waveform) {
      return this.decorateContent(
        wire(state)`
          <div>
            ${!state.submitted ? Tutorial() : ''}
            ${state.submitted ? Ready() : ''}
            ${
              state.submitted
                ? Form({
                    id: state.audio,
                    initialValue: getDisplayName(state.file.name),
                    onChange: this.handleNameChange,
                  })
                : ''
            }
            ${SliceActions({
              disabled,
              submitted: state.submitted,
              saved: state.saved,
              shared: state.shared,
              handleDownload: this.handleDownloadClick,
              handleShare: this.handleShareClick,
              handleSubmit: this.handleSubmitClick,
              toggleSave: !state.saved
                ? this.handleSaveClick
                : this.handleDeleteClick,
            })}
            ${
              state.sharing
                ? Loader('Saving the slice to the server... Please wait.')
                : ''
            }
            ${state.error ? ErrorMessage(state.error) : ''}
            ${state.shared ? SharedAlert(state.shared) : ''}
            ${state.saved ? SavedAlert(state.saved) : ''}
            ${state.submitted ? Reslice() : ''}
            <div class="player-container">
              <strong class="block margin-y-small text-center">
                ${formatTime(duration)}
              </strong>
              <div class="flex">
                ${PlayerActions({
                  disabled,
                  paused: state.audio.paused,
                  submitted: state.submitted,
                  handlePlayPauseClick: this.handlePlayPauseClick,
                  handleSubmitClick: this.handleSubmitClick,
                  handleSaveClick: this.handleSaveClick,
                  handleDismissClick: this.handleDismissClick,
                })}
                ${this.waveform}
              </div>
            </div>
          </div>
        `
      );
    }
  }
}

module.exports = Slice;
