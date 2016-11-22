'use strict';

var request = require('request');

exports.ping = function(integration, cb) {
	try {
    request.post({
      url:'https://app.freshmail.com/pl/actions/subscribe/', 
      form: {
        subscribers_list_hash: integration.fields.listID.value, 
        freshmail_email: 'hello@popupdelivery.com'
      }
    }, function() {
      return cb(null, true);
    })
	} catch(err) {
		return cb(err, false);
	}
};

exports.synch = function(customer, integration, cb) {
	customer = customer || {};
	cb = cb || function() {};

	try {
    request.post({
      url:'https://app.freshmail.com/pl/actions/subscribe/', 
      form: {
        subscribers_list_hash: integration.fields.listID.value, 
        freshmail_email: customer.email
      }
    }, function() {
      return cb(null, true);
    })
	} catch(err) {
		return cb(err, true);
	}
};