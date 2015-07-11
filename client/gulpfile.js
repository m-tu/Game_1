var gulp = require("gulp");
var gutil = require("gulp-util");
var webpack = require("webpack");
var WebpackDevServer = require("webpack-dev-server");
var webpackConfig = require("./webpack.config.js");
var devServerPort = 61337;


gulp.task("webpack-dev-server", function(callback) {
  // Start a webpack-dev-server
  var compiler = webpack(webpackConfig);

  new WebpackDevServer(compiler, {
	// server and middleware options
  }).listen(devServerPort, "localhost", function(err) {
		if(err) throw new gutil.PluginError("webpack-dev-server", err);
		// Server listening
		gutil.log("[webpack-dev-server]", "http://localhost:8080/webpack-dev-server/index.html");

		// keep the server alive or continue?
		// callback();
	  });
});

gulp.task("run", ["webpack-dev-server"]);