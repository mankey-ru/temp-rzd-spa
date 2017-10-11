<script>
	import mixins from './../vue-mixins.js'

	export default {
		name: 'AppRoot',
		data: function () {
			return {				
				links: [{
					name: 'ЛК слепых',
					href: 'http://pass2.psi.oooinex.ru:1488/tickets/public/ru/accessible?STRUCTURE_ID=704&layer_id=5901'
				}]
			}
		},
		mixins: [mixins]
	}
</script>


<template>
	<div>
		<div class="theme-devbar">
			<div class="row">
				<div class="col-md-24">					
					<div v-for="li in links" class="pull-right" >
						<a :href="li.href">{{li.name}}</a>
					</div>
					<div v-for="rt in $root.$router.options.routes">
						<a v-bind:class="rt.name === $route.name ? 'current' : ''"
						v-if="rt.meta && !rt.meta.hidden" 
						v-bind:href="'#'+rt.path" 
						v-html="rt.meta.title"></a>
					</div>
				</div>			
			</div>
		</div>
		<router-view></router-view>
	</div>
</template>

<style scoped lang="less"> /* Изолированные (scoped) стили обвязки */
.theme-devbar {
	border-radius: 5px;
	padding: 15px;
	margin: 15px 0;
	border: 1px solid #000;
	a {
		margin-right: .7em;
	}
	a.current {
		color: red;
	}
}
</style>