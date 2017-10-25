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
				return window.PAGEDATA.LayerLinks;
			}
			else {
				console.error('Не найдена ссылка window.PAGEDATA.LayerLinks.' + key);
				return ''
			}
		}
	},
	filters: {
		DF_FULL: function(val) { // DateFormat_full
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
		'dict': {
			props: {
				name: {
					type: String
				}
			},
			data: function() {
				return {
					content: ''
				}
			},
			created: function() {
				var key = this.$props.name;
				if (key.indexOf('/') !== -1) {
					key = key.split('/');
				}
				var value = window.lang(key);
				var comment = this.IS_DEV ? `<!--${key}-->` : '';
				if (value) {
					this.$data.content = comment + value;
				}
				else if (this.IS_DEV) {
					this.$data.content = `Словарная запись с ключом «${key}» не найдена`;
					console.error(this.$data.content);
				}
			},
			template: `<span v-html="content"></span>`
		},
		'ifrmsg': {
			props: {
				name: {
					type: String
				}
			},
			data: function() {
				return {
					content: ''
				}
			},
			created: function() {
				var key = this.$props.name;
				var value = window.IFRMSG[key];
				var comment = this.IS_DEV ? `<!--${key}-->` : '';
				if (value) {
					this.$data.content = comment + value;
				}
				else if (this.IS_DEV) {
					this.$data.content = `Сообщение ИФР «${key}» не найдено в window.IFRMSG`;
					console.error(this.$data.content);
				}
			},
			template: `<span v-html="content"></span>`
		}
	},
	computed: { // отвечает за показ стектрейсов, подробный вывод в консоль, глобальные переменные - ссылки на инстанс VUEI и всякое такое
		IS_DEV: function() {
			return window.PAGEDATA && window.PAGEDATA.showErrors
		}
	}
}