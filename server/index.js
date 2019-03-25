/* eslint-disable no-console */

const path = require('path');
const express = require('express');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const serveStatic = require('serve-static');

const { getClient } = require('./db');
const routes = require('./routes');
const api = require('./api');

const env = process.env.NODE_ENV || 'development';
const app = express();

app.use(favicon(path.join(__dirname, '..', 'public', 'favicon.ico')));
app.use(morgan(env === 'development' ? 'dev' : 'tiny'));
app.use('/public', serveStatic('public'));
app.use('/public', serveStatic('dist'));

app.get('/', routes.home);
app.get('/play', routes.play);
app.get('/shared/:id', routes.shared);
app.get('/link', routes.link);
app.get('/saved/:type/:id', routes.saved);

app.post('/api/link', bodyParser.json(), api.link);
app.get('/api/slice/:id', api.getSlice);
app.delete('/api/slice/:id', api.deleteSlice);
app.post('/api/share', api.shareSlice);

const port = process.env.PORT || 3000;
app.listen(port, async function start() {
  console.info(`Sound Slice HTTP Server now listening on port ${port}`);
  try {
    const client = await getClient();
    client.release();
    console.info('Succesfuly retrieved and released database client');
  } catch (err) {
    console.error('Unable to retrieve or release database client. \n', err);
  }
});
