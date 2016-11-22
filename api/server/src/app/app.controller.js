'use strict';

var fs = require('fs');
// var async = require('async');

var _ = require('lodash');

var App = require('./app.model');
var VisitorApp = require('../visitor/visitorapp.model');

/**
 * GET /apps
 *
 * @description
 * list of apps
 *
 */

exports.find = function(req, res, next) {
  // var insights = {};
  var query = {enabled: true};

  if(req.query.app_type) {
    query.app_type = req.query.app_type;
  }
  if(req.query.user_id) {
    query.user = req.query.user_id;
  } else {
    query.user = req.authed.id;
  }

  App.find(query).sort({created_at: -1}).exec(function(err, apps) {
    if (err) {
      return next(err);
    }

    var app_ids = _.map(apps || [], function(app) {return app._id});

    var id = { app: "$app" };
    var match = {app: {$in: app_ids}};

    VisitorApp.aggregate({
      $match: match
    }, {
      $group: {
        _id: id,
        "total": {
          $sum: "$counter" 
        },
        "count":{$sum:1}
      } 
    }, {
      $sort: {
        '_id.year': 1,
        '_id.month': 1,
        '_id.day': 1
      }
    })
    .sort({created_at: 1})
    .exec(function(err, found_traffic) {
      if(found_traffic) {
        found_traffic.forEach(function(insight) {
          apps.forEach(function(app, index) {
            if(insight._id.app.toString() === app._id.toString()) {
              apps[index] = apps[index].toObject();
              apps[index].views = insight.total; 
            }
          });
        });
      }

      return res.status(200).json(_.groupBy(apps, function(app) {return app.app_type}));
    });    
  });
};

/**
 * GET /apps/:id
 *
 * @description
 * Find app by id
 *
 */
exports.get = function(req, res, next) {
  App.findById(req.params.id).lean().exec(function(err, app) {
    if (err) {
      return res.status(404).send('Not Found');
    }
    if (!app) {
      return res.status(404).send('Not Found');
    }
    return res.status(200).json(app);
  });
};

/**
 * POST /apps
 *
 * @description
 * Create a new app
 *
 */
exports.post = function(req, res, next) {
  console.log('creating app');
  var app_type = req.body.app_type;
  var user = req.body.user || req.authed.id;

  req.body.user = user;

  App.findOne({user: user, app_type: app_type, enabled: true}, function(err, app) {
    if(!err && (!app || app_type === 'coupon')) {
      var i18n;
      if(process.env.NODE_ENV === 'production') {
        i18n = JSON.parse(fs.readFileSync('./i18n/app-locale_' + (req.body.design.language || 'en') + '.json', 'utf8'));
      } else {
        i18n = JSON.parse(fs.readFileSync(__dirname + '/../../i18n/app-locale_' + (req.body.design.language || 'en') + '.json', 'utf8'));
      }
      
      if(app_type === 'signup') {
        req.body.design.format = 'form';
        req.body.design.title = _.get(i18n, 'main.app.design.title', '');
        req.body.design.summary = _.get(i18n, 'main.app.design.summary', '');
        req.body.design.footer = _.get(i18n, 'main.app.design.footer', '');
        req.body.design.button_submit = _.get(i18n, 'main.app.design.button_submit', '');
        req.body.design.button_cancel = _.get(i18n, 'main.app.design.button_cancel', '');
        req.body.design.width = '600';
        req.body.manifest = {};
        req.body.manifest.who = 'all';
        req.body.manifest.where = 'all';
        req.body.manifest.when = 'immediately';
      } else if(app_type === 'coupon') {
        req.body.design.format = 'form';
        req.body.design.summary = _.get(i18n, 'main.app.design.summary', ''); // custom text with markdown for coupon
        req.body.design.footer = _.get(i18n, 'main.app.design.footer', '');
        req.body.design.button_submit = _.get(i18n, 'main.app.design.button_submit', '');
        req.body.design.button_cancel = _.get(i18n, 'main.app.design.button_cancel', '');
        req.body.design.width = '600';
        req.body.design.fields = {email: true};
        req.body.manifest = {};
        req.body.manifest.who = 'all';
        req.body.manifest.where = 'all';
        req.body.manifest.where_segment = 'all';
        req.body.manifest.when = 'immediately';
      } else if(app_type === 'reminder') {
        req.body.design.size = 'regular';
        req.body.design.format = 'form';
        req.body.design.position = 'right';
      }

      App.create(req.body, function(err, app) {
        console.log('err', err);
        if (err) {
          return next(err);
        }
        return res.status(201).json(app);
      });
    } else {
      if(app_type === 'signup' || app_type === 'coupon' || app_type === 'reminder') {
        return res.status(201).json(app);
      }
    }
  });
};

/**
 * PUT /apps/:id
 *
 * @description
 * Update a app
 *
 */
exports.put = function(req, res, next) {
  App.findById(req.params.id, function(err, app) {
    if (err) {
      return next(err);
    }
    if (!app) {
      return res.status(404).send('Not Found');
    }

    app.manifest = req.body.manifest;
    app.design = req.body.design;
    app.products = req.body.products;

    app.save(function(err) {
      if (err) {
        return next(err);
      }
      return res.status(200).json({success: true, app: app});
    });
  });
};

exports.deactivate = function(req, res, next) {
  console.log('deactivate', req.params.id);
  App.deactivate(req.params.id, function(err) {
    if (err) {
      return next(err);
    }
    return res.status(200).json({success: true});
  });
};
  