const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require("webpack");

module.exports = {
    entry: './src/renderer/index.tsx',
    plugins: [
      new HtmlWebpackPlugin({
        template: "public/index.html"

      }),
      new webpack.ProvidePlugin({
        "React": "react",
     }),
    ],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "babel-loader"
        },
        {
          test: /\.s?css$/,
            use: [
              'style-loader', 'css-loader', 'postcss-loader',
          ]
        }, {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        }
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      filename: 'renderer.js',
      path: path.resolve(__dirname, '.webpack'),
    },
  };