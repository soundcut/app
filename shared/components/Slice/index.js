const { Component, wire } = require('hypermorphic');

const Loader = require('../Loader');
const ErrorMessage = require('../ErrorMessage');
const Volume = require('../Volume');
const WaveForm = require('../WaveForm');
const PlayerActions = require('./PlayerActions');
const ShareInput = require('./ShareInput');
const getDisplayName = require('../../helpers/getDisplayName');
const formatTime = require('../../helpers/formatTime');
const decodeFileAudioData = require('../../helpers/decodeFileAudioData');
const getAudioSlice = require('../../helpers/getAudioSlice');

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
  id: undefined,
  error: undefined,
  file: undefined,
  audio: undefined,
  slice: undefined,
};

class Slice extends Component {
  constructor({ audio, file }) {
    super();
    this.state = Object.assign({}, initialState, { file, audio });

    this.handleSliceChange = this.handleSliceChange.bind(this);
    this.handleDownloadClick = this.handleDownloadClick.bind(this);
    this.handlePlayPauseClick = this.handlePlayPauseClick.bind(this);
    this.handleShareClick = this.handleShareClick.bind(this);
    this.handleSubmitClick = this.handleSubmitClick.bind(this);
    this.handleDismissClick = this.handleDismissClick.bind(this);
    this.setBoundary = this.setBoundary.bind(this);
    this.resetSlice = this.resetSlice.bind(this);
  }

  async onconnected() {
    this.sliceWire = wire();
    this.setState({
      mounted: true,
      decoding: true,
    });
    try {
      this.sourceAudioBuffer = await decodeFileAudioData(this.state.file);
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

    await this.setBoundary('start', 0);
    await this.setBoundary('end', this.sourceAudioBuffer.duration);

    this.waveform = new WaveForm({
      audio: this.state.audio,
      audioBuffer: this.sourceAudioBuffer,
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
    const filename = getDisplayName(this.state.file.name) || 'Untitled';
    link.download = `${filename} - Sound Slice [${`${this.state.start}-${
      this.state.end
    }`}].mp3`;
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

    const original = getDisplayName(this.state.file.name) || 'Untitled';
    const filename = `${original} - Sound Slice [${`${this.state.start}-${
      this.state.end
    }`}].mp3`;
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
    this.setState({
      audio: this.state.slice,
      file: this.blob,
      submitted: true,
    });

    this.onconnected();
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
            ${[state.error ? ErrorMessage(state.error) : '']}
            ${[state.id ? ShareInput(state.id) : '']}
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
                ${[
                  PlayerActions({
                    disabled,
                    paused: state.slice.paused,
                    sharing: state.sharing,
                    submitted: state.submitted,
                    handlePlayPauseClick: this.handlePlayPauseClick,
                    handleDownloadClick: this.handleDownloadClick,
                    handleShareClick: this.handleShareClick,
                    handleSubmitClick: this.handleSubmitClick,
                    handleDismissClick: this.handleDismissClick,
                  }),
                ]}
                ${[this.waveform ? this.waveform : '']}
                ${[state.slice ? this.volume : '']}
              </div>
            </div>
          </div>
        `
      );
    }
  }
}

module.exports = Slice;
