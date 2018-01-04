/**
	Глобальные миксины
	Имена глобальных методов и функций - капсом
*/

//const moment = require('moment')
//moment.locale('ru');

export default {
	methods: {
		DICT: function(key) { // для вывода слов лучше использовать компонент <dict name="MY_DICT_KEY"/>, функция нужна например для вывода в атрибуты
			if (key.indexOf('/') !== -1) {
				key = key.split('/');
			}
			return window.lang(key)
		},
		LINK: function(key) {
			if (window.PAGEDATA && window.PAGEDATA.LayerLinks && window.PAGEDATA.LayerLinks[key]) {
				return window.PAGEDATA.LayerLinks[key];
			}
			else {
				console.error('Не найдена ссылка window.PAGEDATA.LayerLinks.' + key);
				return ''
			}
		}
	},
	filters: {
		DF_FULL: function(val) { // TODO запилить какое-то стандартное форматирование дат
			if (!val) {
				return ''
			}
			var date = new Date(val);
			if (date.toLocaleString) {
				return date.toLocaleString()
			}
			//return moment(val).format('MM.DD.YYYY hh:mm');
		},
		CAPITALIZE: UTIL.capitalizeEachWord,
		FORMAT_SUM: UTIL.formatSum
	},
	components: {
		// Ахтунг! Глобальные компоненты имеет смысл делать functional
		// https://vuejs.org/v2/guide/render-function.html#Functional-Components
		// Функциональные компоненты - просто функции, они не имеют состояния и не создают хуков и обсерверов
		// ко всему прочему, они не отображаются в Vue devtools, это тоже плюс в случае словарей и сообщений ИФР
		// https://vuejs.org/v2/guide/render-function.html#createElement-Arguments
		'dict': {
			functional: true,			
			props: {
				name: {
					type: String
				}
			},
			render: function(createElement, context) {
				var key = context.props.name;
				if (key.indexOf('/') !== -1) {
					key = key.split('/');
				}
				var value = window.lang(key);
				var comment = context.parent.IS_DEV ? `<!--${key}-->` : '';
				var content = '';
				if (value) {
					content = comment + value;
				}
				else if (context.parent.IS_DEV) {
					content = `Словарная запись с ключом «${key}» не найдена`;
					console.error(content);
				}
				return createElement('span', {
					domProps: {
						innerHTML: content
					}
				});
			}
		},
		'ifrmsg': {
			functional: true,
			props: {
				name: {
					type: String
				}
			},			
			render: function(createElement, context) {				
				var key = context.props.name;
				var value = window.IFRMSG[key];
				var comment = context.parent.IS_DEV ? `<!--${key}-->` : '';
				var content = '';
				if (value) {
					content = comment + value;
				}
				else if (context.parent.IS_DEV) {
					content = `Сообщение ИФР «${key}» не найдено в window.IFRMSG`;
					console.error(content);
				}
				return createElement('span', {
					domProps: {
						innerHTML: content
					}
				});
			}
		}
	},
	computed: { // отвечает за показ стектрейсов, подробный вывод в консоль, глобальные переменные - ссылки на инстанс VUEI и всякое такое
		IS_DEV: function() {
			return window.PAGEDATA && window.PAGEDATA.showErrors
		}
	}
}