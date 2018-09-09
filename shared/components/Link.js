/* eslint-disable indent */
/* prettier-ignore-start */
const { Component, wire } = require('hypermorphic');
const LocalPlay = require('./LocalPlay');

const linkPath = '/api/link';

const initialState = {
  error: false,
  hasValue: false,
  loading: false,
  file: undefined,
};

function ErrorMessage() {
  return wire()`<p>Oops! Something went wrong.</p>`;
}

class Link extends Component {
  constructor(...args) {
    super(...args);
    this.handleChange = this.handleChange.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  onconnected() {
    this.setState(initialState);
    this.source = document.getElementById('source');
    this.source.focus();
  }

  handleReset() {
    this.setState(initialState);
  }

  handleChange() {
    const value = this.source.value;
    if (value && !this.state.hasValue) {
      this.setState({ hasValue: true });
    }

    if (!value && this.state.hasValue) {
      this.setState({ hasValue: false });
    }
  }

  async handleSubmit(evt) {
    evt.preventDefault();
    const url = this.source.value;

    if (this.state.file) {
      this.setState({ file: undefined });
    }

    const fetchPromise = fetch(linkPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        url,
      }),
    });

    if (url) {
      this.setState({ loading: true });
      try {
        const response = await fetchPromise;
        if (response.status !== 201) {
          throw response;
        }

        const blob = await response.blob();
        const file = new File([blob], response.headers.get('x-title'));
        this.setState({
          file,
          loading: false,
        });
      } catch (err) {
        console.error(err);
        this.setState({
          error: true,
          loading: false,
        });
      }
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
          ${[this.state.error ? ErrorMessage() : '']}
          <label for="source">
            URL
          </label>
          <input onInput=${this.handleChange}
                 type="url"
                 id="source"
                 name="source"
                 disabled=${this.state.loading}
          />
        </fieldset>
        <p class="button-container flex flex-wrap flex-justify-content-center">
          <button type="reset"
                  disabled=${this.state.loading}
          >
            Reset
          </button>
          <button type="submit"
                  disabled=${!this.state.hasValue || this.state.loading}
                  title="${
                    this.state.loading ? 'This can take up to a minute...' : ''
                  }"
          >
            ${this.state.loading ? 'Extracting audio...' : 'Extract audio'}
          </button>
        </p>
        ${[this.state.file ? new LocalPlay(this.state.file) : '']}
      </form>
    `;
  }
}

module.exports = Link;
