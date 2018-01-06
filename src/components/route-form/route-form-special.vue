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

<style scoped>
	.v-err {
		color: red;
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
					<span class="v-err">{{v.stationFrom}}</span>
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
					<span class="v-err">{{v.stationTo}}</span>
				</div>
			</div>
			<div class="row form-group">
				<div class="col-md-7">
					<label class="control-label">Дата отправления</label>
					<datepicker v-model="dt0" :months="3" :mindate="minDate0" :maxdate="maxDate" ref="inp_dt0" />
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
				<div class="col-md-24">					
					<span class="v-err">{{v.dt0}}</span>
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
					<datepicker v-model="dt1" :months="3" :mindate="minDate1" :maxdate="maxDate" ref="inp_dt1" />
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
				<div class="col-md-24">					
					<span class="v-err">{{v.dt1}}</span>
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

<script src="./route-form.js"></script>