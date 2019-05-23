import { getClient, query } from '../db/index.js';
import { isFileReadable } from '../../lib/index.js';
import { unlinkAsync } from '../utils.js';

export default async function deleteSlice(req, res) {
  const id = req.params.id;

  if (!id) {
    res.sendStatus(422);
    res.end();
    return;
  }

  const owner = req.get('X-Browser-Id') || '';
  if (!owner) {
    res.sendStatus(401);
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
  if (!isOwner || req.get('X-Browser-Id') === 'anonymous') {
    res.sendStatus(403);
    res.end();
    return;
  }

  const { path } = row.json;
  console.info('Is file readable?', path);
  const readOK = await isFileReadable(path);
  if (!readOK) {
    res.sendStatus(404);
    res.end();
    return;
  }

  try {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      console.info('BEGIN transaction', id);
      await client.query('DELETE FROM slices WHERE id = $1 AND owner = $2', [
        id,
        owner,
      ]);
      console.info('DID delete', id);
      await unlinkAsync(path);
      console.info('Removed file', path);
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
    res.writeHead(500);
    res.end();
    return;
  }

  res.writeHead(204);
  res.end();
}
