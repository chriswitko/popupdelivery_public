'use strict';

var _ = require('lodash');
var numeral = require('numeral');

var Product = require('./product.model');
var App = require('../app/app.model');

/**
 * GET /products
 *
 * @description
 * list of products
 *
 */

exports.findSelectedInApp = function(req, res, next) {
  var limit = parseInt(req.query.limit) || 25;
  var page = req.query.page || 1;
  var skip = (page - 1) * limit;
  var query = {enabled: true};

  if(req.query.user_id) {
    query.user = req.query.user_id;
  } else {
    query.user = req.authed.id;
  }

  if(req.query.q) {
    var words = req.query.q.split(' ');
    var sentence = '';
    sentence += '(';
    words.forEach(function(word) {
      sentence += '(?=.*' + word + ')';
    });
    sentence += ')';
    sentence = sentence.replace('|)', ')');
    query.title = new RegExp(sentence, 'gi');
  }

  App.findById(req.query.app_id, function(err, app) {
    if(app) {
      query._id = {$in: app.products};
    }
    Product.find(query).limit(limit).skip(skip).exec(function(err, products) {
      if (err) {
        return next(err);
      }
      return res.status(200).json(products);
    });
  });
  
};


exports.find = function(req, res, next) {
  var limit = parseInt(req.query.limit) || 25;
  var page = req.query.page || 1;
  var skip = (page - 1) * limit;
  var query = {enabled: true};

  if(req.query.user_id) {
    query.user = req.query.user_id;
  } else {
    query.user = req.authed.id;
  }

  if(req.query.q) {
    var words = req.query.q.split(' ');
    var sentence = '';
    sentence += '(';
    words.forEach(function(word) {
      sentence += '(?=.*' + word + ')';
    });
    sentence += ')';
    sentence = sentence.replace('|)', ')');
    query.title = new RegExp(sentence, 'gi');
  }
  
  Product.find(query).limit(limit).skip(skip).exec(function(err, products) {
    if (err) {
      return next(err);
    }
    return res.status(200).json(products);
  });
};

exports.demo = function(req, res, next) {
  var limit = parseInt(req.query.limit) || 25;
  var page = req.query.page || 1;
  var skip = (page - 1) * limit;
  var query = {enabled: true};
  
  if(req.query.user_id) {
    query.user = req.query.user_id;
  } else {
    query.user = req.authed.id;
  }

  if(req.query.q) {
    var words = req.query.q.split(' ');
    var sentence = '';
    sentence += '(';
    words.forEach(function(word) {
      sentence += '(?=.*' + word + ')';
    });
    sentence += ')';
    sentence = sentence.replace('|)', ')');
    query.title = new RegExp(sentence, 'gi');
  }
  
  Product.find(query, {title: 1, image: 1, link: 1, price: 1}).limit(limit).skip(skip).exec(function(err, products) {
    if (err) {
      return next(err);
    }
    // async.forEachSeries(products, function(product, next) {
    //   product.price = numeral(product.price).format('0,0.00');
    //   console.log('product.price', product.price);
    //   next();
    // }, function() {
    //   // console.log('products', products);
    //   return res.status(200).json({items: products});
    // });
    products = _.map(products, function(product) {
      product = product.toObject();
      product.price = numeral(product.price).format('0,0.00');
      return product;
    });
    // console.log('products', products);
    return res.status(200).json({items: products});
  });
};

/**
 * GET /products/:id
 *
 * @description
 * Find product by id
 *
 */
exports.get = function(req, res, next) {
  Product.findById(req.params.id).lean().exec(function(err, product) {
    if (err) {
      return next(err);
    }
    if (!product) {
      return res.status(404).send('Not Found');
    }
    return res.status(200).json(product);
  });
};

/**
 * POST /products
 *
 * @description
 * Create a new product
 *
 */
exports.post = function(req, res, next) {
  Product.create(req.body, function(err, product) {
    if (err) {
      return next(err);
    }
    return res.status(201).json(product);
  });
};

/**
 * PUT /products/:id
 *
 * @description
 * Update a product
 *
 */
exports.put = function(req, res, next) {
  Product.findById(req.params.id, function(err, product) {
    if (err) {
      return next(err);
    }
    if (!product) {
      return res.status(404).send('Not Found');
    }

    product.manifest = req.body.manifest;
    product.design = req.body.design;

    product.save(function(err) {
      if (err) {
        return next(err);
      }
      return res.status(200).json({success: true, product: product});
    });
  });
};


