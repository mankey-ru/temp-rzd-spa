<script>import componentMixin from './payment-handler.js';export default {name:'PaymentHandlerRedesign', mixins: [componentMixin]}</script>
<style scoped lang="less">/* здесь можно писать scoped стили, либо указать src внешнего файла */</style> 

<template>	
	<div>
		<template v-if="paymentAvailable">

			<div class="payment-systems row">
				<div class="col-xs-8 payment-systems__item"
					v-for="ps in list" 
					v-on:click="select(ps)"
					v-bind:title="ps.tip"
					v-bind:class="{'selected': curCode === ps.code}">								
					<div class="payment-systems__item-cont">
						<!--@formatter:off-->
						<label><span class="glyphicon glyphicon-check pseudoradio__checked"></span><span class="glyphicon glyphicon-unchecked pseudoradio"></span><img v-bind:src="'/dbmm/images/61/28054/' + ps.id" class="payment-systems__logo"/></label>
						<!--@formatter:on-->
					</div>
				</div>
			</div>

			<form v-if="yandexMoney" v-bind:action="yandexMoney.url || 'https://money.yandex.ru/eshop.xml'" method="post" ref="yaform">
				<input v-for="(val, key) in yandexMoney" v-bind:name="key" v-bind:value="val" v-if="key !== 'url'" type="hidden" />
			</form>
		</template>

		<pre v-if="HUMAN_ERROR" class="alert alert-danger">{{HUMAN_ERROR}}</pre>

	</div>		
</template>