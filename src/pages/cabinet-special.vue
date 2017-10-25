<!-- что к чему в ответе на запрос заказа: slots.id === APP_SALE_ORDER.ID, slots.lst. === APP_ORDER.ID, slots.lst.lst.n	=== APP_TICKET.ID -->
<template>
	<div>
		<div v-if="bShowForm" class="row">
			<div class="col-md-24">	
				<form class="pass-cabinet-form form-horizontal" v-on:submit.prevent="getOrders">
					<div class="row form-group">
						<div class="col-md-4">
							<label for="id-name"><dict name="Last name" /></label>
							<input class="form-control input-lg" id="id-name" v-model="form.name" tabindex="0"/>
						</div>
						<div class="col-md-4">
							<label for="id-number"><dict name="Train number" /></label>
							<input class="form-control input-lg" id="id-number" v-model="form.number" tabindex="0"/>
						</div>
						<div class="col-md-6">
							<label for="id-date0"><dict name="Departure Date" />&#160;<dict name="predlog/ot" /></label>
							<input class="form-control input-lg" v-jqui-datepicker="form.date0" data-custom-default-value="true" id="id-date0" tabindex="0"/>
						</div>
						<div class="col-md-6">
							<label for="id-date1"><dict name="predlog/do" /></label> 
							<input class="form-control input-lg" v-jqui-datepicker="form.date1" id="id-date1" tabindex="0"/> 
						</div>
						<div class="col-md-4 text-right">
							<label>&#160;</label> 
							<button type="submit" class="btn btn-block btn-lg"><dict name="Find" /></button>
						</div>
					</div>
					<div class="row">
						<div class="col-md-24 text-center">									
							<div class="btn-group">							
								<a class="btn btn-sm" v-on:click="changeMode('active')" v-bind:class="{active:form.mode==='active'}" tabindex="0"><dict name="CabinetMode_active"/></a><!-- Предстоящие поездки -->
								<a class="btn btn-sm" v-on:click="changeMode('archive')" v-bind:class="{active:form.mode==='archive'}" tabindex="0"><dict name="CabinetMode_archive"/></a><!-- Архивные поездки -->
							</div>
						</div>
					</div>
				</form>
			</div>
		</div>

		<div class="row" v-if="PAYMENT_RESULT">
			<div class="col-md-24">
				<h1 v-if="PAYMENT_RESULT === 'OK'"><dict name="Ticket/headerPaymentOk"/></h1>
				<div v-else class="alert alert-danger">	
					<ifrmsg v-if="PAYMENT_RESULT === 'CANCEL'" name="PSTKT_BANK_CANCEL"/>
					<ifrmsg v-if="PAYMENT_RESULT === 'DECLINE'" name="PSTKT_BANK_CANCEL"/>	
				</div>
			</div>
		</div>

		<pre v-if="HUMAN_ERROR" class="col-md-24 pre-message pre-message-common">{{HUMAN_ERROR}}</pre>		
		
		<div v-for="(ordslot, ordslot_index) in slots" v-bind:id="'hash-sord-'+ordslot.id"> 
			<div v-for="(ord, index) in ordslot.lst">
				<div class="pass-orderList-order" v-bind:class="{'pass-orderList-order-refunded': ord.STATUS }">
					<h2 class="row">
						<div class="col-md-24">
							{{ord.station0 | CAPITALIZE}} — {{ord.station1 | CAPITALIZE}} 
						</div>
					</h2>
					<div class="row">
						<div class="col-md-17">
							<div class="row">
								<div class="col-md-7">
									<dict name="Train" /> №
								</div>
								<div class="col-md-17">
									{{ord.train}}
								</div>
							</div>

							<div class="row">
								<div class="col-md-7">
									<dict name="Departure" />
								</div>
								<div class="col-md-17">
									<!-- ЕСЛИ класс datetime-wrap_first-msk ТО CSS (flex) выводит блок с местным временем после московского, ЕСЛИ класс datetime-wrap_first-local то порядок как в разметке (сначала местное) -->
									<div v-bind:class="'datetime-wrap datetime-wrap_first-' + ordslot.defShowTime">
										<!-- время местное -->
										<div v-if="ord.localDate0" class="datetime-local">
											{{ord.localDate0}}&#160;<b class="datetime-hhmm">{{ord.localTime0}}&#160;{{ord.timeDeltaString0}}</b>
										</div>
										<!-- время московское -->
										<div class="datetime-msk">	
											{{ord.date0}}&#160;<b class="datetime-hhmm">{{ord.time0}}&#160;<span v-if="ord.Msk0">{{ordslot.mskTimeSuffix}}</span></b>
										</div>
									</div>
								</div>
							</div>

							<div class="row">
								<div class="col-md-7">
									<dict name="Arrival" />
								</div>
								<div class="col-md-17">	
									<!-- ЕСЛИ класс datetime-wrap_first-msk ТО CSS (flex) выводит блок с местным временем после московского, ЕСЛИ класс datetime-wrap_first-local то порядок как в разметке (сначала местное) -->
									<div v-bind:class="'datetime-wrap datetime-wrap_first-' + ordslot.defShowTime">
										<!-- время местное -->
										<div v-if="ord.localDate1" class="datetime-local">
											{{ord.localDate1}}&#160;<b class="datetime-hhmm">{{ord.localTime1}}&#160;{{ord.timeDeltaString1}}</b>
										</div>
										<!-- время московское -->
										<div class="datetime-msk">	
											{{ord.date1}}&#160;<b class="datetime-hhmm">{{ord.time1}}&#160;<span v-if="ord.Msk1">{{ordslot.mskTimeSuffix}}</span></b>
										</div>
									</div>
								</div>
							</div>

							<div class="row">
								<div class="col-md-7">
									<dict name="Ticket/Car" />
								</div>
								<div class="col-md-17">
									<ifrmsg name="ANY_VAGON_LASTOCHKA" v-if="ord.bWithoutPlaces"/>
									<template v-else="">{{ord.car}} ({{ord.carCls}})</template>
								</div>
							</div>

							<div class="row">
								<div class="col-md-7">
									<dict name="Ticket/transactionId" />
								</div>
								<div class="col-md-17">
									{{ordslot.transactionId}}
								</div>
							</div>
						</div>							
						<div class="col-md-7 text-right">
							<!-- кнопки к ЗАКАЗУ -->
							<div class="btn-group">
								<a class="btn btn-sm" target="_blank" tabindex="0" v-bind:href="ord.LINK_BLANK">
									<dict name="Order form" />
								</a>
								<button class="btn btn-sm" tabindex="0" 
									v-on:click="getBlank_ticket('pdf', ord)" 
									v-on:keyup.enter.space="getBlank_ticket('pdf', ord)" 
									v-bind:disabled="ord.LOADING_STATUSES">
									PDF
								</button>
							</div>
							<br/><br/>
							<button class="pass-order-elreg-get btn btn-md" tabindex="0"
								v-on:click="getStatuses(ord)" v-if="!ord.left"
								v-bind:disabled="ord.LOADING_STATUSES">
								<i class="glyphicon glyphicon-info-sign"></i>
								<dict name="Ticket/Request for ticket status" /> <!-- Запросить статус билетов -->
							</button>
							<template v-if="IS_DEV"><a v-bind:href="ord.ORDER_LINK" class="pass-order-debug-link" title="Открыть только текущий заказ (ссылка видна только при включённом показе ошибок)"><i class="glyphicon glyphicon-share-alt"></i></a></template>
						</div>							
					</div>

					<!--  Сообщение о том что для данной поездки есть информация о возврате которую не удалось сопоставить ни с одним билетом (PIRS-16410). В этом сообщении есть вуёвое выражение v-bind:href="ordslot.LINK_REFUND_REGISTER". ordslot.hasUnmatchedRefundTransfer -> CABINET_BANK_REFUND_INFO-->

					<template v-if="ord.autoCarrier">
						<div class="row pass-ord-group">
							<div class="col-md-17">
								<div class="pass-ord-group-head">
									Перевозка транспортного средства
								</div>
								Для данного поезда вы можете оформить заявку на перевозку транспортного средства (автомобиля)
							</div>
							<div class="col-md-7 text-right">
								<a v-bind:href="ord.LINK_AUTORACK" target="_blank" class="btn btn-sm">
									<template v-if="ord.autoOrder">Просмотр заявки на перевозку</template>
									<template v-else="">Заявка на услугу перевозки автомобиля</template>
								</a>
							</div>
						</div>
					</template>

					<div class="row" v-if="ord.HUMAN_ERROR">
						<pre class="col-md-24 pre-message pre-message-common">{{ord.HUMAN_ERROR}}</pre>
					</div>


					<template v-if="!ord.left && ord.avisoTimer"><!-- PIRS-13686 -->
						<div class="alert alert-info">
							Заказ подтверждается. &#160;{{ord.avisoTimer}} мин.
						</div>
					</template>

					<template v-if="ord.bNonRefundable"><!-- PIRS-16411 -->
						<div class="alert alert-danger">
							<ifrmsg name="REFUND_FORBIDDEN_LASTOCHKA" />
						</div>
					</template>						

					<div><!-- обертка нужна для правильно работы last-child у класса pass-orderList-ticket -->
						<div v-for="tik in ord.lst" 
							class="pass-orderList-ticket" 
							v-bind:class="{'pass-orderList-ticket-refunded': tik.status === 'REFUNDED'}">
							<div class="row">
								<div class="col-md-24">
									<div class="pass-ord-ticket-name">{{tik.name | CAPITALIZE}}</div>
								</div>
								<div class="col-md-17">
									<div class="row">
										<div class="col-md-7">
											<dict name="Document number" />
										</div>
										<div class="col-md-17">	
											{{tik.doc}}	
										</div>
									</div>
									<div class="row">
										<div class="col-md-7">
											<dict name="Place" />
										</div>
										<div class="col-md-17">		
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
										<div class="col-md-7">
											<dict name="Ticket/Cost" />
										</div>
										<div class="col-md-17">	
											{{tik.cost | FORMAT_SUM}}&#160;руб.
										</div>
									</div>
									<div class="row">
										<div class="col-md-7">
											<dict name="Tariff" />
										</div>
										<div class="col-md-17">	
											{{tik.tariff}}
										</div>
									</div>
									<div class="row">
										<div class="col-md-7">
											<dict name="Status" />
										</div>
										<div class="col-md-17">		
											<i v-if="tik.LOADER || ord.LOADER" class="spin"></i><!-- ord.LOADING_STATUSES || tik.LOADING_STATUS -->
											<div v-else="" class="pass-orderList-status">
												<b v-if="tik.STATUS.NAME">{{tik.STATUS.NAME}}</b>
												<a v-else="" v-on:click="getStatuses(ord)" class="link-dotted"><!-- Обновить --><dict name="Reset"/></a>
												<!-- есть ещё признак финального (окончательного) статуса - finalSt -->
											</div>
										</div>
									</div>
								</div>
								<div class="col-md-7 text-right"><!--кнопки к билету-->
									<div class="form-group btn-group">
										<a class="btn btn-sm" target="_blank" tabindex="0" v-bind:href="tik.LINK_BLANK">
											<dict name="Ticket blank" />
										</a>
										<button class="btn btn-sm" tabindex="0" v-on:click="getBlank_ticket('pdf', ord, tik)" v-on:keyup.enter.space="getBlank_ticket('pdf', ord, tik)" v-bind:disabled="ord.LOADING_STATUSES">PDF</button>
										<button class="btn btn-sm" tabindex="0" v-on:click="getBlank_ticket('png', ord, tik)" v-on:keyup.enter.space="getBlank_ticket('png', ord, tik)" v-bind:disabled="ord.LOADING_STATUSES">PNG</button>
									</div>
									<!--PIRS-11575-->
									<div class="form-group" v-if="tik.STATUS.CODE==='REFUNDED'">
										<a class="btn btn-sm" target="_blank" tabindex="0" v-bind:href="ord.LINK_BLANK">
											<dict name="Ticket/Refund coupon" />
										</a>
									</div>
								</div>
							</div>
							<template v-if="tik.HUMAN_ERROR">
								<div class="row">
									<pre class="col-md-24 pre-message pre-message-common">{{tik.HUMAN_ERROR}}</pre>
								</div>
							</template>

							<template v-if="isTicketActionsAvailable(tik, ord)">
								<div class="pass-orderList-ticket-btnWrap row">
									<div class="col-md-24 text-right">

										<button class="btn btn-sm" tabindex="0"
											v-on:click="changeStatus(tik, ord, true)"
											v-on:keyup.enter.space="changeStatus(tik, ord, true)"
											v-show="tik.STATUS.CODE==='PAID'"
											v-bind:disabled="tik.LOADING_STATUS">
											<!-- Пройти электронную регистрацию -->
											<dict name="Perform an electronic registration"/>
										</button>

										<button class="btn btn-sm" tabindex="0"
											v-on:click="changeStatus(tik, ord, false)" 
											v-on:keyup.enter.space="changeStatus(tik, ord, false)" 
											v-show="tik.STATUS.CODE==='REGISTERED'" 
											v-bind:disabled="tik.LOADING_STATUS">
											<!-- Отменить электронную регистрацию -->
											<dict name="Cancel electronic registration"/>
										</button>

										<button class="btn btn-sm" tabindex="0"
											v-if="!ord.bNonRefundable"
											v-on:click="refundTicket(tik, ord, ordslot)" 
											v-on:keyup.enter.space="refundTicket(tik, ord, ordslot)" 
											v-bind:disabled="tik.LOADING_REFUND_TICKET">
											<!-- Оформить возврат -->
											<dict name="Order a refund"/>
										</button>

									</div>
								</div>
							</template>

							<!-- сообщение Ваш возврат по платежной транзакции XXXX обработан и т.п., собирается из PSTKT_CABINET_MSG_REFUND_* -->
							<template v-if="ordslot.REFUND_MESSAGE">
								<div class="pass-orderList-refund-msg__cont">
									<div class="refund-msg__item" v-html="ordslot.REFUND_MESSAGE"></div>
								</div>
							</template>

							<!-- Страховка НС (от несчастных случаев, т.е. обычная) -->
							<template v-if="tik.INSUR">
								<div class="row pass-ord-group">
									<div class="col-md-17">											
										<div class="pass-ord-group-head">
											<!-- Страхование пассажиров от несчастных случаев на время поездки -->
											<ifrmsg name="INSURANCE_FORM_ENABLE_TOOLTIP" />
										</div>
										<template v-if="tik.INSUR.Refunded == 1">
											<!-- Осуществлен возврат страховой премии -->
											<ifrmsg name="INSURANCE_RETURN_STATUS" />
										</template>
										<template v-else="">
											<div class="row">													
												<div class="col-md-7">
													<!-- Компания --><dict name="Company"/>:
												</div>
												<div class="col-md-17">
													{{tik.INSUR.shortName}}
												</div>

												<div class="col-md-7">
													<!-- Стоимость --><dict name="Stoimost"/>:
												</div>
												<div class="col-md-17">
													{{tik.INSUR.cost | FORMAT_SUM}}&#160;руб.
												</div>
											</div>
										</template>
									</div>
									<div class="col-md-7 text-right">
										<div class="btn-group" v-if="isInsuranceActive(tik)">
											<a class="btn btn-sm" target="_blank" tabindex="0" v-if="tik.INSUR.Refunded!=1" v-bind:href="tik.LINK_INSURANCE" title="Бланк страховки от несчастных случаев">
												<dict name="Insurance policy" />
											</a>
											<!--кнопки скачивания бланков страховки  -->
											<a class="btn btn-sm" tabindex="0" v-on:click="getBlank_insurance(tik, 'pdf')" v-on:keyup.enter.space="getBlank_insurance(tik, 'pdf')" title="Бланк страховки от несчастных случаев в формате PDF">
												PDF
											</a>
											<button class="btn btn-sm" tabindex="0"
												v-on:click="refundInsurance(tik, ord)" 
												v-on:keyup.enter.space="refundInsurance(tik, ord)" 
												v-if="isInsuranceRefundAvailable(tik, ord)"><dict name="Order a refund" /></button>
												<!-- Оформить возврат -->
										</div>										
									</div>
								</div>
							</template>

							<!-- Страховка ДМС (медицинская) -->
							<template v-if="tik.POLICY">
								<div class="row pass-ord-group">
									<div class="col-md-17">
										<div class="pass-ord-group-head">
											<!-- Страхование медицинских расходов на время путешествия -->
											<ifrmsg name="POLICY_FORM_ENABLE_TOOLTIP" />
										</div>

										<div v-if="tik.POLICY_STATUS.code != 'ISSUED'" v-html="tik.POLICY_STATUS.name"></div>
										<div v-else="">
											<div class="row">
												<div class="col-md-7">
													<!-- Компания --><dict name="Company"/>:
												</div>
												<div class="col-md-17">
													<ifrmsg name="POLICY_COMPANY" />
												</div>
												<div class="col-md-7"> 
													<!-- стоимость -->
													<ifrmsg name="POLICY_FORM_PRICE" />
												</div>
												<div class="col-md-17">
													{{tik.POLICY.cost | FORMAT_SUM}}&#160;руб.
												</div>
												<div class="col-md-7">
													<ifrmsg name="POLICY_FORM_TERRITORY" />
												</div>
												<div class="col-md-17">
													{{tik.POLICY_AREA}}
												</div>
												<div class="col-md-7">
													<!-- Срок действия полиса --><dict name="Policy valid till"/>:
												</div>
												<div class="col-md-17">
													{{tik.POLICY_DATE}}
												</div>
											</div>
										</div>
									</div>
									<div class="col-md-7 text-right">
										<div class="btn-group">
											<a class="btn btn-sm" target="_blank" tabindex="0" v-if="tik.POLICY_STATUS.code == 'ISSUED'" v-bind:href="tik.POLICY.link" title="Бланк полиса ДМС в формате PDF">PDF</a>

											<button class="btn btn-sm" tabindex="0" 
												v-on:click="refundDMS(tik, ord)" 
												v-on:keyup.enter.space="refundDMS(tik, ord)" 
												v-bind:disabled="ord.LOADING_STATUSES" 
												v-if="isPolicyRefundAvailable(tik, ord)">
												<!-- Оформить возврат --><dict name="Order a refund"/>
											</button>

										</div>
									</div>
								</div>
							</template>

							<template v-if="prepaidFood_visible(tik, ord)"><!-- PIRS-16436 -->
								<div class="row pass-ord-group">
									<div class="col-md-17">
										<div class="pass-ord-group-head">
											Предоплаченое питание
										</div>
										<div class="row" v-if="tik.foodId">
											<div class="col-md-7">
												Выбранный рацион:
											</div>
											<div class="col-md-17">
												<!-- сюда сервер пишет "Выберите тип питания", если он не выбран, таким образом понять, выбран ли тип, можно только по заполненности поля foodId -->
												{{tik.foodName}}
											</div>
										</div>											
									</div>
									<div v-if="!ord.left && tik.status != 'REFUNDED'" class="col-md-7 text-right">
										<a v-on:click.prevent="changeMeal(ord, tik, ordslot_index, ordslot)" class="btn btn-sm">
											<template v-if="ord.foodId">Сменить</template>
											<template v-else="">Выбрать</template> тип питания
										</a>
									</div>
								</div>
							</template>

							<!-- Дополнительное питание -->
							<template v-if="addFood_visible(tik)">
								<div  v-for="foodOrder in addFood_getArray(tik)" class="row pass-ord-group">
									<div class="col-md-17">
										<div class="pass-ord-group-head">
											<ifrmsg name="ADD_FOOD" />
										</div>

										<!-- Питание возвёрнуто - Оформлен возврат -->
										<dict name="Refunded" v-if="foodOrder.isRefunded"/>

										<!-- Питание куплено -->
										<template v-else-if="foodOrder.isPurchased">
											<div>
												<a class="link-dotted" v-on:click.prevent="getFoodDetails(ord, tik, foodOrder)">
													<template
														v-for="(selectedFoodItem, index) in foodOrder.foodPattern.split('')">
														<template v-if="index">/</template>
														<dict name="Breakfast" v-if="selectedFoodItem === 'З'"/>
														<dict name="Lunch" v-if="selectedFoodItem === 'О'" />
														<dict name="Dinner" v-if="selectedFoodItem === 'У'" />
													</template>
												</a>. <dict name="Stoimost"/>: {{foodOrder.cost | FORMAT_SUM}}&#160;руб.
											</div>

											<template v-if="foodDetails.selectedMenuItems && foodDetails.ticketId === tik.n">
												<div class="row" v-for="selectedFoodItem in foodDetails.selectedMenuItems">
													<div class="col-xs-8 text-right">
														<dict name="Breakfast" v-if="selectedFoodItem === 'З'"/>
														<dict name="Lunch" v-if="selectedFoodItem === 'О'" />
														<dict name="Dinner" v-if="selectedFoodItem === 'У'" />
													</div>
													<div class="col-xs-8 text-center">
														{{selectedFoodItem.variant}}
													</div>
													<div class="col-xs-8">
														{{selectedFoodItem.count}} шт.
													</div>
												</div>
											</template>
										</template>
									</div>

									<div class="col-md-7 text-right">

										<div class="btn-group" v-if="!foodOrder.isFake">
											<a v-bind:href="getFoodBlank(tik, ord, 'html', foodOrder)" class="btn btn-sm" target="_blank"><dict name="Receipt"/></a>
											<a v-on:click="getFoodBlank(tik, ord, 'pdf', foodOrder)" class="btn btn-sm">PDF</a>
										</div>

										<div class="btn-group">
											<button
												v-if="tik.SHOW_REFUND_FOOD && foodOrder.isPurchased"
												v-on:click.prevent="refundFood(ord, tik, foodOrder)"
												v-bind:disabled="foodDetails.LOADING_REFUND" class="btn btn-sm">
												<!-- Сдать питание -->
												<dict name="Return addtional food" />
											</button>

											<button :href="LINK('catering-menu-page')" class="btn btn-sm" v-on:click.prevent="addFood_showMenuWindow()">Посмотреть меню</button>

											<button class="btn btn-sm" v-if="addFood_isBuyPossible(tik)" v-on:click.prevent="buyAdditionals(ordslot, ord, tik, 'food')">
												<dict name="Buy" /><!-- Купить питание -->
											</button>
										</div>

									</div>
								</div>
							</template>

							<!-- PIRS-16873 Товары с маркета -->
							<template v-if="tik.addGoods || tik.goodsTotalCost">
								<div class="row pass-ord-group">
									<div class="col-sm-18">
										<div class="pass-ord-group-head">
											Товары
										</div>
									</div>
									<div class="col-sm-6 text-right" v-if="tik.goodsTotalCost">
										<b>
											<span v-html="tik.goodsTotalCost"></span>&#160;<dict name="RUB"/>
										</b>
									</div>
									<div class="col-sm-7">
										<a href="#" class="link-dotted"
											v-if="tik.addGoods &amp;&amp; tik.status != 'REFUNDED'"
											v-on:click.prevent="buyAdditionals(ordslot, ord, tik, 'goods')">Купить товары</a>
										</div>
										<div class="col-sm-17 text-right" v-if="tik.goodsTotalCost">
											<a v-bind:href="tik.LINK_GOODS_LIST" class="link-dotted">Оформленные товары</a>
											<a class="link-dotted" style="margin-left: 1em;" target="_blank" v-bind:href="tik.LINK_GOODS_BLANK_PDF">PDF</a>
										</div>
									</div>
								</template>

							</div> <!-- pass-orderList-ticket -->
						</div>

						<template v-if="ord.ELREG_IFRMSG">
							<div class="row">
								<div class="col-md-18">
									<ifrmsg :name="ord.ELREG_IFRMSG" /> <!-- сообщения типа "Обратитесь в КАССУ ИЛИ ТЕРМИНАЛ для оформления Вашего билета на бланке..." -->
								</div>
							</div>
						</template>

						<template v-if="ord.LINK_HOTEL">
							<!-- "Забронировать отель", формируется из переменной UFS_HOTELS_TPL кот содерджит сообщение ИФР UFS_HOTELS_ORDERS -->
							<div class="cab-hotels-block" v-html="ord.LINK_HOTEL"></div>							
						</template>
					</div>
				</div> <!-- ord in lst	 -->
			</div> <!-- ordslots in slots -->

			<div class="text-center">
				<div v-show="LOADING_ORDERS===false">					
					<a class="btn" tabindex="0" v-show="!lastPage" v-on:click.prevent="getOrders(true)">
						<dict name="Show more"/><!-- Показать ещё -->
					</a>
					<div v-if="slots.length===0 && bShowForm === true && !HUMAN_ERROR">
						<!-- Список заказов пуст. Уточните даты поиска. -->
						<ifrmsg name="PSTKT_CABINET_MSG_EMPTY_SLOTS" />
					</div>
				</div>
				<i v-show="LOADING_ORDERS===true" class="spin spin-lg"/>
			</div>


			<div class="hdn">

				<div class="j-on-aviso-popup">
					<ifrmsg name="PST_WAIT_TRIP_STATUS_BLIND" />
					<div v-for="(ordslot, ordslot_index) in slots" v-bind:id="'hash-sord-'+ordslot.id">
						<div v-if="ordslot.jstatus === 'ON_AVISO'">
							<a class="link-dotted" v-on:click="getStatusesForSaleOrder(ordslot)">
								<dict name="Ticket/transactionId" /> {{ordslot.transactionId}}
							</a>
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
						<dict name="Departure" /> {{refundMsg.ord.date0}} {{refundMsg.ord.time0}}, <dict name="Train" /> 
						{{refundMsg.ord.train}}, <dict name="Ticket/Car" /> {{refundMsg.ord.car}}, <dict name="place" /> {{ritem.place}}, {{ritem.name}}

						<div v-html="ritem.message"></div><!-- "Сумма, причитающаяся к возврату..." - берётся из словаря и шаблонизируется в cabinet.js  -->
						<br/>
					</div>
					<div class="form-group" v-if="refundMsg.bINSUR">
						<!-- сообщение при попытке возврата билета со страховкой -->
						<ifrmsg name="INSURANCE_REFUND_SUM"/>&#160;<span v-html="refundMsg.bINSUR_cost"></span>&#160;руб.</b>
					</div>
					<div class="form-group" v-if="refundMsg.bDMS">
						<!-- сообщение при попытке возврата билета со страховкой ВТБ ДМС -->
						<ifrmsg name="POLICY_CABINET_REFUND_SUM"/>&#160;<span v-html="refundMsg.bDMS_cost"></span>&#160;руб.</b>

					</div>
					<div class="form-group"> <!-- общее сообщение -->
						<ifrmsg name="REFUND_INFO_CABINET" />
					</div>
					<ifrmsg name="REFUND_RULES_YANDEX_MONEY" v-if="refundMsg.bYandex" /><!-- текст для яндекс -->
					<ifrmsg name="REFUND_RULES_BANK" v-if="!refundMsg.bYandex" /><!-- текст для ТКБ -->
				</div>
			</div>

			<div style="display: none">
				<!-- PIRS-16436 -->
				<!-- Шаблон для вывода списка питания. Содержит контейнер для элементов .j-list и кнопку выбора .j-submit -->
				<div id="j-change-food-popup">
					<div class="j-mealList food-selector">
						<h1>
							<dict name="Selecting the type of food" />
						</h1>

						<div style="background: #eee; padding: 1em; margin-bottom: 1em">
							<div>
								<p>
									<b>
										<dict name="Service expiration moment" />&#160;
									</b>
								</p>
								<!-- всю разметку храним в сообщении ифр -->
								<ifrmsg name="PSTKT_MSG_FOOD_PRELIM" />
							</div>
						</div>
						<b>
							<dict name="FoodService/Select food type" />
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
			</div>

			<template v-if="bShowBankResultBtns">

				<payment-handler v-if="bShowRetryPayment" v-bind:jr="journeyReservation" ref="paymentHandler"></payment-handler>
				<br/>

				<div class="row">
					<div class="col-md-8">
						<div v-if="bShowRetryPayment">
							<a v-on:click="retryPayment" class="btn btn-lg">
								Попытаться оплатить ещё раз
							</a>&nbsp;<i v-if="LOADING_ORDERS" class="spin spin-xs"></i>							
						</div>
					</div>
					<div class="col-md-16 text-right">
						<a class="btn btn-md"  :href="LINK('route-2012')" v-on:click.prevent="bankResult_goStart">
							<dict name="Ticket/start ticket processing first"/>
						</a> &#160;
						<a class="btn btn-md" v-on:click.prevent="gotoCabinet" href="LINK('cabinet-2012')">
							<dict name="Go to My orders"/>
						</a>
					</div>
				</div>

			</template>
		</div>
	</template>

<script>
	import componentMixin from './cabinet.js';
	import paymentHandler from '@comps/payment-handler/payment-handler-special.vue'
	import authHandler from '@comps/auth-handler/auth-handler-special.vue'

	export default {
		name:'CabinetSpecial',		
		components: {
			'payment-handler': paymentHandler,
			'auth-handler': authHandler
		},
		mixins: [componentMixin]
	}
</script>
<style scoped lang="less">/* здесь можно писать scoped стили, либо указать src внешнего файла */</style> 