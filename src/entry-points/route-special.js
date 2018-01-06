import makeRoot from './_makeRoot.js'
import pageComponent from '@pages/route-special.vue'

makeRoot({
	comps: {
		pageComponent
	},
	routes: [{
		alias: '/',
		path: '/route',
		name: 'page-route',
		component: pageComponent
	}]
});