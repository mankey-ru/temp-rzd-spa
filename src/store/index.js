import Vue from 'vue'
import Vuex from 'vuex'
import request from 'superagent'

/*
	Это глобальный стейт для всего SPA, предназначен для глобальных же вещей
	Если стейт нужен для каких-то частных страниц, надо использовать модули и класть их в соседние файлы
	Модули - это вот https://vuex.vuejs.org/en/modules.html
*/


const state = {

};

const mutations = {
	m_updateUser: function (state, user) {
		Vue.set(state, 'currentUser', user);
	}
};

const actions = {
	a_updateUser: function (store, user) {
		return store.commit('m_updateUser', user)
	}
};

const getters = {
	currentUser: state => state.currentUser
};



// -------------------------------------------------------------------------------
Vue.use(Vuex);
export default new Vuex.Store({
	state,
	getters,
	actions,
	mutations
})