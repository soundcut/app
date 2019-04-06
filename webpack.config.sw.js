const assets = require('./dist/assets.json');
const DefinePlugin = require('webpack').DefinePlugin;

const ENV = process.env.NODE_ENV || 'development';

module.exports = {
  entry: './client/service-worker.js',
  output: {
    path: __dirname + '/dist',
    filename: 'service-worker.js',
  },
  plugins: [
    new DefinePlugin({
      ASSETS: Object.values(assets).map(JSON.stringify),
    }),
  ],
  mode: ENV,
};
