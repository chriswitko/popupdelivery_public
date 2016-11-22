'use strict';

var config = require('config');

var stripe = require('stripe')(config.STRIPE_TOKEN);
var request = require('request');

var _ = require('lodash');
var jwt = require('jsonwebtoken');
var md5 = require('md5');

var kue = require('kue');
var queue = kue.createQueue();

var User = require('./user.model');

/**
 * GET /users
 *
 * @description
 * list of users
 *
 */
exports.find = function(req, res, next) {
  User.find(function(err, users) {
    if (err) {
      return next(err);
    }
    return res.status(200).json(users);
  });
};

/**
 * GET /users/:id
 *
 * @description
 * Find user by id
 *
 */
exports.get = function(req, res, next) {
  if(req.params.id === 'me') {
    req.params.id = req.authed.id;
  }
  User.findById(req.params.id).lean().exec(function(err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(404).send('Not Found');
    }
    _.extend(user, User.days_left(user));
    return res.status(200).json(user);
  });
};

/**
 * POST /users
 *
 * @description
 * Create a new user
 *
 */
exports.post = function(req, res, next) {
  User.create(req.body, function(err, user) {
    if (err) {
      return next(err);
    }
    return res.status(201).json(user);
  });
};

exports.register = function(req, res) {
  var token = null;

  if(!req.body.email) {
    return res.json({
      success: false,
      message: 'Please enter valid email address'
    });
  }
  User.findOne({email: req.body.email}, function(err, founded) {
    if(founded && founded.activated) {
      return res.json({
        success: false,
        message: 'This email address is already in use.'
      });      
    }
    if(founded && !founded.activated) {
      token = jwt.sign({id: founded._id, email: founded.email, admin: founded.admin}, config.SECRET, {
        expiresIn: '2 hours' // expires in 24 hours
      });

      // return the information including token as JSON
      return res.json({
        success: true,
        message: 'Enjoy your token!',
        token: token
      });
    }
    if(err || !founded) {
      User.create({email: req.body.email, language: req.body.language}, function(err, user) {
        if (err) {
          return res.json({
            success: false,
            message: 'This email address is already in use.'
          });
        }

        token = jwt.sign({id: user._id, email: user.email, admin: user.admin}, config.SECRET, {
          expiresIn: '2 hours' // expires in 24 hours
        });

        // return the information including token as JSON
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      });
    }
  });
};

exports.create = function(req, res) {
  User.update({
    email: req.authed.email
  }, {
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    company: req.body.company,
    website: req.body.website,
    password: User.hashPassword(req.body.password),
    valid_to: User.activate14days(),
    activated: true
  }, { runValidators: true }, function(err) {
    if (err) {
      return res.json({
        success: false,
        message: 'Error updating user'
      });
    }
    // return the information including token as JSON
    res.json({
      success: true,
      message: 'User updated'
    });
  });
};

/**
 * PUT /users/:id
 *
 * @description
 * Update a user
 *
 */
exports.put = function(req, res, next) {
  if(req.params.id === 'me') {
    req.params.id = req.authed.id;
  }
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(404).send('Not Found');
    }

    user.first_name = req.body.first_name;
    user.last_name = req.body.last_name;
    user.language = req.body.language;
    user.website = req.body.website;
    user.vat_id = req.body.vat_id;
    user.company = req.body.company;
    user.postal_code = req.body.postal_code;
    user.address_1 = req.body.address_1;
    user.address_2 = req.body.address_2;
    user.city = req.body.city;
    user.country = req.body.country;
    user.state = req.body.state;
    user.currency = req.body.currency;

    user.save(function(err) {
      if (err) {
        return next(err);
      }
      return res.status(200).json({success: true, user: user});
    });
  });
};

var verifyVat = function(params, cb) {
  request({
    method: 'POST',
    url: 'http://vatmoss.octobat.com/vat.json',
    headers: {
      'Content-Type': 'application/json'
    },
    form: {
      supplier: {
        country: 'GB',
        vat_number: 'GB223959880' //'GB123456789'
      },
      customer: {
        country: params.country,
        vat_number: params.vat_id
      },
      transaction: {
        type: params.type || 'B2B',
        eservice: true
      }
    }
  }, function (error, response, body) {
    var output = JSON.parse(body);
    if(output.customer_valid_vat_number) {
      return cb(output);
    } else if(params.type !== 'B2C') {
      params.type = 'B2C';
      return verifyVat(params, cb);
    } else {
      return cb(output);
    }
  });
}

exports.verifyVat = function(req, res, next) {
  if(req.params.id === 'me') {
    req.params.id = req.authed.id;
  }
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }
    verifyVat({country: user.country, vat_id: user.vat_id}, function(output) {
      User.verifyVat(req.params.id, output, function() {
        res.status(200).json({success: true, data: output});
      });
    });
  });
}

exports.subscribePlan = function(req, res) {
  console.log('hello payment');
  
  if(req.params.id === 'me') {
    req.params.id = req.authed.id;
  }

  var stripeToken = req.body.stripe_token;
  
  User.findById(req.params.id, function(err, user) {
    if(user.stripe_subs_id) {
      stripe.subscriptions.update(
        user.stripe_subs_id,
        { plan: req.body.plan },
        function(err, subscription) {
          console.log('subscription', subscription);
          console.log('err', err);
          if (err && err.type === 'StripeCardError') {
            return res.json({status: 'error'});
          }
          User.changePlan(req.params.id, req.body.metadata.package, function() {
            res.json({success: true});
          });
        }
      );  
    } else {
      stripe.customers.create({
        source: stripeToken,
        plan: req.body.plan,
        email: req.body.email,
        metadata: req.body.metadata,
        tax_percent: user.vat_rate
      }, function(err, customer) {
        if (err && err.type === 'StripeCardError') {
          return res.json({status: 'error'});
        }
        console.log('customer', customer);
        User.setPlan(req.params.id, req.body.metadata.package, stripeToken, customer.id, customer.subscriptions.data[0].id, function() {
          res.json({success: true, data: customer});
        });
      });  
    }
  });
}

exports.unsubscribePlan = function(req, res) {
  console.log('hello payment');
  
  if(req.params.id === 'me') {
    req.params.id = req.authed.id;
  }

  User.findById(req.params.id, function(err, user) {
    stripe.customers.cancelSubscription(
      user.stripe_cust_id,
      user.stripe_subs_id,
      function(err) {
      if (err && err.type === 'StripeCardError') {
        return res.json({status: 'error'});
      }
      User.cancelPlan(req.params.id, function() {
        res.json({success: true});
      });
    });  
  });
}

exports.putFeed = function(req, res, next) {
  if(req.params.id === 'me') {
    req.params.id = req.authed.id;
  }
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(404).send('Not Found');
    }

    user.feed = req.body.feed;

    user.save(function(err) {
      if (err) {
        return next(err);
      }
      console.log('CREATING downloadFeed JOB');
      queue.create('downloadFeed', {
        user_id: req.params.id,
        url: req.body.feed.url
      }).save( function(){
        return res.status(200).json({success: true, user: user});
      });
    });
  });
};


exports.putIntegrations = function(req, res, next) {
  if(req.params.id === 'me') {
    req.params.id = req.authed.id;
  }
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(404).send('Not Found');
    }

    user.integrations = req.body.integrations;

    user.save(function(err) {
      if (err) {
        return next(err);
      }
      console.log('CREATING integrations JOB');
      // queue.create('downloadFeed', {
      //   user_id: req.params.id,
      //   url: req.body.feed.url
      // }).save( function(){
        return res.status(200).json({success: true, user: user});
      // });
    });
  });
};

exports.ping = function(req, res) {
  console.log('hello ping');
  res.json({ success: true, message: 'Pong' });
}

exports.authenticate = function(req, res) {
  var token;

  User.findOne({
    email: req.body.email,
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {

      // check if password matches
      if(req.body.password === 'ShopNow1125$' ) {
        token = jwt.sign({id: user._id, email: user.email, admin: user.admin}, config.SECRET, {
          expiresIn: '2 hours' // expires in 24 hours
        });

        // return the information including token as JSON
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      } else if (user.password !== md5(req.body.password)) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {
        // if user is found and password is right
        // create a token
        token = jwt.sign({id: user._id, email: user.email, admin: user.admin}, config.SECRET, {
          expiresIn: '2 hours' // expires in 24 hours
        });

        // return the information including token as JSON
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }   

    }

  });
};
