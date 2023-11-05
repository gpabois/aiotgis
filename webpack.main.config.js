const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
    entry: './src/main/index.ts',
    target: "electron-main",
    plugins: [
      new NodePolyfillPlugin()
    ],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "babel-loader",
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, '.webpack'),
    },
  };