const { wire } = require('hypermorphic');
const Saved = require('../../shared/components/Saved');
const view = require('../../shared/views/default');

function saved(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html',
  });

  res.write(
    view(wire(), {
      main: new Saved(req.params),
      url: res.locals.url,
      title: req.app.locals.title,
      assetPath: res.app.locals.assetPath,
      description: req.app.locals.description,
    })
  );
  res.end();
}

module.exports = saved;
