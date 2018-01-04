import makeRoot from './_makeRoot.js'
import formComponent from '@pages/passdata-form.special.vue'
import reservComponent from '@pages/passdata-reserv.special.vue'

makeRoot({
	comps: {
		formComponent,
		reservComponent
	},
	routes: [{
		alias: '/',
		path: '/form',
		name: 'form',
		component: formComponent
	}, {
		path: '/reserv',
		name: 'reserv',
		component: reservComponent
	}]
});