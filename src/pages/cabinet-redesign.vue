<style scoped lang="less">
	.debug-link-order {float:right; font-size: 1.4em;}
</style> 

<!-- что к чему в ответе на запрос заказа: slots.id === APP_SALE_ORDER.ID, slots.lst. === APP_ORDER.ID, slots.lst.lst.n	=== APP_TICKET.ID -->
<template>
	<div>
		<div>

			<h3 class="cab-pageName">
				<template v-if="PAYMENT_RESULT">
					<template v-if="PAYMENT_RESULT === 'OK'"><dict name="Ticket/headerPaymentOk"/></template>
					<div v-else class="alert alert-danger">			
						<ifrmsg v-if="PAYMENT_RESULT === 'CANCEL'" name="PSTKT_BANK_CANCEL"/>
						<ifrmsg v-if="PAYMENT_RESULT === 'DECLINE'" name="PSTKT_BANK_CANCEL"/>	
					</div>
				</template>
				<template v-else="">Мои заказы</template>
			</h3>

			<template v-if="bShowForm">
				<ul class="list-inline mode-trigger">
					<li>
						<a v-on:click="changeMode('active')" v-bind:class="{active: form.mode==='active'}" class="link-black link-pseudo color-grey"><dict name="CabinetMode_active"/></a>
					</li>
					<li>
						<a v-on:click="changeMode('archive')" v-bind:class="{active: form.mode==='archive'}" class="link-black link-pseudo color-grey"><dict name="CabinetMode_archive"/></a>
					</li>
				</ul>
				<form v-on:submit.prevent="getOrders">					
					<div class="cab-form form-group">
						<div class="row">
							<div class="col-xs-6">
								<div class="cab-form-headers">
									<dict name="Last name"/>
								</div>
							</div>
							<div class="col-xs-6">
								<div class="cab-form-headers">
									<dict name="Train number"/>
								</div>
							</div>
							<div class="col-xs-12">
								<div class="cab-form-headers">
									<dict name="Departure Date"/>
								</div>
							</div>
						</div>
						<div class="row form-group">
							<div class="col-xs-6">
								<input class="form-control" v-model="form.name"/>
							</div>
							<div class="col-xs-5">
								<input class="form-control" v-model="form.number"/>
							</div>
							<div class="col-xs-4 col-xs-offset-1 cab-form-dates-wrap">
								<input class="form-control" v-jqui-datepicker="form.date0" :placeholder="DICT('predlog/ot')" data-custom-default-value="true"/>
							</div>
							<div class="col-xs-4">
								<input class="form-control" v-jqui-datepicker="form.date1" :placeholder="DICT('predlog/do')" /> 
							</div>
							<div class="col-xs-3">
								<button type="submit" class="btn btn-main-red btn-arrow-right cab-form-btn">
									<dict name="Find"/>
								</button>
							</div>
						</div>
					</div>
				</form>
			</template>

			<div class="cab-pageName"></div> <!-- таким интересным способом в редизайне делается бордер-разделитель между формой и заказами -->
			<div class="cab-result-wrap">

				<!-- Ошибки корневого объекта -->
				<pre v-if="HUMAN_ERROR" class="alert alert-danger">{{HUMAN_ERROR}}</pre>

				<div v-for="(ordslot, ordslot_index) in slots" v-bind:id="'hash-sord-'+ordslot.id"> 
					<div v-for="(ord, index) in ordslot.lst"> <!-- на самом деле этот массив всегда из одного элемента. Чудо-API. -->
						<div class="cab-order" v-bind:class="{'cab-order-allTicketsRefunded': ord.STATUS,  'cab-order-trainLeft': ord.left}">
							<!-- PIRS-12469 -->

							
							<div class="color-grey">
								<dict name="Ticket/transactionId"/>: <b>{{ordslot.transactionId}}</b>
								
								<template v-if="IS_DEV">
									<a v-bind:href="ord.ORDER_LINK" class="debug-link-order" title="Открыть только текущий заказ (ссылка видна только при включённом показе ошибок)"><i class="glyphicon glyphicon-share-alt"></i></a>
								</template>
							</div>
							<div v-if="ordslot.REFUND_MESSAGE">
								<div class="pass-orderList-refund-msg__cont">
									<!-- сообщение Ваш возврат по платежной транзакции XXXX обработан и т.п., собирается из PSTKT_CABINET_MSG_REFUND_* -->
									<div class="refund-msg__item" v-html="ordslot.REFUND_MESSAGE"></div>
								</div>
							</div>
							<div class="cab-train-title">
								{{ord.station0 | CAPITALIZE}} — {{ord.station1 | CAPITALIZE}}
							</div>


							<div class="cab-order-train-bar">

								<div class="row">
									<div class="col-xs-6">
										<div class="cab-label"><dict name="Train"/></div>
										<b>{{ord.train}}</b>
									</div>
									<div class="col-xs-6">
										<div class="cab-label">Вагон</div>
										<b>									
											<template v-if="ord.bWithoutPlaces"> <!-- "Посадка в любой вагон класса 3В" -->
												<ifrmsg name="ANY_VAGON_LASTOCHKA"/>
											</template>
											<template v-else="">
												{{ord.car}}
											</template>
										</b>
									</div>

									<div class="col-xs-6">
										<div class="cab-label">
											<dict name="Departure"/>
										</div>
										<!-- ЕСЛИ класс datetime-wrap_first-msk ТО CSS (flex) выводит блок с местным временем после московского, ЕСЛИ класс datetime-wrap_first-local то порядок как в разметке (сначала местное) -->
										<div v-bind:class="'datetime-wrap datetime-wrap_first-' + ordslot.defShowTime">
											<!-- время местное -->
											<div v-if="ord.localDate0" class="datetime-local">
												<span class="datetime-hhmm">{{ord.localTime0}}</span> 
												<span class="datetime-suffix">({{ord.timeDeltaString0}})</span>
												<span class="datetime-dmy">{{ord.localDate0}}</span>
											</div>
											<!-- время московское -->
											<div class="datetime-msk">	
												<span class="datetime-hhmm">{{ord.time0}}</span>
												<span class="datetime-suffix" v-if="ord.Msk0">({{ordslot.mskTimeSuffix}})</span>
												<span class="datetime-dmy">{{ord.date0}}</span>										
											</div>
										</div>
										<span class="color-grey cab-small">{{ord.station0 | CAPITALIZE}}</span>
									</div>

									<div class="col-xs-6">
										<div class="cab-label">
											<dict name="Arrival"/>
										</div>
										<!-- ЕСЛИ класс datetime-wrap_first-msk ТО CSS (flex) выводит блок с местным временем после московского, ЕСЛИ класс datetime-wrap_first-local то порядок как в разметке (сначала местное) -->
										<div v-bind:class="'datetime-wrap datetime-wrap_first-' + ordslot.defShowTime">
											<!-- время местное -->
											<div v-if="ord.localDate1" class="datetime-local">
												<span class="datetime-hhmm">{{ord.localTime1}}</span>
												<span class="datetime-suffix">({{ord.timeDeltaString1}})</span>
												<span class="datetime-dmy">{{ord.localDate1}}</span>
											</div>	
											<!-- время московское. -->			
											<div class="datetime-msk">	
												<span class="datetime-hhmm">{{ord.time1}}</span>
												<span class="datetime-suffix" v-if="ord.Msk1">({{ordslot.mskTimeSuffix}})</span>
												<span class="datetime-dmy">{{ord.date1}}</span>										
											</div>
										</div>								
										<span class="color-grey cab-small">{{ord.station1 | CAPITALIZE}}</span>
									</div>
								</div>
								<div class="row cab-order-money-block">
									<div class="col-xs-6 col-xs-offset-12">
										<b v-if="!ord.deferredPayment && ordslot.jstatus === 'ISSUED'"><!-- TODO перенести в JS -->
											Оплачено мест: 
											<template v-if="ord.bWithoutPlaces"> <!-- "Без места" -->
												<ifrmsg name="VAGON_NO_SEATS_LASTOCHKA"/>
											</template>
											<template v-else="">
												{{ord.nPayed}}
											</template>									
										</b> 
									</div>
									<div class="col-xs-6">
										Общая стоимость
										<br/>
										<b class="color-orange">
											{{ord.cost | FORMAT_SUM}} <dict name="RUB"/>
										</b>

										<div class="color-grey cab-small" v-if="ord.hasInsurance">Включая страховку</div>
									</div>
								</div>
							</div>

							<div v-for="tik in ord.lst" class="row cab-ticket" v-bind:class="{'cab-ticket-refunded': tik.status === 'REFUNDED'}">

								<!-- Ошибки операций с билетами -->
								<pre v-if="tik.HUMAN_ERROR" class="col-xs-24 alert alert-danger">{{tik.HUMAN_ERROR}}</pre>

								<div class="col-xs-12">
									<div class="cab-fio cab-label">
										{{tik.name | CAPITALIZE}}
									</div>
									<div v-if="ordslot.jstatus === 'ISSUED'">
										Сохранить билет:

										<a class="cab-blank-link color-orange" v-on:click="getBlank_ticket('pdf', ord, tik)" v-on:keyup.enter.space="getBlank_ticket('pdf', ord, tik)" v-bind:disabled="ord.LOADING_STATUSES">PDF</a>

										<span class="color-grey">|</span>

										<a class="cab-blank-link color-orange" v-on:click="getBlank_ticket('png', ord, tik)" v-on:keyup.enter.space="getBlank_ticket('png', ord, tik)" v-bind:disabled="ord.LOADING_STATUSES">PNG</a>

										<span class="color-grey">|</span>

										<a class="cab-blank-link color-orange" target="_blank" v-bind:href="tik.LINK_BLANK">
											<!-- Ссылки на HTML-бланк различаются заголовком ссылки (обычный, отложенный, возвращённый), т.е. ссылка одинаковая, разница только в названии -->
											<span v-if="tik.STATUS.CODE==='REFUNDED'">
												<!--Купон возврата PIRS-11575   TODO параметр бланка anotherUserTicketRequest -->
												<dict name="Ticket/Refund coupon"/>
											</span>
											<span v-else-if="ord.deferredPayment">
												<!-- Ссылка на бланк отложенной оплаты "Бланк брони заказа" -->
												<dict name="Ticket/Order reservation card"/>
											</span>
											<span v-else="">
												<!-- Обычный бланк -->
												<i class="glyphicon glyphicon-print"></i>
											</span>						
										</a>

									</div>
								</div>
								<div class="col-xs-6">
									<div class="row">
										<div>
											<div class="col-xs-8">
												<div class="cab-label">
													<dict name="place"/>:
												</div>
											</div>
											<div class="col-xs-16">
												<div class="cab-label cab-label-multiline">
													<b>
														<template v-if="ord.bWithoutPlaces">
															<ifrmsg name="VAGON_NO_SEATS_LASTOCHKA"/>
														</template>
														<template v-else-if="tik.place">													
															{{tik.place}}
															<span class="color-grey cab-small" v-bind:title="tik.seatsType">
																{{tik.seatsTypeName}}
															</span>
														</template>
														<template v-else="">
															<!-- Без указания места -->
															<dict name="Ticket/withoutPlace"/>
														</template>
													</b>
												</div>
											</div>
										</div>
									</div>

									<div class="row">								
										<div class="col-xs-8">
											<div class="cab-label">
												Тариф:
											</div>
										</div>
										<div class="col-xs-16">
											<b>
												<div class="cab-label cab-label-multiline">
													{{tik.tariff}}
												</div>
											</b>
										</div>								
									</div>

									<div class="row"  v-if="tik.vtr">
										<div class="col-xs-24">
											ВТТ № {{tik.vtr}}
										</div>
									</div>
								</div>

								<div class="col-xs-6">
									<div class="cab-label">
										<!-- Стоимость --><dict name="Stoimost"/>
									</div>
									<b class="-color-orange">{{tik.cost | FORMAT_SUM}} <dict name="RUB"/></b>
								</div>

								<!-- PIRS-16436 -->

								<template v-if="prepaidFood_visible(tik, ord) || addFood_visible(tik)">
									<div class="col-xs-24 dotted-top-delimiter">
										<h5>
											Питание
										</h5>
									</div>
									<div class="col-xs-24">								
										<div v-if="prepaidFood_visible(tik, ord)" class="row">
											<div class="col-xs-4">
												Предоплаченное:									
											</div>
											<div class="col-xs-20">
												<template v-if="tik.foodId">
													<b>{{tik.foodName}}</b>
													&#160;&#160;									
												</template>
												<a v-if="!ord.left && tik.status != 'REFUNDED'" v-on:click.prevent="changeMeal(ord, tik, ordslot_index, ordslot)" class="link-dotted">
													<template v-if="ord.foodId">Сменить</template>
													<template v-else="">Выбрать</template> предоплаченное питание
												</a>
											</div>
										</div>

										<!-- Дополнительное питание -->
										<div v-if="addFood_visible(tik)">
											<div class="row" v-for="foodOrder in addFood_getArray(tik)">
												<div class="col-xs-4">
													Дополнительное:
												</div>
												<!-- Питание возвёрнуто -->
												<div v-if="foodOrder.isRefunded" class="col-xs-20">
													Оформлен возврат.
												</div>
												<!-- Питание куплено -->
												<template v-else-if="foodOrder.isPurchased" class="col-xs-20">
													<div class="col-xs-14">
														<a class="link-dotted" v-on:click.prevent="getFoodDetails(ord, tik, foodOrder)">
															<template v-for="(selectedFoodItem, index) in foodOrder.foodPattern.split('')">
																<template v-if="index">/</template>													
																<dict name="Breakfast" v-if="selectedFoodItem === 'З'"/>
																<dict name="Lunch" v-if="selectedFoodItem === 'О'" />
																<dict name="Dinner" v-if="selectedFoodItem === 'У'" />
															</template>
														</a>&#160;
														<i class="glyphicon glyphicon-chevron-down"></i>
														<template v-if="foodDetails.selectedMenuItems && foodDetails.ticketId === tik.n">
															<div class="row" v-for="selectedFoodItem in foodDetails.selectedMenuItems">
																<div class="col-xs-6">																	
																	<dict name="Breakfast" v-if="selectedFoodItem === 'З'"/>
																	<dict name="Lunch" v-if="selectedFoodItem === 'О'" />
																	<dict name="Dinner" v-if="selectedFoodItem === 'У'" />
																</div>
																<div class="col-xs-12">
																	{{selectedFoodItem.variant}}
																</div>
																<div class="col-xs-6">
																	{{selectedFoodItem.count}}&#160;шт.
																</div>
															</div>
															<div class="row" v-if="!tik.SHOW_REFUND_FOOD && tik.SHOW_REFUND_FOOD_MSG">
																<div class="col-xs-24 alert alert-info">
																	<ifrmsg name="ADD_FOOD_REFUND_WARNING"/>
																</div>
															</div>
														</template>
													</div>
													<div class="col-xs-5">
														<div class="cab-label">Стоимость</div>
														<b class="color-orange">
															{{foodOrder.cost | FORMAT_SUM}}&#160;<dict name="RUB"/>
														</b>
													</div>
												</template>

												<div class="col-xs-20" >
													<template v-if="!foodOrder.isFake">
														<span class="color-grey">Квитанции:</span>
														<!-- PDF-бланк -->
														<a v-on:click="getFoodBlank(tik, ord, 'pdf', foodOrder)" class="cab-blank-link color-orange">PDF</a>
														<span class="color-grey">|</span>
														<!-- HTML-бланк -->
														<a v-bind:href="getFoodBlank(tik, ord, 'html', foodOrder)" class="link-icon link-icon-print cab-blank-link color-orange" target="_blank"></a>
													</template>

													<div class="cab-order-action-item">
														<template v-if="tik.SHOW_REFUND_FOOD && foodOrder.isPurchased">
															<button
																v-on:click.prevent="refundFood(ord, tik, foodOrder)"
																v-bind:disabled="foodDetails.LOADING_REFUND"
																class="link-dotted">
																<!-- Кнопка "Сдать питание" -->
																<dict name="Return addtional food"/>
															</button>
															&#160;
														</template>
														<button :href="LINK('catering-menu-page')" class="link-dotted" v-on:click.prevent="addFood_showMenuWindow()">Посмотреть меню</button> &#160;
														<button class="link-dotted"
															v-if="foodOrder.isLast && addFood_isBuyPossible(tik)"
															v-on:click.prevent="buyAdditionals(ordslot, ord, tik, 'food')">
															<!-- Купить питание -->
															<dict name="Buy"/>
														</button>
													</div>
												</div>
											</div>
										</div>
									</div>
								</template>

								<!-- PIRS-16873 Товары с маркета -->
								<template v-if="tik.addGoods || tik.goodsTotalCost">
									<div class="col-xs-24 dotted-top-delimiter">
										<h5>Товары</h5>
									</div>
									<div class="col-xs-18" >
										<template v-if="tik.addGoods && tik.status != 'REFUNDED'">									
											<a href="#" class="link-dotted" v-on:click.prevent="buyAdditionals(ordslot, ord, tik, 'goods')">Купить товары</a>
											&#160;
										</template>
										<template v-if="tik.goodsTotalCost">
											<a v-bind:href="tik.LINK_GOODS_LIST" class="link-dotted">Оформленные товары</a>
											<a class="cab-blank-link color-orange" v-bind:href="tik.LINK_GOODS_BLANK_PDF">PDF</a>
										</template>
									</div>
									<div class="col-xs-6" v-if="tik.goodsTotalCost">
										<b>
											<span v-html="tik.goodsTotalCost"></span>&#160;<dict name="RUB" />
										</b>
									</div>
								</template>


								<template v-if="tik.INSUR">
									<template v-if="tik.INSUR.Refunded == 1">								
										<div class="col-xs-24 color-grey dotted-top-delimiter">
											<!-- Осуществлен возврат страховой премии -->
											<ifrmsg name="POLICY_CABINET_RETURN_STATUS"/>
										</div>
									</template>
									<template v-if="tik.INSUR.Refunded != 1" >
										<div class="col-xs-24 dotted-top-delimiter">
											<h5>
												<ifrmsg name="POLICY_TITLE_NS_FULL"/>
											</h5>
										</div>
										<div class="col-xs-18">
											<div class="cab-ticket-insur-wrap">										
												{{tik.INSUR.shortName}}:	

												<span class="text-nowrap">											
													<a class="cab-blank-link color-orange" v-on:click="getBlank_insurance(tik, 'pdf')" v-on:keyup.enter.space="getBlank_insurance(tik, 'pdf')">PDF</a>

													<span class="color-grey">|</span>

													<a class="cab-blank-link color-orange" target="_blank" v-bind:href="tik.LINK_INSURANCE">
														<i class="glyphicon glyphicon-print"></i>
													</a>
													&#160;
													<a class="link-dotted" v-on:click="refundInsurance(tik, ord)" v-on:keyup.enter.space="refundInsurance(tik, ord)" v-if="isInsuranceRefundAvailable(tik, ord)"><dict name="Order a refund" /></a><!-- Оформить возврат -->
												</span>
											</div>
										</div>
										<div class="col-xs-6">
											<b class="-color-orange">{{tik.INSUR.cost | FORMAT_SUM}} <dict name="RUB"/></b>
										</div>
									</template>
								</template>

								<!-- PIRS-14578 ДМС страховки "Полис медицинского страхования" -->
								<div class="col-xs-24 dotted-top-delimiter" v-if="tik.POLICY">
									<div class="row">
										<div class="col-xs-24">
											<h5>
												<ifrmsg name="POLICY_TITLE"/>
											</h5>
										</div>
										<div class="col-xs-18">
											<ifrmsg name="POLICY_COMPANY"/>&#160;

											<template v-if="isPolicyActive(tik)">
												<a class="cab-blank-link color-orange" target="_blank" v-bind:href="tik.POLICY.link">PDF</a>
											</template>
										</div>
										<div class="col-xs-6">										
											<b class="-color-orange">
												{{tik.POLICY.cost | FORMAT_SUM}} <dict name="RUB"/>
											</b>
										</div>
										<div class="col-xs-24 color-grey">										
											<ifrmsg name="POLICY_FORM_TERRITORY"/>: 
											<b>{{tik.POLICY_AREA}}</b>
											&#160; | &#160;
											Срок действия полиса: <b>{{tik.POLICY_DATE}}</b>
										</div>
									</div>								
								</div>



								<div class="col-xs-24 dotted-top-delimiter" v-if="tik.LOADER || ord.LOADER || tik.STATUS.NAME">		
									<!-- Информация о статусе билета -->
									<div v-if="true">
										<!-- ord.LOADING_STATUSES || tik.LOADING_STATUS -->
										<i  v-if="tik.LOADER || ord.LOADER" class="spin--aurora"></i>								
										<div v-else-if="tik.STATUS.CODE" class="cab-statusName">
											<b>{{tik.STATUS.NAME}}</b> &#160; 
											<!-- <a v-on:click="getStatuses(ord)" class="link-dotted">Обновить</a> -->
										</div> 											
									</div>


									<div class="pass-orderList-ticket-btnWrap row" v-if="isTicketActionsAvailable(tik, ord)">

										<div class="col-xs-24 buttons-list cab-order-action-bar color-grey">

											<div class="cab-order-action-item" v-show="tik.STATUS.CODE==='PAID'">				
												<button class="link-dotted"
													v-on:click="changeStatus(tik, ord, true)"
													v-bind:disabled="tik.LOADING_STATUS">
													<!-- Пройти электронную регистрацию -->
													<dict name="Perform an electronic registration"/>
												</button>
											</div>

											<div class="cab-order-action-item" v-show="tik.STATUS.CODE==='REGISTERED'" >
												<button class="link-dotted"
													v-on:click="changeStatus(tik, ord, false)" 												
													v-bind:disabled="tik.LOADING_STATUS">
													<!-- Отменить электронную регистрацию -->
													<dict name="Cancel electronic registration"/>
												</button>
											</div>

											<div class="cab-order-action-item">
												<i class="spin" v-if="tik.LOADING_REFUND_TICKET"></i>
												<button v-else="" class="link-dotted"
													v-show="ord.bNonRefundable===false"
													v-on:click="refundTicket(tik, ord, ordslot)" 
													v-bind:disabled="tik.LOADING_REFUND_TICKET">												
													<!-- Оформить возврат -->
													<dict name="Order a refund"/>
												</button>
											</div>

											<div class="cab-order-action-item" v-if="isInsuranceRefundAvailable(tik, ord)">
												<a class="link-dotted"
													v-on:click="refundInsurance(tik, ord)" 
													v-if="tik.INSUR.Refunded!=1">
													Оформить возврат страховки
												</a>
											</div>

											<div class="cab-order-action-item" v-if="tik.STATUS.CODE === 'PAID'">
												<a v-bind:href="'?STRUCTURE_ID=5243&amp;layer_id=5476&amp;cs_id=' + ord.parentStation0" 
													class="link-dotted" target="_blank">
													Посмотреть кассы
												</a>
											</div>

											<div class="cab-order-action-item" v-if="isPolicyRefundAvailable(tik, ord)">
												<button class="link-dotted"
													v-on:click="refundDMS(tik, ord)" 
													v-on:keyup.enter.space="refundDMS(tik, ord)" 
													v-bind:disabled="ord.LOADING_STATUSES">
													<!-- Оформить возврат полиса медицинского страхования -->
													<ifrmsg name="POLICY_CABINET_RETURN_TITLE"/>
												</button>											
											</div>

										</div>
									</div>

									<div class="t-legend" v-if="ord.ELREG_IFRMSG">
										<div class="t-legend-text">Важно</div>
										<div v-if="ord.bNonRefundable"> <!-- PIRS-16411 -->
											<ifrmsg name="REFUND_FORBIDDEN_LASTOCHKA" />
											<hr/>
										</div>
										<ifrmsg :name="ord.ELREG_IFRMSG" /> <!-- сообщения типа "Обратитесь в КАССУ ИЛИ ТЕРМИНАЛ для оформления Вашего билета на бланке..." -->
									</div>
								</div>

								<div class="clearfix"></div>
							</div>

							<div class="cab-order-action-bar color-grey">
								<div class="row cab-order-action-row" v-if="ordslot.jstatus === 'ISSUED'"> <!-- Данная информация должна быть показана только для поездки в статусе ISSUED: PIRS-13714 -->
									<div class="col-xs-24">
										Сохранить билеты:
										<a class="cab-blank-link color-orange" v-on:click="getBlank_ticket('pdf', ord)" v-on:keyup.enter.space="getBlank_ticket('pdf', ord)" v-bind:disabled="ord.LOADING_STATUSES">PDF</a>

										<span class="color-grey">|</span>
										<a class="link-icon link-icon-print cab-blank-link color-orange" target="_blank" v-bind:href="ord.LINK_BLANK" v-bind:title="DICT('Order form')"></a>								
									</div>
								</div>
								<div class="row cab-order-action-row">
									<div class="col-xs-24">
										<i v-if="ord.left">Поезд ушёл</i>
										<!-- Если заказ активный, можно запросить статус билетов -->
										<a v-show="!ord.left && !ord.LOADING_STATUSES" class="link-icon-refresh" 
											v-bind:title="DICT('Ticket/Request for ticket status')"
											v-on:click="getStatuses(ord)"
											v-bind:disabled="ord.LOADING_STATUSES">
											<span class="link-dotted">Обновить статус заказа</span>
										</a>
										<!-- <i class="spin" v-show="ord.LOADING_STATUSES"></i> -->
									</div>
								</div>
								<div class="row cab-order-action-row">
									<div class="col-xs-12">
										<div class="cab-order-action-item" v-if="ord.autoCarrier">
											<a v-bind:href="ord.LINK_AUTORACK" target="_blank">
												<xsl:attribute name="title">
													Для данного поезда вы можете оформить заявку на перевозку транспортного средства (автомобиль)
												</xsl:attribute>
												<b>
													<span v-if="ord.autoOrder">Просмотр заявки на перевозку ТС</span>
													<span v-else="">Заказать перевозку автомобиля</span>
												</b>
											</a>
										</div>

										<div class="cab-order-action-item" v-if="ord.LINK_HOTEL">
											<!-- "Забронировать отель" -->
											<div class="cab-hotels-block" v-html="ord.LINK_HOTEL"></div>
										</div>
									</div>

									<!-- Таймер Aviso PIRS-13686 -->
									<div class="col-xs-12" v-if="!ord.left && ord.avisoTimer">
										<div class="aviso-timer">
											<span class="aviso-timer__text"><span class="glyphicon glyphicon-time"></span>&#160;Заказ подтверждается</span>
											&#160;
											<span class="aviso-timer__timer">{{ord.avisoTimer}} мин.</span>
										</div>
									</div>
								</div>
							</div>

							<!-- Ошибки операций с заказами -->
							<pre v-if="ord.HUMAN_ERROR" class="alert alert-danger">{{ord.HUMAN_ERROR}}</pre>

						</div>
					</div> <!-- ord in lst	 -->
				</div> <!-- ordslots in slots -->

				<div class="text-center">
					<div v-show="LOADING_ORDERS===false" class="cab-load-more-wrap">
						<a class="btn btn-main-gray" v-show="!lastPage" v-on:click.prevent="getOrders(true)">
							Загрузить ещё
						</a>
						<div v-show="slots.length===0 && bShowForm === true && !HUMAN_ERROR" class="alert alert-err alert-border-ext alert-square alert-err-back">
							<!-- Список заказов пуст. Уточните даты поиска. -->
							<ifrmsg name="PSTKT_CABINET_MSG_EMPTY_SLOTS"/>
						</div>
					</div>
					<div class="spin--aurora" v-show="LOADING_ORDERS===true"></div>
				</div>

				<div v-if="bShowBankResultBtns">

					<payment-handler v-if="bShowRetryPayment" actor="desktop_2016" v-bind:jr="journeyReservation" ref="paymentHandler"></payment-handler>
					<br/>

					<div class="row">
						<div class="col-md-8">
							<div v-if="bShowRetryPayment">
								<a v-on:click="retryPayment" class="btn btn-main-red">Попытаться оплатить ещё раз</a>&#160;<i v-if="LOADING_ORDERS" class="spin spin-xs"></i>
							</div>
						</div>
						<div class="col-md-16 text-right">
							<a class="btn btn-main-gray"  :href="LINK('route-2012')" v-on:click.prevent="bankResult_goStart">
								Начать покупку с начала <!-- Купить новый билет? -->
							</a> &#160;
							<a class="btn btn-main-red" v-on:click.prevent="gotoCabinet" :href="LINK('cabinet-2012')">Перейти в "Мои заказы"</a>
						</div>
					</div>
				</div>


				<div class="hidden">

					<div class="j-on-aviso-popup">
						<ifrmsg name="PST_WAIT_TRIP_STATUS_REDESIGN2016"/>
						<div v-for="(ordslot, ordslot_index) in slots" v-bind:id="'hash-sord-'+ordslot.id"> 
							<div v-if="ordslot.jstatus === 'ON_AVISO'">
								<a class="link-dotted" v-on:click="getStatusesForSaleOrder(ordslot)">
									<dict name="Ticket/transactionId"/> {{ordslot.transactionId}}
								</a>
							</div>
						</div>
					</div>

					<!-- PIRS-16436 -->
					<!-- Шаблон для вывода списка питания. Содержит контейнер для элементов .j-list и кнопку выбора .j-submit -->
					<div id="j-change-food-popup">
						<div class="j-mealList food-selector">
							<h1>
								<dict name="Selecting the type of food"/>
							</h1>

							<div style="background: #eee; padding: 1em; margin-bottom: 1em">
								<div>
									<p>
										<b>
											<dict name="Service expiration moment"/>
										</b>
									</p>
									<!-- всю разметку храним в сообщении ифр -->
									<ifrmsg name="PSTKT_MSG_FOOD_PRELIM"/>
								</div>
							</div>

							<b>
								<dict name="FoodService/Select food type"/>
							</b>
							<br/>
							<div class="j-list">
								<div v-for="(foodItem, idx) in foodList.list" class="j-food-list-item food-selector__item">
									<!-- Заголовок выводится всегда. Содержит radio-button и название -->
									<div class="j-header food-selector__item-head">
										<!-- дада, я знаю что c лейблом так делать плохо -->
										<label style="display: block">
											<input type="radio" v-bind:value="foodItem.name+'_'+foodItem.id" v-model="foodListSelectedItem" name="food-type" v-bind:id="foodItem.id" v-bind:checked="foodItem.name == foodList.tikFoodName"></input>
											{{foodItem.name}}
											<div class="food-selector__toggler-down" style="float: right">▼</div>
											<div class="food-selector__toggler-up" style="float: right">▲</div>
										</label>
									</div>
									<!-- Описание скрыто для тех элементов, которые не активны -->
									<div class="j-descr food-selector__item-descr">
										<div class="message-box">
											<div v-if="foodItem.shortDescr" class="food-selector__item-descr-short">
												{{foodItem.shortDescr}}
											</div>

											<div>
												<div v-if="foodItem.hasImage" style="float: left; width: 270px">
													<img style="max-width: 100%; max-width: 250px;">
														<!--<xsl:attribute name="src">/dbmm/images/8/23715/{{foodItem.id}}</xsl:attribute>-->
													</img>
												</div>

												<div v-if="foodItem.descr" style="float: left; width: 300px">
													{{foodItem.descr}}
												</div>

												<div style="clear:both"></div>
											</div>

										</div>
									</div>
								</div>
							</div>
						</div>
					</div>


					<div class="j-refund-popup" v-if="refundMsg">
						<p v-if="refundMsg.bMulti">
							<span v-if="refundMsg.bDisabledCompanion">
								<!-- сообщение при попытке возврата билета инвалида мол, билет сопровождающего тоже надо вернуть -->
								<ifrmsg name="DPEOPLE_TICKET_SIMULTANEOUS_RETURN"/>							
							</span>
							<dict name="Only the simultaneous return of several tickets at once is possible!"  v-if="!refundMsg.bDisabledCompanion"/>
						</p>
						<div v-for="ritem in refundMsg.list" class="form-group">
							<dict name="Departure"/> {{refundMsg.ord.date0}} {{refundMsg.ord.time0}}, <dict name="Train"/> {{refundMsg.ord.train}}, <dict name="Ticket/Car"/>{{refundMsg.ord.car}}, <dict name="place"/> {{ritem.place}}, {{ritem.name}}

							<div v-html="ritem.message"></div><!-- "Сумма, причитающаяся к возврату..." - берётся из словаря и шаблонизируется в cabinet.js  -->
							<br/>
						</div>
						<div class="form-group" v-if="refundMsg.bINSUR">
							<span>
								<!-- сообщение при попытке возврата билета со страховкой -->
								<b><ifrmsg name="INSURANCE_REFUND_SUM"/>&#160;<span v-html="refundMsg.bINSUR_cost"></span>&#160;руб.</b>
							</span>
						</div>
						<div class="form-group" v-if="refundMsg.bDMS">
							<span>
								<!-- сообщение при попытке возврата билета со страховкой ВТБ ДМС -->
								<b><ifrmsg name="POLICY_CABINET_REFUND_SUM"/>&#160;<span v-html="refundMsg.bDMS_cost"></span>&#160;руб.</b>
							</span>
						</div>
						<div class="form-group"> <!-- общее сообщение -->
							<ifrmsg name="REFUND_INFO_CABINET"/>
						</div>
						<div v-if="refundMsg.bYandex"> <!-- текст для яндекс -->
							<ifrmsg name="REFUND_RULES_YANDEX_MONEY"/>
						</div>

						<div v-if="!refundMsg.bYandex"> <!-- текст для ТКБ -->
							<ifrmsg name="REFUND_RULES_BANK"/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

</template>


<script>
	import componentMixin from './cabinet.js';
	import paymentHandler from '@comps/payment-handler/payment-handler-redesign.vue'
	import authHandler from '@comps/auth-handler/auth-handler-redesign.vue'

	export default {
		name:'CabinetRedesign',		
		components: {
			'payment-handler': paymentHandler,
			'auth-handler': authHandler
		},
		mixins: [componentMixin]
	}
</script>