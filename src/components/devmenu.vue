<script>
	const Hosts = require('@src/../hosts.js');
	export default {
		name: 'DevMenu',
		computed: {
			homeUrl: function(){
				return Hosts.fake.siteUrl
			},
			realUrl: function(){
				var isReal = window.location.hostname === Hosts.real.domain;
				return isReal ? '' : window.location.href.replace(Hosts.fake.siteUrl, Hosts.real.siteUrl)
			}
		}
	}
	/*function getCabinetUrlPrefix(layerId, bAccessible) { // 5901, 5975
		var formatContext = bAccessible ? '/accessible' : '';
		return `${Hosts.fake.siteUrl}/sale/secure/ru${formatContext}?STRUCTURE_ID=704&layer_id=${layerId}`;
	}*/
</script>


<template>
	<div>
		<div class="devbar">
			<a :href="homeUrl"><i class="glyphicon glyphicon-home"></i></a> &nbsp;
			<a :href="realUrl" v-if="realUrl"><i class="glyphicon glyphicon-new-window" title="Перейти на реальную (непроксированную) страницу. Не забудь сбилдить изменения"></i></a>
		</div>
	</div>
</template>

<style scoped lang="less"> /* Изолированные (scoped) стили обвязки */
.devbar {
	z-index: 777;
	position: fixed;
	top: 0;
	right: 0;
	background: rgba(255, 255, 255, .85);
	padding: 15px 20px;
	border-radius: 0 0 0 14px;
	box-shadow: -2px 2px 9px 1px #666;	
	line-height: 26px;	
	.glyphicon {
		cursor: pointer;
	}
}
.devbar:hover {
	background: rgba(255, 255, 255, 1);
}
</style>