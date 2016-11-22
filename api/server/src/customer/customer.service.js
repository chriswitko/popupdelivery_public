'use strict';

var geoip = require('geoip-lite');

var async = require('async');

var Customer = require('./customer.model');
var User = require('../user/user.model');

var kue = require('kue');
var queue = kue.createQueue();

exports.post = function (data, cb) {
  var customer = data.body;
	console.log('HELLO', data);
	cb = cb || function() {};
	
	if(!customer.email) {
		return cb();
	}

  customer.ip_address = (data.headers ? data.headers['x-forwarded-for'] : null) || (data.connection ? data.connection.remoteAddress : null);
	if(customer.ip_address) {
		var geo = geoip.lookup(customer.ip_address);
		if(geo) {
			customer.city = geo.city;
			customer.country = geo.country;
			customer.loc = geo.ll;
		}
	}

  var lang = data.headers ? (data.headers['accept-language'] || '') : '';
  lang = lang.split(';') || ''
  
	if(lang) {
    customer.lang = lang[0] || 'en';
	} else {
		customer.lang = 'en';
	}

	console.log('customer data', customer);

  customer.recent_visit_at = new Date().valueOf();

	var addToSet = {
		cookie_ids: customer.cookie_id, 
	};

	if(customer.site_id) {
		addToSet.site_ids = customer.site_id; 
	}

	if(customer.app_id) {
		addToSet.apps = {
			app: customer.app_id, 
			created_at: new Date().valueOf()
		}
	}

  User.findById(customer.user_id, function (err, user) {
    Customer.update({email: customer.email, user: customer.user_id, enabled: true}, {$set: customer, $addToSet: addToSet, $setOnInsert: {created_at: new Date().valueOf(), synched: false, enabled: true}}, {upsert: true}).exec(function() {
      user.integrations = user.integrations || {};

      async.forEach(Object.keys(user.integrations), function (integration, next){ 
        if(user.integrations[integration].enabled && user.integrations[integration].active) {
          queue.create('synchIntegration', {
            user_id: customer.user_id,
            customer: customer,
            service: user.integrations[integration]
          }).save(next);
        } else {
          next();
        }
      }, function() { 
        return cb();
      });  
    });
  });
};

/**
 * PUT /customers/:id
 *
 * @description
 * Update a customer
 *
 */
exports.put = function(req, res, next) {
  Customer.findById(req.params.id, function(err, customer) {
    if (err) {
      return next(err);
    }
    if (!customer) {
      return res.status(404).send('Not Found');
    }

    customer.manifest = req.body.manifest;
    customer.design = req.body.design;
    customer.products = req.body.products;

    customer.save(function(err) {
      if (err) {
        return next(err);
      }
      return res.status(200).json({success: true, customer: customer});
    });
  });
};

exports.deactivate = function(req, res, next) {
  Customer.update({_id: {$in: req.body.customer_ids}}, {$set: {enabled: false}}, {multi: true}, function(err) {
    if (err) {
      return next(err);
    }
    return res.status(200).json({success: true});
  });
};
  