import Vue from 'vue'
import devmenu from '@comps/devmenu.vue'
import globalMixins from '@mixins'

/** Функция, создающая корневой инстанс Vue, призвана избежать дублирования кода */

export default function(pageComponent) {

	var vm = new Vue({
		el: '#vue-app',
		mixins: [globalMixins],
		components: {
			devmenu,
			'page-component': pageComponent
		},
		template: '<div><devmenu v-if="IS_DEV"/><page-component/></div>'
	});

	if (window && window.PAGEDATA && window.PAGEDATA.showErrors) {
		window.VUEI = vm;
	};
}



















/*
	import Vue from 'vue'
	import router from './cabinet-router.js'
	import store from '@store.js'
	import devmenu from '@comps/devmenu.vue'
	import mixins from '@mixins'

	var vm = new Vue({
		el: '#vue-app',
		router,
		store,	
		mixins: [mixins],
		components: {devmenu},
		template: '<div><devmenu v-if="IS_DEV"/><router-view/></div>'
		// вместо темплейте, если компонент один, можно указать render: (h) => h(Theme),
	});

	if (window && window.PAGEDATA && window.PAGEDATA.showErrors) {
		window.VUEI = vm;
	}
*/