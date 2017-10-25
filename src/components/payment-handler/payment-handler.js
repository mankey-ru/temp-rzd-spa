// Компонент выбора платёжной системы и перехода к оплате
// минимально необходимый вызов:
// <payment-handler v-bind:jr="jr" ref="paymentHandler"></payment-handler> где jr - journeyReservation

export default {
	props: {
		// Ответ на запрос бронирования
		// TODO возможно имеет смысл не пихать в пропс весь объект, а только то что нужно
		jr: {
			type: Object,
			'default': function() { // Props with type Object/Array must use a factory function to return the default value.
				return {}
			}
		},
		// Флаг повторной попытки оплаты
		// Случается на странице возврата из банка
		// Если результат неуспешный
		retry: {
			type: Boolean,
			'default': false
		},
		// Тип клиента (эктора)
		// бывает:
		// * desktop_2016
		// * MOBILE_USER
		// * INSPECTOR
		// * TRAINMASTER
		actor: {
			type: String
				// 'default': 'desktop_2016'
		}
	},
	data: function() {
		return {
			curCode: store.local.get('paymethod') || 'BANK',
			bRetry: this.$props.retry,
			paymentAvailable: true,
			LOADER: false, // изменяется в т.ч. из ridQuery
			HUMAN_ERROR: '' // изменяется в т.ч. из ridQuery
		}
	},
	computed: { // в компьютед попадают те пропсы которые могут быть изменены извне
		// Список платёжных систем.
		// Получается на этапе бронирования, сохраняется в сторедж
		list: function() {
			return this.$props.jr.paymentSystems
		},
		// Параметры для перехода в яндекс
		// Получается на этапе бронирования, сохраняется в сторедж
		yandexMoney: function() {
			return this.$props.jr.yandexMoney
		},
		// Айди заказа
		// Получается на этапе бронирования
		// на этапе возврата берётся из урла
		saleOrderId: function() {
			return this.$props.jr.saleOrderId || UTIL.pageData.orderid || UTIL.pageData.orderId || UTIL.pageData.saleOrderId; // vuex
		},
		//полная сумма к оплате
		totalSum: function() {
			return this.$props.jr.totalSum;
		},
		//тип платежа по своей сути за что платеж.
		type: function() {
			return this.$props.jr.type || 'TICKET';
		},

		//!НЕ РАБОТАЕТ!
		transactionId: function() {
			return this.$props.jr.transactionId; // Я не знаю поечму этот параметр не передается, я передаю его в как аргумент к функции submit
		}
	},
	methods: {
		select: function(ps) {
			if (yaCheckRequest) {
				// пользователь после яндекса сам кликает-переключается на банк
				yaCheckRequest.cancel();
			}
			this.$data.curCode = ps.code;
		},
		// Нажатие на кнопку оплатить
		// авторизация в банке, затем goPay
		submit: function(transactionId) { // вызов из родителя: this.$refs.paymentHandler.submit();
			var vm = this;
			// TODO дизейбл кнопки (у родителя)
			store.local.set('paymethod', vm.$data.curCode);
			// Если НЕ яндекс
			// значит или BANK или вообще ВТТ либо лояльность (безденежная оплата, сумма заказа 0)
			if (vm.$data.curCode !== 'YANDEX') {
				vm.goPay(transactionId);
			}
			else { // Если яндекс, перед переходом надо спросить у него, можно ли попробовать ещё раз
				UTIL.log('Проверка возможности оплаты Яндексом');
				// TODO крутилка
				var url = '/ticket/services/payment/possibility/check/journey/' + vm.saleOrderId + '/' + UTIL.pageData.lang + UTIL.getServiceParams();
				yaCheckRequest = UTIL.ridQuery(url)
					.fail(function() { // вызывается когда response.error непустой
						UTIL.dialogMessage('Оплата Яндекс.Деньгами невозможна');
						vm.curCode = 'BANK'; // TODO вообще скрыть яндекс?
					})
					.done(function() {
						vm.goPay(transactionId)
					});
			}
		},
		// Переход на страницу платёжной системы
		// происходит после авторизации в банке
		goPay: function(transactionId) {
			var vm = this,
				url;
			// --- идём на страницу подтверждения оплаты (если общая сумма заказа равна 0, это по всей видимости - ВТТ, лояльность)
			if (!vm.totalSum) {
				url = '?layer_name=e3-result&zero=1&result=OK&orderId=' + vm.saleOrderId + UTIL.getServiceParams();
				window.location.href = url;
				// Важен параметр zero, т.к. с его помошью выбирается адрес запроса на подтверждение payment0 в orders.js
			}
			else if (vm.$data.curCode === 'YANDEX') { // --- идём в Яндекс
				this.$refs.yaform.submit();
			}
			else if (vm.$data.curCode === 'BANK') { // --- Идём в банк
				url = window.UTIL.pageData.LayerLinks.bankAuth || '?layer_id=5734'; // правильнее брать из метаданных, т.к. в случае 'неправильного' path (например если из редизайна просить слой 152 ИФР) случается редирект и POST-параметры попадают в кверистринг
				var params = {
					type: vm.type,
					orderId: vm.saleOrderId,
					actorType: vm.$props.actor
				};
				if (transactionId) {
					params.transactionId = transactionId;
				}
				window.UTIL.ridQuery(url, params, vm.$data)
					.done(function(response) {
						window.location.href = response.url;
					})
					.always(function() { // чтобы при ошибке у родителя скрывалась крутилка. Кривовато, но...
						if (vm.$parent && vm.$parent.$data.LOADING_NEXT === true) {
							vm.$parent.$data.LOADING_NEXT = false;
						}
					})
					.fail(function(error, errData) {
						if (vm.$parent && error === 'Оплата заказа невозможна') {
							vm.$data.paymentAvailable = false;
							vm.$parent.$data.paymentAvailable = false;
						}
					})
			}
			else {
				throw new Error('Не найден обработчик для кода ' + curCode);
			}
		},
		getImageSrc: function(ps) {
			return '/dbmm/images/61/28054/' + ps.id;
		}
	},
	mounted: function() {
		window.UTIL.log('payment-handler mounted');
		if (window.UTIL.pageData.showErrors === true) { // сервер разработческий или в урле есть err
			window.VUEI_paymentHandler = this;
		}
	}
}