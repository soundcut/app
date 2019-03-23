const { Component, wire } = require('hypermorphic');
const { encode } = require('punycode');

const Loader = require('../Loader');
const ErrorMessage = require('../ErrorMessage');
const SavedAlert = require('../SavedAlert');
const SharedAlert = require('../SharedAlert');
const Volume = require('../Volume');
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

const MAX_SLICE_LENGTH = 90;

const initialState = {
  mounted: false,
  start: undefined,
  end: undefined,
  decoding: false,
  submitted: false,
  loading: false,
  sharing: false,
  shared: undefined,
  error: undefined,
  file: undefined,
  audio: undefined,
  slice: undefined,
  sourceAudioBuffer: undefined,
};

class Slice extends Component {
  constructor({ audio, file, onSubmit, onDismiss }) {
    super();
    this.state = Object.assign({}, initialState, { file, audio });

    this.onSubmit = onSubmit;
    this.onDismiss = onDismiss;
    this.handleSliceChange = this.handleSliceChange.bind(this);
    this.handleDownloadClick = this.handleDownloadClick.bind(this);
    this.handlePlayPauseClick = this.handlePlayPauseClick.bind(this);
    this.handleShareClick = this.handleShareClick.bind(this);
    this.handleSubmitClick = this.handleSubmitClick.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleDismissClick = this.handleDismissClick.bind(this);
    this.setBoundary = this.setBoundary.bind(this);
    this.resetSlice = this.resetSlice.bind(this);
  }

  async onconnected() {
    if (!this.sliceWire) {
      this.sliceWire = wire();
    }

    this.setState({
      mounted: true,
      decoding: !this.state.sourceAudioBuffer,
    });

    if (!this.state.sourceAudioBuffer) {
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

    await this.setBoundary('start', 0);
    await this.setBoundary('end', this.state.sourceAudioBuffer.duration);

    this.waveform = new WaveForm({
      editable: !this.state.submitted,
      audio: this.state.audio,
      audioBuffer: this.state.sourceAudioBuffer,
      slice: this.state.slice,
      setSliceBoundary: this.setBoundary,
      resetSlice: this.resetSlice,
      start: this.state.start,
      end: this.state.end,
    });
    this.render();
  }

  ondisconnected() {
    if (this.state.slice) {
      this.state.slice.pause();
      URL.revokeObjectURL(this.state.slice.currentSrc);
    }
  }

  async setBoundary(name, value) {
    const parsedValue = Math.round(Number.parseFloat(value, 10) * 1e2) / 1e2;
    const current = this.state[name];
    const equal = current === parsedValue;

    let boundaries = { start: this.state.start, end: this.state.end };
    const update = {
      [name]: parsedValue,
    };

    if (equal) {
      return Object.assign(
        { audio: this.state.slice, swap: false },
        boundaries
      );
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

    if (this.state.end) {
      await this.createSlice();
    }

    return Object.assign({ audio: this.state.slice, swap }, boundaries);
  }

  resetSlice() {
    this.setState({
      slice: undefined,
      start: undefined,
      end: undefined,
    });
    return { start: this.state.start, end: this.state.end };
  }

  handleSliceChange(evt) {
    this.setBoundary(evt.target.name, evt.target.value);
  }

  async createSlice() {
    const state = this.state;

    const { audio, blob } = await getAudioSlice(
      this.state.file,
      state.start,
      state.end
    );
    let volume = 0.5;
    if (this.state.slice) {
      this.state.slice.pause();
      volume = this.state.slice.volume;
    }
    this.blob = blob;
    audio.volume = volume;
    this.volume = new Volume(audio);
    this.setState({
      slice: audio,
    });
  }

  handleSubmitClick(evt) {
    evt.preventDefault();
    this.reset = Object.assign({}, this.state);
    this.state.slice.pause();
    const filename = getSliceName(
      this.state.file,
      this.state.start,
      this.state.end
    );
    this.onSubmit();
    const newState = Object.assign({}, initialState, {
      audio: this.state.slice,
      file: new File([this.blob], filename),
      submitted: true,
    });
    this.setState(newState);
    this.onconnected();
  }

  handleDismissClick(evt) {
    evt.preventDefault();
    this.onDismiss();
    this.setState(Object.assign({}, this.reset));
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
    if (this.state.slice.paused) {
      this.state.slice.play();
    } else {
      this.state.slice.pause();
    }
    this.render();
  }

  handleDownloadClick(evt) {
    evt.preventDefault();

    const src = this.state.slice.currentSrc;
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
    this.state.file = new File([this.blob], encode(filename));
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
    const disabled = !state.slice || this.state.loading || this.state.sharing;
    const duration = state.end - state.start;

    if (!this.state.mounted) {
      return this.decorateContent('');
    }

    if (this.state.decoding) {
      return this.decorateContent(
        Loader('Decoding audio data... Please wait.')
      );
    }

    if (!state.slice && state.error) {
      return this.decorateContent(ErrorMessage(state.error));
    }

    /* eslint-disable indent */
    if (state.slice) {
      return this.decorateContent(
        this.sliceWire`
          <div>
            ${!state.submitted ? Tutorial() : ''}
            ${state.submitted ? Ready() : ''}
            ${
              state.submitted
                ? Form({
                    id: state.slice,
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
                  paused: state.slice.paused,
                  submitted: state.submitted,
                  handlePlayPauseClick: this.handlePlayPauseClick,
                  handleSubmitClick: this.handleSubmitClick,
                  handleSaveClick: this.handleSaveClick,
                  handleDismissClick: this.handleDismissClick,
                })}
                ${this.waveform}
                ${this.volume}
              </div>
            </div>
          </div>
        `
      );
    }
  }
}

module.exports = Slice;
