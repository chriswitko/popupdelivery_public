'use strict';

var createsend = require('createsend-node');

exports.ping = function(integration, cb) {
	try {
    var mailing = new createsend({ apiKey: integration.fields.apiKey.value });
    mailing.subscribers.addSubscriber(integration.fields.listID.value, {EmailAddress: 'help@popupdelivery.com'}, function(err) {
      cb(err, err ? false : true);
    });
	} catch(err) {
		return cb(err, false);
	}
};

exports.synch = function(customer, integration, cb) {
	customer = customer || {};
	cb = cb || function() {};

	try {
    var mailing = new createsend({ apiKey: integration.fields.apiKey.value });
    mailing.subscribers.addSubscriber(integration.fields.listID.value, {EmailAddress: customer.email, Name: customer.fullname}, function(err) {
      cb(err, err ? false : true);
    });
	} catch(err) {
		return cb(err, true);
	}
};