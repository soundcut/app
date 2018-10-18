const { Component } = require('hypermorphic');

const WIDTH = 835;
const HEIGHT = 200;
const MIN_PX_PER_SEC = 5;
const BAR_WIDTH = 1;
const BAR_COLOR = '#166a77';

class WaveForm extends Component {
  constructor(audio, file) {
    super();
    this.audio = audio;
    this.file = file;

    this.pixelRatio =
      window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI;
    this.halfPixel = 0.5 / this.pixelRatio;

    this.createAudioCtx();
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

  setLength(length) {
    this.splitPeaks = [];
    this.mergedPeaks = [];
    // Set the last element of the sparse array so the peak arrays are
    // appropriately sized for other calculations.
    const channels = this.buffer ? this.buffer.numberOfChannels : 1;
    // const channels = 1;
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
    return new Promise((resolve, reject) => {
      this.audioCtx.decodeAudioData(arrayBuffer, resolve, reject);
    });
  }

  async getBuffer() {
    const arrayBuffer = await this.getArrayBuffer();
    const buffer = await this.decodeArrayBuffer(arrayBuffer);

    return buffer;
  }

  async onconnected() {
    this.create2DContext();

    this.buffer = await this.getBuffer();

    const nominalWidth = Math.round(
      this.audio.duration * MIN_PX_PER_SEC * this.pixelRatio
    );

    let start = 0;
    let end = WIDTH;

    const peaks = this.getPeaks(nominalWidth, start, end);
    this.drawBars(peaks, 0, start, end);
  }

  drawBars(peaks, channelIndex, start, end) {
    return this.prepareDraw(
      peaks,
      channelIndex,
      start,
      end,
      ({ absmax, hasMinVals, height, offsetY, halfH, peaks }) => {
        // Skip every other value if there are negatives.
        const peakIndexScale = hasMinVals ? 2 : 1;
        const length = peaks.length / peakIndexScale;
        const bar = BAR_WIDTH * this.pixelRatio;
        const gap = Math.max(this.pixelRatio, ~~(bar / 2));
        const step = bar + gap;

        const scale = length / WIDTH;
        const first = start;
        const last = end;
        let i;

        for (i = first; i < last; i += step) {
          const peak = peaks[Math.floor(i * scale * peakIndexScale)] || 0;
          const h = Math.round((peak / absmax) * halfH);
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
    const startCanvas = Math.floor(x / WIDTH);
    const endCanvas = Math.min(
      Math.ceil((x + width) / WIDTH) + 1,
      [this.canvas].length
    );
    let i;
    for (i = startCanvas; i < endCanvas; i++) {
      this.maxCanvasWidth = WIDTH;
      const leftOffset = i * this.maxCanvasWidth;

      const intersection = {
        x1: Math.max(x, i * this.maxCanvasWidth),
        y1: y,
        x2: Math.min(x + width, i * this.maxCanvasWidth + this.canvas.width),
        y2: y + height,
      };

      if (intersection.x1 < intersection.x2) {
        this.canvasCtx.fillStyle = BAR_COLOR;
        this.fillRectToContext(
          this.canvasCtx,
          intersection.x1 - leftOffset,
          intersection.y1,
          intersection.x2 - intersection.x1,
          intersection.y2 - intersection.y1
        );
      }
    }
  }

  prepareDraw(peaks, channelIndex, start, end, fn) {
    const frame = func => {
      return (...args) => requestAnimationFrame(() => func(...args));
    };
    return frame(() => {
      // calculate maximum modulation value, either from the barHeight
      // parameter or if normalize=true from the largest value in the peak
      // set
      let absmax = 1 / 1; /*this.params.barHeight*/

      // Bar wave draws the bottom only as a reflection of the top,
      // so we don't need negative values
      const hasMinVals = [].some.call(peaks, val => val < 0);
      const height = HEIGHT * this.pixelRatio;
      const offsetY = height * channelIndex || 0;
      const halfH = height / 2;

      return fn({
        absmax: absmax,
        hasMinVals: hasMinVals,
        height: height,
        offsetY: offsetY,
        halfH: halfH,
        peaks: peaks,
      });
    })();
  }

  fillRectToContext(ctx, x, y, width, height) {
    ctx.fillRect(x, y, width, height);
  }

  render() {
    return this.html`
      <canvas id="WaveForm" onconnected=${this} ondisconnected=${this}>
      </canvas>
    `;
  }
}

module.exports = WaveForm;
