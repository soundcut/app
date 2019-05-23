/* eslint-disable no-console */

import pg from 'pg';

// FIXME: configuration file
const config = {
  host: 'localhost',
  port: 5432,
  user: 'soundslice',
  password: process.env.SOUNDSLICE_DB_PASSWORD,
  database: 'soundslice',
};

const pool = new pg.Pool(config);

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.info('Executed query', { text, duration, rows: res.rowCount });
  return res;
}

export function getClient() {
  return pool.connect();
}
