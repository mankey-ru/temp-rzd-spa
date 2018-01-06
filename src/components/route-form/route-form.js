import suggester from '@comps/station-suggester.vue'
import datepicker from '@comps/jqui-datepicker.vue'
import slider from 'vue-slider-component'
import moment from 'moment'

var dateFormat = 'DD.MM.YYYY';
var vm;

export default {
	data: function() {
		return {
			st0: '',
			code0: '',
			st1: '',
			code1: '',
			ti0: '0-24',
			ti1: '0-24',
			dt0: moment(window.PAGEDATA.srvDate).format(dateFormat),
			dt1: moment(window.PAGEDATA.srvDate).add(1,'days').format(dateFormat),
			tfl: 0, // 1 - ДС; 2 - ПС; 3 - неважно|оба
			tfl_1: true,
			tfl_2: true,
			dir: 0, // туда или туда-обратно
			checkSeats: true, // "только с местами"
			md: 2, // пересадки
			saleDepthLinks: [],
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
		times0: timesComputed(0),
		times1: timesComputed(1),
		minDate1: function(){
			return this.$data.dt0 // moment(this.$data.dt0, dateFormat);
		},
		isValid: {
			cache: false,
			get: function() { // так как полей всего ничего, решил не юзать либу и валидировать руками
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

				var errDt0 = !d.dt0 || !dateIsValid(d.dt0);
				err += errDt0;
				d.v.dt0 = errDt0 ? 'Пожалуйста, выберите или введите дату отправления в формате ДД.ММ.ГГГГ' : '';

				var errDt1 = !!d.dir && (!d.dt1 || !dateIsValid(d.dt1));
				err += errDt1;
				d.v.dt1 = errDt1 ? 'Пожалуйста, выберите или введите дату отправления обратно в формате ДД.ММ.ГГГГ' : '';

				function dateIsValid(dateStr) {
					return moment(dateStr, dateFormat, true).isValid()
				}

				return !err;
			}
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
			var _data = Object.assign({}, this.$data);
			this.$data.st0 = _data.st1;
			this.$data.code0 = _data.code1;
			this.$data.st1 = _data.st0;
			this.$data.code1 = _data.code0;
		},
		triggerDateFocus: function(index) {
			this.$refs['inp_dt' + index].$el.focus();
		},
		getRequestParams: function() { // получение объекта с параметрами запроса для гейзера
			var d = this.$data;
			var paramNames = ['st0', 'code0', 'st1', 'code1', 'dt0', 'ti0', 'tfl', 'dir', 'checkSeats'];
			if (d.dir) {
				paramNames.push('dt1', 'ti1');
			}
			var r = window.copyFields({}, this.$data, paramNames);
			if (r.checkSeats === 0) {
				r.withoutSeats = 'y'; // неявный и недокументированный параметр, отвечающий за показ ушедших поездов
			}			
			return r;
		},
		hash2form: function() {
			for (var k in this.$route.query) {
				if (k in this.$data) {					
					var val = this.$route.query[k];
					if ((val | 0).toString() === val) { // чтобы цифры продолжали оставаться цифрами
						val = val | 0;
					}
					this.$data[k] = val;
				}
			}
			this.$data.v._onceSubmitted = true;
			if (this.isValid && window.location.hash.indexOf('_PREVENT_FORM_SUBMIT_') === -1) {
				this.$emit('formready', this.getRequestParams());
			}
		},
		form2hash: function() {
			this.$router.push({
				name: 'page-route',
				query: this.getRequestParams()
			})
		},
		applySaleDepth: function(sd){
			this.$data.dt0 = sd.sellDate;
		}
	},
	components: {
		suggester,
		datepicker,
		slider
	},
	watch: {
		dt0: validationTrigger,
		dt1: validationTrigger,
		st0: validationTrigger,
		st1: validationTrigger
	},
	mounted: function() {
		vm = this;
		this.hash2form();
		window.SaleDepth.get('/catalogue/sales_depth/').then(function() {
			vm.$data.saleDepthLinks = window.SaleDepth.getCalendarLinksArray();
		});
	}
}

function validationTrigger() {
	return this.isValid;
}

function timesComputed(index) {
	var key = 'ti' + index;
	return {
		get: function() {
			return this.$data[key].split('-');
		},
		set: function(v) {
			this.$data[key] = v.join('-');
		}
	}
}