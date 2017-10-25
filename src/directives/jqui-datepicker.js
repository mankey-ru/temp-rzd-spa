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