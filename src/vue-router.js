import Vue from 'vue'
import VueRouter from 'vue-router'

import p_cabinet from './vue-components/p_cabinet.vue';
import p_result from './vue-components/p_result.vue';

const routes = [{
	alias: '/',
	path: '/cabinet',
	name: 'cabinet',	
	component: p_cabinet,
	meta: {
		title: 'Мои заказы'
	}
}, {
	path: '/result',
	name: 'result',
	component: p_result,
	meta: {
		title: 'Результат оплаты'
	}
}, { // 404
	path: '*',
	component: {
		template: `
			<h1 class="text-center"><br/><br/>Ой-вэй, страница не найдена</h1>
			`
	}
}];

Vue.use(VueRouter);
var router = new VueRouter({
	routes
});

// router.beforeEach((to, from, next) => {}) // https://router.vuejs.org/en/advanced/navigation-guards.html
export default router;