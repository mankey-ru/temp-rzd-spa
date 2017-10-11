import Vue from 'vue'
import router from './vue-router.js'
import store from './vue-store.js'
import Theme from './vue-components/Theme.vue'

new Vue({
	el: '#vue-app',
	router,
	store,
	render: (h) => h(Theme)
})