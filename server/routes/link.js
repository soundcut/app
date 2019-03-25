const { wire } = require('hypermorphic');
const Link = require('../../shared/components/Link');
const view = require('../../shared/views/default');

const title = 'Sound Slice';

function link(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html',
  });

  res.write(
    view(wire(), {
      path: req.path,
      title: title,
      main: new Link(),
    })
  );
  res.end();
}

module.exports = link;
