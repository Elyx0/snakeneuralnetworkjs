require('babel-register');
module.exports = process.env.NODE_ENV !== 'production' ? require('./webpack.config.development') : require('./webpack.config.production');
