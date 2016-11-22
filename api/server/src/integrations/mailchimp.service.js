'use strict';

var Mailchimp = require('mailchimp-api-v3')

exports.ping = function(integration, cb) {
	try {
		var mailchimp = new Mailchimp(integration.fields.apiKey.value);
		mailchimp.get('/lists/' + integration.fields.listID.value)
		.then(function() {
			return cb(null, true);
		})
		.catch(function (err) {
			return cb(err, false);
		});
	} catch(err) {
		return cb(err, false);
	}
};

exports.synch = function(customer, integration, cb) {
	customer = customer || {};
	cb = cb || function() {};

	try {
		var mailchimp = new Mailchimp(integration.fields.apiKey.value);
		mailchimp.post('/lists/' + integration.fields.listID.value + '/members', {
			email_address : customer.email,
			status: 'subscribed'
		})
		.then(function() {
			return cb(null, true);
		})
		.catch(function (err) {
			return cb(err, true);
		});
	} catch(err) {
		return cb(err, true);
	}
};