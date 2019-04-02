const CopyPlugin = require('copy-webpack-plugin');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');

const ENV = process.env.NODE_ENV || 'development';
const DEV = ENV === 'development';

module.exports = {
  entry: {
    app: ['./client/index.js', './assets/styles/main.scss'],
  },
  output: {
    path: __dirname + '/dist',
    filename: `js/[name]${!DEV ? '.[contenthash]' : ''}.js`,
  },
  resolve: {
    alias: {
      // hyperhtml/cjs is returned by hypermorphic
      // so that aliasing viperhtml as hyperhtml/cjs
      // will basically nullify viperhtml require
      viperhtml: 'hyperhtml/cjs',
    },
  },
  optimization: {
    minimizer: [new TerserPlugin({}), new OptimizeCSSPlugin({})],
  },
  module: {
    rules: [
      {
        test: /\.woff(2)?$/,
        use: {
          loader: 'file-loader',
          options: {
            name: `[name]${!DEV ? '.[contenthash]' : ''}.[ext]`,
            outputPath: 'fonts',
            publicPath: '../fonts',
          },
        },
      },
      {
        test: /\.scss$/,
        use: [
          { loader: MiniCSSExtractPlugin.loader },
          'css-loader',
          'sass-loader',
        ],
      },
    ],
  },
  plugins: [
    new MiniCSSExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: `css/[name]${!DEV ? '.[contenthash]' : ''}.css`,
    }),
    new CopyPlugin([
      {
        from: 'public/*',
        to: `${__dirname}/dist/[name]${!DEV ? '.[contenthash]' : ''}.[ext]`,
      },
      {
        from: 'public/img/*',
        to: `${__dirname}/dist/img/[name]${!DEV ? '.[contenthash]' : ''}.[ext]`,
      },
    ]),
    new ManifestPlugin({
      fileName: 'assets.json',
      // Remove for christmas
      // https://github.com/webpack-contrib/copy-webpack-plugin/issues/104
      map: file => {
        if (file.isModuleAsset) {
          file.name = file.path.replace(/(\.[a-f0-9]{32})(\..*)$/, '$2');
        }
        if (!DEV) {
          file.name = file.name.replace(/(\.[a-f0-9]{32})(\..*)$/, '$2');
        }
        return file;
      },
    }),
  ],
  mode: ENV,
};
