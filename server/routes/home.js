const { wire } = require('hypermorphic');
const Home = require('../../shared/components/Home');
const view = require('../../shared/views/default');

function home(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html',
  });

  res.write(
    view(wire(), {
      main: new Home(),
      url: res.locals.url,
      assetPath: res.app.locals.assetPath,
      title: `${req.app.locals.title} | Extract sound memes in the browser`,
      description: req.app.locals.description,
    })
  );
  res.end();
}

module.exports = home;
