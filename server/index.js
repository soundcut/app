const util = require('util');
const path = require('path');
const express = require('express');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const multiparty = require('multiparty');
const serveStatic = require('serve-static');
const { wire } = require('hypermorphic');
const Home = require('../shared/components/Home');
const { spawnYouTubeDL } = require('../lib/index');

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

const jsonParser = bodyParser.json();
app.post('/api/link', jsonParser, async function(req, res) {
  if (!req.body) return res.sendStatus(400);
  const ret = await spawnYouTubeDL(req.body.url);

  res.writeHead(
    201,
    Object.keys(ret)
      .filter(key => key !== 'fileStream')
      .reduce(
        (acc, key) => Object.assign({ [`x-${key}`]: ret[key] }, acc),
        { 'content-type': 'audio/mp3' }
      )
  );
  ret.fileStream.pipe(res);
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
