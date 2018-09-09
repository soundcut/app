const util = require('util');
const path = require('path');
const express = require('express');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const multiparty = require('multiparty');
const serveStatic = require('serve-static');
const { wire } = require('hypermorphic');
const { encode } = require('punycode');
const { spawnYouTubeDL } = require('../lib/index');
const Home = require('../shared/components/Home');
const Upload = require('../shared/components/Upload');
const Link = require('../shared/components/Link');

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

  try {
    const ret = await spawnYouTubeDL(req.body.url, req);
    const headers = Object.keys(ret)
      .filter(key => key !== 'fileStream')
      .reduce((acc, key) => Object.assign({ [`x-${key}`]: encode(ret[key]) }, acc), {
        'content-type': 'audio/mp3',
      });

    res.writeHead(
      201,
      headers,
    );
    ret.fileStream.pipe(res);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
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

app.get('/upload', function(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html',
  });

  res.write(
    views.default(wire(), {
      path: req.path,
      title: title,
      links: links,
      main: new Upload(),
    })
  );
  res.end();
});

app.get('/link', function(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html',
  });

  res.write(
    views.default(wire(), {
      path: req.path,
      title: title,
      links: links,
      main: new Link(),
    })
  );
  res.end();
});

const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.info(`Sound Slice HTTP Server now listening on port ${port}`);
});
