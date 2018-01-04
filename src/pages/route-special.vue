<template>
	<div>
		<routeform ref="routeForm" v-on:formsubmit="fetchTrains" v-on:formready="checkCache" />
		<div v-if="LOADER">Загрузка...</div>
		<template v-if="trdata.tp">
			<template v-for="trpane in trdata.tp">
				<div v-for="route in trpane.list" style="border-top: 1px solid;padding: 5px;">
					{{route.number}} &#160;&#160; 
					{{route.time0}} - {{route.time1}} &#160;&#160;
					{{route.station0}} - {{route.station1}} &#160;&#160;
					{{route.carrier}}
					<div>
						<span v-if="route.addHandLuggage">Ручная кладь</span>
						<span v-if="route.addPets">Животное</span>						
					</div>
				</div>
			</template>
		</template>
	</div>
</template>

<script>
	//import componentMixin from './route.js';
	import routeform from '@comps/route-form/route-form-special.vue'

	var vm;
	var storageKey_routeParams = 'RouteCache_req';
	var storageKey_routeData = 'RouteCache_res';

	export default {
		name:'RouteSpecial',
		//mixins: [componentMixin],
		components: {
			routeform
		},
		data: function(){
			return {
				LOADER: false,
				trdata: {}
			}
		},
		methods: {
			checkCache: function(requestParams){
				var prevRequestParamsStr = sessionStorage.getItem(storageKey_routeParams);
				var prevRequestData = window.store.session(storageKey_routeData);
				var cacheSuitable = JSON.stringify(requestParams) === sessionStorage.getItem;
				if (cacheSuitable && prevRequestData) {
					handleResponse(prevRequestData);
				}
			},
			fetchTrains: function(requestParams) {
				console.log(requestParams)
				vm.$data.LOADER = true;
				var url = '/timetable/public/' + PAGEDATA.lang +'?layer_id=5827';
				UTIL.ridQuery(url, requestParams, vm.$data).done(handleResponse);
			}
		},
		computed: {
			trdataFiltered: function(){
				return this.trdata;
			}
		},
		mounted: function(){
			vm = this;
		}
	}
	function handleResponse(responseData) {
		store.session('storageKey_routeParams', ''); // TODO пихнуть сюда параметры
		store.session('storageKey_routeData', responseData);
		for (var i = 0; i < responseData.tp.length; i++) {
			var cur_tp = responseData.tp[i];

			cur_tp.FILTERS = {
				luggage: {
					show: false,
					props: {}
				},
				carrier: {
					show: false,
					props: {}
				}
			}

			for (var j = 0; j < cur_tp.list.length; j++) {
				var route = cur_tp.list[j];

				// =============== Фильтры =============
				// ------------ фильтры багажа ---------
				var luggagePropNames = {
					// ключ - поле в ответе сервера; значение - имя сообщения ИФР (в переменной IFRMSG)
					'addAutoCarrier': 'ASHP_BAGGAGE_AUTO_NAME',
					'addCompLuggage': 'ASHP_BAGGAGE_COMPARTMENT_NAME',
					'addHandLuggage': 'ASHP_BAGGAGE_HAND_NAME',
					'addPets': 'ASHP_BAGGAGE_ANIMAL_NAME'
				};
				for (var lugPropName in luggagePropNames) {
					if (route[lugPropName] === true) {
						cur_tp.FILTERS.luggage.props[lugPropName] = {
							title: window.IFRMSG[luggagePropNames[lugPropName]],
							active: false
						};
						cur_tp.FILTERS.luggage.show = true;
					}
				}				
				// ------------ фильтр по перевозчику ---------
				cur_tp.FILTERS.luggage.props[route.carrier] = {
					title: route.carrier,
					active: false
				};
				
			}
		}
		vm.trdata = responseData;
	}
</script>
<style scoped lang="less">/* здесь можно писать scoped стили, либо указать src внешнего файла */</style> 