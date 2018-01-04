<template>
	<div>
		здесь будет страница ввода пассданных
		<router-link to="reserv">бронирование</router-link>
	</div>
</template>

<script>
	import componentMixin from './passdata-form.js';

	export default {
		name:'PassdataFormSpecial',
		mixins: [componentMixin]
	}
</script>
<style scoped lang="less">/* здесь можно писать scoped стили, либо указать src внешнего файла */</style> 