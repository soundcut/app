import { Component } from 'hypermorphic';

import Source from './Source/index.js';
import ErrorMessage from './ErrorMessage.js';
import getDisplayName from '../helpers/getDisplayName.js';
import { getItem } from '../helpers/indexedDB.js';

const initialState = {
  source: undefined,
  error: undefined,
  item: undefined,
};

export default class Saved extends Component {
  constructor({ id, type }) {
    super();
    this.id = id;
    this.type = type;
    this.state = Object.assign({}, initialState);
  }

  async onconnected() {
    try {
      const item = await getItem({ store: 'file', key: this.id });
      const filename = item.file.name;
      const newTitle = `${getDisplayName(filename)} | Soundcut`;
      document.title = newTitle;

      this.setState({
        item,
        source: new Source({
          type: this.type,
          file: item.file,
          saved: this.id,
        }),
      });
    } catch (err) {
      const error = ['Unable to retrieve this item :(', err.message];
      this.setState({
        error,
      });
    }
  }

  decorateContent(...children) {
    return this.html`<section onconnected=${this}>${children}</section>`;
  }

  render() {
    if (this.state.error) {
      return this.decorateContent(ErrorMessage(this.state.error));
    }

    if (!this.state.item) {
      return this.decorateContent('');
    }

    return this.decorateContent(this.state.source);
  }
}
