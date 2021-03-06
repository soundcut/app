const { Component, wire } = require('hypermorphic');
const { encode } = require('punycode');
const Upload = require('./Upload');
const LinkForm = require('./Link/Form');
const Source = require('./Source');
const List = require('./List');
const getDisplayName = require('../helpers/getDisplayName');

const initialState = {
  linkLoading: false,
  source: undefined,
};

function Title() {
  return wire(Title)`<h1>Extract sound memes in the browser</h1>`;
}

function Description() {
  return wire(Description)`
    <p>
      Soundcut lets you listen, extract, download and share specific moments
      of a song or an external audio source.
    </p>
  `;
}

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
    document.title = 'Soundcut | Extract sound memes in the browser';
  }

  onFileValid(type, file, from) {
    const filename = file.name;
    const newTitle = `${getDisplayName(filename)} | Soundcut`;
    document.title = newTitle;
    const encodedName = encode(filename);
    const historyState = { filename: encodedName };
    if (type === 'upload') {
      /*
       * Firefox Mobile doesn't allow using `history.pushState`
       * between File retrieval and URL.createObjectURL()
       * https://gist.github.com/ziir/aa8ae3af995df6a40de0ead650a81ac3
       */
      const userAgent = navigator.userAgent.toLowerCase();
      const firefoxMobile = ['firefox', 'mobile'].every(
        word => userAgent.indexOf(word) > -1
      );
      if (!firefoxMobile) {
        const pathname = `/play?title=${encodedName}`;
        history.pushState(historyState, document.title, pathname);
      }
    } else if (from) {
      const pathname = `/link?title=${encodedName}&from=${from}`;
      history.pushState(historyState, document.title, pathname);
    }

    this.setState({
      source: new Source({
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
    return this.html`<section onconnected=${this}>${children}</section>`;
  }

  render() {
    if (this.state.linkLoading) {
      return this.decorateContent(this.link);
    }

    if (this.state.source) {
      return this.decorateContent(this.state.source);
    }

    return this.decorateContent(
      Title(),
      Description(),
      this.upload,
      this.link,
      this.slices,
      this.sounds
    );
  }
}

module.exports = Home;
