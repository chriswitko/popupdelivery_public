'use strict';

var User = require('../user/user.model');

var kue = require('kue');
var queue = kue.createQueue();

var requireF = function(modulePath) {
	try {
		return require(modulePath);
	}
	catch (e) {
		console.log('e', e);
		return false;
	}
}

exports.ping = function(req, res) {
	if(!requireF('./' + req.params.service + '.service')) {
		User.setIntegrationStatus(req.authed.id, req.params.service, false, function() {
			return res.status(200).json({status: false});
		});
	} else {
		var integration = require('./' + req.params.service + '.service');

		integration.ping(req.body, function(err, status) {
			if(err || !status) {
				User.setIntegrationStatus(req.authed.id, req.params.service, false, function() {
					return res.status(200).json({success: false});
				}); 
			} else {
				User.setIntegrationStatus(req.authed.id, req.params.service, true, function() {
					return res.status(200).json({success: status});
				});
			}
		});
	}
};

var _synch = function(user_id, customer, service, cb) {
	cb = cb || function() {};

	var integration = require('./' + service.code + '.service');

	integration.synch(customer, service, function() {
		return cb(null, true);
	});
};

queue.process('synchIntegration', function(job, done){
  _synch(job.data.user_id, job.data.customer, job.data.service, done);
});