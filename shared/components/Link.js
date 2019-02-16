/* eslint-disable indent */
/* prettier-ignore-start */
const { Component, wire } = require('hypermorphic');

const LocalPlay = require('./LocalPlay');
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

  reset() {
    this.localPlay = undefined;
    this.setState(initialState);
    this.source.focus();
  }

  handleReset() {
    const historyState = { value: '' };
    history.pushState(historyState, this.pageTitle, '/link');
    document.title = this.pageTitle;
    this.reset();
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
      this.reset();
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
            <span>Link to an external media (YouTube, ...)</span>
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
      </form>
    `;
  }
}

module.exports = Link;
