const { Component, wire } = require('hypermorphic');

class Volume extends Component {
  constructor(audio) {
    super();
    this.state = {
      audio,
    };
    this.handleVolumeChange = this.handleVolumeChange.bind(this);
  }

  handleVolumeChange(evt) {
    const target = evt.target;
    const value = target.value;

    const parsedValue = Math.floor(Number.parseInt(value, 10)) / 100;
    if (!isNaN(parsedValue) && this.state.audio.volume !== parsedValue) {
      this.state.audio.volume = parsedValue;
      this.render();
    } else {
      evt.preventDefault();
    }
  }

  render() {
    const state = this.state;

    return this.html`
        <p>
          <label for="volume-slider">Volume</label>
          <input type="range"
                  id="volume-slider"
                  min="0"
                  max="100"
                  value="${Math.floor(state.audio.volume * 100)}"
                  step="1"
                  aria-valuemin="1"
                  aria-valuemax="100"
                  aria-valuenow="${Math.floor(state.audio.volume * 100)}"
                  onInput=${this.handleVolumeChange}
          >
          <output for="volume-slider" id="volume">
            ${`${Math.floor(state.audio.volume * 100)}/100`}
          </output>
        </p>
    `;
  }
}

module.exports = Volume;
