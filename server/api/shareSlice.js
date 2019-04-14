const path = require('path');
const { createHash } = require('crypto');
const get = require('lodash/get');
const multiparty = require('multiparty');

const { renameAsync } = require('../utils');
const { getClient } = require('../db');

const env = process.env.NODE_ENV || 'development';

async function shareSlice(req, res) {
  const finalDir =
    res.app.locals.config.uploads.path || env === 'development'
      ? '/tmp'
      : '/home/hosting-user/uploads';

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

    const owner = req.get('X-Browser-Id') || 'anonymous';

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
        await client.query(
          'INSERT INTO slices(id, owner, json) VALUES($1, $2, $3)',
          [id, owner, json]
        );
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
}

module.exports = shareSlice;
