const { Component } = require('hypermorphic');

class Volume extends Component {
  constructor(audio) {
    super();
    this.audio = audio;
    this.handleVolumeChange = this.handleVolumeChange.bind(this);
  }

  handleVolumeChange(evt) {
    const target = evt.target;
    const value = target.value;

    const parsedValue = Math.floor(Number.parseInt(value, 10)) / 100;
    if (!isNaN(parsedValue) && this.audio.volume !== parsedValue) {
      this.audio.volume = parsedValue;
      this.render();
    } else {
      evt.preventDefault();
    }
  }

  render() {
    return this.html`
        <p class="Volume">
          <label for="volume-slider">Volume</label>
          <input type="range"
                  id="volume-slider"
                  min="0"
                  max="100"
                  value="${Math.floor(this.audio.volume * 100)}"
                  step="1"
                  aria-valuemin="1"
                  aria-valuemax="100"
                  aria-valuenow="${Math.floor(this.audio.volume * 100)}"
                  onInput=${this.handleVolumeChange}
          >
          <output for="volume-slider" id="volume">
            ${`${Math.floor(this.audio.volume * 100)}/100`}
          </output>
        </p>
    `;
  }
}

module.exports = Volume;
