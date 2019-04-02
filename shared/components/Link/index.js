const { Component } = require('hypermorphic');
const { encode } = require('punycode');

const LinkForm = require('./Form');
const Source = require('../Source');
const getDisplayName = require('../../helpers/getDisplayName');

const initialState = {
  source: undefined,
};

class Link extends Component {
  constructor() {
    super();
    this.state = Object.assign({}, initialState);
    this.onFileValid = this.onFileValid.bind(this);
    this.link = new LinkForm({
      onFileValid: this.onFileValid,
    });
  }

  onconnected() {
    document.title = 'Sound Slice | Link external media';
  }

  onFileValid(file) {
    const filename = file.name;
    const newTitle = `${getDisplayName(filename)} | Sound Slice`;
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

module.exports = Link;
