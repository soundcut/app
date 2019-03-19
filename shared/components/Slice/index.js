const { Component, wire } = require('hypermorphic');

const Loader = require('../Loader');
const ErrorMessage = require('../ErrorMessage');
const SuccessMessage = require('../SuccessMessage');
const Volume = require('../Volume');
const WaveForm = require('../WaveForm');
const PlayerActions = require('./PlayerActions');
const ShareInput = require('./ShareInput');
const getSliceName = require('../../helpers/getSliceName');
const formatTime = require('../../helpers/formatTime');
const decodeFileAudioData = require('../../helpers/decodeFileAudioData');
const getAudioSlice = require('../../helpers/getAudioSlice');
const getFileHash = require('../../helpers/getFileHash');
const { setItem } = require('../../helpers/indexedDB');

const MAX_SLICE_LENGTH = 90;
const SHARE_PATH = '/api/share';

const initialState = {
  mounted: false,
  start: undefined,
  end: undefined,
  decoding: false,
  submitted: false,
  loading: false,
  sharing: false,
  saving: false,
  id: undefined,
  error: undefined,
  file: undefined,
  audio: undefined,
  slice: undefined,
  sourceAudioBuffer: undefined,
};

function SavedAlert(hash) {
  const messages = [
    'This slice has been saved to your browser.',
    wire()`It is now available on the <a href="/">home screen</a>.`,
    wire()`<a href="${`/saved/slice/${hash}`}">Go to slice</a>.`,
  ];

  return SuccessMessage(messages);
}

class Slice extends Component {
  constructor({ audio, file }) {
    super();
    this.state = Object.assign({}, initialState, { file, audio });

    this.handleSliceChange = this.handleSliceChange.bind(this);
    this.handleDownloadClick = this.handleDownloadClick.bind(this);
    this.handlePlayPauseClick = this.handlePlayPauseClick.bind(this);
    this.handleShareClick = this.handleShareClick.bind(this);
    this.handleSubmitClick = this.handleSubmitClick.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
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
    const parsedValue = Math.floor(Number.parseFloat(value, 10));
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
    const filename = this.state.file.name;
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

    const filename = this.state.file.name;
    const formData = new FormData();
    formData.append('file', this.blob, filename);

    const promise = fetch(SHARE_PATH, {
      method: 'POST',
      body: formData,
    });
    this.setState({ loading: true, sharing: true, error: false });
    try {
      const response = await promise;

      if (response.status !== 201) {
        const err = new Error('Server Error');
        err.response = response;
        throw err;
      }

      const data = await response.json();
      this.setState({
        loading: false,
        sharing: false,
        id: data.id,
      });
    } catch (err) {
      console.error({ err });
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
      return;
    }
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
    const newState = Object.assign({}, initialState, {
      audio: this.state.slice,
      file: new File([this.blob], filename),
      submitted: true,
    });
    this.setState(newState);
    this.onconnected();
  }

  async handleSaveClick(evt) {
    evt.preventDefault();
    this.setState({
      saving: true,
    });
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
        saving: false,
        saved: hash,
      });
    } catch (err) {
      const error = [
        'Unable to save slice in indexedDB :(',
        'Please try again using a different browser.',
        err.message,
      ];
      this.setState({
        saving: false,
        error,
      });
    }
  }

  handleDismissClick(evt) {
    evt.preventDefault();
    this.setState(Object.assign({}, this.reset));
    this.onconnected();
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
    const disabled = !state.slice || this.state.loading;
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

    if (state.slice) {
      /* eslint-disable indent */
      return this.decorateContent(
        this.sliceWire`
          <div>
            ${state.error ? ErrorMessage(state.error) : ''}
            ${state.id ? ShareInput(state.id) : ''}
            ${state.saved ? SavedAlert(state.saved) : ''}
            <div class="player-container">
              <div class="player-header">
                <strong>
                  Drag handles to slice
                </strong>
                <small>
                  ${
                    state.slice
                      ? `${formatTime(duration)} (${duration}seconds)`
                      : ''
                  }
                </small>
              </div>
              <div class="flex">
                ${PlayerActions({
                  disabled,
                  paused: state.slice.paused,
                  sharing: state.sharing,
                  saving: state.saving,
                  submitted: state.submitted,
                  handlePlayPauseClick: this.handlePlayPauseClick,
                  handleDownloadClick: this.handleDownloadClick,
                  handleShareClick: this.handleShareClick,
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
