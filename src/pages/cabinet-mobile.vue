<!-- что к чему в ответе на запрос заказа: slots.id === APP_SALE_ORDER.ID, slots.lst. === APP_ORDER.ID, slots.lst.lst.n	=== APP_TICKET.ID -->
<template>
	<div>
		
		<div class="main-content">

			<auth-handler></auth-handler>

			<template v-if="!bAuthFormVisible">

				<template v-if="bShowForm">
					<div class="row">
						<div class="col-xs-12">	
							<form class="pass-cabinet-form" v-on:submit.prevent="getOrders">
								<div class="">
									<div class="form-group col-xs-12 col-md-6">
										<label for="id-date0"><dict name="Departure Date"/>&#160;<dict name="predlog/ot"/></label>
										<input class="form-control input-lg" v-jqui-datepicker="form.date0" data-custom-default-value="true" id="id-date0"/>
									</div>
									<div class="form-group col-xs-12 col-md-6">
										<label for="id-date1"><dict name="predlog/do"/></label> 
										<input class="form-control input-lg" v-jqui-datepicker="form.date1" id="id-date1"/> 
									</div>
									<div class="form-group col-xs-12 text-right">
										<label>&#160;</label> 
										<button type="submit" class="btn btn-with-icon btn-rzd-round"><span class="glyphicon glyphicon-search"/><dict name="Find"/></button>
									</div>
								</div>

								<div class="row">
									<div class="col-xs-12 text-center">
										<div class="btn-group">
											<a class="btn" v-on:click="changeMode('active')" v-bind:class="{active:form.mode==='active'}" ><dict name="CabinetMode_active"/></a>
											<a class="btn" v-on:click="changeMode('archive')" v-bind:class="{active:form.mode==='archive'}" ><dict name="CabinetMode_archive"/></a>
										</div>
									</div>
								</div>
							</form>
						</div>
					</div>
				</template>

				<div class="margin-content">
					<div class="row" v-if="PAYMENT_RESULT">
						<div class="col-xs-12">
							<h1 v-if="PAYMENT_RESULT === 'OK'"><dict name="Ticket/headerPaymentOk"/></h1>
							<div v-else class="alert alert-danger">	
								<ifrmsg v-if="PAYMENT_RESULT === 'CANCEL'" name="PSTKT_BANK_CANCEL"/>
								<ifrmsg v-if="PAYMENT_RESULT === 'DECLINE'" name="PSTKT_BANK_CANCEL"/>	
							</div>
						</div>
					</div>
				</div>

				<pre v-if="HUMAN_ERROR" class="pre-message pre-message-common">{{HUMAN_ERROR}}</pre>

				<h3 class="orders-header" v-if="slots.length && bShowForm">Список заказов</h3>

				<div v-for="(ordslot, ordslot_index) in slots" v-bind:id="'hash-sord-'+ordslot.id" class="order-items"> 
					<!-- TODO: здесь надо бы вывести заголовок маршрута, если он туда-обратно или с пересадкой -->
					
					<div v-for="(ord, index) in ordslot.lst" class="order">
						<div v-if="index == 0 && ordslot.routeNames" class="margin-content text-bold route-header">{{ordslot.routeNames}}</div>
						<div class="order-item">
							<div class="order-item-content clearfix" v-bind:class="{'order-refunded': ord.STATUS, 'order-refunded-show': ord.SHOW_REFUNDED_ORDER}">
								<div class="icon-show-refunded" v-if="ord.STATUS" v-on:click.keyup.enter.space="showRefundedOrder(ord)">
									<div class="glyphicon" v-bind:class="{'glyphicon-chevron-up' : ord.SHOW_REFUNDED_ORDER, 'glyphicon-chevron-down' : !ord.SHOW_REFUNDED_ORDER }"></div>
								</div>
								<div class="onrefund-row clearfix">
									<div class="row">
										<div class="col-xs-12 text-bigger">
											<dict name="Train" />&#160;<b>{{ord.train}}</b><b v-if="ord.brand" class="text-red">&#160;{{ord.brand}}</b>
										</div>
									</div>
									<div class="row">
										<div class="col-xs-12 text-bigger">
											<dict name="Ticket/Car" />&#160;
											<b>
												<ifrmsg v-if="ord.bWithoutPlaces" name="ANY_VAGON_LASTOCHKA" />
												<template v-else="">{{ord.car}} ({{ord.carCls}})</template>
											</b>
										</div>
									</div>
								</div>
								<div class="row form-group onrefund-one-line">
									<div class="col-xs-6 text-bigger">{{ord.station0}}</div>
									<div class="col-xs-6 text-bigger">{{ord.station1}}</div>
								</div>
								<div class="row form-group onrefund-show">
									<div class="col-xs-5">
										<!-- ЕСЛИ класс datetime-wrap_first-msk ТО CSS (flex) выводит блок с местным временем после московского, ЕСЛИ класс datetime-wrap_first-local то порядок как в разметке (сначала местное) -->
										<div v-bind:class="'datetime-wrap datetime-wrap_first-' + ordslot.defShowTime">
											<!-- время местное -->
											<div v-if="ord.localDate0" class="datetime-local">
												{{ord.localDate0}}&#160;<b>{{ord.localTime0}}</b>
												&#160;<span class="color-grey">{{ord.timeDeltaString0}}</span>
											</div>
											<!-- время московское -->
											<div class="datetime-msk">
												{{ord.date0}}&#160;<b>{{ord.time0}}</b>&#160;<span class="color-grey" v-if="ord.Msk0">{{ordslot.mskTimeSuffix}}</span>
											</div>
										</div>
									</div>
									<div class="col-xs-1"> → </div>
									<div class="col-xs-6">
										<!-- ЕСЛИ класс datetime-wrap_first-msk ТО CSS (flex) выводит блок с местным временем после московского, ЕСЛИ класс datetime-wrap_first-local то порядок как в разметке (сначала местное) -->
										<div v-bind:class="'datetime-wrap datetime-wrap_first-' + ordslot.defShowTime">
											<!-- время местное -->
											<div v-if="ord.localDate1" class="datetime-local">
												{{ord.localDate1}}&#160;<b>{{ord.localTime1}}</b>
												&#160;<span class="color-grey">{{ord.timeDeltaString1}}</span>
											</div>
											<!-- время московское -->
											<div class="datetime-msk">
												{{ord.date1}}&#160;<b>{{ord.time1}}</b>&#160;<span class="color-grey" v-if="ord.Msk1">{{ordslot.mskTimeSuffix}}</span>
											</div>
										</div>
									</div>
								</div>
								<div class="row form-group hdn">
									<div class="col-xs-12 text-right">
										<div class="btn-group">
											<a class="btn" target="_blank"  v-bind:href="ord.LINK_BLANK">
												<dict name="Order form"/>
											</a>
											<a class="btn" v-bind:href="'/ticket-form/ticket/download/pdf/order/' + ord.N + '/ru'">PDF</a>
										</div>
									</div>
								</div>

								<div class="row form-group">
									<div class="col-xs-12">
										Стоимость заказа: <span class="text-red">{{ord.cost}} руб.</span>
									</div>
									<div class="col-xs-12 text-small">
										<dict name="Ticket/transactionId"/>: <span>{{ordslot.transactionId}}</span>
									</div>
								</div>
								
								<div class="row form-group" v-if="!ord.left">
									<div class="col-xs-12 text-right">
										<button class="btn-with-icon btn" 
											v-on:click="getStatuses(ord)" 
											v-if="!ord.left" 
											v-bind:disabled="ord.LOADING_STATUSES">
											<i class="glyphicon glyphicon-info-sign"></i>
											<dict name="Ticket/Request for ticket status"/> <!-- Запросить статус билетов -->
										</button>
									</div>
								</div>


								<div class="row" v-if="ordslot.REFUND_MESSAGE">
									<div class="col-xs-12">
										<div class="pass-orderList-refund-msg__cont">
											<!-- сообщение Ваш возврат по платежной транзакции XXXX обработан и т.п., собирается из PSTKT_CABINET_MSG_REFUND_* -->
											<div class="refund-msg__item" v-html="ordslot.REFUND_MESSAGE"></div>
										</div>
									</div>
								</div>

								<div class="row" v-if="!ord.left && ord.avisoTimer">
									<div class="col-xs-12">
										<h3>
											<i class="glyphicon glyphicon-time"></i>&#160;Заказ подтверждается.
											&#160;{{ord.avisoTimer}} мин.
										</h3>
									</div>
								</div>

								<pre v-if="ord.HUMAN_ERROR" class="pre-message pre-message-common">{{ord.HUMAN_ERROR}}</pre>

								<div class="order-item-ticket" v-for="tik in ord.lst" v-bind:class="{'ticket-refunded': tik.status === 'REFUNDED'}">
									<div>
										<div class="row onrefund-show">
											<div class="col-xs-7 text-bold">{{tik.name}}</div>
											<div class="col-xs-5 text-right text-small">(док. {{tik.doc}})</div>
										</div>

										<div class="row">
											<div class="col-xs-4">
												<dict name="Ticket/Car"/>
											</div>
											<div class="col-xs-8">
												<ifrmsg v-if="ord.bWithoutPlaces" name="ANY_VAGON_LASTOCHKA" />
												<template v-else=""><span class="text-bold">{{ord.car}} ({{ord.carCls}})</span></template>
											</div>
										</div>

										<div class="row">
											<div class="col-xs-4"><dict name="Place"/></div>
											<div class="col-xs-8">
												<ifrmsg v-if="ord.bWithoutPlaces" name="VAGON_NO_SEATS_LASTOCHKA" />
												<template v-else-if="tik.place">
													<span class="text-bold">{{tik.place}}</span> {{tik.seatsTypeName}}
												</template>
												<template v-else="">
													<!-- Без указания места -->
													<dict name="Ticket/withoutPlace"/>
												</template>

											</div>
										</div>
										<div class="row">
											<div class="col-xs-4"><dict name="Ticket/Cost" /></div>
											<div class="col-xs-8">
												<span class="text-red">
													<span v-if="tik.tariffId == 200" class="text-capitalize">   <!-- PIRS-17511 билет куплен по Деловому проездному PIRS-18023 -->
														<dict name="prepaid"/>
													</span>
													<span v-else="">
														{{tik.cost | FORMAT_SUM}}&#160;<dict name="RUB"/>&#160;
													</span>
												</span>
												<span>
													{{tik.tariff}}
												</span>
											</div>
										</div>
										<div class="row onrefund-show">
											<div class="col-xs-4"><dict name="Status" /></div>
											<div class="col-xs-8">
												<div v-if="true">
													<i class="spin" v-if="tik.LOADER || ord.LOADER"></i><!-- ord.LOADING_STATUSES || tik.LOADING_STATUS -->
													<div v-else="">
														<b>{{tik.STATUS.NAME}}</b> &#160; 
														<!-- <a v-on:click="getStatuses(ord)" class="link-dotted">Обновить</a> -->
														<!-- PIRS-17431 -->
														<a href="#"
														   v-if="ordslot.REFUND_MESSAGE"
														   v-on:click.prevent="showRefundDetails">
															<dict name="Refund_Details"/>
														</a>
													</div>
												</div>
											</div>
											<!-- PIRS-17430 - Детали возврата -->
											<div class="col-xs-12" v-if="bRefundDetailsVisible">
												<div class="pass-orderList-refund-msg__cont alert alert-warning"
												     v-if="ordslot.REFUND_MESSAGE">
													<!-- сообщение Ваш возврат по платежной транзакции XXXX обработан и т.п., собирается из PSTKT_CABINET_MSG_REFUND_* -->
													<div class="refund-msg__item" v-html="ordslot.REFUND_MESSAGE"></div>
												</div>
											</div>
										</div>
										<div class="row">
											<div class="col-xs-12"><!--кнопки к билету-->
												<div class="text-right">
													<div class="form-group btn-group">
														<a class="btn" target="_blank"  v-bind:href="tik.LINK_BLANK">
															<dict name="Ticket blank"/>
														</a>
														<a class="btn" v-bind:href="'/ticket-form/ticket/download/pdf/order/' + ord.N + '/ru?ticketId=' + tik.n">PDF</a>
														<a class="btn" v-bind:href="'/ticket-form/ticket/download/png/order/' + ord.N + '/ru?ticketId=' + tik.n">PNG</a>
													</div>
													<!--PIRS-11575-->
													<div class="form-group form-group" v-if="tik.STATUS.CODE==='REFUNDED'">
														<a class="btn" target="_blank"  v-bind:href="ord.LINK_BLANK">
															<dict name="Ticket/Refund coupon"/>
														</a>
													</div>
												</div>
											</div>
										</div>

										<template v-if="prepaidFood_visible(tik, ord) || addFood_visible(tik)">
											<div class="row form-group">
												<div v-if="prepaidFood_visible(tik, ord)" class="">
													<div class="col-xs-9">
														Предоплаченное питание:<br/>
														<template v-if="tik.foodId">
															<b>{{tik.foodName}}</b>
															&#160;&#160;
														</template>
													</div>
													<template v-if="!isChangePrepaidFoodPossible(tik)">
														<div class="col-xs-12">
															<ifrmsg name="CHANGE_PREPAID_FOOD_NOT_POSSIBLE"/>
															<p>Дата и время окончания услуги выбора питания: <span style="color:#e21a1a">{{tik.foodFinal}}</span></p>
														</div>
													</template>
													<template v-else="">
														<div class="col-xs-3 text-right" v-if="!ord.left && tik.status != 'REFUNDED' && changeMeal_visible(tik, ord)">
															<a v-on:click.prevent="changeMeal(ord, tik, ordslot_index, ordslot)" class="btn" style="padding: .6em .9em; line-height: 1;">
																<i class="glyphicon glyphicon-cog" v-if="!tik.LOADER_FOOD" style="font-size: 1.5em;"></i>
																<i class="spin" v-if="tik.LOADER_FOOD" style="font-size: 1.5em;"></i>
																<!--
																<template v-if="ord.foodId">Сменить</template>
																<template v-else="">Выбрать</template> предоплаченное питание
																-->
															</a>
														</div>
													</template>
												</div>
											</div>
										</template>


										<!-- дополнительное питание -->
										<template v-if="(prepaidFood_visible(tik, ord) || addFood_visible(tik))">
											<div class="col-xs-24">								
												<!-- Дополнительное питание -->
												<div v-if="addFood_visible(tik)">
													<div class="row" v-for="foodOrder in addFood_getArray(tik)">
														<div class="col-xs-12">Дополнительное питание:</div>
														<div v-if="foodOrder.cost && foodOrder.isPurchased" class="col-xs-4">Стоимость</div>
														<div v-if="foodOrder.cost && foodOrder.isPurchased" class="col-xs-8"><span class="text-red">{{foodOrder.cost | FORMAT_SUM}}&#160;руб.</span></div>

														<!-- Питание возвёрнуто -->
														<div v-if="foodOrder.isRefunded" class="col-xs-12">Оформлен возврат.</div>
														
														<!-- Питание куплено -->
														<template v-else-if="foodOrder.isPurchased" class="col-xs-12">
															<div class="col-xs-4 clickable">
																<a class="food-selector-link" v-on:click.prevent="getFoodDetails(ord, tik, foodOrder)">
																	<template v-for="(selectedFoodItem, index) in foodOrder.foodPattern.split('')">
																		<template v-if="index">/</template>
																		<dict name="Breakfast" v-if="selectedFoodItem === 'З'"/>
																		<dict name="Lunch" v-if="selectedFoodItem === 'О'" />
																		<dict name="Dinner" v-if="selectedFoodItem === 'У'" />
																	</template>
																	&#160;
																	<i v-if="!(foodDetails.selectedMenuItems && foodDetails.ticketId === tik.n)" class="glyphicon glyphicon-chevron-right"></i>
																	<i v-if="foodDetails.selectedMenuItems && foodDetails.ticketId === tik.n" class="glyphicon glyphicon-chevron-left"></i>
																</a>
															</div>
															<div class="col-xs-8 clickable">
																<template v-if="foodDetails.selectedMenuItems && foodDetails.ticketId === tik.n">
																	<div v-for="selectedFoodItem in foodDetails.selectedMenuItems">
																		<div class="">
																			<dict name="Breakfast" v-if="selectedFoodItem === 'З'"/>
																			<dict name="Lunch" v-if="selectedFoodItem === 'О'" />
																			<dict name="Dinner" v-if="selectedFoodItem === 'У'" />
																		</div>
																		<div class="col-xs-9">
																			{{selectedFoodItem.variant}}
																		</div>
																		<div class="col-xs-3">
																			{{selectedFoodItem.count}}&#160;шт.
																		</div>
																	</div>
																	<div class="row" v-if="!tik.SHOW_REFUND_FOOD && tik.SHOW_REFUND_FOOD_MSG">
																		<div class="col-xs-24 alert alert-info">
																			<ifrmsg name="ADD_FOOD_REFUND_WARNING"/>
																		</div>
																	</div>
																</template>
																<template v-else="">&#160;</template>
															</div>
														</template>
														<div class="col-xs-12 text-right" >
															<div class="form-group btn-group">
																<template v-if="!foodOrder.isFake">
																	<!-- PDF-бланк -->
																	<a v-on:click="getFoodBlank(tik, ord, 'pdf', foodOrder)" class="btn">PDF</a>
																	
																	<!-- HTML-бланк -->
																	<a v-bind:href="getFoodBlank(tik, ord, 'html', foodOrder)" class="btn text-red" style="padding: 1em 1.3em;" target="_blank">
																		<i class="glyphicon glyphicon-print"></i>
																	</a>
																</template>
																<template v-if="tik.SHOW_REFUND_FOOD && foodOrder.isPurchased">
																	<a
																		v-on:click.prevent="refundFood(ord, tik, foodOrder)"
																		v-bind:disabled="foodDetails.LOADING_REFUND"
																		class="btn">
																		<!-- Кнопка "Сдать питание" -->
																		<dict name="Return addtional food"/>
																	</a>
																</template>
																<!-- Купить питание -->
																<!--
																<a class="btn"
																	v-if="foodOrder.isLast && addFood_isBuyPossible(tik)"
																	v-on:click.prevent="buyAdditionals(ordslot, ord, tik, 'food')">
																	
																	<dict name="Buy"/>
																</a>
																-->
															</div>
														</div>
														
													</div>
												</div>
											</div>
										</template><!-- дополнительное питание -->


										<div class="row" v-if="tik.INSUR || tik.POLICY">
											<div class="text-bold clickable" v-on:click.keyup.enter.space="showInsurances(tik)">
												Страховки
												<div class="glyphicon" v-bind:class="{'glyphicon-chevron-up' : tik.SHOW_INSURANCES, 'glyphicon-chevron-down' : !tik.SHOW_INSURANCES }"></div>
											</div>
											<div class="ticket-insurances clearfix" v-if="tik.SHOW_INSURANCES">
												<div class="clearfix" v-if="tik.INSUR">
													<div class="col-xs-12">
														<span class="text-bold">Страховка&#160;</span>
														<span v-if="tik.INSUR.Refunded == 1">
															<ifrmsg name="POLICY_CABINET_RETURN_STATUS" />
														</span> 
														<span v-else="">{{tik.INSUR.shortName}}</span>
													</div>
													<div class="col-xs-12" v-if="tik.INSUR.cost">
														Стоимость: <span class="text-red">{{tik.INSUR.cost | FORMAT_SUM}} руб.</span>
													</div>
													<div class="col-xs-12 text-right" v-if="isInsuranceActive(tik)">
														<div class="btn-group">
															<a class="btn" target="_blank"  v-bind:href="tik.LINK_INSURANCE">
																<dict name="Insurance policy"/>
															</a>
															<!--кнопки скачивания бланков страховки  -->
															<a class="btn"  v-on:click="getBlank_insurance(tik, 'pdf')" v-on:keyup.enter.space="getBlank_insurance(tik, 'pdf')">PDF</a>
														</div>
													</div>
												</div>

												<div class="clearfix" v-if="tik.POLICY">
													<div class="col-xs-12">
														<b><ifrmsg name="POLICY_TITLE" /></b> <ifrmsg name="POLICY_COMPANY" />
													</div>

													<div class="col-xs-12 text-bold" v-if="tik.POLICY_STATUS.code != 'ISSUED'" v-html="tik.POLICY_STATUS.name"></div>
													<div v-else="">
														<div class="col-xs-12">
															<ifrmsg name="POLICY_FORM_PRICE" />&#160;<span class="text-red">{{tik.POLICY.cost | FORMAT_SUM}} руб.</span>
														</div>
														<div class="col-xs-12">
															<ifrmsg name="POLICY_FORM_TERRITORY" />: <b>{{tik.POLICY_AREA}}</b>
														</div>
														<div class="col-xs-12">Срок действия полиса: <b>{{tik.POLICY_DATE}}</b></div>
													</div>

													<div class="col-xs-12 text-right" v-if="tik.POLICY_STATUS.code == 'ISSUED'"> <!-- tik.POLICY.Refunded!==1 -->
														<div class="btn-group">
															<a class="btn" target="_blank"  v-if="tik.POLICY_STATUS.code == 'ISSUED'" v-bind:href="tik.POLICY.link">PDF</a>
															<!-- если статус ISSUED, то можно вернуть // вернуть можно при обновлении статуса -->
															<!-- <button class="btn" target="_blank"  v-if="tik.POLICY_STATUS.code == 'ISSUED'" v-on:click="refundDMS(tik, ord)" v-on:keyup.enter.space="refundDMS(tik, ord)" v-bind:disabled="ord.LOADING_STATUSES">Возврат</button> -->
														</div>
													</div>
												</div>
											</div>
										</div>

										<pre v-if="tik.HUMAN_ERROR" class="pre-message pre-message-common">{{tik.HUMAN_ERROR}}</pre>

										<div v-if="!ord.left">
											<div class="row" style="margin-top: 15px;">
												<div class="col-xs-12 form-group text-right" v-if="isTicketActionsAvailable(tik, ord)">
													<button class="btn"
														v-on:click="changeStatus(tik, ord, true)"
														v-show="tik.STATUS.CODE==='PAID'"
														v-bind:disabled="tik.LOADING_STATUS">
														Пройти электронную регистрацию
													</button>

													<button class="btn"
														v-on:click="changeStatus(tik, ord, false)" 
														v-show="tik.STATUS.CODE==='REGISTERED'" 
														v-bind:disabled="tik.LOADING_STATUS">
														Отменить электронную регистрацию
													</button>
												</div>

												<div class="col-xs-12 form-group text-right" 
													v-if="!ord.bNonRefundable && tik.status != 'REFUNDED'"><!-- PIRS-16411 && PIRS-16852 -->
													<span style="margin-right: 10px;"><i v-show="tik.LOADING_REFUND_TICKET" class="spin spin-sm"></i></span>
													<button class="btn"
														v-on:click="refundTicket(tik, ord, ordslot)"
														v-bind:disabled="tik.LOADING_REFUND_TICKET">
														Оформить возврат билета 
													</button>
												</div>

												<div style="display: none;">
													{{ tik }}
												</div>

												<div class="col-xs-12 form-group text-right" v-if="isInsuranceRefundAvailable(tik, ord)">
													<a class="btn"
														v-on:click="refundInsurance(tik, ord)" 
														v-if="tik.INSUR.Refunded!=1">
														Оформить возврат страховки
													</a>
												</div>

												<div class="col-xs-12 form-group text-right" v-if="isPolicyRefundAvailable(tik, ord)">
													<span>
														<button class="btn" target="_blank" style="white-space: normal; text-align: left;"  v-on:click="refundDMS(tik, ord)" v-on:keyup.enter.space="refundDMS(tik, ord)" v-bind:disabled="ord.LOADING_STATUSES">
															<ifrmsg name="POLICY_CABINET_RETURN_TITLE" />
														</button>
													</span>
												</div>
											</div>
										</div>

									</div> <!-- pass-orderList-ticket -->
								</div><!-- tik in ord -->
								<div class="row" v-if="ord.ELREG_IFRMSG">
									<div class="col-xs-12 msg-mobile-block">
										<!-- здесь сообщение ИФР про электронную регистрацию -->
										<ifrmsg :name="ord.ELREG_IFRMSG" />
									</div>
								</div>
							</div>
						</div>
					</div> <!-- ord in lst	 -->
				</div> <!-- ordslots in slots -->

				<div class="col-xs-12 text-center" style="margin-top: 1em;">
					<div v-show="LOADING_ORDERS===false">
						<a class="btn"  v-show="!lastPage" v-on:click.prevent="getOrders(true)">Показать ещё</a>
						<div v-show="slots.length===0  && bShowForm === true">
							<ifrmsg name="PSTKT_CABINET_MSG_EMPTY_SLOTS"/>
						</div>
					</div>
					<i v-show="LOADING_ORDERS===true" class="spin spin-lg"></i>
				</div>


				<template v-if="bShowBankResultBtns">
					<div class="col-xs-12">
						<payment-handler v-if="bShowRetryPayment" v-bind:jr="journeyReservation" ref="paymentHandler"></payment-handler>
					</div>
					<div class="clearfix text-center">
						<div class="btn-group" style="font-size: .9em;">
							<a v-if="bShowRetryPayment" v-on:click="retryPayment" class="btn btn-md">Попытаться оплатить ещё раз</a>&#160;<i v-if="bShowRetryPayment && LOADING_ORDERS" class="spin spin-xs"></i>
							<a class="btn btn-md" :href="LINK('route')" v-on:click.prevent="bankResult_goStart">
								<dict name="Ticket/start over"/>
							</a>
							<a class="btn btn-md" :href="LINK('cabinet')"><dict name="Go to My orders"/></a>
						</div>
					</div>

				</template>


				<div class="hdn">
					<div class="j-on-aviso-popup">
						<ifrmsg name="PST_WAIT_TRIP_STATUS_BLIND"/>
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
							<h3><dict name="Selecting the type of food"/></h3>
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
							<b><dict name="FoodService/Select food type"/></b>
							<br/>
							<div class="j-list">
								<div v-for="(foodItem, idx) in foodList.list" class="j-food-list-item food-selector__item">
									<!-- Заголовок выводится всегда. Содержит radio-button и название -->
									<div class="j-header food-selector__item-head">
										<!-- дада, я знаю что c лейблом так делать плохо -->
										<label style="display: block">
											<input type="radio" v-bind:value="foodItem.name+'_'+foodItem.id" v-model="foodListSelectedItem" name="food-type" v-bind:id="foodItem.id" v-bind:checked="foodItem.name == foodList.tikFoodName"></input>
											{{foodItem.name}}
											<!--
											<div class="food-selector__toggler-down" style="float: right">▼</div>
											<div class="food-selector__toggler-up" style="float: right">▲</div>
											-->
										</label>
									</div>
									<!-- Описание скрыто для тех элементов, которые не активны -->
									<div v-if="foodListSelectedItem == foodItem.name+'_'+foodItem.id" class="j-descr food-selector__item-descr">
										<div class="message-box">
											<div v-if="foodItem.shortDescr" class="food-selector__item-descr-short">{{foodItem.shortDescr}}</div>
											<div>
												<div v-if="foodItem.hasImage" style="float: left; width: 270px">
													<img style="max-width: 100%; max-width: 250px;">
														<!--<xsl:attribute name="src">/dbmm/images/8/23715/{{foodItem.id}}</xsl:attribute>-->
													</img>
												</div>
												<div v-if="foodItem.descr" style="float: left; width: 300px">{{foodItem.descr}}</div>
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
							<!-- сообщение при попытке возврата билета инвалида мол, билет сопровождающего тоже надо вернуть -->
							<ifrmsg name="DPEOPLE_TICKET_SIMULTANEOUS_RETURN" v-if="refundMsg.bDisabledCompanion"/>
							<dict name="Only the simultaneous return of several tickets at once is possible!"  v-if="!refundMsg.bDisabledCompanion"/>
						</p>
						<div v-for="ritem in refundMsg.list" class="form-group">
							<div class="row">
								<div class="col-xs-4"><dict name="Departure"/></div><div class="col-xs-8 text-bold">{{refundMsg.ord.date0}} {{refundMsg.ord.time0}}</div>
								<div class="col-xs-4"><dict name="Train"/></div><div class="col-xs-8 text-bold">{{refundMsg.ord.train}}</div>
								<div class="col-xs-4"><dict name="Ticket/Car"/></div><div class="col-xs-8 text-bold">{{refundMsg.ord.car}}</div>
								<div class="col-xs-4"><dict name="Place"/></div><div class="col-xs-8 text-bold">{{ritem.place}}</div>
								<div class="col-xs-12 text-bold">{{ritem.name}}</div>
							</div>

							<div v-html="ritem.message"></div><!-- "Сумма, причитающаяся к возврату..." - берётся из словаря и шаблонизируется в cabinet.js  -->
							<br/>
						</div>
						<div class="form-group" v-if="refundMsg.bINSUR">
							<!-- сообщение при попытке возврата билета со страховкой -->
							<ifrmsg name="INSURANCE_REFUND_SUM"/>&#160;<span class="text-bold" v-html="refundMsg.bINSUR_cost"></span>&#160;<span class="text-bold">руб.</span></b>
						</div>
						<div class="form-group" v-if="refundMsg.bDMS">
							<!-- сообщение при попытке возврата билета со страховкой ВТБ ДМС -->
							<ifrmsg name="POLICY_CABINET_REFUND_SUM"/>&#160;<span class="text-bold" v-html="refundMsg.bDMS_cost"></span>&#160;<span class="text-bold">руб.</span></b>
						</div>
						<div class="form-group"> <!-- общее сообщение -->
							<ifrmsg name="REFUND_INFO_CABINET" />
						</div>
						<ifrmsg name="REFUND_RULES_YANDEX_MONEY" v-if="refundMsg.bYandex" /><!-- текст для яндекс -->
						<ifrmsg name="REFUND_RULES_BANK" v-if="!refundMsg.bYandex" /><!-- текст для ТКБ -->

					</div>
				</div>
			</template>
		</div>
	</div>
</template>

<script>
	import componentMixin from './cabinet.js';
	import paymentHandler from '@comps/payment-handler/payment-handler-mobile.vue'
	import authHandler from '@comps/auth-handler/auth-handler-mobile.vue'

	export default {
		name:'CabinetMobile',		
		components: {
			'payment-handler': paymentHandler,
			'auth-handler': authHandler
		},
		mixins: [componentMixin]
	}
</script>
<style scoped lang="less">/* здесь можно писать scoped стили, либо указать src внешнего файла */</style> 