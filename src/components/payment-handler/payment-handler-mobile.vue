<script>import componentMixin from './payment-handler.js';export default {name:'PaymentHandlerMobile', mixins: [componentMixin]}</script>
<style scoped lang="less">/* здесь можно писать scoped стили, либо указать src внешнего файла */</style> 

<template>	
	<div>
		<template v-if="paymentAvailable">			
			<div class="page-reserv">
				<div class="row">

					<div class="col-sm-4 col-xs-6 payment-systems__item" 
						v-for="ps in list" 
						v-on:click="select(ps)"
						v-bind:class="{'selected': curCode === ps.code}">
						<div class="payment-systems__item-cont">
							<label v-bind:title="ps.tip">
								<img v-bind:src="'/dbmm/images/61/28054/' + ps.id"/>
							</label>
						</div>
					</div>

					<form v-if="yandexMoney" v-bind:action="yandexMoney.url || 'https://money.yandex.ru/eshop.xml'" method="post" ref="yaform">
						<input v-for="(val, key) in yandexMoney" v-bind:name="key" v-bind:value="val" v-if="key !== 'url'" type="hidden" />
					</form>
				</div>

				<pre v-if="HUMAN_ERROR" class="pre-message pre-message-common">{{HUMAN_ERROR}}</pre>

			</div>
		</template>
	</div>	
</template>