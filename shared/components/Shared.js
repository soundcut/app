/* eslint-disable indent */
/* prettier-ignore-start */
import { Component } from 'hypermorphic';

import Source from './Source/index.js';
import ErrorMessage from './ErrorMessage.js';
import Loader from './Loader.js';
import fetchSlice from '../helpers/fetchSlice.js';

const initialState = {
  error: false,
  loading: false,
  file: undefined,
  owner: false,
};

export default class Shared extends Component {
  constructor(id) {
    super();
    this.id = id;
  }

  onconnected() {
    window.document.title = 'Listen to slice | Soundcut';

    this.setState(initialState);
    this.fetchSlice();
  }

  async fetchSlice() {
    this.setState({ loading: true, error: false });

    try {
      const { file, owner } = await fetchSlice(this.id);
      this.setState({
        file,
        owner,
        loading: false,
      });
    } catch (err) {
      this.setState({
        error: true,
        loading: false,
      });
    }
  }

  render() {
    const state = this.state;
    const file = state.file;
    const owner = state.owner;

    return this.html`
      <div onconnected=${this}>
        ${state.error ? ErrorMessage() : ''}
        ${state.loading ? Loader() : ''}
        ${
          file
            ? new Source({ shared: this.id, file, owner, type: 'shared' })
            : ''
        }
      </div>
    `;
  }
}
