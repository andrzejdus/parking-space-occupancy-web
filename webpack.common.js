const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const HtmlWebpackPluginConfig = new HtmlWebpackPlugin({
    template: './src/index.html',
    filename: 'index.html',
    inject: 'body'
});

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: [
                path.resolve(__dirname, 'node_modules')
            ],
            use: [{
                loader: 'babel-loader'
            }]
        }, {
            test: /\.scss$/,
            exclude: [
                path.resolve(__dirname, 'node_modules')
            ],
            use: ExtractTextPlugin.extract({
                use: [
                    { loader: 'css-loader' },
                    { loader: 'sass-loader' }
                ]
            })
        }]
    },
    plugins: [
        HtmlWebpackPluginConfig,
        new webpack.optimize.CommonsChunkPlugin({
            name: 'node-static',
            filename: 'node-static.js',
            minChunks(module, count) {
                var context = module.context;
                return context && context.indexOf('node_modules') >= 0;
            },
        }),
        new ExtractTextPlugin('styles.css')
    ]
};
