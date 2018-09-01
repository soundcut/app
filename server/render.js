const { async, wire } = require('viperhtml');
const path = require('path');
const view = new Proxy(
  new String(path.join(__dirname, '..', '..', 'shared', 'view')),
  { get: (base, module) => require(base + path.sep + module) }
);

const renderers = {
  page: async(),
  header: wire(),
};

module.exports = {
  // async wires - parent
  page: (chunks, model) => view.index(renderers.page(chunks), model),

  // async wires - children
  item: model => view.item(async(model)(), model),
  comment: model => view.comment(async(model)(), model),

  // runtime wires
  summary: model => view.summary(wire(model), model),

  // single wires
  header: model => view.header(renderers.header, model),
};
