const util = require('util');
const path = require('path');
const express = require('express');
const favicon = require('serve-favicon');
const multiparty = require('multiparty');
const serveStatic = require('serve-static');
const { wire } = require('hypermorphic');
const Home = require('../shared/components/Home');

const views = {
  default: require('../shared/views/default'),
};

const app = express();

app.use(favicon(path.join(__dirname, '..', 'public', 'favicon.ico')));
app.use('/public', serveStatic('public'));
app.use('/public', serveStatic('dist'));

const title = 'SoundSlice';

const links = [
  {
    name: 'Home',
    path: '/',
  },
];

app.post('/api/upload/mp3', function(req, res) {
  const form = new multiparty.Form();

  form.parse(req, function(err, fields, files) {
    if (err) {
      res.writeHead(400, { 'content-type': 'text/plain' });
      res.end('invalid request: ' + err.message);
      return;
    }

    res.writeHead(200, { 'content-type': 'text/plain' });
    res.write('received fields:\n\n ' + util.inspect(fields));
    res.write('\n\n');
    res.end('received files:\n\n ' + util.inspect(files));
  });

  return;
});

app.get('/', function(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html',
  });

  res.write(
    views.default(wire(), {
      path: req.path,
      title: title,
      links: links,
      main: new Home(),
    })
  );
  res.end();
});

const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.info(`Sound Slice HTTP Server now listening on port ${port}`);
});
