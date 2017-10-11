/**
	Глобальные миксины
	Имена глобальных методов и функций - капсом
*/

const moment = require('moment')
moment.locale('ru');

export default {
	methods: {
		LANG: function(key) {
			if (key.indexOf('/') !== -1) {
				key = key.split('/');
			}
			return window.lang(key);
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
			return moment(val).format('MM.DD.YYYY hh:mm');
		},		
		CAPITALIZE: UTIL.capitalizeEachWord,
		FORMAT_SUM: UTIL.formatSum
	},
	components: {
		'ifrmsg': {
			props: {
				name: {
					type: String
				}
			},
			data: function(){
				return {
					content: ''
				}
			},
			created: function(){
				var key = this.$props.name;
				if (window.IFRMSG[key]) {
					this.$data.content = `<!--${key}-->${window.IFRMSG[key]}`;
				}
				else if (window.PAGEDATA.showErrors) {
					this.$data.content = `Сообщение ИФР «${key}» не найдено в window.IFRMSG`;
				}
			},
			template: `<span v-html="content"></span>`
		}
	},
	computed: {}
}