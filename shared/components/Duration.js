const { Component } = require('hypermorphic');

class Duration extends Component {
  constructor(audio) {
    super();
    this.state = {
      audio,
    };
    this.handleMediaTimeUpdate = this.handleMediaTimeUpdate.bind(this);
    this.handleTimeChange = this.handleTimeChange.bind(this);
  }

  onconnected() {
    this.state.audio.addEventListener('timeupdate', this.handleMediaTimeUpdate);
  }

  ondisconnected() {
    this.state.audio.removeEventListener(
      'timeupdate',
      this.handleMediaTimeUpdate
    );
    this.state.audio = undefined;
  }

  handleMediaTimeUpdate() {
    this.render();
  }

  handleTimeChange(evt) {
    const target = evt.target;
    const value = target.value;

    const parsedValue = Math.floor(Number.parseFloat(value, 10));
    const current = Math.floor(this.state.audio.currentTime);
    if (!isNaN(parsedValue) && current !== parsedValue) {
      this.state.audio.currentTime = parsedValue;
      this.render();
    } else {
      evt.preventDefault();
    }
  }

  render() {
    const state = this.state;
    const audio = state.audio;
    const currentTime = audio.currentTime.toFixed(2);
    const duration = audio.duration.toFixed(2);

    return this.html`
        <p onconnected=${this} ondisconnected=${this}>
          <label for="duration-slider">Duration (s)</label>
          <input type="range"
                 id="duration-slider"
                 min="0"
                 max="${Number.parseInt(audio.duration, 10)}"
                 value="${Number.parseInt(audio.currentTime, 10)}"
                 step="1"
                 aria-valuemin="0"
                 aria-valuemax="${Number.parseInt(audio.duration, 10)}"
                 aria-valuenow="${audio.currentTime}"
                 onInput=${this.handleTimeChange}
          >
          <output for="duration-slider" id="duration">
            ${`${currentTime}/${duration}`}
          </output>
        </p>
    `;
  }
}

module.exports = Duration;
