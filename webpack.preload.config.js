const path = require('path');

module.exports = {
    entry: './src/preload.ts',
    target: "electron-preload",
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
      filename: 'preload.js',
      path: path.resolve(__dirname, '.webpack'),
    },
  };