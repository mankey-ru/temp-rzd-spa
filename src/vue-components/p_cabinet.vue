<template src="./p_cabinet.htm"></template> <!-- https://forum.vuejs.org/t/single-file-components-with-multiple-templates/7389 -->
<style scoped lang="less"></style>

<script>
	import mixins from './../vue-mixins.js' // глобальные миксины	
	import jquiDatepicker from './../vue-directives/jqui-datepicker.js'

	var REQ = window.PAGEDATA.params;

	var vm;
	var component = {
		name: 'Cabinet',
		data: function() {
			return {
				bShowForm: true,
				form: { // поля формы можно задать в урле
					date0: REQ.date0 || '',
					date1: REQ.date1 || '',
					number: REQ.number || '',
					name: REQ.name || '',
					mode: REQ.mode || '', // бывает archive и active
					type: REQ.type, //параметр передаются для покупки из личного кабинета (например питание)
					transactionId: REQ.transactionId, //параметр передаются для покупки из личного кабинета (например питание)
					saleOrderId: REQ.saleOrderId || REQ.orderId || '', // TODO избавиться от зоопарка, это в яве
					result: REQ.result // отладка: чтобы страница после банка не становилась кабинетом после F5
				},
				slots: [], // сюда помещаются поездки (название слотс взято тупо из апи)
				LOADING_ORDERS: false,
				HUMAN_ERROR: '', // человекопонятный текст глобальной ошибки
				DMSAREA: g_dmsArea,
				POLICY_STATUSES: g_policyStatus,
				refundMsg: false,
				lastPage: true,
				DEBUG: UTIL.pageData.showErrors,

				/* Страница после банка */
				bPageAfterBank: !!REQ.result, // считаем что если в урле есть result, то страница после банка
				bShowRetryPayment: false, // возврат к оплате
				PAYMENT_RESULT: REQ.result,

				/* Дополнительное питание */
				foodDetails: {
					selectedMenuItems: false,
					LOADING_REFUND: false
				},
				/* Предоплаченное питание */
				foodList: [],
				foodListSelectedItem: '',
				bAuthFormVisible: false
			}
		},
		methods: {
			getOrders: getOrders,

			// Видимость нижней плашки с кнопками типа "Вернуть билет" и "Сменить ЭР"
			isTicketActionsAvailable: function(tik, ord) {
				return !ord.left && !!tik.STATUS.CODE && tik.STATUS.CODE !== 'REFUNDED';
			},
			// Страховка НС приобретена и не возвращена
			isInsuranceActive: function(tik) {
				return tik.INSUR && tik.INSUR.Refunded !== 1
			},
			// Страховка ДМС приобретена и не возвращена
			isPolicyActive: function(tik) {
				return tik.POLICY && tik.POLICY.Refunded !== 1;
			},
			// Доступен возврат страховки ДМС
			isPolicyRefundAvailable: function(tik, ord) {
				return this.isTicketActionsAvailable(tik, ord) && tik.POLICY_STATUS && tik.POLICY_STATUS.code == 'ISSUED';
			},
			// Доступен возврат страховки НС
			isInsuranceRefundAvailable: function(tik, ord) {
				return this.isTicketActionsAvailable(tik, ord) && this.isInsuranceActive(tik) && tik.INSUR.bRefund === 1;
			},
			prepaidFood_visible: function(tik, ord) {
				if (ord.left && !ord.foodId) {
					return false
				}
				return tik.food;
			},
			// Видимость всего блока дополнительного питания
			addFood_visible: function(tik) {
				var hasFood = false;
				if (tik.extendedServices && tik.extendedServices.length) {
					for (var i = 0; i < tik.extendedServices.length; i++) {
						if (tik.extendedServices[i] && tik.extendedServices[i].typeId === 1) {
							hasFood = true;
							break;
						}
					}
				}
				return tik.addFood || hasFood;
			},
			addFood_getArray: function(tik) {
				var i, foodArray = [];
				if (tik.extendedServices && tik.extendedServices.length) {
					for (i = 0; i < tik.extendedServices.length; i++) {
						if (tik.extendedServices[i] && tik.extendedServices[i].typeId === 1) {
							if (tik.extendedServices[i].statusId === 30) {
								tik.extendedServices[i].isPurchased = true;
								tik.extendedServices[i].isRefunded = false;
							}
							else if (tik.extendedServices[i].statusId === 70) {
								tik.extendedServices[i].isPurchased = false;
								tik.extendedServices[i].isRefunded = true;
							}
							tik.extendedServices[i].isLast = tik.extendedServices.length === i + 1;
							foodArray.push(tik.extendedServices[i]);
						}
					}
				}
				return foodArray;
			},
			addFood_isBuyPossible: function(tik) {
				var hasPurchased = false;
				if (tik.extendedServices && tik.extendedServices.length) {
					for (var i = 0; i < tik.extendedServices.length; i++) {
						if (tik.extendedServices[i] && tik.extendedServices[i].typeId === 1 && tik.extendedServices[i].statusId === 30) {
							hasPurchased = true;
							break;
						}
					}
				}
				return tik.addFood && (!hasPurchased);
			},
			addFood_showMenuWindow: function(url) {
				// см. также showMenuWindow из pass16/market-food.js
				url = url || '/catering/public/ru?layer_name=catering-menu';
				window.open(url, 'Menu', '_blank, strWindowFeatures, height=400, width=737, scrollbars=1');
			},
			// PIRS-16873 Купить товары с маркета
			buyAdditionals: function(ordslot, ord, tik, addType) {
				// эмулируем структуру данных редизайна :(
				// можно попробовать брать данные о билете из слоя 5744, кот. используется в бланке
				var _tik = $.extend({
					ticketId: tik.n,
					pass: [$.extend(tik, { // пассажир в билете в петином коде выделяется в отдельный подобъект
						shortName: tik.name,
						tariff: tik.tariffId
					})]
				}, tik);

				var _ord = $.extend({
					orderId: ord.N,
					tickets: [_tik],
					type: ord.carTypeRu, // additionals-store:194
					number2: ord.train //for additionals-store
				}, ord);

				var pass16_ResResponse = {
					saleOrderId: ordslot.id,
					orders: [_ord],
					paymentSystems: [{
						"id": 2,
						"code": "BANK",
						"name": "Банковская карта",
						"tip": "Оплата картами банков." // Сейчас по факту товары нельзя купить за ЯД, вроде и не планируется
					}]
				};

				store.session('pass16_ResResponse', pass16_ResResponse);
				//В URL добавляется параметр reduced=true он обрабатывается в js и указывает урезанный шаблон для VUE.
				window.location.href = UTIL.pageData.LayerLinks.additionals + '&reduced=true#/' + addType;
			},

			//Предоплаченное питание
			// PIRS-16436 food
			changeMeal: function(ord, tik, ordslot_index, ordslot) {
				var self = this;
				UTIL.ridQuery('?layer_id=5713', {
						ORDER_ID: tik.ORDER_ID
					})
					.then(function(responseData) {
						if (responseData.list && responseData.list.length === 0) {
							UTIL.dialogMessage('К сожалению, выбор типа питания для данного заказа недоступен')
							return
						}
						self.foodList = responseData;
						self.foodList.tikFoodName = tik.foodName;
						self.foodList.curSlotId = ordslot.id;
						self.foodList.curORDER_ID = ord.N;
						self.foodList.curTicketId = tik.n;

						// нексттик и вызов в коллбеке аякса потому что
						// иначе попап неверно вычисляет размер
						Vue.nextTick(function() {
							UTIL.dialogMessage($('#j-change-food-popup'), {
								buttons: {
									OK: function() {
										self.setChangedFood();
										$(this).dialog('close');
									}
								}
							})
						})

					}, function(reason) {
						UTIL.dialogMessage('Ошибка ' + reason);
					});
			},
			setChangedFood: function() {
				var self = this;
				var val = self.foodListSelectedItem.split('_');
				var foodName = val[0];
				var foodId = val[1];
				for (var n in self.slots) {
					if (self.slots[n].id === self.foodList.curSlotId) {
						// self.slots[n].lst[0].lst[0].foodName = foodName;
						var params = {
							ORDER_ID: self.foodList.curORDER_ID,
							ticket_id: self.foodList.curTicketId,
							foodId: foodId
						};
						var curN = n;
						UTIL.ridQuery('?layer_id=5718', params)
							.then(function(responseData) {
								self.slots[curN].lst[0].lst[0].foodName = foodName;
							}, function(reason) {
								UTIL.dialogMessage("Во время сохранения данных произошла ошибка");
								console.log("Во время сохранения произошла ошибка:" + reason);
							});
					}
				}
			},
			/**
				Подготовка к превращению всего после банка в одностраничник
				потом вынесем в компоненты, а пока простыня
			*/
			// На шаге возврата из банка проверяется статус заказа в экспрессе и финализируется покупка у нас в системе
			// для яндекса перед этим действием случается дополнительная проверка статуса finalStep_checkPaymentYandex
			bankResult_finalizePayment: function(bNoCostCheck) {
				var vm = this;
				// на слое подтверждения с нулевой стоимостью помимо ВТТ и Лояльности обрабатывается также и Яндекс
				var layerId = bNoCostCheck ? 5726 : 5752;
				// TODO сделать кнопку гашения в случае неуспеха, layerId = 5769

				var params = {
					orderId: vm.$data.form.saleOrderId
				};

				//Случай если оплачивались только доп услуги
				if (vm.$data.form.transactionId && vm.$data.form.type === 'SERVICE') {
					layerId = 5954;
					params.type = vm.$data.form.type;
					params.transactionId = vm.$data.form.transactionId
				}

				var url = '?layer_id=' + layerId;
				vm.LOADING_ORDERS = true; // глобальная крутилка
				UTIL.ridQuery(url, params, vm.$data)
					.done(function(result) {
						paymentCheckDispatch(result);
					})
					.fail(function(result) {
						paymentCheckDispatch(result, true);
					})

				function paymentCheckDispatch(result, bErrorMode) {
					var allOk = REQ.result === 'OK' && result.result === 'OK' && !bErrorMode;
					if (allOk) {
						// window.UTIL.dialogMessage('Оплата успешно подтверждена');
						if (result.response && result.response[0] && result.response[0].saleOrderId) { // для проверямой покупки доп. услуг передан ID покупки билетов, которые нужно показать
							vm.$data.form.saleOrderId = result.response[0].saleOrderId
						}
						vm.getOrders(); // Показ заказа
					}
					else {
						window.UTIL.dialogMessage('Произошла ошибка при проверке платежа');
						vm.LOADING_ORDERS = false;
					}
				}
			},
			// Кнопка "Начать покупку сначала"
			bankResult_goStart: function() {
				var url;
				if (PAGEDATA.bAccessible === true) {
					var steps = window.store.session('Steps');
					url = steps && steps.trains ? steps.trains + '|_PREVENT_FORM_SUBMIT_' : '/';
				}
				else if (PAGEDATA.bRedesign2016 === true) {
					url = '?layer_name=e3-route';
				}
				else {
					url = '/';
				}
				window.location.href = url;
			},
			// На шаге возврата из банка в случае Яндекса 
			// первым делом проверяем статус платежа в Яндексе, см. PIRS-13679
			bankResult_checkPaymentYandex: function() {
				var vm = this;
				var url = '/ticket/services/status/journey/' + vm.$data.form.saleOrderId + '/payment/' + UTIL.pageData.lang;
				var params = {};

				//Случай если оплачивались только доп услуги
				if (vm.$data.form.transactionId && vm.$data.form.type === 'SERVICE') {
					params.type = vm.$data.form.type;
					params.transactionId = vm.$data.form.transactionId
				}
				vm.LOADING_ORDERS = true; // глобальная крутилка
				UTIL.ridQuery(url, params, vm.$data)
					.done(function(result) {
						if (result.result === 'Error') {
							onYaError();
						}
						else if (result.result === 'OK') {
							if (result.data === 'PAID_YANDEX') {
								vm.bankResult_finalizePayment(true);
							}
							else if (result.data === 'ISSUED') {
								vm.getOrders(); // Показ заказа
							}
							else {
								vm.bankResult_checkPaymentYandex(); // Следующая попытка запроса статуса оплаты
							}
						}
					})
					.fail(onYaError)
					.always(function() {
						vm.LOADING_ORDERS = false;
					});

				function onYaError() {
					window.UTIL.dialogMessage('Ошибка запроса статуса платежа Яндекс.Деньги')
				}
			},
			// алерт сделанный на жиквери-уи-диалоге
			// можно передать селектор (обязательно класс)
			// можно передать готовую строку
			alert: window.UTIL.dialogMessage
		},
		filters: {},
		computed: {},
		mixins: [mixins], // глобальные миксины
		components: {
			// здесь будут подключаемые компоненты, например дейтпикер
		},
		mounted: function() {
			vm = this;
			this.getOrders();
		},
		directives: {
			'jqui-datepicker': jquiDatepicker
		}
	};

	function getOrders(bNext) {
		var ON_AVISO_cnt = 0;
		var ON_AVISO_cnt_prev = 0;

		var data = this;
		if (bNext === true) {
			data.form.page++;
		}
		else {
			data.form.page = 1;
			data.slots = [];
		}
		var params = $.extend({}, data.form);

		if ('history' in window && 'replaceState' in window.history) {
			// Если браузер умеет менять урл без перезагрузки (ИЕ11+), делаем это
			var params2url = $.extend(REQ, params);
			if (data.bPageAfterBank === false) {
				delete params2url.xmlmsg;
				delete params2url.orderId;
				delete params2url.paymentSystem;
				delete params2url.result;
			}
			window.history.replaceState(null, null, '?' + $.param(params2url));
		}

		vm.LOADING_ORDERS = true;
		UTIL.ridQuery(PAGEDATA.LayerLinks.orderList, params, vm)
			.done(function(responseData) {
				UTIL.log('Ответ на запрос списка заказов', responseData);
				var ticDate = responseData.timestamp.substr(3, 2) + '/' + responseData.timestamp.substr(0, 2) + '/' + responseData.timestamp.substr(6, 4) + ' ' + responseData.timestamp.substr(11);
				var dateTimeNow = new Date(Date.parse(ticDate)); // Date.parse принимает дату в формате MM.DD.YYYY, чтоб его..
				data.HUMAN_ERROR = null; // обнуление ошибки

				if (responseData.slots && !responseData.slots.length && window.location.search.indexOf('tD=1') != -1 && window.sessionStorage['mobile_Test'] != undefined) {
					responseData = window.sessionStorage['mobile_Test'] ? JSON.parse(window.sessionStorage['mobile_Test']) : responseData;
					UTIL.log('Восстановлено из Хранилища', responseData);
				}

				if (typeof responseData.slots === 'undefined') {
					var herr = 'Произошла ошибка. Пожалуйста, попробуйте выполнить запрос позже.';
					if (UTIL.pageData.showErrors === true) {
						herr += '\n' + JSON.stringify(responseData, null, 2);
					}
					data.HUMAN_ERROR = herr;
				}
				else {
					// Перемывка данных нашего доблестного API
					// Свойства, которые создаются в результате перемывки, названы капсом
					for (var i = 0; i < responseData.slots.length; i++) {
						var sord = responseData.slots[i]; // это запись в APP_SALE_ORDER, в шаблонах зачем-то называется ordslot
						if (sord.jstatus === 'ON_AVISO') { // PIRS-13686. jstatus - это journey_status
							ON_AVISO_cnt++;
							// заказы в статусе ON_AVISO, см. PIRS-13686
							UTIL.log('В ответе найдена поездка в статусе ON_AVISO', sord)
						}
						//сортировка по дате билетов в заказе
						if (sord.lst.length > 1) {
							sord.lst.sort(sortByDate);
						}
						sord.LINK_REFUND_REGISTER = '?STRUCTURE_ID=735&layer_id=5963&transaction_id=' + sord.transactionId; // PIRS-16410
						sord.defShowTime = responseData.defShowTime; // переношу сюда чтобы не срать в корень
						sord.mskTimeSuffix = responseData.mskTimeSuffix; // переношу сюда чтобы не срать в корень
						var routeNames = [];
						for (var k = 0; k < sord.lst.length; k++) {
							var ord = sord.lst[k]; // это запись в APP_ORDER
							ord.ELREG_IFRMSG = '';
							// Внимание! Здесь надо перечислять все свойства, которые отсутствуют в API, 
							// иначе они не станут реактивными (т.е. не будут на лету обновляться в шаблоне) 
							// TODO по уму создавать их конструктором
							ord.LOADING_STATUSES = false; // initial
							ord.STATUS = null;
							ord.HIDE = false; // скрываем в списке
							ord.LOADER = false; // initial
							ord.LINK_BLANK = '?layer_id=5422&ORDER_ID=' + ord.N;
							ord.LINK_PDF = '/blank/ticket/download/pdf/order/' + ord.N;
							ord.LINK_AUTORACK = '?STRUCTURE_ID=5235&layer_id=5473&app_order_id=' + ord.N;
							ord.LINK_HOTEL = getHotelLink(sord);
							ord.HUMAN_ERROR = '';
							ord.SHOW_REFUNDED_ORDER = false;
							ord.journeyId = sord.id;
							console.log(vm, vm.$data)
							if (vm.$data.DEBUG) {
								ord.ORDER_LINK = window.location.href + '&saleOrderId=' + sord.id;
							}

							routeNames.push({
								'from': ord.parentStation0 || ord.station0,
								'to': ord.parentStation1 || ord.station1,
								'dir': ord.dir
							});

							for (var j = 0; j < ord.lst.length; j++) {
								var tik = ord.lst[j]; // это запись в APP_TICKET
								var ticDate = ord.date0.substr(3, 2) + '/' + ord.date0.substr(0, 2) + '/' + ord.date0.substr(6, 4);
								// Date.parse принимает дату в формате MM.DD.YYYY, чтоб его..
								tik.dateTimeDeparture = new Date(Date.parse(ticDate + ' ' + ord.time0));
								// нужно для активации/дезактивации кнопки "Сдать билет", за 1 час до выезда должна блокироваться

								tik.LINK_BLANK = '?layer_id=5422&ORDER_ID=' + ord.N + '&ticket_id=' + tik.n;

								var additionals = tik.extendedServices;
								if (additionals) {
									// PIRS-16873
									tik.GOODS = [];
									tik.GOODS_TOTAL_COST = 0;
									for (var a = 0; a < additionals.length; a++) {
										var ad = additionals[a];
										if (ad.typeId === 2 && ad.statusId === 30) { // если это товар маркета и статус ок
											tik.GOODS.push(ad);
											tik.GOODS_TOTAL_COST += ad.cost;
										}
									}

									tik.LINK_GOODS_LIST = '?layer_id=5972&ticket_id=' + tik.n + '&order_id=' + ord.N;
									tik.LINK_GOODS_BLANK_PDF = '/blank/extendedService/download/pdf/serviceOrder/' + ord.N;
									// tik.LINK_GOODS_BLANK_PDF = '/blank/extendedService/display/pdf/serviceOrder/' + ord.N;
								}

								tik.HUMAN_ERROR = '';
								tik.STATUS = {
									// первоначальный статус может быть null (если он не окончательный)
									// а может быть и сразу нормальный (если окончательный, например REFUNDED)
									NAME: (tik.status ? window.lang(['TicketStatus', tik.status]) : ''),
									CODE: tik.status
								};
								ord.STATUS = !tik.status ? false : true;

								tik.ORDER_ID = ord.N;
								tik.LOADING_STATUS = false; // initial
								tik.LOADER = false; // initial
								tik.LOADING_REFUND_TICKET = false; // initial
								tik.LOADING_REFUND_INSURANCE = false; // initial
								tik.LINK_PDF = '/blank/ticket/download/pdf/order/' + ord.N + '/' + UTIL.pageData.lang;
								tik.LINK_PNG = '/blank/ticket/download/png/order/' + ord.N + '/' + UTIL.pageData.lang;
								tik.SHOW_INSURANCES = false;
								tik.SHOW_REFUND_FOOD = true;
								tik.SHOW_REFUND_FOOD_MSG = false;

								if (tik.extendedServices && tik.extendedServices.length && (tik.dateTimeDeparture - dateTimeNow < 60 * 59 * 1000)) {
									// запрет возврата еды менее чем за час до отправления.
									tik.SHOW_REFUND_FOOD = false;
									tik.SHOW_REFUND_FOOD_MSG = true;
								}

								if (tik.insurances[0]) {
									tik.INSUR = tik.insurances[0];
									tik.LINK_INSURANCE = '?layer_id=5666&passenger_id=' + tik.insurances[0].passId;
									if (tik.INSUR.passId) {
										tik.LINK_INS_PDF = '/blank/insurance/download/pdf/passenger/' + tik.INSUR.passId + '/' + UTIL.pageData.lang;
										// UTIL.log('LINK_INS_PDF', tik.LINK_INS_PDF)
									}
								}
								if (tik.policies[0] && tik.number == tik.policies[0].ticketNumber) {
									if (tik.policies[0]) {
										tik.POLICY = tik.policies[0];
										tik.POLICY_DATE = tik.policies[0].startDate + ' — ' + tik.policies[0].finishDate;
										tik.POLICY_AREA = data.DMSAREA[tik.policies[0].areaId];
										tik.POLICY_STATUS = data.POLICY_STATUSES[tik.policies[0].statusId];
									}
								}
								else if (tik.policies[0]) {
									//delete tik.policies[0];
								}
							}
						}
						var routeName = routeNames[0].from,
							directional = routeNames[0].dir;
						if (routeNames.length > 1) {
							for (var r = 1; r < routeNames.length; r++) {
								if (routeNames[r].dir != directional) {
									routeName += ' — ' + routeNames[r].from;
									directional = routeNames[r].dir;
								}
							}
							routeName += ' — ' + routeNames[routeNames.length - 1].to;
							//UTIL.log(routeNames, routeName); // название сложных маршрутов
							sord.routeNames = routeName;
						}


						if (bNext === true) { // рисуем след. страницу
							data.slots.push(sord)
						}
					}
					if (bNext !== true) { // первоначальная отрисовка
						data.slots = responseData.slots;
					}
					if (ON_AVISO_cnt !== ON_AVISO_cnt_prev) {
						UTIL.dialogMessage($('.j-on-aviso-popup')) // PIRS-13686
						ON_AVISO_cnt = ON_AVISO_cnt_prev;
					}
					data.lastPage = responseData.lastPage;

					if (window.location.search.indexOf('tD=1') != -1 && !window.sessionStorage['mobile_Test']) {
						window.sessionStorage['mobile_Test'] = JSON.stringify(responseData);
					}
				}

				// Формирование ссылки "Забронировать отель"
				// Изначально она с разметкой и закодированным хрефом
				// лежит в сообщении UFS_HOTELS_ORDERS
				// Формат хрефа - Петин, кастомные разделители 
				// передаются третьим аргументом UTIL.formatStr
				// аргумент - SALE_ORDER (в нашем апи это элемент slots)
				function getHotelLink(sord) {
					var ord = sord.lst[0];
					var ordBack = sord.lst[1];

					if (ord.arrived || !window.UFS_HOTELS_TPL) {
						return ''
					}

					var bdarray = [];
					for (var i = 0; i < ord.lst.length; i++) {
						bdarray.push(ord.lst[i].birthday)
					}

					return UTIL.formatStr(window.UFS_HOTELS_TPL, {
						code1: ord.code1,
						date1: ord.date1,
						time1: ord.time1,
						birthdays: bdarray.join(),
						bk_date0: ordBack ? ordBack.date0 : '',
						bk_time0: ordBack ? ordBack.time0 : ''
					}, ['$%', '$']);
				}

				function sortByDate(a, b) {
					var date1 = TDate.parse(a.date0),
						date2 = TDate.parse(b.date0);
					return date1 - date2;
				}
			})
			.always(function() {
				data.LOADING_ORDERS = false;
			})
	};

	export default component;
</script>