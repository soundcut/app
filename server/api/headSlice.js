const { query } = require('../db');
const { isFileReadable } = require('../../lib');

async function headSlice(req, res) {
  const id = req.params.id;

  if (!id) {
    res.sendStatus(422);
    res.end();
    return;
  }

  let result;
  try {
    console.info('Retrieving slice json', id);
    result = await query('SELECT owner, json FROM slices WHERE id LIKE $1', [
      `${id}%`,
    ]);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
    res.end();
    return;
  }

  if (result.rows.length > 1) {
    res.sendStatus(409);
    res.end();
    return;
  }

  const row = result.rows[0];
  if (!row) {
    res.sendStatus(404);
    res.end();
    return;
  }

  const isOwner = row.owner === req.get('X-Browser-Id');
  const { path, name } = row.json;

  console.info('Is file readable?', path);
  const readOK = await isFileReadable(path);
  if (!readOK) {
    res.sendStatus(404);
    res.end();
    return;
  }

  const headers = {
    'X-Owner': isOwner ? 1 : 0,
  };

  res.writeHead(204, headers);
  res.end();
}

module.exports = headSlice;
