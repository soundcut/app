/* eslint-disable indent */
/* prettier-ignore-start */
const { Component, wire } = require('hypermorphic');
const LocalPlay = require('./LocalPlay');

function getFilePath(id) {
  return `/api/slice/${id}`;
}

function ErrorMessage() {
  return wire()`<p>Oops! Something went wrong.</p>`;
}

const initialState = {
  error: false,
  loading: false,
  file: undefined,
};

function Loading() {
  return wire()`<p>Loading...</p>`;
}

class Shared extends Component {
  constructor(id) {
    super();
    this.id = id;
  }

  onconnected() {
    window.document.title = 'Listen to slice | Sound Slice';

    this.setState(initialState);
    this.fetchSlice();
  }

  async fetchSlice() {
    const url = getFilePath(this.id);

    const fetchPromise = fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'audio/mpeg; charset=utf-8',
      },
    });

    this.setState({ loading: true, error: false });
    try {
      const response = await fetchPromise;
      if (response.status !== 200) {
        throw response;
      }

      const blob = await response.blob();
      const filename = response.headers
        .get('content-disposition')
        .match(/filename="(.+)"/)[1];
      const file = new File([blob], filename);
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
    const file = state.file;

    return this.html`
      <div onconnected=${this}>
        ${state.error ? ErrorMessage() : ''}
        ${state.loading ? Loading() : ''}
        ${file ? new LocalPlay({ file, type: 'shared' }) : ''}
      </div>
    `;
  }
}

module.exports = Shared;
