import path from 'path';
import webpack from 'webpack';
import merge from 'webpack-merge';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

import baseConfig from './webpack.config.base';

const port = process.env.PORT || 3000;

//const publicPath = `http://localhost:${port}/dist`;
const publicPath = `/dist`;


export default merge(baseConfig, {
  devtool: '#source-map',
  entry: [
    path.join(__dirname, 'src/index.js')
  ],
  output: {
    publicPath
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    }),
    new webpack.LoaderOptionsPlugin({
      debug: true
    })
  ]
});
