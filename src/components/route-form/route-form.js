import suggester from '@comps/station-suggester.vue'
import datepicker from '@comps/jqui-datepicker.vue'
import slider from 'vue-slider-component'
import moment from 'moment'

var hashPrefix = '#/?data=';
var dateFormat = 'DD.MM.YYYY';

export default {
	data: function() {
		return {
			st0: null,
			code0: null,
			st1: null,
			code1: null,
			times0: [0, 24], // => ti0
			times1: [0, 24], // => ti1
			dt0: moment(window.PAGEDATA.srvDate).format(dateFormat),
			dt1: moment(window.PAGEDATA.srvDate).add(1,'days').format(dateFormat),
			tfl: 0, // 1 - ДС; 2 - ПС; 3 - неважно|оба
			tfl_1: true,
			tfl_2: true,
			dir: 0, // туда или туда-обратно
			checkSeats: true, // "только с местами"
			md: 2, // пересадки
			v: {
				stationFrom: '',
				stationTo: '',
				dt0: '',
				dt1: ''
			},
			maxDate: (PAGEDATA.BaseParams.SALE_DATE_MAX | 0) || 60, // жиквери уи принимает и колво дней и даты
			minDate0: moment(window.PAGEDATA.srvDate).format(dateFormat) // т.е. сегодня. minDate1 - в computed
		}
	},
	computed: {
		stationFrom: stationComputed(0),
		stationTo: stationComputed(1),
		minDate1: function(){
			return this.$data.dt0 // moment(this.$data.dt0, dateFormat);
		},
		isValid: function() { // так как полей всего ничего, решил не юзать либу и валидировать руками
			var d = this.$data;
			if (!d.v._onceSubmitted) {
				return false
			}

			var err = 0;

			var errSt0 = (!d.st0 || !d.code0);
			err += errSt0;
			d.v.stationFrom = errSt0 ? 'Пожалуйста, выберите станцию отправления' : '';

			var errSt1 = (!d.st1 || !d.code1);
			err += errSt1;
			d.v.stationTo = errSt1 ? 'Пожалуйста, выберите станцию назначения' : '';

			var errDt0 = !d.dt0;
			err += errDt0;
			d.v.dt0 = errDt0 ? 'Пожалуйста, выберите дату отправления' : '';

			var errDt1 = !!d.dir && !d.dt1;
			err += errDt1;
			d.v.dt1 = errDt1 ? 'Пожалуйста, выберите дату отправления обратно' : '';

			function dateIsValid(dateStr) {
				return moment(dateStr, dateFormat, true).isValid()
			}



		/*	var inst = $.datepicker._getInst(element);
			var minDate = $.datepicker._determineDate(inst, $.datepicker._get(inst, 'minDate'), null);
			var maxDate = $.datepicker._determineDate(inst, $.datepicker._get(inst, 'maxDate'), null);	
			return [_fdate(minDate), _fdate(maxDate)];
			function _fdate(date){return $.datepicker.formatDate('dd.mm.yy',date)}*/

			return !err;
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
			this.$data.v._onceSubmitted = true;
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
			this.$refs['inp_dt' + index].$el.focus();
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
			if (r.checkSeats === 0) {
				r.withoutSeats = 'y'; // неявный и недокументированный параметр, отвечающий за показ ушедших поездов
			}			
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
					this.$data.v._onceSubmitted = true;
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
		datepicker,
		slider
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