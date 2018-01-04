<template>
	<div>
		здесь будет страница бронирования
		<router-link to="form">форма</router-link>
	</div>
</template>

<script>
	import componentMixin from './passdata-reserv.js';
	import paymentHandler from '@comps/payment-handler/payment-handler-special.vue'

	export default {
		name:'PassdataReservSpecial',		
		components: {
			'payment-handler': paymentHandler
		},
		mixins: [componentMixin]
	}
</script>
<style scoped lang="less">/* здесь можно писать scoped стили, либо указать src внешнего файла */</style> 