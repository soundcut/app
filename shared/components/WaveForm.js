const { Component } = require('hypermorphic');
const throttle = require('lodash/throttle');
const parser = require('mp3-parser');
const concatArrayBuffer = require('../helpers/ArrayBuffer.concat');
const concatAudioBuffer = require('../helpers/AudioBuffer.concat');

const WIDTH = 835;
const HEIGHT = 200;
const BAR_WIDTH = 3;
const BAR_COLOR = '#166a77';
const BAR_GAP = false;
const CHUNK_MAX_SIZE = 100 * 1000;

class WaveForm extends Component {
  constructor(audio, file) {
    super();
    this.audio = audio;
    this.file = file;

    this.pixelRatio =
      // FIXME: Force pixelRatio=1 otherwise devices > 1 only draw half
      1 || window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI;
    this.halfPixel = 0.5 / this.pixelRatio;

    this.createAudioCtx();
    this.handleMouseMove = throttle(this.handleMouseMove.bind(this), 16, {
      leading: true,
      trailing: true,
    });
    this.handleSourceTimeUpdate = this.handleSourceTimeUpdate.bind(this);
  }

  createAudioCtx() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioCtx.createAnalyser();
  }

  create2DContext() {
    const canvas = (this.canvas = document.getElementById('WaveForm'));
    const canvasCtx = (this.canvasCtx = canvas.getContext('2d'));
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    return canvasCtx;
  }

  async onconnected() {
    this.audio.addEventListener('timeupdate', this.handleSourceTimeUpdate);
    this.create2DContext();
    this.boundingClientRect = this.canvas.getBoundingClientRect();

    this.buffer = await this.getBuffer();

    // const nominalWidth = Math.round(
    //   this.buffer.duration * MIN_PX_PER_SEC * this.pixelRatio
    // );

    const width = WIDTH;
    const start = 0;
    const end = WIDTH;

    const peaks = this.getPeaks(width, start, end);
    this.drawBars(peaks, 0, 0, WIDTH);
    this.drawn = true;
  }

  /**
   * Set the rendered length (different from the length of the audio).
   *
   * @param {number} length
   */
  setLength(length) {
    this.splitPeaks = [];
    this.mergedPeaks = [];
    // Set the last element of the sparse array so the peak arrays are
    // appropriately sized for other calculations.
    const channels = this.buffer.numberOfChannels;
    let c;
    for (c = 0; c < channels; c++) {
      this.splitPeaks[c] = [];
      this.splitPeaks[c][2 * (length - 1)] = 0;
      this.splitPeaks[c][2 * (length - 1) + 1] = 0;
    }
    this.mergedPeaks[2 * (length - 1)] = 0;
    this.mergedPeaks[2 * (length - 1) + 1] = 0;
  }

  /**
   * Compute the max and min value of the waveform when broken into <length> subranges.
   *
   * @param {number} length How many subranges to break the waveform into.
   * @param {number} first First sample in the required range.
   * @param {number} last Last sample in the required range.
   * @return {number[]|number[][]} Array of 2*<length> peaks or array of arrays of
   * peaks consisting of (max, min) values for each subrange.
   */
  getPeaks(length, first, last) {
    first = first || 0;
    last = last || length - 1;

    this.setLength(length);

    const sampleSize = this.buffer.length / length;
    const sampleStep = ~~(sampleSize / 10) || 1;
    const channels = this.buffer.numberOfChannels;
    let c;

    for (c = 0; c < channels; c++) {
      const peaks = this.splitPeaks[c];
      const chan = this.buffer.getChannelData(c);
      let i;

      for (i = first; i <= last; i++) {
        const start = ~~(i * sampleSize);
        const end = ~~(start + sampleSize);
        let min = 0;
        let max = 0;
        let j;

        for (j = start; j < end; j += sampleStep) {
          const value = chan[j];

          if (value > max) {
            max = value;
          }

          if (value < min) {
            min = value;
          }
        }

        peaks[2 * i] = max;
        peaks[2 * i + 1] = min;

        if (c == 0 || max > this.mergedPeaks[2 * i]) {
          this.mergedPeaks[2 * i] = max;
        }

        if (c == 0 || min < this.mergedPeaks[2 * i + 1]) {
          this.mergedPeaks[2 * i + 1] = min;
        }
      }
    }

    return this.mergedPeaks;
  }

  getArrayBuffer() {
    return new Promise(resolve => {
      let fileReader = new FileReader();
      fileReader.onloadend = () => {
        resolve(fileReader.result);
      };
      fileReader.readAsArrayBuffer(this.file);
    });
  }

  decodeArrayBuffer(arrayBuffer) {
    return new Promise(
      this.audioCtx.decodeAudioData.bind(this.audioCtx, arrayBuffer)
    );
  }

  async getBuffer() {
    const arrayBuffer = await this.getArrayBuffer();

    const view = new DataView(arrayBuffer);

    const tags = parser.readTags(view);
    const firstFrame = tags.pop();
    const tagsArrayBuffer = arrayBuffer.slice(0, firstFrame._section.offset);
    let next = firstFrame._section.nextFrameIndex;
    const frames = [firstFrame];
    while (next) {
      const frame = parser.readFrame(view, next);
      frame && frames.push(frame);
      next = frame && frame._section.nextFrameIndex;
    }

    const chunks = frames.reduce((acc, frame) => {
      let chunk = acc[acc.length - 1];

      if (
        !chunk ||
        chunk.byteLength + frame._section.byteLength >= CHUNK_MAX_SIZE
      ) {
        chunk = { byteLength: 0, frames: [] };
      }

      chunk.byteLength = chunk.byteLength + frame._section.byteLength;
      chunk.frames.push(frame);

      if (!acc.includes(chunk)) {
        return acc.concat(chunk);
      }

      return acc;
    }, []);

    const audioBuffer = await chunks.reduce(async (acc, chunk) => {
      const buffer = await acc;
      const tmpArrayBuffer = arrayBuffer.slice(
        chunk.frames[0]._section.offset,
        chunk.frames[chunk.frames.length - 1]._section.nextFrameIndex
      );

      const finalArrayBuffer = concatArrayBuffer(
        tagsArrayBuffer,
        tmpArrayBuffer
      );
      const decoded = await this.decodeArrayBuffer(finalArrayBuffer);

      if (buffer) {
        return concatAudioBuffer(this.audioCtx, buffer, decoded);
      }

      return decoded;
    }, Promise.resolve());

    return audioBuffer;
  }

  drawBars(peaks, channelIndex, start, end) {
    return this.prepareDraw(
      peaks,
      channelIndex,
      start,
      end,
      ({ hasMinVals, height, offsetY, halfH, peaks }) => {
        // Skip every other value if there are negatives.
        const peakIndexScale = hasMinVals ? 2 : 1;
        const length = peaks.length / peakIndexScale;
        const bar = BAR_WIDTH * this.pixelRatio;
        const gap = BAR_GAP ? Math.max(this.pixelRatio, ~~(bar / 2)) : 0;
        const step = bar + gap;

        const scale = length / WIDTH;
        const first = start;
        const last = end;
        let i;

        this.canvasCtx.fillStyle = BAR_COLOR;
        for (i = first; i < last; i += step) {
          const peak = peaks[Math.floor(i * scale * peakIndexScale)] || 0;
          const h = Math.round((peak / 1) * halfH);
          this.fillRect(
            i + this.halfPixel,
            halfH - h + offsetY,
            bar + this.halfPixel,
            h * 2
          );
        }
      }
    );
  }

  fillRect(x, y, width, height) {
    this.canvasCtx.fillRect(x, y, width, height);
  }

  prepareDraw(peaks, channelIndex, start, end, fn) {
    return requestAnimationFrame(() => {
      // Bar wave draws the bottom only as a reflection of the top,
      // so we don't need negative values
      const hasMinVals = [].some.call(peaks, val => val < 0);
      const height = HEIGHT * this.pixelRatio;
      const offsetY = height * channelIndex || 0;
      const halfH = height / 2;

      return fn({
        hasMinVals: hasMinVals,
        height: height,
        offsetY: offsetY,
        halfH: halfH,
        peaks: peaks,
      });
    });
  }

  handleMouseMove(evt) {
    if (!this.drawn) {
      return;
    }

    requestAnimationFrame(() => {
      if (!this.waveform) {
        this.waveform = this.canvasCtx.getImageData(0, 0, WIDTH, HEIGHT);
      } else {
        this.canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        this.canvasCtx.putImageData(this.waveform, 0, 0);
      }

      const x = evt.clientX - this.boundingClientRect.left;
      this.canvasCtx.fillStyle = 'red';
      this.canvasCtx.fillRect(x, 0, 1, HEIGHT);
    });
  }

  handleSourceTimeUpdate() {
    if (!this.drawn) {
      return;
    }

    requestAnimationFrame(() => {
      if (!this.waveform) {
        this.waveform = this.canvasCtx.getImageData(0, 0, WIDTH, HEIGHT);
      } else {
        this.canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        this.canvasCtx.putImageData(this.waveform, 0, 0);
      }

      const x = (WIDTH / this.buffer.duration) * this.audio.currentTime;

      this.canvasCtx.fillStyle = 'white';
      this.canvasCtx.fillRect(x, 0, 1, HEIGHT);
    });
  }

  render() {
    return this.html`
      <canvas
        onconnected=${this}
        onmousemove=${this.handleMouseMove}
        width="${WIDTH}"
        height="${HEIGHT}"
        id="WaveForm"
      >
      </canvas>
    `;
  }
}

module.exports = WaveForm;
