/* eslint-disable no-console */

const path = require('path');
const { rename, createReadStream } = require('fs');
const { createHash } = require('crypto');
const express = require('express');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const multiparty = require('multiparty');
const serveStatic = require('serve-static');
const { wire } = require('hypermorphic');
const { encode } = require('punycode');
const get = require('lodash/get');
const { getClient, query } = require('./db');
const { spawnYouTubeDL, isFileReadable } = require('../lib');
const Home = require('../shared/components/Home');
const Upload = require('../shared/components/Upload');
const Link = require('../shared/components/Link');
const Shared = require('../shared/components/Shared');

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
app.use(morgan(env === 'development' ? 'dev' : 'tiny'));
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
  console.info('Received POST request for sharing a file...');
  const form = new multiparty.Form();

  form.parse(req, async function(err, fields, files) {
    // FIXME: Ensure proper file type, maybe ffmpeg dry-run
    if (err) {
      console.error('Unable to parse file upload request', err);
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: err.message }));
      return;
    }

    const file = get(files, 'file[0]');
    if (!file) {
      console.error('Mhhh, no file..', err);
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

    const originalFilename = file.originalFilename;
    const temporarypath = file.path;
    const id = createHash('sha256')
      .update(file.path, 'utf8')
      .digest('hex');
    const destination = path.join(finalDir, id);
    console.info('Generated unique id, computed destination', {
      originalFilename,
      temporarypath,
      destination,
      id,
    });

    try {
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
        console.info('DID insert', id);
        await renameAsync(file.path, destination);
        console.info('Moved file to final location', destination);
        await client.query('COMMIT');
        console.info('COMMIT transaction', id);
      } catch (err) {
        await client.query('ROLLBACK');
        console.info('ROLLBACK transaction', id);
        throw err;
      } finally {
        console.info('Releasing connection', id);
        client.release();
      }
    } catch (err) {
      console.error(err);
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
    const headers = {
      'content-disposition': `attachment; filename="${encode(ret.title)}"`,
      'content-type': 'audio/mp3',
    };

    res.writeHead(201, headers);
    res.on('error', function(err) {
      ret.fileStream.end();
    });
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

app.get('/slice/:id', async function(req, res) {
  const id = req.params.id;

  try {
    const result = await query('SELECT COUNT(*) FROM slices WHERE id = $1', [
      id,
    ]);
    const row = result.rows[0];
    if (!Number.parseInt(row.count)) {
      res.writeHead(404, {
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
      return;
    }
  } catch (err) {
    console.error(err);
    res.writeHead(500, {
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
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/html',
  });

  res.write(
    views.default(wire(), {
      path: req.path,
      title: title,
      links: links,
      main: new Shared(),
    })
  );
  res.end();
});

app.get('/api/slice/:id', async function(req, res) {
  const id = req.params.id;

  let result;
  try {
    console.info('Retrieving slice json', id);
    result = await query('SELECT json FROM slices WHERE id = $1', [id]);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
    res.end();
    return;
  }

  const row = result.rows[0];
  if (!row) {
    res.sendStatus(404);
    res.end();
    return;
  }

  const { path, name } = row.json;

  console.info('Is file readable?', path);
  const readOK = await isFileReadable(path);
  if (!readOK) {
    res.sendStatus(404);
    res.end();
    return;
  }

  console.info('Retrieving slice file stream...', id);
  const fileStream = createReadStream(path);
  const headers = {
    'content-disposition': `attachment; filename="${encode(name)}"`,
    'content-type': 'audio/mp3',
  };
  res.writeHead(200, headers);
  console.info('Streaming slice back to client', name);
  fileStream.pipe(res);
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
