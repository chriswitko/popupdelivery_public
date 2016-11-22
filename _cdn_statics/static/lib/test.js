'use strict';

exports.http_method = 'get';
exports.http_route = '/api/test';

exports.index = function(req, res, next) {
	res.json({status: 'hello test'});
};