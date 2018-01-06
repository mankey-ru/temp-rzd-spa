<template> 
		<input class="form-control" maxlength="10" v-bind:value="value" v-on:input="$emit('input', $event.target.value)" />
</template>

<script>
	export default {
		name: 'JqueryUIDatepicker',
		props: {
			value: {},
			months: {
				type: Number,
				default: 1
			},
			maxdate: {},
			mindate: {}
		},
		mounted: function() {
			var vm = this;
			if (!window.datePickerLoc || !$.datepicker) {
				console.error('Для работы компонента требуется функция window.datePickerLoc и либа jQueryUI');
				return
			}
			var opts = window.datePickerLoc({
				dateFormat: 'dd.mm.yy',
				hideIfNoPrevNext: true,
				numberOfMonths: [1, vm.$props.months],
				onClose: function(dateStr) {
					_setBodyClass(false);
					vm.$emit('input', dateStr);
				},
				beforeShow: function() {
					_setBodyClass(true);
				}
			});
			if (vm.$props.mindate) {
				opts.minDate = vm.$props.mindate;
			}
			if (vm.$props.maxdate) {
				opts.maxDate = vm.$props.maxdate;
			};
			$(this.$el).datepicker(opts);
		},
		watch: {
			value: function(newVal) {
				$(this.$el).datepicker('setDate', newVal);
			},
			mindate: function(newVal) {
				$(this.$el).datepicker('option', 'minDate', newVal);
				var min = newVal.split('.').reverse().join();
				var cur = this.$props.value.split('.').reverse().join();
				if (min > cur) {
					this.$emit('input', newVal);
				}
			}
		}
	}

	function _setBodyClass(boo) {
		$(document.body).toggleClass('jqui-datepicker-active', boo); // для мобилки
	}
</script> 