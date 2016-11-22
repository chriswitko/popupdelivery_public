'use strict';

exports.http_method = 'get';
exports.http_route = '/api/oauth';

exports.index = function(req, res, next) {
	res.json({status: 'hello oauth'});
};