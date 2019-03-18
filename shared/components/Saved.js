const { Component } = require('hypermorphic');
const LocalPlay = require('./LocalPlay');
const ErrorMessage = require('./ErrorMessage');
const { getItem } = require('../helpers/indexedDB');

const initialState = {
  localplay: undefined,
  error: undefined,
  item: undefined,
};

class Saved extends Component {
  constructor(id) {
    super();
    this.id = id;
    this.state = Object.assign({}, initialState);
  }

  async onconnected() {
    try {
      const item = await getItem(this.id);
      this.setState({
        item,
        localplay: new LocalPlay({ file: item.file }),
      });
    } catch (err) {
      const error = ['Unable to retrieve this slice :(', err.message];
      this.setState({
        error,
      });
    }
  }

  decorateContent(...children) {
    return this.html`
      <section onconnected=${this}>
        ${children}
      </section>
    `;
  }

  render() {
    if (this.state.error) {
      return this.decorateContent(ErrorMessage(this.state.error));
    }

    if (!this.state.item) {
      return this.decorateContent('');
    }

    return this.decorateContent(this.state.localplay);
  }
}

module.exports = Saved;
