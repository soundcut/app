module.exports = {
  entry: './client/index.js',
  output: {
    filename: 'main.js',
    path: __dirname + '/dist/js',
  },
  resolve: {
    alias: {
      // hyperhtml/cjs is returned by hypermorphic
      // so that aliasing viperhtml as hyperhtml/cjs
      // will basically nullify viperhtml require
      viperhtml: 'hyperhtml/cjs'
    }
  },
  mode: process.env.NODE_ENV || 'development'
};
