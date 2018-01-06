export default {
	bind: function(el, binding, vnode) {
		var opts = window.datePickerLoc({
			dateFormat: 'dd.mm.yy',
			onClose: function(dateStr) {
				_setBodyClass(false);
				_parsePathAndSet(vnode.context, binding.expression, dateStr);
			},
			beforeShow: function() {
				_setBodyClass(true);
			}
		})
		var $inp = $(el);

		// Опция "количество месяцев", на стартовой пасса кажем сразу три
		if ($inp.attr('months') | 0) {
			opts.numberOfMonths = [1, $inp.attr('months') | 0];
		}

		// Опции "минимальная и максимальная даты", на стартовой пасса кажем сразу три
		var minDate = $inp.attr('mindate'); // attr, потому что нужен стринг, а data превращает "0" в ноль
		var maxDate = $inp.attr('maxdate');
		if (minDate) {
			opts.minDate = minDate;
		}
		if (maxDate) {
			opts.maxDate = maxDate;
		}
		opts.hideIfNoPrevNext = true;
		$inp.datepicker(opts);
		/**
			Пример использования
			var obj = {prop1:{anotherProp:1}};
			parsePathAndSet(obj, 'prop1.anotherProp', 2)
			console.log(obj) // {prop1:{anotherProp:2}}
		*/
		function _parsePathAndSet(obj, key, value) {
			var keyArr = key.split('.');
			var lastKey = keyArr.pop();
			for (var i = 0, len = keyArr.length; i < len; i++) {
				obj = obj[keyArr[i]];
			}
			obj[lastKey] = value;
		}

		function _setBodyClass(boo) {
			$(document.body).toggleClass('jqui-datepicker-active', boo); // для мобилки
		}
	},
	update: function(el, binding, vnode) {
		$(el).datepicker('setDate', binding.value);
	}
}