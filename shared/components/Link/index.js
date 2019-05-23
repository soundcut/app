import { Component } from 'hypermorphic';
import { encode } from 'punycode';

import LinkForm from './Form.js';
import Source from '../Source/index.js';
import getDisplayName from '../../helpers/getDisplayName.js';

const initialState = {
  source: undefined,
};

export default class Link extends Component {
  constructor() {
    super();
    this.state = Object.assign({}, initialState);
    this.onFileValid = this.onFileValid.bind(this);
    this.link = new LinkForm({
      onFileValid: this.onFileValid,
    });
  }

  onconnected() {
    document.title = 'Soundcut | Link external media';
  }

  onFileValid(file) {
    const filename = file.name;
    const newTitle = `${getDisplayName(filename)} | Soundcut`;
    document.title = newTitle;
    const encodedName = encode(file.name);
    const historyState = { filename: encodedName };
    const from = new URL(document.location).searchParams.get('from');
    const pathname = `/link?title=${encodedName}&from=${from}`;
    history.replaceState(historyState, document.title, pathname);
    this.setState({
      source: new Source({ file, type: 'link' }),
    });
  }

  decorateContent(...children) {
    return this.html`<section connected=${this}>${children}</section>`;
  }

  render() {
    if (this.state.source) {
      return this.decorateContent(this.state.source);
    }

    return this.decorateContent(this.link);
  }
}
