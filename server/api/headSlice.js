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
  const { path } = row.json;

  console.info('Is file readable?', path);
  const readOK = await isFileReadable(path);
  if (!readOK) {
    res.sendStatus(404);
    res.end();
    return;
  }

  const headers = {
    // Effectively ruin cache cardinality
    // FIXME: Retrieve slice ownership separately so this route can be cached.
    'X-Owner': isOwner ? 1 : 0,
    Vary: 'X-Browser-Id',
  };

  res.writeHead(204, headers);
  res.end();
}

module.exports = headSlice;
