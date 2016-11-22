'use strict';

var geoip = require('geoip-lite');
var Intercom = require('intercom-client');
var client = new Intercom.Client({ token: 'dG9rOjE1NTk4NGUxX2QwNDNfNDA1NV85NmI2X2FhMTZhYWY4OTE5ODoxOjA=' });
var config = require('config');

var async = require('async');

var Customer = require('./customer.model');
var User = require('../user/user.model');

var kue = require('kue');
var queue = kue.createQueue();

/**
 * GET /customers
 *
 * @description
 * list of customers
 *
 */

exports.addToIntercom = function(req, res) {
  var redirect_url = req.query.redir_url || config.CLIENT_URL;

  if(!req.query.email) {
    return res.redirect(redirect_url);
  }

  var custom_attributes = {};
      custom_attributes['activity_name'] = req.query.an;
      custom_attributes['activity_lang'] = req.query.al;

  client.users.create({ email: req.query.email, created_at: new Date().getTime(), custom_attributes: custom_attributes }, function() {
    res.redirect(redirect_url);
  });
};

exports.find = function(req, res, next) {
  var query = {enabled: true};
  if(req.query.user_id) {
    query.user = req.query.user_id;
  } else {
    query.user = req.authed.id;
  }
  Customer.find(query, function(err, customers) {
    if (err) {
      return next(err);
    }
    return res.status(200).json(customers);
  });
};

exports.exportCsv = function(req, res) {
  var query = {enabled: true};
  if(req.query.user_id) {
    query.user = req.query.user_id;
  } else {
    query.user = req.authed.id;
  }

  res.writeHead(200, {
    'Content-Type': 'text/csv',
    'Content-Disposition': 'attachment; filename=customers.csv'
  });    

  console.log('export query', query);
  
  Customer.findAndStreamCsv(query)
    .pipe(res);
};



/**
 * GET /customers/:id
 *
 * @description
 * Find customer by id
 *
 */
exports.get = function(req, res, next) {
  Customer.findById(req.params.id).lean().exec(function(err, customer) {
    if (err) {
      return next(err);
    }
    if (!customer) {
      return res.status(404).send('Not Found');
    }
    return res.status(200).json(customer);
  });
};

/**
 * POST /customers
 *
 * @description
 * Create a new customer
 *
 */
exports.post = function(req, res) {
  var customer = req.body;

  customer.ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  var geo = geoip.lookup(customer.ip_address);
  if(geo) {
    customer.city = geo.city;
    customer.country = geo.country;
    customer.loc = geo.ll;
  }

  var lang = req.headers['accept-language'] || '';
      lang = lang.split(';') || ''
  if(lang) {
    customer.lang = lang[0];
  }

  customer.recent_visit_at = new Date().valueOf();

  User.findById(customer.user_id, function(err, user) {
    Customer.update({email: customer.email, user: customer.user_id, enabled: true}, {$set: customer, $addToSet: {cookie_ids: customer.cookie_id, site_ids: customer.site_id, apps: {app: customer.app_id, created_at: new Date().valueOf()}}, $setOnInsert: {created_at: new Date().valueOf(), synched: false, enabled: true}}, {upsert: true}).exec(function() {
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
        if(req.body.redir_url) {
          return res.redirect(req.body.redir_url);
        }
        return res.status(201).json({success: true});
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
  