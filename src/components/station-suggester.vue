<template> 
	<div class="stsug-wrap">
		<autocomplete
		v-on:blur="onBlur"
		v-on:change="onChange"
		v-on:update-items="getOptions" 
		v-on:item-selected="onSelect"		
		:value="autocompleteValue"
		:items="myOptions"
		:input-attrs="inputAttrs"
		:wait="300"
		:component-item="itemComponent"
		:get-label="getLabel"/>
		<i class="spin" slot="spinner" v-show="LOADER" />
	</div>
</template>

<script>
	import autocomplete from 'v-autocomplete'
	import mixins from '@mixins'

	export default {
		name: 'StationSuggester',
		props: {
			storage: {
				type: String,
				default: 'RouteSuggesterHistory'
			},
			code: {
				default: ''
			},
			name: {
				default: ''
			}
		},
		computed: {
			autocompleteValue: function(){
				return this.$props.name && this.$props.code ? {
					label: this.$props.name,
					value: this.$props.code,
				} : null;
			}
		},
		data: function() {
			return {
				myOptions: [],
				HUMAN_ERROR: '',
				LOADER: false,
				inputAttrs: {
					class: 'form-control input-lg'
				},
				itemComponent,
				cache: {},
				history: [],
				resetValueOnBlur: false
			}
		},
		components: {
			autocomplete
		},
		mixins: [mixins],
		mounted: function(){
			// Достаём первичные опции или из локалстореджа или умолчательные
			var stored = window.store.local(this.$props.storage);
			var history = this.$props.storage && stored instanceof Array ? stored : defaultHistory;
			this.$data.history = history.slice();
			this.$data.myOptions = history.slice().reverse();
		},
		methods: {
			onChange: function(search){
				if (search.length === 0) {
					this.$emit('update:code', '');
					this.$emit('update:name', '');
					this.$data.myOptions = this.$data.history.reverse();
				}
				else {
					this.$data.resetValueOnBlur = true;
					this.$data.myOptions = [];
				}
				if (ajaxRequest && ajaxRequest.abort) {
					ajaxRequest.abort();
				}
			},
			onSelect: function(item) {
				this.$data.resetValueOnBlur = false;
				// см. https://vuejs.org/v2/guide/components.html#sync-Modifier
				this.$emit('update:code', item.value);
				this.$emit('update:name', item.label);
				if (this.$props.storage && this.$data.history) {
					// ищем дубль в выбранных ранее станциях
					var duplicates = this.$data.history.filter(function(el) {
						return el.value === item.value;
					});
					// если дубля нет - запоминаем
					if (duplicates.length === 0) {
						this.$data.history.push(item);
						// размер стека 5, если больше - удаляем более ранние
						if (this.$data.history.length > 5) {
							this.$data.history.shift();
						}
						store.local(this.$props.storage, this.$data.history);
					}
				}
			},
			onBlur: function(){
				if (this.$data.resetValueOnBlur) { // если поискал и ничего не выбрал
					var code = this.$props.code;
					var name = this.$props.name;
					this.$emit('update:code', '');
					this.$emit('update:name', '');
					this.$nextTick(function(){ 
						// трюк чтобы восстановилось прежнее значение инпута
						// если не через некстТик, то можно ещё 
						// сделать сеттер у autocompleteValue, но это не точно
						this.$emit('update:code', code);
						this.$emit('update:name', name);
					})
					if (ajaxRequest && ajaxRequest.abort) {
						ajaxRequest.abort();
					}
				}
			},
			getLabel: function(item){
				return item ? item.label : '';
			},
			getOptions: function(search) {
				var vm = this;
				// Переводим запрос из латиницы в кириллицу и апррекейс
				var term = Sugg.makeKey(search.toUpperCase(), true);
				// Если запрос есть в кеше
				if (term in vm.cache) {
					this.$data.myOptions = vm.cache[term];
				}
				// Если запроса нет в кеше, спрашиваем сервер
				else {
					vm.LOADER = true;
					this.HUMAN_ERROR = '';
					ajaxRequest = window.jQuery.getJSON('/suggester', {
							stationNamePart: term,
							lang: window.PAGEDATA.lang,
							lat: 0,
							compactMode: 'y'
						})
						.done(function(data){							
							data = Sugg.makeList(data, term, 3);
							var opt = [];
							for (var i = 0; i < data.length; i++) {
								opt.push({
									label: vm.$options.filters.CAPITALIZE(data[i].n),
									value: data[i].c
								})
							}
							vm.$data.justGotNewOptions = true;
							vm.$data.myOptions = opt;
						})
						.fail(function() {
							this.HUMAN_ERROR = 'Произошла ошибка запроса';
						})
						.always(function() {
							vm.LOADER = false;
						})
				}

			}
		}
}

// Отдельными (вне инстанса компонента) сделаны вещи которые не страшно расшарить между инстансами
// потому что если на странице два компонента саджестера
// то они ОКАЗЫВАЕТСЯ шарят переменные которые вне дефолта
// век живи - век учись

var defaultHistory = [{
	label: 'Москва',
	value: 2000000
}, {
	label: 'Санкт-Петербург',
	value: 2004000
}, {
	label: 'Казань',
	value: 2060500
}];

var ajaxRequest;

var itemComponent = {
	functional: true,
	props: ['item'],
	render: function(createElement, context) {
		return createElement('div', {
			domProps: {
				innerHTML: context.props.item.label,
				className: 'stsug-item'
			}
		});
	}
}

/** Кусок тупо перенесён из js\pass16\form_route.js */
var Sugg = new function() {
	var rusMap = {
		'F': 'А',
		'<': 'Б',
		',': 'Б',
		'D': 'В',
		'U': 'Г',
		'L': 'Д',
		'T': 'Е',
		'`': 'Е',
		'~': 'Е',
		'Ё': 'Е',
		':': 'Ж',
		';': 'Ж',
		'P': 'З',
		'B': 'И',
		'Q': 'Й',
		'R': 'К',
		'K': 'Л',
		'V': 'М',
		'Y': 'Н',
		'J': 'О',
		'G': 'П',
		'H': 'Р',
		'C': 'С',
		'N': 'Т',
		'E': 'У',
		'A': 'Ф',
		'{': 'Х',
		'[': 'Х',
		'W': 'Ц',
		'X': 'Ч',
		'I': 'Ш',
		'O': 'Щ',
		'}': 'Ъ',
		']': 'Ъ',
		'S': 'Ы',
		'M': 'Ь',
		'"': 'Э',
		"'": 'Ю',
		'Z': 'Я'
	};

	function cvtRus(src) {
		var i = 0,
			s = src.toUpperCase(),
			dst = '',
			ch;
		if (Lang.$ID != 'ru') {
			return s;
		}
		for (; i < s.length; i++) {
			ch = s.charAt(i);
			if (ch in rusMap) dst += rusMap[ch];
			else dst += ch;
		}
		return dst;
	}

	function makeKey(stName, noSlice) {
		if (!noSlice) {
			return cvtRus(stName.slice(0, 2));
		}
		else {
			return cvtRus(stName);
		}
	}

	this.makeKey = makeKey;

	/**
	 * сортировка списка станций
	 * @param {Array} list массив объектов из асинхронного запроса
	 * @param {string} namePart значение из инпута
	 * @param {int} tfl 1 - дальние, 2 - пригород, 3 - оба
	 * @return {Array}
	 */
	this.makeList = function(list, namePart, tfl) {
		var i, k, st, substr = cvtRus(namePart),
			result = [],
			LFlag = !!(tfl & 1),
			SFlag = !!(tfl & 2);
		// Найти все станции, у которых совпадает и соответствуют маске
		for (i in list) {
			st = list[i];
			// Отбросить станции, не соответствующие выбранному фильтру типов поездов
			if (!(st.S && SFlag) && !(st.L && LFlag)) {
				continue;
			}
			k = st.n.indexOf(substr);
			if (k >= 0) {
				st.k = k;
				result.push(st);
			}
		}
		// Сортировка по убыванию веса
		result.sort(function(a, b) {
			var weight1, weight2;
			// if (LFlag) {         //PIRS-13727
			if (tfl == 1) { //PIRS-13727
				weight1 = a.L;
				weight2 = b.L;
			}
			// else if (SFlag) {    //PIRS-13727
			else if (tfl == 2) { //PIRS-13727
				weight1 = a.S;
				weight2 = b.S;
			}
			else {
				weight1 = a.S + a.L;
				weight2 = b.S + b.L;
			}
			return cmp(weight2, weight1); // Сортировка по убыванию
		});
		// Ограничение числа станций в списке
		if (result.length > this.stLimit) {
			result.length = this.stLimit;
		}
		return result;
	};
	this.stLimit = 12;

	function cmp(a, b) {
		return a < b ? -1 : (a > b ? 1 : 0);
	}
};
</script> 



<style lang="less">
.stsug-wrap {
	position: relative;
	.spin {		
		position: absolute;
		top: 5px;
		right: 10px;
		font-size: 1.5em;
	}
}
.v-autocomplete-input-group .v-autocomplete-input {
	/*font-size: 1.5em;
	padding: 10px 15px;
	box-shadow: none;
	border: 1px solid #157977;
	width: calc(100% - 32px);
	outline: none;
	background-color: #eee;*/
}
.v-autocomplete-input-group.v-autocomplete-selected .v-autocomplete-input {
	//color: #008000;
	//background-color: #f2fff2;
}
.v-autocomplete-list {
	position: absolute;
	width: 100%;
	text-align: left;
	border: none;
	border-top: none;
	max-height: 400px;
	overflow-y: auto;
	border: 1px solid #ccc;
	box-shadow: 1px 3px 5px 1px #666;
	font-size: 1.3em;	
    border-radius: 0 0 6px 6px;
    z-index: 4;
}
.v-autocomplete-list-item {
	cursor: pointer;
	background-color: #fff;
	padding: 10px;
}
.v-autocomplete-list-item:last-child {
	border-bottom: none;
}
.v-autocomplete-list-item:hover, .v-autocomplete-item-active {
	background-color: #eee;
}
.v-autocomplete-list-item abbr {
	opacity: 0.8;
	font-size: 0.8em;
	display: block;
	font-family: sans-serif;
}

</style>