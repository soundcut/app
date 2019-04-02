const { wire } = require('hypermorphic');
const Link = require('../../shared/components/Link');
const view = require('../../shared/views/default');

function link(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html',
  });

  res.write(
    view(wire(), {
      main: new Link(),
      url: res.locals.url,
      title: req.app.locals.title,
      assetPath: res.app.locals.assetPath,
      description: req.app.locals.description,
    })
  );
  res.end();
}

module.exports = link;
