const { Component } = require('hypermorphic');

const LocalPlay = require('./LocalPlay');
const ErrorMessage = require('./ErrorMessage');
const getDisplayName = require('../helpers/getDisplayName');
const { getItem } = require('../helpers/indexedDB');

const initialState = {
  localplay: undefined,
  error: undefined,
  item: undefined,
};

class Saved extends Component {
  constructor({ id, type }) {
    super();
    this.id = id;
    this.type = type;
    this.state = Object.assign({}, initialState);
  }

  async onconnected() {
    try {
      const item = await getItem({ store: this.type, key: this.id });
      const filename = item.file.name;
      const newTitle = `${getDisplayName(filename)} | Sound Slice`;
      document.title = newTitle;

      this.setState({
        item,
        localplay: new LocalPlay({
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
