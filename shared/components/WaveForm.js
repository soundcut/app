const { Component, wire } = require('hypermorphic');
const formatTime = require('../helpers/formatTime');
const hexToRGB = require('../helpers/hexToRGB');
const checkPassiveEventListener = require('../helpers/checkPassiveEventListener');

const SPACING = 20;
const CONTAINER_HEIGHT = 240;
const HEIGHT = CONTAINER_HEIGHT - SPACING * 2;
const BAR_WIDTH = 4;
const BAR_HANDLE_RADIUS = 8;
const BAR_CENTER = (BAR_WIDTH - 1) / 2;
const BAR_GAP = false;
const FONT_FAMILY = 'monospace';
const FONT_SIZE = 10;
const FONT = `${FONT_SIZE}px ${FONT_FAMILY}`;
const TIME_ANNOTATION_WIDTH = 40;
const BAR_COLOR = '#166a77';
const SLICE_COLOR = '#37f0c2';

function Canvases({ containerWidth, width }) {
  return wire(Canvases)`
    <canvas id="waveform-canvas" width="${width}" height="${HEIGHT}" />
    <canvas id="progress-canvas" width="${width}" height="${HEIGHT}" />
    <canvas id="start-canvas" width="${containerWidth}" height="${HEIGHT}" />
    <canvas id="end-canvas" width="${containerWidth}" height="${HEIGHT}" />
  `;
}

class WaveForm extends Component {
  constructor({ editable, audio, audioBuffer, setSliceBoundary, start, end }) {
    super();
    this.audio = audio;
    this.buffer = audioBuffer;
    this.setSliceBoundary = setSliceBoundary;
    this.editable = editable;

    this.state = {
      start,
      end,
    };

    this.pixelRatio =
      // FIXME: Force pixelRatio=1 otherwise devices > 1 only draw half
      1 || window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI;
    this.halfPixel = 0.5 / this.pixelRatio;

    this.handleSourceTimeUpdate = this.handleSourceTimeUpdate.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  setupContainer() {
    this.container = document.getElementById('WaveForm').firstElementChild;
    this.boundingClientRect = this.container.getBoundingClientRect();
    this.containerWidth = this.boundingClientRect.width;
    this.width = this.containerWidth - SPACING * 2;
  }

  setupCanvases() {
    this.canvases = {};
    this.canvasContexts = {};
    this.snapshots = {};
    this.setState({
      canvases: Canvases({
        containerWidth: this.containerWidth,
        width: this.width,
      }),
    });
    this.state.canvases.childNodes.forEach(node => {
      const canvas = node.id.replace('-canvas', '');
      this.canvases[canvas] = node;
      this.canvasContexts[canvas] = node.getContext('2d');
      this.canvasContexts[canvas].clearRect(0, 0, this.width, HEIGHT);
      this.canvasContexts[canvas].font = FONT;
      this.snapshots[canvas] = [];
    });
  }

  async onconnected() {
    this.supportsPassiveEventListener = checkPassiveEventListener();
    this.evtHandlerOptions = this.supportsPassiveEventListener
      ? { passive: true }
      : true;

    this.setupContainer();
    this.setupCanvases();

    if (this.editable) {
      this.container.addEventListener(
        'mousedown',
        this.handleMouseDown,
        this.evtHandlerOptions
      );
      this.container.addEventListener(
        'touchstart',
        this.handleMouseDown,
        this.evtHandlerOptions
      );

      this.container.addEventListener(
        'mousemove',
        this.handleMouseMove,
        this.evtHandlerOptions
      );
      this.container.addEventListener(
        'touchmove',
        this.handleMouseMove,
        this.evtHandlerOptions
      );
    }

    this.audio.addEventListener(
      'timeupdate',
      this.handleSourceTimeUpdate,
      this.evtHandlerOptions
    );

    // const nominalWidth = Math.round(
    //   this.buffer.duration * MIN_PX_PER_SEC * this.pixelRatio
    // );

    const width = this.width;
    const start = 0;
    const end = this.width;

    const peaks = this.getPeaks(width, start, end);
    await this.drawBars(peaks, 0, this.width);
    this.drawn = true;
    this.doSnapshot('waveform');
    if (this.editable) {
      this.drawBoundary(this.canvasContexts['start'], SPACING);
      this.drawBoundary(
        this.canvasContexts['end'],
        this.containerWidth - SPACING
      );
    }
  }

  ondisconnected() {
    this.audio.removeEventListener(
      'timeupdate',
      this.handleSourceTimeUpdate,
      this.evtHandlerOptions
    );

    if (this.editable) {
      this.container.removeEventListener(
        'mousedown',
        this.handleMouseDown,
        this.evtHandlerOptions
      );
      this.container.removeEventListener(
        'touchstart',
        this.handleMouseDown,
        this.evtHandlerOptions
      );

      this.container.removeEventListener(
        'mousemove',
        this.handleMouseMove,
        this.evtHandlerOptions
      );
      this.container.removeEventListener(
        'touchmove',
        this.handleMouseMove,
        this.evtHandlerOptions
      );
    }
  }

  getDuration() {
    return this.buffer.duration;
  }

  doSnapshot(canvas) {
    this.snapshots[canvas].push(
      this.canvasContexts[canvas].getImageData(0, 0, this.width, HEIGHT)
    );
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
    return new Promise(resolve => {
      this.prepareDraw(
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

          const scale = length / this.width;
          const first = start;
          const last = end;
          let i;

          this.canvasContexts['waveform'].fillStyle = BAR_COLOR;
          for (i = first; i < last; i += step) {
            const peak = peaks[Math.floor(i * scale * peakIndexScale)] || 0;
            const h = Math.round((peak / 1) * halfH);
            this.canvasContexts['waveform'].fillRect(
              i + this.halfPixel,
              halfH - h + offsetY,
              bar + this.halfPixel,
              h * 2
            );
          }
          resolve();
        }
      );
    });
  }

  prepareDraw(peaks, start, end, fn) {
    return requestAnimationFrame(() => {
      // Bar wave draws the bottom only as a reflection of the top,
      // so we don't need negative values
      const hasMinVals = peaks.some(val => val < 0);
      const height = HEIGHT - SPACING * 2 * this.pixelRatio;
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

  handleMouseDown(evt) {
    const touch = evt.touches;
    const x =
      (touch ? evt.touches[0] : evt).clientX -
      this.boundingClientRect.left +
      this.container.parentNode.scrollLeft;

    const duration = this.getDuration();

    const startPos = (this.width / duration) * this.state.start + SPACING;
    const startBoundaryRange = [
      startPos + BAR_HANDLE_RADIUS,
      startPos - BAR_HANDLE_RADIUS,
    ];
    const inStartBoundaryRange =
      x <= startBoundaryRange[0] && x >= startBoundaryRange[1];
    const endPos = (this.width / duration) * this.state.end + SPACING;
    const endBoundaryRange = [
      endPos + BAR_HANDLE_RADIUS,
      endPos - BAR_HANDLE_RADIUS,
    ];
    const inEndBoundaryRange =
      x <= endBoundaryRange[0] && x >= endBoundaryRange[1];

    const boundary = inStartBoundaryRange
      ? 'start'
      : inEndBoundaryRange
        ? 'end'
        : null;

    if (boundary) {
      this.setState({
        hovering: false,
        dragging: {
          boundary,
          position: x,
        },
      });
      this.container.addEventListener(
        'mouseup',
        this.handleMouseUp,
        this.evtHandlerOptions
      );
      this.container.addEventListener(
        'touchend',
        this.handleMouseUp,
        this.evtHandlerOptions
      );
    }
  }

  handleMouseMove(evt) {
    const touch = evt.touches;
    if (this.state.dragging) {
      requestAnimationFrame(() => {
        if (!this.state.dragging) {
          return;
        }

        const duration = this.getDuration();
        const boundary = this.state.dragging.boundary;
        const xContainer =
          (touch ? evt.touches[0] : evt).clientX -
          this.boundingClientRect.left +
          this.container.parentNode.scrollLeft;
        const delta = xContainer - this.state.dragging.position;

        const boundaryPos =
          (this.width / duration) * this.state[boundary] + SPACING;
        const newBoundaryPos =
          boundary === 'start'
            ? Math.max(
              SPACING,
              Math.min(this.width + SPACING, boundaryPos + delta)
            )
            : Math.min(
              this.width + SPACING,
              Math.max(SPACING, boundaryPos + delta)
            );

        const canvasCtx = this.canvasContexts[boundary];
        canvasCtx.clearRect(0, 0, this.containerWidth, CONTAINER_HEIGHT);
        this.drawBoundary(canvasCtx, newBoundaryPos);
      });
      return;
    }

    // Disacard hovering for touch events.
    if (touch) {
      return;
    }

    const x =
      evt.clientX -
      this.boundingClientRect.left +
      this.container.parentNode.scrollLeft;
    const duration = this.getDuration();

    const startPos = (this.width / duration) * this.state.start + SPACING;
    const startBoundaryRange = [
      startPos + BAR_HANDLE_RADIUS,
      startPos - BAR_HANDLE_RADIUS,
    ];
    const inStartBoundaryRange =
      x <= startBoundaryRange[0] && x >= startBoundaryRange[1];
    const endPos = (this.width / duration) * this.state.end + SPACING;
    const endBoundaryRange = [
      endPos + BAR_HANDLE_RADIUS,
      endPos - BAR_HANDLE_RADIUS,
    ];
    const inEndBoundaryRange =
      x <= endBoundaryRange[0] && x >= endBoundaryRange[1];

    const boundary = inStartBoundaryRange
      ? 'start'
      : inEndBoundaryRange
        ? 'end'
        : null;

    if (!this.state.hovering && boundary) {
      this.setState({
        hovering: true,
      });
      return;
    }

    if (this.state.hovering && !boundary) {
      this.setState({
        hovering: false,
      });
    }
  }

  async handleMouseUp(evt) {
    const boundary = this.state.dragging.boundary;

    const xContainer =
      (evt.changedTouches ? evt.changedTouches[0] : evt).clientX -
      this.boundingClientRect.left +
      this.container.parentNode.scrollLeft;
    this.container.removeEventListener(
      'touchend',
      this.handleMouseUp,
      this.evtHandlerOptions
    );
    this.container.removeEventListener(
      'mouseup',
      this.handleMouseUp,
      this.evtHandlerOptions
    );
    const x =
      boundary === 'start'
        ? Math.max(0, xContainer - SPACING)
        : Math.min(this.width, xContainer - SPACING);

    const time = Math.max((this.getDuration() / this.width) * x, 0);
    const slice = this.setSliceBoundary(boundary, time);
    this.setState({ dragging: null, start: slice.start, end: slice.end });

    // FIXME:
    // Dirty fix in case `start` boundary is put after `end` boundary.
    // Prefer re-drawing the correct boundaries on the matching canvas.
    if (slice.swap) {
      const startCanvas = this.canvases.start;
      const endCanvas = this.canvases.end;
      this.canvases.start = endCanvas;
      this.canvases.end = startCanvas;

      const startCtx = this.canvasContexts.start;
      const endCtx = this.canvasContexts.end;
      this.canvasContexts.start = endCtx;
      this.canvasContexts.end = startCtx;
    }
  }

  handleSourceTimeUpdate() {
    if (!this.drawn) return;

    requestAnimationFrame(() => {
      const duration = this.getDuration();

      const x = Math.round((this.width / duration) * this.audio.currentTime);
      const startX = Math.round((this.width / duration) * this.state.start);
      const width = x - startX;

      const canvasCtx = this.canvasContexts['progress'];

      if (!width) {
        canvasCtx.clearRect(0, 0, this.width, HEIGHT);
        return;
      }

      const partial = this.canvasContexts['waveform'].getImageData(
        startX,
        0,
        width,
        HEIGHT
      );
      const imageData = partial.data;

      const progressColor = hexToRGB(SLICE_COLOR);
      // Loops through all of the pixels and modifies the components.
      for (let i = 0, n = imageData.length; i < n; i += 4) {
        imageData[i] = progressColor[0]; // Red component
        imageData[i + 1] = progressColor[1]; // Green component
        imageData[i + 2] = progressColor[2]; // Blue component
        //pix[i+3] is the transparency.
      }

      canvasCtx.clearRect(0, 0, this.width, HEIGHT);
      canvasCtx.putImageData(partial, startX, 0);
    });
  }

  drawBoundary(canvasCtx, x) {
    canvasCtx.fillStyle = SLICE_COLOR;
    canvasCtx.fillRect(x, 0, BAR_WIDTH / 2, HEIGHT);
    canvasCtx.beginPath();
    canvasCtx.arc(
      x + BAR_CENTER,
      HEIGHT - BAR_HANDLE_RADIUS,
      BAR_HANDLE_RADIUS,
      0,
      2 * Math.PI
    );
    canvasCtx.fill();
    canvasCtx.beginPath();
    canvasCtx.arc(
      x + BAR_CENTER,
      BAR_HANDLE_RADIUS,
      BAR_HANDLE_RADIUS,
      0,
      2 * Math.PI
    );
    canvasCtx.fill();

    const time = Math.max((this.getDuration() / this.width) * (x - SPACING), 0);
    const formattedTime = formatTime(time);
    const textSpacing = BAR_HANDLE_RADIUS + SPACING / 2;
    const textX =
      this.width - x < TIME_ANNOTATION_WIDTH + textSpacing
        ? x - TIME_ANNOTATION_WIDTH - textSpacing
        : x + textSpacing;
    const textY = FONT_SIZE;
    canvasCtx.fillText(formattedTime, textX, textY);
  }

  /* eslint-disable indent */
  render() {
    const style = `height:${CONTAINER_HEIGHT}px;${
      this.state.dragging ? 'overflow-x: hidden; touch-action: none;' : ''
    }`;

    return this.html`
    <div
      id="WaveForm"
      onconnected=${this}
      ondisconnected=${this}
      style="${style}"
      class="${
        this.state.dragging || this.state.hovering ? 'cursor-grabbing' : ''
      }"
    >
      <div>
        ${this.state.canvases || ''}
      </div>
    </div>
    `;
  }
}

module.exports = WaveForm;
