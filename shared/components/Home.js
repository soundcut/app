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
             class="button"
          >
            Link
          </a>
          <a href="/upload"
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
