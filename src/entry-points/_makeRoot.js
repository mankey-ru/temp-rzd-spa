/** 
	Функция, создающая корневой инстанс Vue, призвана избежать дублирования кода
	
	Минимальный вызов:
		makeRoot({
			comps: {pageComponent}
		})

	Вызов с множественными страницами (т.е. с роутером):
		makeRoot({			
			comps: {componentA, componentB},
			routes: [{
				alias: '/',
				path: '/routeA',
				name: 'routeA',
				component: componentA
			}, {
				path: '/routeA',
				name: 'routeB',
				component: componentB
			}]
		})
*/
import Vue from 'vue'
import VueRouter from 'vue-router'
import devmenu from '@comps/devmenu.vue'
import globalMixins from '@mixins'
import _ from 'underscore'

export default function(opts) {

	var hasRoutes = !!opts.routes;

	var midpageTpl = opts.template || (hasRoutes ? '<router-view/>' : '<mainpagecomponent/>');

	var components = _.assign({
		devmenu: devmenu
	}, opts.comps);

	if (!hasRoutes && !opts.template) {
		components['mainpagecomponent'] = opts.comps[Object.keys(opts.comps)[0]]; // берём первый переданный компонент как основной по дефолту
	}

	var options = {
		el: '#vue-app',
		mixins: [globalMixins, ...(opts.mixins || [])],
		components,
		template: opts.template || '<div><devmenu v-if="IS_DEV"/>' + midpageTpl + '</div>'
	}

	if (hasRoutes) {
		Vue.use(VueRouter);
		options.router = new VueRouter({
			routes: opts.routes.concat([{
				path: '*', // 404
				component: {
					template: `<h1 class="text-center"><br/>Cтраница не найдена<br/></h1>`
				}
			}])
		});
	}

	var vm = new Vue(options);

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