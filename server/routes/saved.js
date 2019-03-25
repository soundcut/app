const { wire } = require('hypermorphic');
const Saved = require('../../shared/components/Saved');
const view = require('../../shared/views/default');

const title = 'Sound Slice';

function saved(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html',
  });

  res.write(
    view(wire(), {
      path: req.path,
      title: title,
      main: new Saved(req.params),
    })
  );
  res.end();
}

module.exports = saved;
