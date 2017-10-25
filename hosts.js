module.exports = {
	// Хосты также указаны в секции scripts в package.json, тут уж никак от дублирования не избавишься
	fake: {
		domain: 'pass2.psi.oooinex.ru',
		port: ':8090', // :1488,
		protocol: 'http://',
		get siteUrl() {
			return this.protocol + this.domain + (this.port || '');
		}
	},
	real: {
		domain: 'pass.psi.oooinex.ru',
		protocol: 'https://',
		get siteUrl() {
			return this.protocol + this.domain;
		}
	},
	psiIp: '172.22.2.92'
}