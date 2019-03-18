const { Component, wire } = require('hypermorphic');
const ListItem = require('./Item');
const { getAllItems } = require('../../helpers/indexedDB');
const getFileAudio = require('../../helpers/getFileAudio');

const initialState = {
  items: [],
};

class List extends Component {
  constructor() {
    super();
    this.state = Object.assign({}, initialState);
  }

  async onconnected() {
    const items = await getAllItems();

    this.setState({
      items,
    });

    this.state.items.forEach(async item => {
      try {
        const audio = await getFileAudio(item.file);
        item.duration = audio.duration;
        this.render();
      } catch (err) {
        console.error(err);
        // pass
      }
    });
  }

  decorateContent(...children) {
    return this.html`
      <section onconnected=${this} class="List">
        ${children}
      </section>
    `;
  }

  render() {
    if (!this.state.items.length) {
      return this.decorateContent('');
    }

    return this.decorateContent(
      wire()`<h2>Your saved slices</h2>`,
      wire()`
        <ul>
          ${this.state.items.map(ListItem)}
        </ul>
      `
    );
  }
}

module.exports = List;
