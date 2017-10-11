import Vue from 'vue'
import Vuex from 'vuex'
import request from 'superagent'

const state = {}
const mutations = {
	m_updateUser: function (state, user) {
		Vue.set(state, 'currentUser', user);
	}
}
const actions = {
	updateUser: function (store, user) {
		return store.commit('m_updateUser', user)
	}
};
const getters = {
	currentUser: state => state.currentUser
}

// -------------------------------------------------------------------------------
Vue.use(Vuex);
export default new Vuex.Store({
	state,
	getters,
	actions,
	mutations
})