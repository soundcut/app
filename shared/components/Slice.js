const parser = require('mp3-parser');
const ID3Writer = require('browser-id3-writer');
const { Component, wire } = require('hypermorphic');

const WaveForm = require('./WaveForm');
const getDisplayName = require('../helpers/getDisplayName');
const getDuration = require('../helpers/getDuration');
const formatTime = require('../helpers/formatTime');
const concatArrayBuffer = require('../helpers/ArrayBuffer.concat');

const MAX_SLICE_LENGTH = 90;
const SHARE_PATH = '/api/share';

function arrayBufferToObjectURL(buffer, callback) {
  const blob = new Blob([buffer], { type: 'audio/mpeg' });
  setTimeout(() => callback(URL.createObjectURL(blob), blob), 0);
}

function ErrorMessage() {
  return wire()`<p>Oops! Something went wrong.</p>`;
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
  audio: undefined,
  start: undefined,
  end: undefined,
  loading: false,
  sharing: false,
  id: undefined,
  error: undefined,
};

class Slice extends Component {
  constructor(audio, file) {
    super();
    this.file = file;
    this.state = Object.assign({}, initialState, { audio });

    this.handleSliceChange = this.handleSliceChange.bind(this);
    this.handleDownloadClick = this.handleDownloadClick.bind(this);
    this.handlePlayClick = this.handlePlayClick.bind(this);
    this.handlePauseClick = this.handlePauseClick.bind(this);
    this.handleShareClick = this.handleShareClick.bind(this);
    this.setBoundary = this.setBoundary.bind(this);
    this.resetSlice = this.resetSlice.bind(this);

    this.waveform = new WaveForm(
      audio,
      file,
      this.setBoundary,
      this.resetSlice
    );
  }

  onconnected() {}

  ondisconnected() {
    this.state.audio = undefined;
    this.file = undefined;
    this.blob = undefined;
    this.state = initialState;
    if (this.slice) {
      this.slice.pause();
      URL.revokeObjectURL(this.slice.currentSrc);
      this.slice = undefined;
    }
  }

  setBoundary(name, value) {
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
      this.createSlice();
    }

    return Object.assign({ swap }, boundaries);
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

  handlePlayClick(evt) {
    evt.preventDefault();
    this.slice.play();
  }

  handlePauseClick(evt) {
    evt.preventDefault();
    this.slice.pause();
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
      this.setState({
        loading: false,
        sharing: false,
        error: true,
      });
      return;
    }
    this.setState({ loading: false, sharing: false, error: false });
  }

  createSlice() {
    const state = this.state;

    return new Promise(resolve => {
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

        if (this.slice) {
          this.slice.pause();
          this.slice = undefined;
        }

        arrayBufferToObjectURL(sliceArrayBuffer, (objectURL, blob) => {
          const slice = new Audio();
          slice.loop = true;
          this.slice = slice;
          slice.src = objectURL;
          this.blob = blob;
          this.render();
          resolve();
        });
      };

      fileReader.readAsArrayBuffer(this.file);
    });
  }

  render() {
    /* eslint-disable indent */
    const state = this.state;
    const disabled = !this.slice || this.state.loading;
    const duration = state.end - state.start;

    return this.html`
      <div onconnected=${this} ondisconnected=${this}>
        <h3>
          Drag handles to slice
        </h3>
        <p>
          ${
            this.slice
              ? `Slice duration: ${formatTime(duration)} (${duration}seconds)`
              : 'No slice boundaries selected.'
          }
        </p>
        <div class="flex flex-justify-content-between">
          <p class="button-container">
            <button type="button"
                    disabled=${disabled}
                    onclick=${this.handlePlayClick}
            >
              Play
            </button>
            <button type="button"
                    disabled=${disabled}
                    onclick=${this.handlePauseClick}
            >
              Pause
            </button>
          </p>
          <p class="button-container">
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
                      !this.state.sharing ? 'A unique URL will be generated for you to share your slice.' : 'Generating unique URL...'
                    }"
            >
              Share
            </button>
          </p>
        </div>
        ${[state.error ? ErrorMessage() : '']}
        ${[state.id ? ShareInput(state.id) : '']}
        ${[this.waveform]}
      </div>
    `;
  }
}

module.exports = Slice;
