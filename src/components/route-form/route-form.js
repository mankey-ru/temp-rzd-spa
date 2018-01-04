import suggester from '@comps/station-suggester.vue'
import jquiDatepicker from '@directives/jqui-datepicker.js'
import slider from 'vue-slider-component'
import moment from 'moment'

var hashPrefix = '#/?data=';

export default {
	data: function() {
		return {
			//stationFrom: null, // => 
			st0: null,
			code0: null,
			st1: null,
			code1: null,
			//stationTo: null,  // => st1, code1
			times0: [0, 24], // => ti0
			times1: [0, 24], // => ti1
			dt0: '',
			dt1: '',
			tfl: 0, // 1 - ДС, 2 - ПС, 3 - неважно
			tfl_1: true,
			tfl_2: true,
			dir: 0, // туда или туда-обратно
			checkSeats: true, // "только с местами"
			md: 2, // пересадки
			v: {
				stationFrom: '',
				stationTo: '',

			}
		}
	},
	computed: {
		stationFrom: stationComputed(0),
		stationTo: stationComputed(1),
		isValid: function() { // так как полей всего ничего, решил не юзать либу и валидировать руками
			var d = this.$data;
			for (var k in d.v) {
				d.v[k] = '';
			}
			var ok = true;
			if (!d.st0 || !d.code0) {
				ok = false;
				d.v.stationFrom = 'Пожалуйста, выберите станцию отправления';
			}
			if (!d.st1 || !d.code1) {
				ok = false;
				d.v.stationTo = 'Пожалуйста, выберите станцию назначения';
			}
			if (!d.dt0) {
				ok = false;
				d.v.dt0 = 'Пожалуйста, выберите дату отправления';
			}
			if (d.dir && !d.dt1) {
				ok = false;
				d.v.dt1 = 'Пожалуйста, выберите дату отправления обратно';
			}
			return ok;
		}
	},
	methods: {
		tfl_click: function(val) {
			if (this.$data.tfl_1 === this.$data.tfl_2) {
				this.$data.tfl_1 = true;
				this.$data.tfl_2 = true;
				this.$data.tfl = 3;
			}
			else {
				this.$data.tfl = this.$data.tfl_1 ? 1 : 2;
			}
		},
		trySubmit: function() {
			if (this.isValid) {
				this.form2hash()
				this.$emit('formsubmit', this.getRequestParams());
			}
		},
		changeStations: function() {
			var from = this.stationFrom ? Object.assign({}, this.stationFrom) : null; // хз зачем я клонирую
			var to = this.stationTo ? Object.assign({}, this.stationTo) : null;
			this.stationFrom = to;
			this.stationTo = from;
		},
		triggerDateFocus: function(index) {
			this.$refs['inp_dt' + index].focus();
		},
		getRequestParams: function() { // получение объекта с параметрами запроса для гейзера
			var d = this.$data;
			var r = {};
			r.st0 = d.st0;
			r.code0 = d.code0;
			r.st1 = d.st1;
			r.code1 = d.code1;
			r.dt0 = d.dt0;
			r.ti0 = d.times0.join('-');
			if (d.dir) {
				r.dt1 = d.dt1;
				r.ti0 = d.times1.join('-');
			}
			r.dir = d.dir | 0;
			r.tfl = d.tfl;
			r.checkSeats = d.checkSeats | 0;
			return r;
		},
		hash2form: function() {
			// когда (если) будет роутер, параметр можно будет доставать из $route.query
			var req = window.location.hash.toString().split(hashPrefix);
			if (req.length === 2) {
				var hashData;
				try {
					hashData = JSON.parse(decodeURIComponent(req[1]));
				}
				catch (e) {};
				if (hashData) {
					for (var k in hashData) {
						this.$data[k] = hashData[k];
					}
					if (this.isValid) {
						this.$emit('formready', this.getRequestParams());
					}
				}
			};
		},
		form2hash: function() {
			window.location.hash = hashPrefix + encodeURIComponent(JSON.stringify(this.getRequestParams()));
		}
	},
	components: {
		suggester,
		slider
	},
	directives: {
		'jqui-datepicker': jquiDatepicker
	},
	watch: {
		times0: timeWatcher,
		times1: timeWatcher
	},
	mounted: function() {
		this.hash2form();
	}
}

function timeWatcher(timeArr) {
	for (var i = 0; i < timeArr.length; i++) {
		timeArr[i] = timeArr[i] | 0;
	}
}

function stationComputed(index) {
	var stName = 'st' + index;
	var codeName = 'code' + index;
	return {
		get: function() {
			return this[stName] && this[codeName] ? {
				label: this[stName],
				value: this[codeName]
			} : null;
		},
		set: function(v) {
			if (v) {
				this[stName] = v.label;
				this[codeName] = v.value;
			}
		}
	}
}