const { Component } = require('hypermorphic');

const maxSliceLength = 90;

function arrayBufferToObjectURL(buffer, callback) {
  const blob = new Blob([buffer], { type: 'audio/mpeg' });
  setTimeout(() => callback(URL.createObjectURL(blob)), 0);
}

class Slice extends Component {
  constructor(audio, file) {
    super();
    this.file = file;
    this.state = {
      audio,
      start: 0,
      end: maxSliceLength,
      downloadInProgress: false,
    };
    this.handleSliceChange = this.handleSliceChange.bind(this);
    this.handleCreateClick = this.handleCreateClick.bind(this);
    this.handleDownloadClick = this.handleDownloadClick.bind(this);
  }

  ondisconnected() {
    this.state.audio = undefined;
    this.file = undefined;
    if (this.slice) {
      this.slice.pause();
      URL.revokeObjectURL(this.slice.currentSrc);
      this.slice = undefined;
    }
  }

  handleSliceChange(evt) {
    const target = evt.target;
    const value = target.value;

    const which = target.name;

    const parsedValue = Math.floor(Number.parseFloat(value, 10));
    const current = this.state[which];
    const opposite = which === 'start' ? 'end' : 'start';
    const diff = this.state[opposite] - parsedValue;
    const diffOK =
      which === 'start' ? diff <= maxSliceLength && diff > 0 : diff < 0;
    const validNumber = !isNaN(parsedValue);
    const notEqual = current !== parsedValue;
    const accept = validNumber && notEqual;

    if (accept) {
      this.setState({
        [which]: parsedValue,
      });
      if (!diffOK) {
        this.setState({
          [opposite]: which === 'start' ? parsedValue + 1 : parsedValue - 1,
        });
      }
    } else {
      this.setState({
        [which]: this.state[which],
      });
    }
  }

  handleCreateClick(evt) {
    evt.preventDefault();

    this.createSlice();
  }

  handleDownloadClick(evt) {
    evt.preventDefault();

    if (this.slice) {
      this.setState({ downloadInProgress: true });
      const src = this.slice.currentSrc;
      const link = document.createElement('a');
      link.style = 'display: none;';
      link.href = src;
      link.download = 'Slice.mp3';
      // Firefox appears to be require appending the element to the DOM..
      // but FileSaver.js does not need to and it still works for some reason.
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        this.setState({ downloadInProgress: false });
      }, 0);
    }
  }

  createSlice() {
    const state = this.state;

    let fileReader = new FileReader();
    fileReader.onloadend = () => {
      const sourceArrayBuffer = fileReader.result;
      const duration = state.end - state.start;
      const bytesPerSecond = Math.floor(
        sourceArrayBuffer.byteLength / state.audio.duration
      );
      const offset = Math.floor(state.start * bytesPerSecond);
      const length = Math.floor(duration * bytesPerSecond);
      const sliceArrayBuffer = sourceArrayBuffer.slice(offset, length);

      console.log('---------', {
        duration,
        bytesPerSecond,
        sliceArrayBuffer,
        sourceArrayBuffer,
        offset,
        length,
      });

      if (!sliceArrayBuffer.byteLength) {
        console.error('Empty sliceArrayBuffer', {
          sliceArrayBuffer,
          sourceArrayBuffer,
        });
        return;
      }

      if (this.slice) {
        this.slice.pause();
        this.slice = undefined;
      }

      arrayBufferToObjectURL(sliceArrayBuffer, result => {
        const slice = new Audio();
        this.slice = slice;
        slice.src = result;
        this.render();
        // slice.play();
      });
    };

    fileReader.readAsArrayBuffer(this.file);
  }

  render() {
    const state = this.state;

    return this.html`
      <div ondisconnected=${this}>
        <h3>
          Drag handles to slice
        </h3>
        <p>
          <label for="slice-start-slider">Slice start (s)</label>
          <input type="range"
                 name="start"
                 id="slice-start-slider"
                 min="0"
                 max="${state.audio.duration}"
                 value="${state.start}"
                 step="1"
                 aria-valuemin="0"
                 aria-valuemax="${state.audio.duration}"
                 aria-valuenow="${state.start}"
                 onChange=${this.handleSliceChange}
          >
          <output for="slice-start-slider" id="slice-start-output">
            ${state.start}/${state.audio.duration.toFixed(2)}
          </output>
        </p>
        <p>
          <label for="slice-end-slider">Slice end (s)</label>
          <input type="range"
                 name="end"
                 id="slice-end-slider"
                 min="0"
                 max="${state.audio.duration}"
                 value="${state.end}"
                 step="1"
                 aria-valuemin="0"
                 aria-valuemax="${state.audio.duration}"
                 aria-valuenow="${state.end}"
                 onChange=${this.handleSliceChange}
          >
          <output for="slice-end-slider" id="slice-end-output">
            ${state.end}/${state.audio.duration.toFixed(2)}
          </output>
        </p>
        <p>
          Slice duration: ${state.end - state.start}
        </p>
        <p>
          <button type="button" disabled>Play slice</button>
          <button type="button" disabled>Pause slice</button>
        </p>
        <p class="flex flex-justify-content-center">
          <button type="button"
                  onClick=${this.handleCreateClick}
          >
            Create a slice!
          </button>
          <button type="button"
                  onClick=${this.handleDownloadClick}
                  disabled=${!this.slice || this.state.downloadInProgress}
                  title=${
  !this.slice
    ? 'Select slice boundaries and click "Create a slice!" before you can download it.'
    : 'Your browser\'s download dialog should open instantly.'
}
          >
            Download slice!
          </button>
        </p>
      </div>
    `;
  }
}

module.exports = Slice;
