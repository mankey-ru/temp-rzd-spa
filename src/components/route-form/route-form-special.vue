<style lang="less">
.rtf-slider {
	margin-top: .3em;
	margin-left: 14px;
	.vue-slider-process {
		background-color: #000 !important;
	}
	.vue-slider-tooltip {
		border-color: #000 !important;
		background-color: #000 !important;
	}
}
.rtf-time-td-1 {
	white-space: nowrap;
}
.rtf-time-td-2 {
	width: 100%;
}
</style>

<template>
	<div>
		<form v-on:submit.prevent="trySubmit">
			<div class="row form-group">				
				<div class="col-md-11">
					<label class="label-xl">
						<i class="glyphicon glyphicon-asterisk color-red-base"></i> Станция отправления
					</label>
					<suggester :value.sync="stationFrom" />
				</div> 
				<div class="col-md-2">
					<label class="dummy"></label>
					<a class="btn btn-lg btn-block" v-on:click="changeStations">
						<i class="glyphicon glyphicon-transfer"></i>
					</a>
				</div>
				<div class="col-md-11">			
					<label class="label-xl">
						<i class="glyphicon glyphicon-asterisk color-red-base"></i> Станция прибытия
					</label>
					<suggester :value.sync="stationTo" />
				</div>
			</div>
			<div class="row form-group">
				<div class="col-md-7">
					<label class="control-label">Дата отправления</label>
					<input class="form-control" v-jqui-datepicker="dt0" data-multi-months="true" ref="inp_dt0"/>
				</div>
				<div class="col-md-4">
					<label for="" class="dummy"></label>
					<button class="btn btn-block" v-on:click.prevent="triggerDateFocus(0)">Выбрать дату</button>
				</div>
				<div class="col-md-13">					
					<label for="" class="control-label">Время отправления</label>
					<table>
						<tr>
							<td class="rtf-time-td-1">
								<div class="form-inline">
									с <input size="1" class="form-control" v-model="times0[0]" /> 
									до <input size="1" class="form-control" v-model="times0[1]" />
								</div>
							</td>
							<td class="rtf-time-td-2">
								<slider v-model="times0" :min="0" :max="24" tooltip="hover" class="rtf-slider" />
							</td>
						</tr>
					</table>
				</div>
			</div>

			<div class="row form-group">
				<div class="col-md-24">
					<label class="form-label"><input type="checkbox" v-model="dir" /> Обратно</label>
				</div>
			</div>

			<div class="row form-group" v-if="dir">
				<div class="col-md-7">
					<label class="control-label">Дата отправления обратно</label>
					<input class="form-control" v-jqui-datepicker="dt0" data-multi-months="true" ref="inp_dt1"/>
				</div>
				<div class="col-md-4">
					<label for="" class="dummy"></label>
					<button class="btn btn-block" v-on:click.prevent="triggerDateFocus(1)">Выбрать дату</button>
				</div>
				<div class="col-md-13">					
					<label for="" class="control-label">Время отправления обратно</label>
					<table>
						<tr>
							<td class="rtf-time-td-1">
								<div class="form-inline">
									с <input size="2" class="form-control" v-model="times1[0]" /> 
									до <input size="2" class="form-control" v-model="times1[1]" />
								</div>
							</td>
							<td class="rtf-time-td-2">
								<slider v-model="times1" :min="0" :max="24" tooltip="hover" class="rtf-slider" />
							</td>
						</tr>
					</table>
				</div>
			</div>
			<div class="row">
				<div class="col-md-12">
					<label><input type="checkbox" v-model="tfl_1" v-on:change="tfl_click"  /> Поезда</label> 
					&nbsp;
					<label><input type="checkbox" v-model="tfl_2" v-on:change="tfl_click" /> Электрички</label>
				</div>
				<div class="col-md-6">
					<label><input type="checkbox" v-model="checkSeats" /> Только с билетами</label>
				</div>
				<div class="col-md-6 text-right">
					<button class="btn btn-lg" type="submit">
						<template v-if="checkSeats">Купить билет</template>
						<template v-else>Посмотреть расписание</template>
					</button>
				</div>
			</div>
		</form>
	</div>
</template>

<script>
	import suggester from '@comps/station-suggester.vue'
	import jquiDatepicker from '@directives/jqui-datepicker.js'
	import slider from 'vue-slider-component'
	import moment from 'moment'

	var hashPrefix = '#/?data=';
 
	export default { 
		data: function(){
			return {
				//stationFrom: null, // => 
				st0: null,
				code0: null,
				st1: null,
				code1: null,
				//stationTo: null,  // => st1, code1
				times0: [0,24], // => ti0
				times1: [0,24], // => ti1
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
			isValid: function () { // так как полей всего ничего, решил не юзать либу и валидировать руками
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
			tfl_click: function(val){
				if (this.$data.tfl_1 === this.$data.tfl_2) {
					this.$data.tfl_1 = true;
					this.$data.tfl_2 = true;
					this.$data.tfl = 3;
				}
				else {
					this.$data.tfl = this.$data.tfl_1 ? 1 : 2;
				}
			},
			trySubmit: function(){
				if (this.isValid) {
					this.form2hash()
					this.$emit('formsubmit', this.getRequestParams());
				}
			},
			changeStations: function () {
				var from = this.stationFrom ? Object.assign({}, this.stationFrom) : null; // хз зачем я клонирую
				var to = this.stationTo ? Object.assign({}, this.stationTo) : null;
				this.stationFrom = to;
				this.stationTo = from;
			},
			triggerDateFocus: function(index) {
				this.$refs['inp_dt' + index].focus();
			},
			getRequestParams: function(){ // получение объекта с параметрами запроса для гейзера
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
			form2hash: function(){
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
		mounted: function(){
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
</script>