import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

export default {
    module : {
        rules: [
            {
                test: /\.js$/,
                use: 'babel-loader',
                exclude: /node_modules/
            }, {
                test: /\.json$/,
                use: 'json-loader'
            },
            {
              test: /\.scss$/,
              use: ExtractTextPlugin.extract({
                use: [{
                  loader: 'css-loader'
                },{
                  loader: 'sass-loader'
                }],
                fallback: 'style-loader'
              })
            }
        ]
    },
    output : {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js',
        //libraryTarget: 'commonjs2'
    },
    resolve : {
        extensions: [
            '.js', '.json'
        ],
        modules: [
            path.join(__dirname, 'src'),
            'node_modules'
        ]
    },
    plugins : [
        new ExtractTextPlugin({
          filename: "[name].[contenthash].css"
        }),
        new webpack.NamedModulesPlugin(),
        new HtmlWebpackPlugin({title: 'Neuroevolution of snakes', template: 'src/index.html.ejs'})
    ]
}
