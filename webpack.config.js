var path = require('path');
var webpack = require('webpack');
var FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');

var devHost_real = 'pass.psi.oooinex.ru';
var devHost_fake = 'pass2.psi.oooinex.ru';

var conf_browser = {
	entry: ['./src/_main-browser.js'],
	output: {
		path: path.resolve(__dirname, './www/'),
		publicPath: '/', // иначе например hot-update будет запрашиваться из корня
		filename: 'build-browser.js'
	},
	module: {
		rules: [{
			test: /\.css$/,
			loader: "style-loader!css-loader"
		}, {
			test: /\.vue$/,
			loader: 'vue-loader',
			options: {
				loaders: {}
			}
		}, {
			test: /\.js$/,
			loader: 'babel-loader',
			exclude: /node_modules/
		}, {
			test: /\.(png|jpg|gif|svg)$/,
			loader: 'file-loader',
			options: {
				name: 'img/[name].[ext]?[hash]'
			}
		}, {
			test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
			loader: 'file-loader', // url-loader
			options: {
				limit: 10000,
				name: 'fonts/[name].[hash:7].[ext]'
			}
		}]
	},
	resolve: {
		alias: {
			'vue$': 'vue/dist/vue.common.js'
		}
	},
	devServer: {
		historyApiFallback: true,
		noInfo: false,
		contentBase: "www",
		// https: true,
		// хост pass2 прописан в конфиге веба пси с Access-Control-Allow-Origin
		public: devHost_fake, // чтобы не было Invalid Host header при заходе на pass2.psi.oooinex.ru, ещё есть disableHostCheck: true
		proxy: [{
			context: ['**', '!/'], // https://github.com/chimurai/http-proxy-middleware/blob/master/recipes/context-matching.md
			target: {
				host: devHost_real,
				protocol: 'https:',
				port: 443 //80
			},
			secure: false,
			// autoRewrite: true,
			changeOrigin: true,
			onProxyRes: function(proxyRes, req, res) {
				if (proxyRes.statusCode === 302 && proxyRes.headers.location) {
					// например для логона
					var newLocation = proxyRes.headers.location
						.replace(devHost_real, devHost_fake + ':' + 1488)
						.replace('https://', 'http://');
					console.log(' REDIRECT! from ' + proxyRes.headers.location + ' to ' + newLocation);
					proxyRes.headers.location = newLocation;
				}
			},
			bypass: function(req, res, proxyOptions) { // http://expressjs.com/en/api.html#req
				// проверки отключил потому что 
				// если файлы находятся в корне (благодаря publicPath: '/')
				// то они не попадают под прокси (благодаря context: [   '!/'])

				/*
					var filename = req.originalUrl.split('/').reverse()[0];
					console.log(filename);
					var bypassNames = ['hot-update.json', 'build-browser.js'];
					for (var i = 0; i < bypassNames.length; i++) {
						if (filename.indexOf(bypassNames[i]) !== -1) { // индексов - потому что у hot-update.json бывает рандомный префикс
							return '/' + bypassNames[i];
						}
					}
				*/
			}
		}]
	},
	performance: {
		hints: false // 'error'
	},
	// https://webpack.github.io/docs/configuration.html#devtool
	devtool: '#cheap-module-eval-source-map', // faster than '#eval-source-map', 
	plugins: [
		new FriendlyErrorsWebpackPlugin()
	]
}

if (process.env.NODE_ENV === 'production') {
	conf_browser.devtool = '#source-map';
	conf_browser.plugins = conf_browser.plugins.concat([
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: '"production"'
			}
		}),
		new webpack.optimize.UglifyJsPlugin({
			sourceMap: true,
			compress: {
				warnings: false,
				comparisons: false // workaround for https://github.com/mapbox/mapbox-gl-js/issues/4359
			}
		}),
		new webpack.LoaderOptionsPlugin({
			minimize: true
		}),
		/**
			This hack is for preventing moment.js from bloating the bundle with its locales
			alt solution is new webpack.IgnorePlugin(/(locale)/, /node_modules.+(momentjs)/)
			or just https://github.com/ksloan/moment-mini
			see also https://github.com/webpack/webpack/issues/3128
		*/
		new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /ru/),
	])
}

module.exports = [conf_browser];