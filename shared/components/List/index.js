const { Component, wire } = require('hypermorphic');
const ListItem = require('./Item');
const { getAllItems } = require('../../helpers/indexedDB');

const initialState = {
  items: [],
};

function getTitle(type) {
  let title;
  switch (type) {
  case 'slice':
    title = 'Your saved slices';
    break;
  case 'sound':
    title = 'Your saved sounds';
    break;
  case 'shared':
    title = 'Your saved shares';
    break;
  default:
    title = 'Your saved things';
    break;
  }

  return title;
}

class List extends Component {
  constructor(type) {
    super();
    this.type = type;
    this.state = Object.assign({}, initialState);
    this.renderItem = this.renderItem.bind(this);
  }

  async onconnected() {
    const items = await getAllItems(this.type);

    this.setState({
      items,
    });
  }

  decorateContent(...children) {
    return this.html`
      <section onconnected=${this} class="List">
        ${children}
      </section>
    `;
  }

  renderItem(item) {
    return ListItem({ type: this.type, item });
  }

  render() {
    if (!this.state.items.length) {
      return this.decorateContent('');
    }

    const title = wire()`<h2>${getTitle(this.type)}</h2>`;
    const items = wire()`
      <ul>
        ${this.state.items.map(this.renderItem)}
      </ul>
    `;

    return this.decorateContent(title, items);
  }
}

module.exports = List;
