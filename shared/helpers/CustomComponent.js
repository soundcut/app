const { Component } = require('hypermorphic');

// relate components getters once
const getters = new WeakMap();

// the CustomComponent helper
function createGetter(self, html) {
  let setup = true;
  const wrap = (...args) => {
    const el = html.apply(self, args);
    if (setup) {
      setup = false;
      self.el = el;
      el.owner = self;
    }
    return el;
  };
  getters.set(self, wrap);
  return wrap;
}

// a friendly companion that doesn't need
// real DOM to have crustom elements (works in node.js too)
module.exports = class CustomComponent extends Component {
  onconnected(event) {
    const el = event.currentTarget;
    if (!this.connectedCallback || el.connectedCallback) return;
    this.connectedCallback();
  }

  ondisconnected(event) {
    const el = event.currentTarget;
    if (!this.disconnectedCallback || el.disconnectedCallback) return;
    this.disconnectedCallback();
  }

  get html() {
    return getters.get(this) || createGetter(this, super.html);
  }
  set html(html) {
    super.html = html;
  }
};
