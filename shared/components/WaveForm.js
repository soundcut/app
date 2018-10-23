const { Component } = require('hypermorphic');
const throttle = require('lodash/throttle');

const WIDTH = 835;
const HEIGHT = 200;
const MIN_PX_PER_SEC = 5;
const BAR_WIDTH = 3;
const BAR_COLOR = '#166a77';
const BAR_GAP = false;

class WaveForm extends Component {
  constructor(audio, file) {
    super();
    this.audio = audio;
    this.file = file;

    this.pixelRatio =
      window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI;
    this.halfPixel = 0.5 / this.pixelRatio;

    this.createAudioCtx();
    this.handleMouseMove = throttle(this.handleMouseMove.bind(this), 16, {
      leading: true,
      trailing: true,
    });
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
    this.create2DContext();
    this.boundingClientRect = this.canvas.getBoundingClientRect();

    this.buffer = await this.getBuffer();

    const nominalWidth = Math.round(
      this.audio.duration * MIN_PX_PER_SEC * this.pixelRatio
    );

    let start = 0;
    let end = WIDTH;

    const peaks = this.getPeaks(nominalWidth, start, end);
    this.drawBars(peaks, 0, 0, WIDTH);
  }

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
    const buffer = await this.decodeArrayBuffer(arrayBuffer);

    return buffer;
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
    if (this.hasDrawnCurrent) {
      this.canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
      this.drawBars(this.mergedPeaks, 0, 0, WIDTH);
    }

    this.hasDrawnCurrent = true;

    requestAnimationFrame(() => {
      const x = evt.clientX - this.boundingClientRect.left;
      this.canvasCtx.fillStyle = 'red';
      this.canvasCtx.fillRect(x, 0, 1, HEIGHT);
    });
  }

  render() {
    return this.html`
      <canvas
        onconnected=${this}
        ondisconnected=${this}
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
