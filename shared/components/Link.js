/* eslint-disable indent */
/* prettier-ignore-start */
const { Component, wire } = require('hypermorphic');

const linkPath = '/api/link';

const initialState = {};

class Link extends Component {
  constructor(...args) {
    super(...args);
    this.handleChange = this.handleChange.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  onconnected() {
    this.setState(initialState);
    document.getElementById('source').focus();
  }

  handleReset() {
    this.setState(initialState);
  }

  handleChange(evt) {
    const target = evt.target;
  }

  handleSubmit(evt) {
    evt.preventDefault();
    const url = document.getElementById('source').value;

    if (url) {
      fetch(linkPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          url,
        }),
      });
    }
  }

  render() {
    return this.html`
      <form onconnected=${this}
            onSubmit=${this.handleSubmit}
            onReset=${this.handleReset}
            method="get"
            action="/link"
      >
        <fieldset>
          <legend>
            Link to an external media (YouTube, ...)
            <em>Audio will be extracted for you to slice</em>
          </legend>
          <label for="source">
            URL
          </label>
          <input onChange=${this.handleChange}
                 type="url"
                 id="source"
                 name="source"
          />
        </fieldset>
        <p class="flex flex-justify-content-center">
          <button type="reset">
            Reset
          </button>
          <button type="submit">
            Extract audio
          </button>
        </p>
      </form>
    `;
  }
}

module.exports = Link;
