'use strict';

var config = require('config');

var express = require('express');
var router = express.Router();
var proxy = require('express-http-proxy');
var jwt    = require('jsonwebtoken');

var thing = require('./thing/thing.controller');
var user = require('./user/user.controller');
var app = require('./app/app.controller');
var product = require('./product/product.controller');
var customer = require('./customer/customer.controller');
var preview = require('./preview/preview.controller');
var integrations = require('./integrations/integrations.controller');

var serviceTestProxy = proxy('localhost:3006/test', {
  forwardPath: function (req, res) {
    console.log('hello proxy');
    return require('url').parse(req.url).path;
  }
});

router.use("/api/test/*", serviceTestProxy);

router.use(function(req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  var white_list = ['POST:/api/authenticate', 'POST:/api/users/register', 'GET:/api/preview', 'GET:/api/can-i-show', 'GET:/api/delivery', 'GET:/api/live', 'GET:/api/source', 'POST:/api/customers', 'GET:/api/products/demo', 'GET:/api/reset_feed', 'POST:/api/insights', 'GET:/api/insights/get_user_traffic', 'GET:/api/insights/get_app_traffic', 'GET:/api/insights/get_product_traffic', 'GET:/api/lead/add', 'GET:/api/demo', 'GET:/api/ping'];

  if(!token && white_list.indexOf(req.method + ':' + req.path) > -1) {
    return next();
  }

  if (token) {
    jwt.verify(token, config.SECRET, function(err, authed) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        req.authed = authed;    
        next();
      }
    });
  } else {
    return res.status(403).send({ 
      success: false, 
      message: 'No token provided.' 
    });
  }
});

router.get('/api/ping', user.ping);

router.get('/api/demo', preview.demo);

router.post('/api/integrations/:service/ping', integrations.ping);

router.get('/api/lead/add', customer.addToIntercom);

// things ressources
router.get('/api/things', thing.find);
router.get('/api/things/:id', thing.get);
router.post('/api/things', thing.post);
router.put('/api/things/:id', thing.put);

// users ressources
router.get('/api/users', user.find);
router.get('/api/users/:id', user.get);
router.post('/api/users', user.post);
router.post('/api/users/register', user.register);
router.post('/api/users/create', user.create);
router.put('/api/users/:id', user.put);
router.put('/api/users/:id/feed', user.putFeed);
router.put('/api/users/:id/integrations', user.putIntegrations);
router.put('/api/users/:id/subscribe', user.subscribePlan);
router.put('/api/users/:id/unsubscribe', user.unsubscribePlan);
router.put('/api/users/:id/verify_vat', user.verifyVat);

// customers ressources
router.get('/api/customers', customer.find);
router.get('/api/customers/export', customer.exportCsv);
router.get('/api/customers/:id', customer.get);
router.post('/api/customers', customer.post);
router.put('/api/customers/:id', customer.put);
router.post('/api/customers/remove', customer.deactivate);


// apps ressources
router.get('/api/apps', app.find);
router.get('/api/apps/:id', app.get);
router.post('/api/apps', app.post);
router.put('/api/apps/:id', app.put);
router.put('/api/apps/:id/deactivate', app.deactivate);

// products ressources
router.get('/api/products', product.find);
router.get('/api/products/selected_in_app', product.findSelectedInApp);
router.get('/api/products/demo', product.demo);
router.get('/api/products/:id', product.get);
router.post('/api/products', product.post);
router.put('/api/products/:id', product.put);

router.post('/api/authenticate', user.authenticate);

// router.get('/api/proxy', proxy.show);

router.get('/api/deploy', preview.deploy);
router.get('/api/preview', preview.show);
router.get('/api/delivery', preview.delivery);
router.get('/api/can-i-show', preview.canishow);
router.get('/api/reset_feed', preview.resetFeed);
router.get('/api/insights/get_user_traffic', preview.insightsGetUserTraffic);
router.get('/api/insights/get_app_traffic', preview.insightsGetAppTraffic);
router.get('/api/insights/get_product_traffic', preview.insightsGetProductTraffic);

router.post('/api/insights', preview.saveInsights);
router.post('/api/signing', preview.signing);
router.post('/api/signing_feed', preview.signing_feed);

router.get('/api/live', preview.showLive);
router.get('/api/source', preview.source);

module.exports = router;
