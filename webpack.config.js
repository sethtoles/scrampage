const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = (env) => ({
  devServer: {
    contentBase: 'dist',
  },
  devtool: env === 'development' ? 'inline-source-map' : 'none',
  entry: './index.js',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [ 'env' ],
          },
        },
      },
    ],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
    }),
  ],
  watchOptions: {
    ignored: /node_modules/,
  },
});
