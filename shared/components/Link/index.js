const { Component } = require('hypermorphic');
const LinkForm = require('./Form');
const LocalPlay = require('../LocalPlay');

const initialState = {
  localPlay: undefined,
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
    window.document.title = 'Sound Slice';
  }

  onFileValid(file) {
    this.setState({
      localPlay: new LocalPlay({ file }),
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
    if (this.state.localPlay) {
      return this.decorateContent(this.state.localPlay);
    }

    return this.decorateContent(this.link);
  }
}

module.exports = Link;
