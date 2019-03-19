const { Component, wire } = require('hypermorphic');
const { encode } = require('punycode');
const Upload = require('./Upload');
const LinkForm = require('./Link/Form');
const LocalPlay = require('./LocalPlay');
const List = require('./List');
const getDisplayName = require('../helpers/getDisplayName');

const initialState = {
  linkLoading: false,
  localPlay: undefined,
};

class Home extends Component {
  constructor() {
    super();
    this.state = Object.assign({}, initialState);
    this.upload = new Upload(this.onFileValid.bind(this, 'upload'));
    this.link = new LinkForm({
      onFileValid: this.onFileValid.bind(this, 'link'),
      loadingCallback: this.onLinkLoading.bind(this),
    });
    this.slices = new List('slice');
    this.sounds = new List('sound');
  }

  onconnected() {
    document.title = 'Sound Slice';
  }

  onFileValid(type, file, from) {
    const filename = file.name;
    const newTitle = `${getDisplayName(filename)} | Sound Slice`;
    document.title = newTitle;
    const encodedName = encode(filename);
    const historyState = { filename: encodedName };
    if (type === 'upload') {
      const pathname = `/play?title=${encodedName}`;
      history.pushState(historyState, document.title, pathname);
    } else if (from) {
      const pathname = `/link?title=${encodedName}&from=${from}`;
      history.pushState(historyState, document.title, pathname);
    }

    this.setState({
      localPlay: new LocalPlay({
        file,
        type,
        disconnectCallback: this.onconnected,
      }),
    });
  }

  onLinkLoading(loading) {
    this.setState({
      linkLoading: loading,
    });
  }

  decorateContent(...children) {
    return this.html`
      <section onconnected=${this}>
        ${children}
      </section>
    `;
  }

  render() {
    if (this.state.linkLoading) {
      return this.decorateContent(this.link);
    }

    if (this.state.localPlay) {
      return this.decorateContent(this.state.localPlay);
    }

    return this.decorateContent(
      wire()`<h1>Extract sound memes in the browser</h1>`,
      wire()`<p>
        Sound Slice lets you listen, extract, download and share specific moments of a song or an external audio source.
      </p>`,
      this.upload,
      this.link,
      this.slices,
      this.sounds
    );
  }
}

module.exports = Home;
