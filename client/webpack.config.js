// This module helps us with the configuration data
var path = require('path');

// Configuration data
module.exports = {
  entry: './es6/main.js',
  output: {
	path: __dirname,
	filename: './dist/bundle.js'
  },
  module: {
	loaders: [
	  { test: path.join(__dirname, 'es6'), loader: 'babel-loader' },
	  { test: /\.less$/, loader: "style!css!less" }
	]
  }
};