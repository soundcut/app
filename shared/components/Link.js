/* eslint-disable indent */
/* prettier-ignore-start */
const { Component, wire } = require('hypermorphic');

const LocalPlay = require('./LocalPlay');
const Slice = require('./Slice');
const WaveForm = require('./WaveForm');
const getDisplayName = require('../helpers/getDisplayName');

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
  constructor(title) {
    super();
    this.pageTitle = title;
    this.handleChange = this.handleChange.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onMediaLoaded = this.onMediaLoaded.bind(this);
  }

  onconnected() {
    this.setState(initialState);
    this.source = document.getElementById('source');
    const initialValue = new URLSearchParams(location.search).get('from');
    if (initialValue) {
      this.source.value = initialValue;
      if (this.source.checkValidity()) {
        this.handleSubmit();
      }
    } else {
      this.source.focus();
    }
    this.handleChange();
  }

  handleReset() {
    const historyState = { value: '' };
    history.pushState(historyState, this.pageTitle, '/link');
    document.title = this.pageTitle;
    this.localPlay = undefined;
    this.slice = undefined;
    this.setState(initialState);
  }

  handleChange() {
    const value = this.source.value;
    if (value && !this.state.hasValue) {
      this.setState({ hasValue: true });
    }

    if (!value && this.state.hasValue) {
      this.handleReset();
    }
  }

  async handleSubmit(evt) {
    if (evt) evt.preventDefault();

    const value = this.source.value;
    const historyState = { value };
    const pathname = `/link?from=${value}`;
    history.pushState(historyState, this.pageTitle, pathname);
    document.title = this.pageTitle;

    if (this.state.file) {
      this.setState({ file: undefined });
    }

    const fetchPromise = fetch(linkPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        url: value,
      }),
    });

    this.setState({ loading: true });
    try {
      const response = await fetchPromise;
      if (response.status !== 201) {
        throw response;
      }

      const blob = await response.blob();
      const filename = response.headers.get('x-title');
      const file = new File([blob], filename);
      const newHistoryState = { value, title: filename };
      const newTitle = `${getDisplayName(filename)} | ${this.pageTitle}`;
      history.replaceState(newHistoryState, newTitle, pathname);
      document.title = newTitle;

      this.localPlay = new LocalPlay({
        file,
        autoplay: true,
        onMediaLoaded: this.onMediaLoaded,
      });

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

  onMediaLoaded(audio) {
    this.slice = new Slice(audio, this.state.file);
    this.waveForm = new WaveForm(audio, this.state.file);
    this.render();
  }

  render() {
    const state = this.state;
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
          ${[state.error ? ErrorMessage() : '']}
          <label for="source">
            URL
          </label>
          <input onInput=${this.handleChange}
                 type="url"
                 id="source"
                 name="source"
                 disabled=${state.loading}
          />
        </fieldset>
        <p class="button-container flex flex-wrap flex-justify-content-center">
          <button type="reset"
                  disabled=${state.loading}
          >
            Reset
          </button>
          <button type="submit"
                  disabled=${!state.hasValue || state.loading}
                  title="${
                    state.loading ? 'This can take up to a minute...' : ''
                  }"
          >
            ${state.loading ? 'Extracting audio...' : 'Extract audio'}
          </button>
        </p>
        ${[this.localPlay || '']}
        ${[this.waveForm || '']}
        ${[this.slice || '']}
      </form>
    `;
  }
}

module.exports = Link;
