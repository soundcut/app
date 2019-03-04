const parser = require('mp3-parser');
const ID3Writer = require('browser-id3-writer');
const { Component, wire } = require('hypermorphic');

const Loader = require('./Loader');
const ErrorMessage = require('./ErrorMessage');
const Volume = require('./Volume');
const WaveForm = require('./WaveForm');
const getDisplayName = require('../helpers/getDisplayName');
const getDuration = require('../helpers/getDuration');
const formatTime = require('../helpers/formatTime');
const concatArrayBuffer = require('../helpers/ArrayBuffer.concat');
const decodeFileAudioData = require('../helpers/decodeFileAudioData');

const MAX_SLICE_LENGTH = 90;
const SHARE_PATH = '/api/share';

function arrayBufferToObjectURL(buffer, callback) {
  const blob = new Blob([buffer], { type: 'audio/mpeg' });
  setTimeout(() => callback(URL.createObjectURL(blob), blob), 0);
}

function ShareInput(id) {
  const url = `${window.location.origin}/slice/${id}`;
  return wire()`
  <p>
    <label for="share" class="flex flex-justify-content-between">
      <span>Sharing link for this slice:</span>
      <a href="${url}">
        Go to this slice
      </a>
    </label>
    <input id="share" class="full-width" type="text" value=${url} />
  </p>
  `;
}

const initialState = {
  mounted: false,
  start: undefined,
  end: undefined,
  decoding: false,
  loading: false,
  sharing: false,
  id: undefined,
  error: undefined,
};

class Slice extends Component {
  constructor(audio, file) {
    super();
    this.file = file;
    this.audio = audio;
    this.state = Object.assign({}, initialState);

    this.handleSliceChange = this.handleSliceChange.bind(this);
    this.handleDownloadClick = this.handleDownloadClick.bind(this);
    this.handlePlayPauseClick = this.handlePlayPauseClick.bind(this);
    this.handleShareClick = this.handleShareClick.bind(this);
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
      this.sourceAudioBuffer = await decodeFileAudioData(this.file);
      await this.setBoundary('start', 0);
      await this.setBoundary('end', this.sourceAudioBuffer.duration);
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

    this.waveform = new WaveForm({
      audio: this.audio,
      audioBuffer: this.sourceAudioBuffer,
      slice: this.slice,
      setSliceBoundary: this.setBoundary,
      resetSlice: this.resetSlice,
      start: this.state.start,
      end: this.state.end,
    });
    this.render();
  }

  ondisconnected() {
    if (this.slice) {
      this.slice.pause();
      URL.revokeObjectURL(this.slice.currentSrc);
    }
  }

  async setBoundary(name, value) {
    const parsedValue = Math.floor(Number.parseFloat(value, 10));
    const current = this.state[name];
    const equal = current === parsedValue;

    const update = {
      [name]: parsedValue,
    };

    if (equal) {
      return;
    }

    this.setState(update);

    let boundaries = { start: this.state.start, end: this.state.end };
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

    return Object.assign({ audio: this.slice, swap }, boundaries);
  }

  resetSlice() {
    this.slice = undefined;
    this.setState({
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
    if (this.slice.paused) {
      this.slice.play();
    } else {
      this.slice.pause();
    }
    this.render();
  }

  handleDownloadClick(evt) {
    evt.preventDefault();

    const src = this.slice.currentSrc;
    const link = document.createElement('a');
    link.style = 'display: none;';
    link.href = src;
    const filename = getDisplayName(this.file.name) || 'Untitled';
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

    const original = getDisplayName(this.file.name) || 'Untitled';
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
      const data = await response.json();
      this.setState({
        loading: false,
        sharing: false,
        id: data.id,
      });
    } catch (err) {
      console.error({ err });
      this.setState({
        loading: false,
        sharing: false,
        error: err.message,
      });
      return;
    }
  }

  async createSlice() {
    const state = this.state;

    await new Promise(resolve => {
      let fileReader = new FileReader();
      fileReader.onloadend = () => {
        const _sourceArrayBuffer = fileReader.result;

        // scrub source's metadata..
        const writer = new ID3Writer(_sourceArrayBuffer);
        writer.addTag();
        const sourceArrayBuffer = writer.arrayBuffer;

        const view = new DataView(sourceArrayBuffer);

        const tags = parser.readTags(view);
        const id3v2Tag = tags[0];
        const id3v2TagArrayBuffer = sourceArrayBuffer.slice(
          id3v2Tag._section,
          id3v2Tag._section.offset
        );

        const firstFrame = tags[tags.length - 1];
        let next = firstFrame._section.nextFrameIndex;

        const sliceFrames = [];
        let duration = 0;
        while (next) {
          const frame = parser.readFrame(view, next, true);
          if (frame) {
            frame.duration = getDuration(
              frame._section.byteLength,
              frame.header.bitrate
            );

            duration += frame.duration;
            if (duration >= state.start) {
              if (duration > state.end) {
                break;
              }
              sliceFrames.push(frame);
            }
          }
          next = frame && frame._section.nextFrameIndex;
        }

        const tmpArrayBuffer = sourceArrayBuffer.slice(
          sliceFrames[0]._section.offset,
          sliceFrames[sliceFrames.length - 1]._section.nextFrameIndex
        );

        const sliceArrayBuffer = concatArrayBuffer(
          id3v2TagArrayBuffer,
          tmpArrayBuffer
        );

        let volume = 1;
        if (this.slice) {
          this.slice.pause();
          volume = this.slice.volume;
          this.slice = undefined;
        }

        arrayBufferToObjectURL(sliceArrayBuffer, (objectURL, blob) => {
          const slice = new Audio();
          this.slice = slice;
          slice.src = objectURL;
          slice.loop = true;
          slice.volume = volume;
          this.volume = new Volume(slice);
          this.blob = blob;
          this.render();
          resolve();
        });
      };

      fileReader.readAsArrayBuffer(this.file);
    });
  }

  decorateContent(...children) {
    return this.html`
      <div id="Slice" onconnected=${this} ondisconnected=${this}>
        ${children}
      </div>
    `;
  }

  render() {
    /* eslint-disable indent */
    const state = this.state;
    const disabled = !this.slice || this.state.loading;
    const duration = state.end - state.start;

    if (!this.state.mounted) {
      return this.decorateContent('');
    }

    if (this.state.decoding) {
      return this.decorateContent(
        Loader('Decoding audio data... Please wait.')
      );
    }

    if (!this.slice && state.error) {
      return this.decorateContent(ErrorMessage(state.error));
    }

    if (this.slice) {
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
                    this.slice
                      ? `${formatTime(duration)} (${duration}seconds)`
                      : ''
                  }
                </small>
              </div>
              <div class="flex">
                ${[this.waveform ? this.waveform : '']}
                ${[this.slice ? this.volume : '']}
              </div>
              <div class="flex">
                <button type="button"
                        disabled=${disabled}
                        onclick=${this.handlePlayPauseClick}
                >
                  ${disabled || this.slice.paused ? 'Play' : 'Pause'}
                </button>
                <button type="button"
                        onClick=${this.handleDownloadClick}
                        disabled=${disabled}
                        title="Your browser's download dialog should open instantly."
                >
                  Download
                </button>
                <button type="button"
                        onClick=${this.handleShareClick}
                        disabled=${disabled}
                        title="${
                          !this.state.sharing
                            ? 'A unique URL will be generated for you to share your slice.'
                            : 'Generating unique URL...'
                        }"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        `
      );
    }
  }
}

module.exports = Slice;
