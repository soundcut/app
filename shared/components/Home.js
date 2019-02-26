const { Component, wire } = require('hypermorphic');
const Upload = require('./Upload');
const LinkForm = require('./Link/Form');
const LocalPlay = require('./LocalPlay');

const initialState = {
  linkLoading: false,
  localPlay: undefined,
};

class Home extends Component {
  constructor() {
    super();
    this.state = Object.assign({}, initialState);
    this.onFileValid = this.onFileValid.bind(this);
    this.onLinkLoading = this.onLinkLoading.bind(this);
    this.upload = new Upload(this.onFileValid);
    this.link = new LinkForm({
      onFileValid: this.onFileValid,
      loadingCallback: this.onLinkLoading,
    });
  }

  onconnected() {
    window.document.title = 'Sound Slice';
  }

  onFileValid(file) {
    this.setState({
      localPlay: new LocalPlay({ file }),
    });
  }

  onLinkLoading(loading) {
    this.setState({
      linkLoading: loading,
    });
  }

  decorateContent(...children) {
    return this.html`
      <section connected=${this}>
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
      wire()`<p>
        Sound Slice allows you to listen, extract, download and share specific moments of a song or an external audio source.
      </p>`,
      this.upload,
      this.link
    );
  }
}

module.exports = Home;
