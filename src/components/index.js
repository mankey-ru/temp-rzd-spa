/**



	------------------ ЭТОТ ФАЙЛ СЕЙЧАС НЕ АКТУАЛЕН, НО В БУДУЩЕМ МОЖЕТ ПРИГОДИТЬСЯ ------------------










	Этот скрипт нужен чтобы при разработке бандл включал в себя всё на свете, а при билде - только то что нужно
	Например, чтобы при сборке слепого кабинета в билд на попадала разметка кабинетов редизайна и мобилки

	Скрипт разделён на два блока - comps и pages. Условия одинаковые, но совместить экспорты не получится из-за circular dependencies - https://stackoverflow.com/questions/30378226/circular-imports-with-webpack-returning-empty-object
*/

// Интересно, что вебпак корректно работает с conditional require если в условии if (__DEFINED_THEME === 'SPECIAL')
// а если вынести признак слабовидящей темы в переменную (var bSpecial = __DEFINED_THEME === 'SPECIAL';)
// и использовать её в условии, то не работает ни if (bSpecial) ни if (bSpecial === true)
// вернее как не работают - работают, но в результате всегда true, соответственно реквайр случается и бандл разрастается
// составные проверки с || или && тоже не работают, indexOf тоже - если __DEFINED_NOLIMIT не передавать вообще
// несмотря на то что в этом случае в переменной будет "undefined" а если передавать - то работают
// поэтому все условия такие ебловатые
// weird shit, what can I say
// TL;DR:
// ПОПЫТКА ОПТИМИЗИРОВАТЬ НИЖЕЛЕЖАЩИЕ УСЛОВИЯ С ВЫСОКОЙ СТЕПЕНЬЮ ВЕРОЯТНОСТИ СДЕЛАЕТ РАЗДЕЛЕНИЕ БАНДЛОВ НЕКОРРЕКТНЫМ (ВО ВСЕ БАНДЛЫ БУДУТ ВХОДИТЬ ВСЕ ТЕМЫ И СТРАНИЦЫ)

/**
	Компоненты внутри страниц
*/
var comps = {};

if (typeof window === 'object') {
	window.__DEFINED_NOLIMIT = 'YES';
}

if (__DEFINED_NOLIMIT === 'YES' || __DEFINED_PAGE === 'CABINET') {
	if (__DEFINED_NOLIMIT === 'YES' || __DEFINED_THEME === 'SPECIAL') {
		comps.paymentHandler_SPECIAL = require('@comps/payment-handler/payment-handler-special.vue');
		comps.authHandler_SPECIAL = require('@comps/auth-handler/auth-handler-special.vue');
	}
	if (__DEFINED_NOLIMIT === 'YES' || __DEFINED_THEME === 'REDESIGN') {
		comps.paymentHandler_REDESIGN = require('@comps/payment-handler/payment-handler-redesign.vue');
		comps.authHandler_REDESIGN = require('@comps/auth-handler/auth-handler-redesign.vue');
	}
	if (__DEFINED_NOLIMIT === 'YES' || __DEFINED_THEME === 'MOBILE') {
		comps.paymentHandler_MOBILE = require('@comps/payment-handler/payment-handler-mobile.vue');
		comps.authHandler_MOBILE = require('@comps/auth-handler/auth-handler-mobile.vue');
	}
}

export default comps;

// Получить подходящий для своей темы компонент
// Чтобы не писать в импортах условия по тому, какой нужен компонент
function GetComp(name, themeOverride) {
	var themeFromPage = window.PAGEDATA ? window.PAGEDATA.theme : 'SPECIAL';
	var theme = themeOverride || themeFromPage;
	var comp = comps[name + '_' + theme];
	if (!comp) {
		console.error(`Для темы ${theme} не найден компонент ${name}`);
	}
	return comp;
}

export {
	GetComp
};

/**
	Страницы
*/

var pages = {};


if (__DEFINED_NOLIMIT === 'YES' || __DEFINED_PAGE === 'CABINET') {
	if (__DEFINED_NOLIMIT === 'YES' || __DEFINED_THEME === 'SPECIAL') {
		pages.cabinet_SPECIAL = require('@pages/cabinet-special.vue');
	}
	if (__DEFINED_NOLIMIT === 'YES' || __DEFINED_THEME === 'REDESIGN') {
		pages.cabinet_REDESIGN = require('@pages/cabinet-redesign.vue');
	}
	if (__DEFINED_NOLIMIT === 'YES' || __DEFINED_THEME === 'MOBILE') {
		pages.cabinet_MOBILE = require('@pages/cabinet-mobile.vue');
	}
}

export {
	pages
};