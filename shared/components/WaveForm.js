const { Component } = require('hypermorphic');
const throttle = require('lodash/throttle');
const getFileAudioBuffer = require('../helpers/getFileAudioBuffer');
const formatTime = require('../helpers/formatTime');

const WIDTH = 835;
const SPACING = 20;
const CANVAS_HEIGHT = 200;
const HEIGHT = CANVAS_HEIGHT - SPACING * 2;
const BAR_WIDTH = 4;
const BAR_COLOR = '#166a77';
const BAR_HANDLE_RADIUS = 8;
const BAR_CENTER = (BAR_WIDTH - 1) / 2;
const BAR_GAP = false;
const FONT_FAMILY = 'monospace';
const FONT_SIZE = 10;
const FONT = `${FONT_SIZE}px ${FONT_FAMILY}`;
const TIME_ANNOTATION_WIDTH = 40;
const SLICE_COLOR = '#37f0c2';

class WaveForm extends Component {
  constructor(audio, file, setSliceBoundary, resetSlice) {
    super();
    this.audio = audio;
    this.file = file;
    this.setSliceBoundary = setSliceBoundary;
    this.resetSlice = resetSlice;

    this.pixelRatio =
      // FIXME: Force pixelRatio=1 otherwise devices > 1 only draw half
      1 || window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI;
    this.halfPixel = 0.5 / this.pixelRatio;

    this.createAudioCtx();
    this.handleMouseMove = throttle(this.handleMouseMove.bind(this), 16, {
      leading: true,
      trailing: true,
    });
    this.handleClick = this.handleClick.bind(this);
    this.handleSourceTimeUpdate = this.handleSourceTimeUpdate.bind(this);
    this.resetBoundaries = this.resetBoundaries.bind(this);
    this.snapshots = [];
  }

  createAudioCtx() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioCtx.createAnalyser();
  }

  create2DContext() {
    const canvas = (this.canvas = document.getElementById('WaveForm'));
    const canvasCtx = (this.canvasCtx = canvas.getContext('2d'));
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    this.canvasCtx.font = FONT;
    return canvasCtx;
  }

  async onconnected() {
    this.audio.addEventListener('timeupdate', this.handleSourceTimeUpdate);
    this.create2DContext();
    this.boundingClientRect = this.canvas.getBoundingClientRect();

    this.buffer = await getFileAudioBuffer(this.file, this.audioCtx);

    // const nominalWidth = Math.round(
    //   this.buffer.duration * MIN_PX_PER_SEC * this.pixelRatio
    // );

    const width = WIDTH;
    const start = 0;
    const end = WIDTH;

    const peaks = this.getPeaks(width, start, end);
    this.drawBars(peaks, 0, WIDTH);
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

  drawBars(peaks, start, end) {
    return this.prepareDraw(
      peaks,
      start,
      end,
      ({ hasMinVals, offsetY, halfH, peaks }) => {
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
          this.canvasCtx.fillRect(
            i + this.halfPixel,
            halfH - h + offsetY,
            bar + this.halfPixel,
            h * 2
          );
        }
        this.drawn = true;
        this.snapshots.push(this.doSnapshot());
      }
    );
  }

  prepareDraw(peaks, start, end, fn) {
    return requestAnimationFrame(() => {
      // Bar wave draws the bottom only as a reflection of the top,
      // so we don't need negative values
      const hasMinVals = peaks.some(val => val < 0);
      const height = HEIGHT * this.pixelRatio;
      const offsetY = SPACING;
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

  getDuration() {
    return (this.buffer || this.audio).duration;
  }

  handleMouseMove(evt) {
    if (!this.drawn || this.state.end) return;

    requestAnimationFrame(() => {
      this.canvasCtx.clearRect(0, 0, WIDTH, CANVAS_HEIGHT);
      this.canvasCtx.putImageData(
        this.snapshots[this.snapshots.length - 1],
        0,
        0
      );

      const x = evt.clientX - this.boundingClientRect.left - BAR_CENTER;
      this.canvasCtx.fillStyle = SLICE_COLOR;
      this.canvasCtx.fillRect(x, 0, BAR_WIDTH / 2, CANVAS_HEIGHT);
      this.canvasCtx.beginPath();
      this.canvasCtx.arc(
        x + BAR_CENTER,
        CANVAS_HEIGHT - BAR_HANDLE_RADIUS,
        BAR_HANDLE_RADIUS,
        0,
        2 * Math.PI
      );
      this.canvasCtx.fill();
      this.canvasCtx.beginPath();
      this.canvasCtx.arc(
        x + BAR_CENTER,
        BAR_HANDLE_RADIUS,
        BAR_HANDLE_RADIUS,
        0,
        2 * Math.PI
      );
      this.canvasCtx.fill();

      const time = Math.max((this.getDuration() / WIDTH) * x, 0);
      const boundary = !this.state.start ? 'start' : 'end';
      const formattedTime = formatTime(time);
      const textSpacing = BAR_HANDLE_RADIUS + SPACING / 2;
      const textX =
        WIDTH - x < TIME_ANNOTATION_WIDTH + textSpacing
          ? x - TIME_ANNOTATION_WIDTH - textSpacing
          : x + textSpacing;
      const textY = boundary !== 'end' ? FONT_SIZE : CANVAS_HEIGHT - FONT_SIZE;
      this.canvasCtx.fillText(formattedTime, textX, textY);
    });
  }

  resetBoundaries() {
    this.setState(this.resetSlice());
    this.snapshots = [this.snapshots[0]];
    this.canvasCtx.clearRect(0, 0, WIDTH, CANVAS_HEIGHT);
    this.canvasCtx.putImageData(this.snapshots[0], 0, 0);
  }

  handleClick(evt) {
    if (typeof this.setSliceBoundary !== 'function' || !this.drawn) {
      return;
    }

    if (this.state.end) {
      this.resetBoundaries();
      return;
    }

    const x = evt.clientX - this.boundingClientRect.left - BAR_CENTER;
    const time = (this.getDuration() / WIDTH) * x;

    if (this.state.start > time) {
      this.resetBoundaries();
      return;
    }

    const boundary = !this.state.start ? 'start' : 'end';
    const { start, end } = this.setSliceBoundary(boundary, time);

    this.snapshots.push(this.doSnapshot());

    this.setState({
      start,
      end,
    });
  }

  doSnapshot() {
    return this.canvasCtx.getImageData(0, 0, WIDTH, CANVAS_HEIGHT);
  }

  handleSourceTimeUpdate() {
    if (!this.drawn) return;

    requestAnimationFrame(() => {
      this.canvasCtx.clearRect(0, 0, WIDTH, CANVAS_HEIGHT);
      this.canvasCtx.putImageData(
        this.snapshots[this.snapshots.length - 1],
        0,
        0
      );

      const x = (WIDTH / this.getDuration()) * this.audio.currentTime;
      this.canvasCtx.fillStyle = 'white';
      this.canvasCtx.fillRect(x, 0, BAR_WIDTH / 2, CANVAS_HEIGHT);

      const time = formatTime(this.audio.currentTime);
      const textX = WIDTH - x < 100 ? x - 55 : x + 10;
      const textY = 20;
      this.canvasCtx.fillText(time, textX, textY);
    });
  }

  render() {
    return this.html`
      <canvas
        onconnected=${this}
        onmousemove=${this.handleMouseMove}
        onclick=${this.handleClick}
        width="${WIDTH}"
        height="${CANVAS_HEIGHT}"
        class="${this.state.end ? 'will-reset' : 'can-select'}"
        id="WaveForm"
      >
      </canvas>
    `;
  }
}

module.exports = WaveForm;
