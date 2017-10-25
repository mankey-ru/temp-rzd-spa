<script>import componentMixin from './payment-handler.js';export default {name:'PaymentHandlerSpecial', mixins: [componentMixin]}</script>
<style scoped lang="less">/* здесь можно писать scoped стили, либо указать src внешнего файла */</style> 

<template>	
	<div>
		<template v-if="paymentAvailable">
			<h3>Способ оплаты</h3>

			<div class="pass-reserv-paymethod" tabindex="0" v-for="ps in list" v-on:click="select(ps)" v-bind:class="{'selected': curCode === ps.code}">
				<div class="row">
					<div class="col-md-2 text-center">
						<i class="glyphicon glyphicon-ok"></i>
					</div>
					<div class="col-md-22">
						<label>
							<span class="sr-only">
								<input type="radio" v-bind:value="ps.code" v-bind:name="ps.name"/> &#160;
							</span>
							{{ps.name}}
						</label>
						<br/>
						{{ps.tip}}
					</div>
				</div>
			</div>

			<form v-if="yandexMoney" v-bind:action="yandexMoney.url || 'https://money.yandex.ru/eshop.xml'" method="post" ref="yaform">
				<input v-for="(val, key) in yandexMoney" v-bind:name="key" v-bind:value="val" v-if="key !== 'url'" type="hidden" />
			</form>
		</template>

		<pre v-if="HUMAN_ERROR" class="pre-message pre-message-common">{{HUMAN_ERROR}}</pre>

	</div>	
</template>