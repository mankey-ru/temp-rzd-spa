import mixins from '@mixins' // глобальные миксины
import jquiDatepicker from '@directives/jqui-datepicker.js'

var REQ = window.PAGEDATA.params;
var ON_AVISO_cnt = 0;
var ON_AVISO_cnt_prev = 0;
var vm;

var component = {
	data: function() {
		return {
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
			DEBUG: PAGEDATA.showErrors,

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
	filters: {},
	computed: {
		// Показ формы - для ЛК	
		bShowForm: function() {
			return this.bPageAfterBank === false;
		},
		// Показ кнопок "Купить новый билет" и "Перейти в «Мои заказы»" - для страницы после банка
		bShowBankResultBtns: function() {
			return this.bPageAfterBank === true;
		},
		journeyReservation: function() {
			// Достаём из сессии резултаты бронирования 
			// для того чтобы нарисовать кнопку возврата к платежу
			// ключи разные. Просто Reservation - это слепые, ResPg.result - это мобилка
			var storedReservation = store.session('Reservation') || store.session('ResPg.result') || store.session('pass16_ResResponse');
			return storedReservation;
		}
	},
	mixins: [mixins], // глобальные миксины
	mounted: function() {
		vm = this;
		if (this.IS_DEV) {
			window['VUEI_' + this.$options.name] = this; // на дев-сервере будет переменная VUEI_CabinetRedesign со ссылкой на компонент
		}
		this.changeMode('active', true);
		// Страница после оплаты
		if (vm.$data.bPageAfterBank) {
			if (REQ.result === 'OK') {
				if (REQ.paymentSystem === 'YANDEX') {
					vm.bankResult_checkPaymentYandex();
				}
				else {
					vm.bankResult_finalizePayment();
				}
			}
			else {
				vm.bShowRetryPayment = true; // показ кнопки "Попытаться оплатить ещё раз"
			}
		}
		// Обычный личный кабинет
		else {
			vm.getOrders();
		}
	},
	directives: {
		'jqui-datepicker': jquiDatepicker
	},
	methods: {
		getOrders: getOrders,
		// Кнопка "Перейти в Мои Заказы" на странице возврата из банка
		gotoCabinet: function() {
			this.$data.HUMAN_ERROR = '';
			$('html,body').animate({
				scrollTop: 0
			}, 300);
			this.$data.bPageAfterBank = false;
			this.$data.form.saleOrderId = '';
			this.$data.PAYMENT_RESULT = '';
			this.getOrders();
		},
		retryPayment: function() {
			this.$refs.paymentHandler.submit();
		},
		changeMode: function(newMode, bDontMakeRequest) {
			if (this.$data.form.mode !== newMode) {
				this.$data.form.mode = newMode;
				var bActive = newMode === 'active';

				var d = new Date();
				var formattedDate = [UTIL.leftpad(d.getDate()), UTIL.leftpad(d.getMonth() + 1), d.getFullYear()].join('.');
				this.$data.form.date0 = bActive ? formattedDate : '';
				this.$data.form.date1 = bActive ? '' : formattedDate;

				if (!bDontMakeRequest) {
					this.getOrders();
				}
			}
		},
		// получить статусы для всего заказа (APP_SALE_ORDER)
		getStatusesForSaleOrder: function(sord) {
			var $activeDialog = $('.ui-dialog-content:visible');
			if ($activeDialog.length !== 0) { // это сделано для PIRS-13686 (ON_AVISO_LIST)
				$activeDialog.dialog('close');
			}
			if (typeof $.scrollTo === 'function') {
				var $sord = $('#hash-sord-' + sord.id);
				$.scrollTo($sord, 200, {
					offset: -50 // высота верхней панели с настройками слепых, иначе она перекрывает
				})
			}
			for (var k = 0; k < sord.lst.length; k++) {
				var ord = sord.lst[k]; // это запись в APP_ORDER
				this.getStatuses(ord);
			}
		},
		// получить статусы для поездки (APP_ORDER)
		// TODO PIRS-13714
		getStatuses: function(ord, callback) {
			ord.LOADING_STATUSES = true;
			ord.LOADER = true;
			ord.HUMAN_ERROR = null;
			var url = '?layer_id=5417';
			var params = {
				ORDER_ID: ord.N
			}
			var requestRidOptions = {
				onIdle: function(res) {
					// запоминаем RID для загрузки PDF и PNG бланков, иначе PIRS-14446
					ord._statusRid = res.RID;
				}
			}
			UTIL.ridQuery(url, params, ord, requestRidOptions)
				.done(function(result) {
					UTIL.log(result);
					requestRidOptions.HUMAN_ERROR = null;
					ord._statusRid_timestamp = Date.now(); // для проверки протухших rid
					var ticDate = result.timestamp.substr(3, 2) + '/' + result.timestamp.substr(0, 2) + '/' + result.timestamp.substr(6, 4) + ' ' + result.timestamp.substr(11);
					var dateTimeNow = new Date(Date.parse(ticDate)); // Date.parse принимает дату в формате MM.DD.YYYY, чтоб его..

					ord.LOADER = false;
					var hasWithER = false;
					var hasWithoutER = false;
					var statuses = result.lst;
					for (var i = 0; i < statuses.length; i++) {
						var stat = statuses[i];
						for (var k = 0; k < ord.lst.length; k++) {
							var tik = ord.lst[k];
							// сопоставляем айди билета в данных и в ответе по статусам, чтобы нарисовать статусы там где нужно
							var blockRefund = (tik.dateTimeDeparture - dateTimeNow < 60 * 59 * 1000) ? true : false; // блокировка сдачи билета за час до отправления
							if (tik.n === stat.n) {
								tik.STATUS.NAME = stat['name_' + window.PAGEDATA.lang];
								tik.STATUS.CODE = stat.status;
								tik.LOADING_STATUS = false;
								// update POLICY
								if (stat.policies && stat.policies.length && tik.POLICY && stat.policies[0].number == tik.POLICY.number) {
									tik.POLICY.statusId = stat.policies[0].statusId;
									tik.POLICY_STATUS = g_policyStatus[stat.policies[0].statusId];
								}
							}
							tik.LOADER = false;
							// блокировать сдачу билета, если до отправления меньше 1 часа PIRS-14238
							if (blockRefund) {
								tik.LOADING_REFUND_TICKET = blockRefund;
								tik.SHOW_REFUND_FOOD = false;
							}
						}
						if (stat.status === 'REGISTERED') {
							hasWithER = true;
							// блокировать отмену регистрации, если до отправления меньше 1 часа PIRS-14238
							if (blockRefund) {
								tik.LOADING_STATUS = blockRefund;
							}
						}
						else if (stat.status === 'PAID') {
							hasWithoutER = true;
						}
						else if (stat.status === 'REFUNDED') {
							tik.status = stat.status;
						}
					}

					if (hasWithER === true && hasWithoutER === true) {
						ord.ELREG_IFRMSG = 'PST_ELREG_BOTH';
					}
					else if (hasWithER === true) {
						ord.ELREG_IFRMSG = 'PST_ELREG_ETICKET_A4';
					}
					else if (hasWithoutER === true) {
						ord.ELREG_IFRMSG = 'PST_ELREG_GET_COUPON';
					}

					if (typeof callback === 'function') {
						callback();
					}
				})
				.always(function() {
					ord.LOADING_STATUSES = false;
				})

		},
		changeStatus: function(tik, ord, bEnable) {
			if (tik.LOADING_STATUS && bEnable === false) return; // блокировка отмены пройденной регистрации за 1 час до отправления PIRS-14238
			tik.LOADING_STATUS = true;
			tik.LOADER = true;
			var params = {
				action: bEnable === true ? 'REGISTER' : 'UNREGISTER',
				ORDER_ID: ord.N,
				ticket_id: tik.n
			}
			UTIL.ridQuery('?layer_id=5418', params, tik)
				.done(function(result) {
					if (result.result === 'OK') {
						vm.getStatuses(ord);
					}
				})
				.always(function() {
					tik.LOADING_STATUS = false;
				})
		},
		/**
			tik				{object}	билет (APP_TICKET)
			ord				{object}	заказ (APP_ORDER)
			sord			{object}	поездка (APP_SALE_ORDER)
			bForceRefund	{boolean}	не запрашивать подтверждение пользователя
		*/
		refundTicket: function(tik, ord, sord, bForceRefund) {
			//Todo создать отдельный признак для блокировки билета.
			if (tik.LOADING_REFUND_TICKET) return; // блокировка возврата билета за 1 час до отправления PIRS-14238
			tik.LOADING_REFUND_TICKET = true; // определено при запросе статуса билета.
			var params = {
				action: bForceRefund === true ? 'REFUND' : 'PREVIEW',
				ORDER_ID: ord.N,
				ticket_id: tik.n
			}
			UTIL.ridQuery('?layer_id=5421', params, tik)
				.done(function(result) {
					tik.HUMAN_ERROR = null;
					UTIL.log(result);
					var msgTemplate = window.lang(['Ticket', 'The amount due for return: $summa$']);
					if ('lst' in result && 'sum' in result.lst[0]) { // то бишь action==='PREVIEW'
						var rfnd = {
							bMulti: result.lst.length > 1,
							bDisabledCompanion: tik.disabledTypeId === 1,
							bYandex: sord.paymentMethod === 'YANDEX_MONEY',
							bDMS: tik.POLICY ? tik.POLICY.number && tik.POLICY.statusId == 40 : null,
							bDMS_cost: tik.POLICY ? tik.POLICY.cost : null,
							bINSUR: tik.INSUR ? tik.INSUR.bRefund == 0 : null,
							bINSUR_cost: tik.INSUR ? tik.INSUR.cost : null,
							ord: ord,
							list: []
						};
						// собираем все билеты заказа в билет для нахождения соответствия
						// респонса и возвращаемых билетов
						var ordTicketList = [];
						for (var k = 0, lenk = ord.lst.length; k < lenk; k++) {
							var ticket = ord.lst[k];
							ordTicketList[ticket.id] = ticket;
						}
						for (var i = 0, len = result.lst.length; i < len; i++) {
							var refundItem = result.lst[i];
							var ticket = ordTicketList[refundItem.ticketNum];
							refundItem = $.extend(ticket, refundItem)
							refundItem.summa = refundItem.sum; // в лучших традициях нашего АПИ в словарном тексте написано $summa$ а в респонсе - sum.
							refundItem.text = UTIL.formatStr(msgTemplate, {
								summa: refundItem.sum,
								time: refundItem.time,
								date: refundItem.date
							}, ['$', '$']);
							rfnd.list.push(refundItem)
						}
						vm.$data.refundMsg = rfnd; // скармливаем данные вуЮ, он их рендерит

						var confirmButtons = {};
						confirmButtons[window.lang('Make refund')] = function(evt) {
							vm.refundTicket(tik, ord, sord, true);
							$(this).dialog('close');
						}
						confirmButtons[window.lang('Cancel')] = function(evt) {
							$(this).dialog('close');
						}
						vm.$nextTick(function() {
							var opts = {
								buttons: confirmButtons
							};
							UTIL.dialogMessage($('.j-refund-popup'), opts)
						})
					}
					else { // то бишь action==='REFUND'
						vm.getStatuses(ord);
					}
					if (bForceRefund && tik.INSUR) { // то бишь action==='REFUND'
						vm.$set(tik.INSUR, 'Refunded', 1); // ставим такой же признак как приходит с сервера PIRS-16888
					}
				})
				.always(function() {
					tik.LOADING_REFUND_TICKET = false;
				})
		},
		refundInsurance: function(tik, ord) {
			var confirmButtons = {};
			confirmButtons[lang('Make refund')] = function(evt) {
				var dfInsrRef = $.ajax({
					url: '?layer_id=5664',
					type: 'POST',
					dataType: 'json',
					data: {
						ORDER_ID: ord.N,
						passengerId: tik.INSUR.passId,
						ticketNumber: tik.id,
						ticket_id: tik.n
					}
				});
				dfInsrRef
					.success(function(insrRetundRes) {
						if (insrRetundRes.result === "OK") {
							vm.$set(tik.INSUR, 'Refunded', 1);
						}
					})
					.error(function(insrRetundRes) {
						UTIL.dialogMessage('В процессе возврата страховки произошла ошибка.<br/>Пожалуйста, повторите попытку позже.');
					});
				$(this).dialog('close');
			}
			confirmButtons[lang('Cancel')] = function(evt) {
				$(this).dialog('close');
			}
			UTIL.dialogMessage('Осуществить возврат страховки?', {
				buttons: confirmButtons
			})
		},
		refundDMS: function(tik, ord) {
			var confirmButtons = {},
				result;
			confirmButtons[lang('Make refund')] = function(evt) {
				var params = {
					journeyId: ord.journeyId,
					policyNumber: tik.POLICY.number
				};
				UTIL.ridQuery('?layer_id=5890', params, tik, {})
					.done(function(result) {
						if (result.result === "OK") {
							tik.policies[0].statusId = 70;
							tik.POLICY_STATUS = g_policyStatus[tik.policies[0].statusId];
						}
						if (result.statusText == 'OK') {
							result = JSON.parse(result.responseText);
							UTIL.log('Ошибка при возврате полиса', result);
							UTIL.dialogMessage('В процессе возврата страховки произошла ошибка.<br/>Пожалуйста, обновите страницу и повторите попытку позже.');
						}
					})
					.always(function(result) {
						tik.LOADING_REFUND_TICKET = false;
						if (result.statusText == 'OK') {
							UTIL.log('Ошибка при возврате полиса.', result);
							UTIL.dialogMessage('В процессе возврата страховки произошла ошибка.<br/>Пожалуйста, обновите страницу и повторите попытку позже.');
						}
					});
				$(this).dialog('close');
			}
			confirmButtons[lang('Cancel')] = function(evt) {
				$(this).dialog('close');
			}
			var msg = window.IFRMSG.POLICY_CABINET_REFUND_SUM + '&nbsp;' + tik.policies[0].cost + '&nbsp;руб.<br/>' + window.IFRMSG.REFUND_INFO_CABINET + '<br/>Осуществить возврат полиса?';
			UTIL.dialogMessage(msg, {
				buttons: confirmButtons
			})
		},
		getBlank_insurance: function(tik, format) {
			var dlAddress = location.origin + '/blank/insurance/download/' + format + '/passenger/' + tik.INSUR.passId + '/' + window.PAGEDATA.lang;
			downloadFile(dlAddress);
		},
		getBlank_policy: function(tik) {
			downloadFile(tik.POLICY.link)
		},
		showInsurances: function(tik) {
			if (tik.SHOW_INSURANCES === true) {
				tik.SHOW_INSURANCES = false;
			}
			else {
				tik.SHOW_INSURANCES = true;
			}
		},
		showRefundedOrder: function(ord) {
			if (ord.SHOW_REFUNDED_ORDER === true) {
				ord.SHOW_REFUNDED_ORDER = false;
			}
			else {
				ord.SHOW_REFUNDED_ORDER = true;
			}
		},
		getBlank_ticket: function(format, ord, tik) {
			// при загрузке бланка критерий необходимости загрузки билета
			// отсутствие у билета статуса !tik.STATUS.CODE
			// значит, статус и неокончательный и притом не получен аяксом
			var currentTimestamp = Date.now();
			var statusCheckNeeded = false;
			if (!tik) {
				// билет не передан, значит скачать надо бланк заказа
				// проверяем все билеты заказа на предмет отсутствия статуса
				for (var i = 0; i < ord.lst.length; i++) {
					if (!ord.lst[i].STATUS.CODE || ridTimestampInvalid(ord._statusRid_timestamp)) {
						statusCheckNeeded = true;
						break;
					}
				}
			}
			else {
				// билет передан, значит скачать надо бланк билета
				// проверяем этот билет на предмет отсутствия статуса
				statusCheckNeeded = !tik.STATUS.CODE || ridTimestampInvalid(ord._statusRid_timestamp);
			}

			if (statusCheckNeeded) {
				vm.getStatuses(ord, downloadBlankTicket);
			}
			else {
				downloadBlankTicket()
			}

			function downloadBlankTicket() {
				// https://wiki.oooinex.ru/pages/viewpage.action?pageId=23825058
				var urlParams = {
					origin: window.location.origin,
					format: format,
					orderId: ord.N,
					lang: window.PAGEDATA.lang,
					random: Math.random() * 1e5 | 0
				}
				var url = UTIL.formatStr('{origin}/blank/ticket/download/{format}/order/{orderId}/{lang}?_rnd={random}', urlParams);
				if (tik && tik.n) {
					// если билет не передан в getBlank_ticket
					// значит, скачиваем бланк не всего заказа, а одного билета
					url += '&ticketId=' + tik.n;
				}
				if (ord._statusRid) {
					// для показа актуального статуса у билетов с неокончательным статусом
					// Это свойство ord заполняется автоматом при запросе статусов
					// Иначе PIRS-14446 + PIRS-14447
					url += '&statusRid=' + ord._statusRid;
				}
				downloadFile(url);
			}

			// грубое определение разницы во времени за которую протухнет statusRid
			// время в 5 минут взято из cabinet.js (см. function updateRid)


			function ridTimestampInvalid(ridTimestamp) {
				if (!ridTimestamp) {
					return true
				}
				var diffMinutes = (currentTimestamp - ridTimestamp) / (1000 * 60);
				return diffMinutes > 5;
			}
		},

		/*Дополнительное питание*/
		getFoodDetails: function(ord, tik, extendedService) {
			if (this.foodDetails.selectedMenuItems && this.foodDetails.ticketId === tik.n) { // заказ уже открыт, просто скрыть его.
				return this.foodDetails.selectedMenuItems = false;
			}

			//var self = this;
			var selectedMenuItems = extendedService.foodPattern.split('');
			var selectedVariants = extendedService.foodType && extendedService.foodType.replace(/\//g, '').split('');
			for (var i = 0; i < selectedMenuItems.length; i++) {
				selectedMenuItems[i] = {
					foodPattern: selectedMenuItems[i],
					foodCode: selectedVariants[i]
				}
			}
			this.foodDetails.ticketId = tik.n;
			this.foodDetails.selectedMenuItems = extendedService.foodCount;

		},
		// Получение бланка дополнительного питания
		// причём в случае HTML возвращается ссылка
		// а в случае PDF производится загрузка
		getFoodBlank: function(tik, ord, format, extendedService) {
			if (format === 'pdf') {
				var url = '/blank/extendedfood/download/pdf/order/' + ord.N + '/serviceId/' + extendedService.id + '?ticketId=' + tik.n;
				//console.log(url)
				downloadFile(url);
			}
			else if (format === 'html') {
				var refundParam = extendedService.statusId === 70 ? '&refund=1' : '';
				return '?STRUCTURE_ID=735&layer_id=5962&tik_id=' + tik.id + '&ORDER_ID=' + ord.N + refundParam;
			}
		},
		// Сдать дополнительное питание
		refundFood: function(ord, tik, extendedService) {
			var closeDialog = function() {
				$(this).dialog('close');
			};
			var self = this;
			var refund = function(evt) {
				var dialogElement = this;
				$(evt.currentTarget).hide();
				self.foodDetails.LOADING_REFUND = true;
				UTIL.ridQuery(
						'/ticket/secure/ru?layer_id=5945&action=Return&orderId=' + ord.N + '&ticketId=' + tik.n + '&serviceId=' + extendedService.id, {}, {})
					.then(
						function() {
							//Успешный запрс возврата!
							self.foodDetails.LOADING_REFUND = false;
							extendedService.statusId = 70;
							$(dialogElement).dialog('close');
						},
						function(reason) {
							self.foodDetails.LOADING_REFUND = false;
							$(dialogElement).find('.jqui-dialog-message').html(
								'При возврате дополнительного питания произошла ошибка: ' + reason);
						}
					);

			};
			self.foodDetails.LOADING_REFUND = true;
			UTIL.ridQuery(
					'/ticket/secure/ru?layer_id=5945&action=Info&orderId=' + ord.N + '&ticketId=' + tik.n + '&serviceId=' + extendedService.id, {}, {})
				.then(
					function(response) {
						self.foodDetails.LOADING_REFUND = false;
						// текущая дата сервера для проверки возврата еды
						var ticDate = response.timestamp.substr(3, 2) + '/' + response.timestamp.substr(0, 2) + '/' + response.timestamp.substr(6, 4) + ' ' + response.timestamp.substr(11);
						var dateTimeNow = new Date(Date.parse(ticDate)); // Date.parse принимает дату в формате MM.DD.YYYY, чтоб его..

						if ((tik.dateTimeDeparture - dateTimeNow < 60 * 59 * 1000)) {
							// проверка серверного времени и запрет возврата еды менее чем за час до отправления.
							// тут показываем сообщение о том, что время вышло
							tik.SHOW_REFUND_FOOD_MSG = true;
							tik.SHOW_REFUND_FOOD = false;
							return;
						}

						var cost = response.response.foodRefunds[0] && response.response.foodRefunds[0].refundAmount;
						var params = {
							buttons: {}
						};
						params.buttons[lang('Make refund')] = refund;
						params.buttons[lang('Cancel')] = closeDialog;
						UTIL.dialogMessage('Сумма к возврату за дополнительное питание: ' + cost + ' руб.', params);
					},
					function(reason) {
						self.foodDetails.LOADING_REFUND = false;
						var buttons = {};
						buttons[lang('Ok')] = closeDialog;
						UTIL.dialogMessage('Ошибка при получении информации о возврате: ' + reason);
					}
				)
		},
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
			var refundAllowed = window.PAGEDATA.BaseParams.is_insurance_refund === '1'; // PIRS-12830
			return refundAllowed && this.isTicketActionsAvailable(tik, ord) && this.isInsuranceActive(tik) && tik.INSUR.bRefund === 1;
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
			if (foodArray.length === 0 && tik.addFood === true) {
				// TODO переделать
				foodArray = [{
					isLast: true,
					isFake: true
				}];
				// фейковое значение чтобы отображался блок Доп.питания с кнопкой купить PIRS-17115
				// причём он должен отображаться если питание сдано И если питание не было куплено
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
				pass: [$.extend({}, tik, { // пассажир в билете в петином коде выделяется в отдельный подобъект
						shortName: tik.name,
						tariff: tik.tariffId
					})] // лишний {} - чтобы не менять tik, иначе при нажатии на кнопку в поле тариф пишется Adult
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
			window.location.href = window.PAGEDATA.LayerLinks.additionals + '&reduced=true#/' + addType;
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
					vm.$nextTick(function() {
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
			console.log(this);
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
						.done(function() {
							self.slots[curN].lst[0].lst[0].foodName = foodName;
						})
						.fail(function(err, res) {
							UTIL.dialogMessage('Во время сохранения данных произошла ошибка ' + res.info || err);
						})
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
					// window.UTIL.dialogMessage('Произошла ошибка при проверке платежа');
					vm.LOADING_ORDERS = false;
				}
			}
		},
		// Кнопка "Начать покупку сначала"
		bankResult_goStart: function() {
			var url;
			if (PAGEDATA.theme === 'SPECIAL') {
				var steps = window.store.session('Steps');
				url = steps && steps.trains ? steps.trains + '|_PREVENT_FORM_SUBMIT_' : '/'; // TODO замена | на &
			}
			else if (PAGEDATA.theme === 'REDESIGN') {
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
			var url = '/ticket/services/status/journey/' + vm.$data.form.saleOrderId + '/payment/' + window.PAGEDATA.lang;
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
	}
};

function getOrders(bNext) {

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
				if (window.PAGEDATA.showErrors === true) {
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
					if (sord.refunds && sord.refunds.length !== 0) {
						var sordRefund = sord.refunds[0];
						// Ваш возврат по платежной транзакции {{./../../transactionId}} обработан. и т.п.
						// Сообщение на боевом содержит разметку для мусташа
						sord.REFUND_MESSAGE = window.IFRMSG._orderRefundMessage
							.replace('{{./../../transactionId}}', ordslot.transactionId)
							.replace('{{transferDate}}', sordRefund.transferDate)
							.replace('{{amount}}', sordRefund.amount);
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
						if (window.PAGEDATA.BaseParams.UFS_HOTELS === '1' && !ord.arrived) {
							ord.LINK_HOTEL = getHotelLink(sord);
						}
						ord.HUMAN_ERROR = '';
						ord.SHOW_REFUNDED_ORDER = false;
						ord.journeyId = sord.id;
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

							if (tik.goodsTotalCost) {
								tik.goodsTotalCost;
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
							tik.LINK_PDF = '/blank/ticket/download/pdf/order/' + ord.N + '/' + window.PAGEDATA.lang;
							tik.LINK_PNG = '/blank/ticket/download/png/order/' + ord.N + '/' + window.PAGEDATA.lang;
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
									tik.LINK_INS_PDF = '/blank/insurance/download/pdf/passenger/' + tik.INSUR.passId + '/' + window.PAGEDATA.lang;
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

				if (ord.arrived || !window.IFRMSG.UFS_HOTELS_ORDERS) {
					return ''
				}

				var bdarray = [];
				for (var i = 0; i < ord.lst.length; i++) {
					bdarray.push(ord.lst[i].birthday)
				}

				var parametrizedMsg = UTIL.formatStr(window.IFRMSG.UFS_HOTELS_ORDERS, {
					code1: ord.code1,
					date1: ord.date1,
					time1: ord.time1,
					birthdays: bdarray.join(),
					bk_date0: ordBack ? ordBack.date0 : '',
					bk_time0: ordBack ? ordBack.time0 : ''
				}, ['$%', '$']).replace(/http:\/\/pass/gm, window.location.protocol + '//pass'); // чтобы ссылки на БДММ не вызывали варнинга
				return parametrizedMsg;
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

function downloadFile(url) {
	document.querySelector('#download-iframe').setAttribute('src', url);
};

export default component;