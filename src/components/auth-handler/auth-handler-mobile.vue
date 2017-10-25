
<script>
	export default {
		name: 'AuthHandlerMobile',
		data: function() {
			return {
				form: { // поля формы можно задать в урле
					name: '',
					password: '',
					save: ''
				},
				isAuth: window.getAuth(),
				authCookie: window.getAuthCookie(),
				authFields: [
				['nm', 'j_username'],
				['psw', 'j_password'],
				['c', 'CAPTCHA']
				],
				onRequest: false,
				errorAuth: false,
				showForm: false,
				authSuccess: false,
				showNotAuthMsg: window.getAuth() ? false : true
			}
		},
		mounted: function() {
			window.vueAuthInstance = this;  // глобальная ссылка используется в common2016.js (ridQuery)
		},
		computed: {
			getAuth: function() {
				// Получить объект авторизации, если он есть
				// Поля: nm, psw, sv=true|false
				var authKey = 'auth',
				authObj = Session.get(authKey);
				if (!authObj) {
					authObj = Storage.get(authKey);
					if (authObj) {
						Session.set(authKey, authObj);
					}
				}
				return authObj;
			},
			getAuthCookie: function() {
				var i, p, key, lst = document.cookie.split(';')
				for (i in lst) {
					p = lst[i].split('=');
					key = $.trim(p[0]);
					if (key == 'LtpaToken2') {
						return p[1];
					}
				}
				return '';
			}
		},
		methods: {
			titlePage: function(isVisible) {
				var pageTitle = isVisible ? 'Авторизация' : $('#CommonTitle').data('title');
				$('#CommonTitle').text(pageTitle);
			},
			toggleForm: function(isVisible) { // isVisible - активна форма авторизации
				this.showForm = !!isVisible;
				this.$parent.bAuthFormVisible = !!isVisible;
				this.titlePage(isVisible);
				this.showAuthMsg(this.isAuthF());
			},
			toggleBlocks: function(showForm, onRequest, errorAuth) { // toggleBlocks(1, 0, 0)
				this.showForm = showForm ? true : false;
				this.onRequest = onRequest ? true : false;
				this.errorAuth = errorAuth ? true : false;
			},
			isAuthF: function() {
				return !!getAuth();
			},
			showAuthMsg: function(isAuth) {
				this.showNotAuthMsg = this.showForm ? false : !isAuth; // подсказка об авторизации должна выводится только в списке
			},
			submitForm: function(form) {
				// Алгоритм авторизации:
				// 1. Запрос auth
				// 2. Проверка куки
				// 3. Если кука есть, сохранить объект авторизации и закрыть модальное окно
				var data = this,
				authObj = {
					nm: form.name,
					psw: form.password,
					sv: form.save
				};
				this.toggleBlocks(0, 1, 0); // показать [форму авторизации, лоадер, ошибки]

				_request('auth', copyFields({}, authObj, AuthFields), 0, 0, function() {
					if (isAuthCookie()) {
							// Авторизация на сервере выполнена успешно. Сохраняем объект авторизации для Радона
							saveAuth(authObj);
							updateMMenu();
							data.closeForm(true);
							data.$parent.getOrders(); // после успешной авторизации получить заново список заказов
						}
						else {
							// Ошибка авторизации. Либо неправильные логин с паролем, либо ошибка на сервере... не имеет значения
							// TODO: Тут нужно предусмотреть механизм показа капчи
							this.toggleBlocks(1, 0, 1);
						}
					})
					// Возвращает 1, если клиент авторизован в системе (есть нужная кука, проставленная сервером)
					function isAuthCookie() {
						return !!getAuthCookie();
					}

					function getAuthCookie() {
						var i, p, key, lst = document.cookie.split(';')
						for (i in lst) {
							p = lst[i].split('=');
							key = $.trim(p[0]);
							if (key == 'LtpaToken2') {
								return p[1];
							}
						}
						return '';
					}

				function saveAuth(authObj) { // необходимо для авторизации Радона и вывода логина в меню.
					var authKey = 'auth';
					Session.set(authKey, authObj);
					Storage.set(authKey, (authObj && authObj.sv) ? authObj : 0);
				}
			}, // submitForm
			clearAuthCookie: function() {
				document.cookie = "LtpaToken2=; expires=Thu, 01-Jan-1970 00:00:01 GMT;";
			},
			openForm: function(st) {
				this.toggleForm(true);
			},
			closeForm: function(success) {
				var data = this;
				data.toggleBlocks(0, 0, 0);
				if (success) {
					data.authSuccess = true;
					setTimeout(function() {
						data.authSuccess = false;
						data.toggleForm(false);
					}, 1000);
				}
				else {
					data.toggleForm(false);
				}
			}
		}
	}
</script>

<style scoped lang="less">/* здесь можно писать scoped стили, либо указать src внешнего файла */</style> 

<template>	
	<div>
		<div class="login" v-if="showForm">
			<div class="j-inp login-box">
				<form class="j-form" name="auth_form" data-type="Auth" v-on:submit.prevent="submitForm(form)">
					<div>
						<div>
							<div class="form-group"><label>Логин</label><input v-model="form.name" type="text" class="form-control" name="nm" size="20" title=""></div>
						</div>
						<div>
							<div class="form-group"><label>Пароль</label><input v-model="form.password" type="password" class="form-control" name="psw" size="20" title=""></div>
						</div>
						<div>
							<div class="checkbox"><label><input v-model="form.save" type="checkbox" name="sv">Запомнить</label></div>
						</div>
						<div><a href="/selfcare/pwdRemind/ru">Забыли пароль?</a></div>
						<div><a href="/selfcare/register/ru">Регистрация</a></div>
						<div class="text-center">
							<div class="btn-group buttons-box"><a class="btn btn-wide" type="button" v-on:click="closeForm()">Отмена</a><input class="btn btn-wide btn-red-rzd" type="submit" value="Вход"></div>
						</div>
					</div>
				</form>
			</div>
		</div>
		<div class="j-wait main-content margin-content" v-if="onRequest">
			<div class="alert alert-plain text-center">
				<div><img src="/images/please-wait.gif"></div>
				<p>Запрос авторизации...</p>
				<div><a class="j-cancel btn btn-red-rzd" v-on:click="closeForm()">Отмена</a></div>
			</div>
		</div>
		<div class="j-error main-content margin-content" v-if="errorAuth">
			<div class="alert alert-danger">
				<div><span class="glyphicon glyphicon-exclamation-sign"></span> Ошибка в процессе авторизации!<br>
					Попробуйте ещё раз ввести логин и пароль.

				</div>
			</div>
		</div>
		<div class="j-success main-content margin-content" v-if="authSuccess">
			<div class="alert alert-info">
				<div><span class="glyphicon glyphicon-exclamation-sign"></span> Вы успешно авторизованы.

				</div>
			</div>
		</div>
		<div class="j-noneAuth main-content margin-content" v-if="showNotAuthMsg">
			<div class="alert alert-info">
				<div><span class="glyphicon glyphicon-exclamation-sign"></span> Авторизуйтесь, пожалуйста.

				</div>
			</div>
		</div>
	</div>
</template>