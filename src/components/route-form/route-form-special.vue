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
		.vue-slider-dot {
			cursor: move !important;
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
	.rtf-err {
		color: red;
		height: 1.3em;
	}
	.glyphicon-transfer {
		font-size: 1.2em;
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
					<suggester v-model="stationFrom" storage="StSuggesterFrom" />
					<div class="rtf-err" role="alert">{{v.stationFrom}}</div>
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
					<suggester v-model="stationTo" storage="StSuggesterTo" /> 
					<!-- TODO попробовать :value.sync=st0 и st1 -->
					<div class="rtf-err" role="alert">{{v.stationTo}}</div>
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
					<div class="rtf-err" role="alert">{{v.dt0}}</div>
				</div>
				<div class="col-md-24" v-if="saleDepthLinks.length"> <!-- вообще нужно юзать сообщение SALE_DEPTH_LINK_TMPL, но там мусташевская разметка, так что ради чистоты подхода - хардкод, всё равно никто никогда не будет этого менять -->
					<template v-for="sd in saleDepthLinks">
						<a v-on:click="applySaleDepth(sd)" class="link-dotted">За {{sd.days}} <template v-if="sd.endsWithOne">сутки</template><template v-else>суток</template> ({{sd.sellDate}}, {{sd.dayOfWeek}})</a> &nbsp;
					</template>
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
									с <input size="1" class="form-control" v-model="times1[0]" /> 
									до <input size="1" class="form-control" v-model="times1[1]" />
								</div>
							</td>
							<td class="rtf-time-td-2">
								<slider v-model="times1" :min="0" :max="24" tooltip="hover" class="rtf-slider" />
							</td>
						</tr>
					</table>
				</div>
				<div class="col-md-24">					
					<div class="rtf-err" role="alert">{{v.dt1}}</div>
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