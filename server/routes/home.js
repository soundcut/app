const { wire } = require('hypermorphic');
const Home = require('../../shared/components/Home');
const view = require('../../shared/views/default');

const title = 'Sound Slice';

function home(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html',
  });

  res.write(
    view(wire(), {
      path: req.path,
      title: title,
      main: new Home(),
    })
  );
  res.end();
}

module.exports = home;
