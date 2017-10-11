var express = require('express');
var app = express();

app.get('/build-browser.js', function (req, res, next) {
	req.url = req.url + '-compressed.gz'; // -compressed is for different filename, otherwise cordova throws an exception
	res.set('Content-Encoding', 'gzip');
	next();
});