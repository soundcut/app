/* eslint-disable no-console */

const { Pool } = require('pg');

// FIXME: configuration file
const config = {
  host: 'localhost',
  port: 5432,
  user: 'soundslice',
  password: process.env.SOUNDSLICE_DB_PASSWORD,
  database: 'soundslice',
};

const pool = new Pool(config);

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.info('Executed query', { text, duration, rows: res.rowCount });
  return res;
}

function getClient() {
  return pool.connect();
}

module.exports = {
  query,
  getClient,
};
