/**
	Как добавить свою точку входа
	1. Создать файл в src/entry-points (по образу и подобию, например, cabinet-mobile.js)
	2. Указать его в переменной entry в webpack.config.js
	3. Перед первой сборкой добавить его в скрипты сборки в package.json

	TODO попробовать таки запилить VUE точку входа
	TODO посмотреть советы насчёт производительности http://dev-city.me/2017/01/22/optimizing-webpack-build-performance
*/

const path = require('path');
const webpack = require('webpack');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const SshWebpackPlugin = require('ssh-webpack-plugin');
const commonChunkName = 'common-chunk-vue';
const filenameDelimiter = '--';
const bundleSuffix = filenameDelimiter + 'bundle.js';
const Hosts = require('./hosts.js');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = function(env) {
	env = env || {};

	if (env.devserver === true) {
		welcomeMsg = ' * Running Webpack Dev Server';
	}
	else if (env.entrypoint) {
		welcomeMsg = ' * Running build ONLY for entrypoint = ' + env.entrypoint;
	}
	else if (env.page || env.theme) {
		welcomeMsg = ' * Running build ONLY for \n * page = ' + env.page + ' \n * theme = ' + env.theme;
	}
	else {
		welcomeMsg = ' * I have no idea whats going on';
	}
	console.log('\n\n' + welcomeMsg + '\n\n');

	var filenameTemplate;
	if (env.entrypoint) {
		// имя файла - тупо имя энтрипойнта, например cabinet_mobile
		filenameTemplate = '[name]';
	}
	else if (env.theme || env.devserver) {
		// имя файла собирается из имени энтрипойнта (чанка) и указанной в вызове темы (это для странных точек входа)
		filenameTemplate = '[name]' + filenameDelimiter + (env.theme || 'FAKE_THEME');
	}

	var output = {
		path: path.resolve(__dirname, './dist/'), // dist зашито в коде сборщика
		filename: filenameTemplate + bundleSuffix
	};

	if (env.devserver) {
		output.path = path.resolve(__dirname, './');
		output.publicPath = '/'; // иначе например hot-update будет запрашиваться из корня
	}

	// Хелп по множественным точкам входа / чанкам
	// https://webpack.js.org/plugins/commons-chunk-plugin/
	// https://github.com/gaearon/react-hot-loader/issues/141

	var entry = {
		cabinet_mobile: './src/entry-points/cabinet-mobile.js',
		cabinet_redesign: './src/entry-points/cabinet-redesign.js',
		cabinet_special: './src/entry-points/cabinet-special.js',
		passdata_special: './src/entry-points/passdata-special.js',
		route_special: './src/entry-points/route-special.js',
	};
	if (env.devserver !== true) {
		entry[commonChunkName] = [
			'vue',
			'vuex',
			'vue-router',
			'underscore'
		]
	}
	if (env.entrypoint) { // Если собираем какую-то одну точку входа (чанк)		
		// В этом случае удаляем всё что не подходит. 
		// Можно было бы с самого начала добавлять то что нужно, но и так сойдёт :)
		for (let chunkName in entry) {
			if (chunkName !== env.entrypoint && chunkName !== commonChunkName) {
				delete entry[chunkName];
			}
		}
	}

	const CONFIG = {
		entry,
		output,
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
				loader: 'babel-loader?cacheDirectory=true',
				exclude: /node_modules/
			}]
		},
		resolve: {
			alias: {
				'vue$': 'vue/dist/vue.common.js',
				'@src': path.resolve(__dirname, 'src/'), 
				'@pages': path.resolve(__dirname, 'src/pages'),
				'@store': path.resolve(__dirname, 'src/store'),
				'@mixins': path.resolve(__dirname, 'src/mixins'),
				'@comps': path.resolve(__dirname, 'src/components'),
				'@directives': path.resolve(__dirname, 'src/directives')
			}
		},
		devServer: {
			historyApiFallback: true,
			noInfo: false,
			contentBase: './',
			// https: true,
			// хост pass2 прописан в конфиге веба пси с Access-Control-Allow-Origin
			public: env.fiddler ? Hosts.real.domain : Hosts.fake.domain, // чтобы не было Invalid Host header при заходе на pass2.psi.oooinex.ru, ещё есть disableHostCheck: true
			proxy: env.fiddler ? [{}] : [{
				context: ['**', '!/'], // https://github.com/chimurai/http-proxy-middleware/blob/master/recipes/context-matching.md
				target: {
					host: Hosts.real.domain,
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
							.replace(Hosts.real.domain, Hosts.fake.domain + Hosts.fake.port)
							.replace('https://', 'http://');
						console.log(' REDIRECT! from ' + proxyRes.headers.location + ' to ' + newLocation);
						proxyRes.headers.location = newLocation;
					}
				},
				bypass: function(req, res, proxyOptions) { // http://expressjs.com/en/api.html#req
					// если файлы находятся в корне (благодаря publicPath: '/')
					// то они не попадают под прокси (благодаря context: [   '!/'])

					if (req.originalUrl.indexOf(bundleSuffix) !== -1) {
						// чтобы при запросе через прокси (т.е. во время разработки)
						// файла, к примеру, cabinet--SPECIAL--bundle.js[.map]
						// вместо этого брался локальный разработческий бандл
						var filenameOrig = req.originalUrl.split('/').reverse()[0];
						var chunkName = filenameOrig.split(filenameDelimiter)[0];

						var mapSuffixRef = '.map';
						var mapSuffix = req.originalUrl.indexOf(bundleSuffix + mapSuffixRef) !== -1 ? mapSuffixRef : '';

						var filename = output.filename.replace('[name]', chunkName);
						return output.publicPath + filename + mapSuffix;
					}
				}
			}]
		},
		performance: {
			hints: false // 'error'
		},
		// https://webpack.js.org/configuration/devtool/#devtool
		devtool: '#cheap-module-eval-source-map', // Для дев-билда
		// devtool: '#eval-source-map', // Для дев-билда		 
		// devtool: '#source-map', // Для продакшена
		plugins: [
			new FriendlyErrorsWebpackPlugin()
		]
	}


	// Сборка кода для продакшена
	if (process.env.NODE_ENV === 'production') {
		CONFIG.devtool = '#source-map';
		CONFIG.plugins = CONFIG.plugins.concat([
			
			new webpack.optimize.CommonsChunkPlugin({
				name: commonChunkName,
				filename: commonChunkName + '.js'
			}),

			new webpack.DefinePlugin({
				'process.env': {
					NODE_ENV: '"production"'
				},
				// переменные в env берутся из package.json (npm scripts)
				__DEFINED_ENTRYPOINT: JSON.stringify(env.entrypoint), // собирать только шаблоны указанной темы
				__DEFINED_THEME: JSON.stringify(env.theme), // собирать только шаблоны указанной темы
				__DEFINED_PAGE: JSON.stringify(env.page), // собирать только шаблоны указанной страницы
				__DEFINED_DEVSERVER: JSON.stringify(!!env.devserver) // собирать всё (вебпак девсервер)
			}),

			/**
				This hack is for preventing moment.js from bloating the bundle with its locales
				alt solution is new webpack.IgnorePlugin(/(locale)/, /node_modules.+(momentjs)/)
				or just https://github.com/ksloan/moment-mini
				see also https://github.com/webpack/webpack/issues/3128
			*/
			new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /ru/)
		])

		if (env.nougly !== true) {
			CONFIG.plugins.push(new webpack.optimize.UglifyJsPlugin({
				sourceMap: true,
				parallel: true,
				compress: {
					warnings: false
				},
				//exclude: [/^common-chunk/]
			}))
		}
	}

	if (env.devserver !== true) {
		CONFIG.plugins.push(new SshWebpackPlugin({
			host: Hosts.psiIp,
			username: 'root',
			password: 'ghjuhfvvf',
			zip: false, // https://github.com/unadlib/ssh-webpack-plugin/issues/2
			from: 'dist',
			to: '/opt/IBM/HTTPServer/htdocs/pirs/rzd/js/sale/dist'
		}))
	}

	if (env.analyze) { // если запустить к примеру "npm run build:cab-r -- --env.analyze"
		CONFIG.plugins.push(new BundleAnalyzerPlugin({
			analyzerPort: 8111
		}))
	}


	return [CONFIG]
};