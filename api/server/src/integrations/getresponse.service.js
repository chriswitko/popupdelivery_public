'use strict';

var apiUrl = 'https://api.getresponse.com/v3';

exports.ping = function(integration, cb) {
	try {
    var GetResponse = new require('./getresponse.lib')(integration.fields.apiKey.value, 'https://api2.getresponse.com');
    GetResponse.ping(function(err){
			return cb(err.success ? null : err.success, err.success ? true : false);
    });
	} catch(err) {
		return cb(err, false);
	}
};

exports.synch = function(customer, integration, cb) {
	customer = customer || {};
	cb = cb || function() {};

	try {
    var GetResponse = new require('./getresponse.lib')(integration.fields.apiKey.value, apiUrl);
    GetResponse.addContact(integration.fields.campaignID.value, customer.fullname, customer.email, null, 0, null, function(err) {
			return cb(err.success ? null : err.success, err.success ? true : false);
    });
	} catch(err) {
		return cb(err, true);
	}
};