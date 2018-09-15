/* eslint-disable no-console */

const path = require('path');
const { rename } = require('fs');
const { createHash } = require('crypto');
const express = require('express');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const multiparty = require('multiparty');
const serveStatic = require('serve-static');
const { wire } = require('hypermorphic');
const { encode } = require('punycode');
const get = require('lodash/get');
const { getClient } = require('./db');
const { spawnYouTubeDL } = require('../lib');
const Home = require('../shared/components/Home');
const Upload = require('../shared/components/Upload');
const Link = require('../shared/components/Link');

const views = {
  default: require('../shared/views/default'),
};

const env = process.env.NODE_ENV || 'development';

const finalDir = env === 'development' ? '/tmp' : '/home/hosting-user/uploads';

function renameAsync(oldPath, newPath) {
  return new Promise((resolve, reject) => {
    rename(oldPath, newPath, err => (err ? reject(err) : resolve()));
  });
}

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

app.post('/api/share', function(req, res) {
  const form = new multiparty.Form();

  form.parse(req, async function(err, fields, files) {
    // FIXME: Ensure proper file type, maybe ffmpeg dry-run
    if (err) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: err.message }));
      return;
    }

    const file = get(files, 'file[0]');
    if (!file) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: 'Missing file' }));
      return;
    }
    // {
    //   fieldName: 'file',
    //   originalFilename: 'foobarbaz.mp3',
    //   path: '/tmp/oyjfnKCrFBiphPySI9Iy2Vmj.mp3',
    //   headers: [Object],
    //   size: 1440000
    // }

    const id = createHash('sha256')
      .update(file.path, 'utf8')
      .digest('hex');
    const destination = path.join(`${finalDir}`, id);
    const client = await getClient();
    try {
      await client.query('BEGIN');
      console.info('BEGIN transaction', id);
      const json = JSON.stringify({
        path: destination,
        name: file.originalFilename,
      });
      await client.query('INSERT INTO slices(id, json) VALUES($1, $2)', [
        id,
        json,
      ]);
      await renameAsync(file.path, destination);
      console.info('Moved file to final location', destination);
      await client.query('COMMIT');
      console.info('COMMIT transaction', id);
    } catch (err) {
      console.error(err);
      await client.query('ROLLBACK');
      console.info('ROLLBACK transaction', id);
      // FIXME: Cleanup temporary files.
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({ status: 'error', message: 'Internal Server Error' })
      );
      return;
    }

    const message = `Successfuly saved ${file.originalFilename}`;
    res.writeHead(201, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'success', message, id }));
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
      .reduce(
        (acc, key) => Object.assign({ [`x-${key}`]: encode(ret[key]) }, acc),
        {
          'content-type': 'audio/mp3',
        }
      );

    res.writeHead(201, headers);
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
