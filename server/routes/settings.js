const { wire } = require('hypermorphic');
const Settings = require('../../shared/components/Settings');
const view = require('../../shared/views/default');

function home(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html',
  });

  res.write(
    view(wire(), {
      main: new Settings(),
      url: res.locals.url,
      assetPath: res.app.locals.assetPath,
      title: `${req.app.locals.title} | Settings`,
      description: req.app.locals.description,
    })
  );
  res.end();
}

module.exports = home;
