/* eslint-disable indent */
/* prettier-ignore-start */
const { Component, wire } = require('hypermorphic');

const ErrorMessage = require('../ErrorMessage');
const Loader = require('../Loader');
const CloudDownload = require('../Icons/CloudDownload');

const linkPath = '/api/link';

const initialState = {
  error: false,
  hasValue: false,
  loading: false,
  file: undefined,
};

class LinkForm extends Component {
  constructor({ onFileValid, loadingCallback } = {}) {
    super();
    this.onFileValid = onFileValid;
    this.loadingCallback = loadingCallback;
    this.state = Object.assign({}, initialState);
    this.handleChange = this.handleChange.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.formWire = wire();
  }

  onconnected() {
    this.link = document.getElementById('link');
    this.loader = Loader('Extracting audio... Please wait.');
    this.errorMessage = ErrorMessage(
      'Unable to extract audio from this source at this time.'
    );

    const initialValue = new URLSearchParams(window.location.search).get(
      'from'
    );
    if (initialValue) {
      this.link.value = initialValue;
      if (this.link.checkValidity()) {
        this.handleSubmit();
      } else {
        this.link.focus();
      }
    }
    this.handleChange();
  }

  reset() {
    this.setState(initialState);
  }

  handleReset() {
    const historyState = { value: '' };
    document.title = 'Sound Slice';
    history.pushState(historyState, document.title, '/link');
    this.reset();
  }

  handleChange() {
    const value = this.link.value;
    if (value && !this.state.hasValue) {
      this.setState({ hasValue: true });
    }

    if (!value && this.state.hasValue) {
      this.handleReset();
    }
  }

  async handleSubmit(evt) {
    if (evt) evt.preventDefault();

    const value = this.link.value;

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

    this.setState({
      loading: true,
      error: false,
    });
    if (typeof this.loadingCallback === 'function') {
      this.loadingCallback(true);
    }

    try {
      const response = await fetchPromise;
      if (response.status !== 201) {
        throw response;
      }

      const blob = await response.blob();
      const filename = response.headers
        .get('content-disposition')
        .match(/filename="(.+)"/)[1];
      const file = new File([blob], filename);

      if (typeof this.onFileValid === 'function') {
        this.onFileValid(file, value);
      }

      this.setState({
        file,
        loading: false,
        error: false,
      });
    } catch (err) {
      console.error(err);
      this.setState({
        error: true,
        loading: false,
      });
    } finally {
      if (typeof this.loadingCallback === 'function') {
        this.loadingCallback(false);
      }
    }
  }

  decorateContent(...children) {
    return this.html`
      <div onconnected=${this}>
        ${children}
      </div>
    `;
  }

  render() {
    const state = this.state;

    if (state.loading) {
      return this.decorateContent(this.loader);
    }

    return this.decorateContent(this.formWire`
      <form onSubmit=${this.handleSubmit}
            method="get"
            action="/link"
      >
        <fieldset>
          <legend>
            <span>Link to an external media (YouTube, ...)</span>
            <em>Audio will be extracted for you to slice</em>
          </legend>
          ${state.error ? ErrorMessage() : ''}
          <label for="link">
            URL
          </label>
          <input onInput=${this.handleChange}
                 type="url"
                 id="link"
                 name="link"
          />
        </fieldset>
        <p class="button-container flex flex-wrap flex-justify-content-end">
          <button type="submit"
                  disabled=${!state.hasValue}
                  class="button--withicon"
          >
            ${CloudDownload()}
            <span>Extract audio</span>
          </button>
        </p>
      </form>
    `);
  }
}

module.exports = LinkForm;
