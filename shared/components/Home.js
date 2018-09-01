const { Component } = require('hypermorphic');

class Home extends Component {
  constructor(...args) {
    super(...args);
  }

  render() {
    return this.html`
      <section id="home">
        <p class="flex flex-justify-content-center">
          <a href="/link"
             onclick=${this.set}
             class="button"
          >
            Link
          </a>
          <a href="/upload"
             onclick=${this.set}
             class="button"
          >
            Upload
          </a>
        </p>
      </section>
    `;
  }
}

module.exports = Home;
