'use strict';
var handlebars = require('handlebars');
var markdown = require('helper-markdown');
var hljs = require('highlight.js');
var numeral = require('numeral');

var fs = require('fs');
var _ = require('lodash');
var async = require('async');

var url = require('url');

var BUCKET_NAME = '';

var aws_config = {
  region: 'us-east-1',
  secretAccessKey: '',
  accessKeyId: ''
};

var aws = require('aws-sdk');
aws.config.update(aws_config);

var s3 = new aws.S3();

var ObjectID = require('mongodb').ObjectID;

var crypto = require('crypto');
var moment = require('moment');

var kue = require('kue');
var queue = kue.createQueue();

var request = require('request');
var progress = require('request-progress');

var sutil = require('line-stream-util');
var XmlStream = require('xml-stream');
var csv = require('csv-streamify')

var s3Url = 'https://s3.amazonaws.com/' + BUCKET_NAME;

var App = require('../app/app.model');
var User = require('../user/user.model');
var Product = require('../product/product.model');
var VisitorTraffic = require('../visitor/visitortraffic.model');
var VisitorProduct = require('../visitor/visitorproduct.model');
var VisitorApp = require('../visitor/visitorapp.model');
var VisitorTtl = require('../visitor/visitorttl.model');
var Customer = require('../customer/customer.model');

/**
 * GET /things
 *
 * @description
 * list of things
 *
 */

function addhttp(url) {
  if (!url.match(/^[a-zA-Z]+:\/\//)) {
    return url = 'http://' + url;
  }
  return url;
}

var downloadFeed = function(params, cb) {
  var output;
  if(process.env.NODE_ENV === 'production') {
    output = '/temp/' + uuid() + '.tmp';
  } else {
    output = uuid() + '.tmp';
  }

  User.setFeedStatus(params.user_id, 'STATUS_GETTING_FILE');

  params.url = addhttp(params.url);

  progress(request(params.url), {
      throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms 
      delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms 
      lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length 
  })
  .on('progress', function (state) {
    User.setFeedStatus(params.user_id, 'STATUS_DOWNLOADING_FILE');
    console.log('DOWNLOADING', state);
  })
  .on('error', function (err) {
    // remove file
    // feed_status = 100 ERR
    User.setFeedStatus(params.user_id, 'STATUS_ERR_DOWNLOADING_FILE');
    console.log('DOWNLOAD ERR', err);
    cb(err); 
  })
  .on('end', function() {
    // remove file
    // feed_status = 100 ERR
    User.setFeedStatus(params.user_id, 'STATUS_FILE_DOWNLOAD');
    console.log('DOWNLOAD DONE');
    queue.create('processFeed', {
      user_id: params.user_id,
      output: output
    }).save( function(err){
      cb(err); 
    });    
  })
  .pipe(fs.createWriteStream(output));
}

var processFeed = function(params, cb) {
  User.setFeedStatus(params.user_id, 'STATUS_FEED_FORMAT');
  console.log('TASK PROCESSING FILE');
  console.log('TASK DETECTING FORMAT');
  params.import_id = uuid();

  var lines = '';
  var format = 'unknown';
  var stream;
  var xml;
  // detect format

  fs.createReadStream(params.output)
    .pipe(sutil.head(3)) // get head lines
    .pipe(sutil.split())
    .setEncoding('utf8')
    .on('data', function(line) {
      lines += line;
    })
    .on('finish', function() {
      // check validity (csv colums)
      // console.log('lines', lines);
      lines = lines.toLowerCase();

      var google_atom_03 = lines.indexOf('<?xml') !== -1 && lines.indexOf('atom') !== -1 && lines.indexOf('0.3') !== -1;
      var google_atom_1 = lines.indexOf('<?xml') !== -1 && lines.indexOf('atom') !== -1 && lines.indexOf('http://base.google.com/ns/1.0') !== -1;
      var google_rss_1 = lines.indexOf('<?xml') !== -1 && lines.indexOf('rss') !== -1 && lines.indexOf('http://purl.org/rss/1.0/') !== -1;
      var google_rss_2 = lines.indexOf('<?xml') !== -1 && lines.indexOf('rss') !== -1 && lines.indexOf('2.0') !== -1;
      var nokaut = lines.indexOf('<?xml') !== -1 && lines.indexOf('nokaut') !== -1;
      var ceneo = lines.indexOf('<?xml') !== -1 && lines.indexOf('offers') !== -1;
      var okazje = lines.indexOf('<?xml') !== -1 && lines.indexOf('okazje') !== -1;
      var csv = lines.indexOf('title') !== -1 && lines.indexOf('image_link') !== -1;

      if(google_atom_03) {
        format = 'google_atom_03';
      } else if(google_atom_1) {
        format = 'google_atom_1';
      } else if(google_rss_1) {
        format = 'google_rss_1';
      } else if(google_rss_2) {
        format = 'google_rss_2'
      } else if(nokaut) {
        format = 'nokaut'
      } else if(okazje) {
        format = 'okazje'
      } else if(ceneo) {
        format = 'ceneo';
      } else if(csv) {
        format = 'csv';
      }

      console.log('format', format);

      if(format !== 'csv') {
        stream = fs.createReadStream(params.output);
        xml = new XmlStream(stream);
      } else {
        xml = params.output;
      }

      if(!processors[format]) {
        // update user feed error
        return cb('Missing XML processor', format);
      }

      processors[format].apply(this, [xml, params, function(err, summary) {
        User.setFeedStatus(params.user_id, 'STATUS_FEED_PROCESSING');
        console.log('process err', err);
        console.log('summary', summary);
        if(err || summary.error) {
          console.log('ERROR DETECTED');
          User.setFeedStatus(params.user_id, 'STATUS_ERR');
          removeFile(params, function() {
            console.log('FILE REMOVED');
            return cb('Feed file incorrect');
          });
        } else {
          removeFile(params, function() {
            User.setFeedStatus(params.user_id, 'STATUS_FEED_PROCESSING_OK');
            console.log('FILE REMOVED');
            User.setFeedStatus(params.user_id, 'STATUS_FEED_ADDING_PRODUCTS');
            insertProducts(summary.products, function() {
              finalizeFeed(params, summary, function(err) {
                cb(err);
              });
            });
          });
        }
      }]);

    })
}

var finalizeFeed = function(params, summary, cb) {
  // update user.total_products
  // send email in future
  async.series([
    function(done) {
      User.setFeedStatus(params.user_id, 'STATUS_FEED_FINISHED', done);
    },
    function(done) {
      User.setFeedStatus(params.user_id, 'STATUS_FEED_FINISHED', done);
    },
    function(done) {
      console.log('TOTAL PRODUCTS', summary.products.length);
      User.setTotalProducts(params.user_id, summary.products.length, done);
    },
    function(done) {
      Product.count({user: params.user_id, available: false}, function(err, count) {
        User.setTotalProductsUnavailable(params.user_id, count, done);
      });
    },
    function(done) {
      Product.enableAllImported(params.import_id, params.user_id, done);
    }
  ], function() {
    console.log('DONE DONE');
    cb(null);
  })
}

var insertProducts = function(products, cb) {
  cb = cb || function() {};
  async.forEachSeries(products, function(product, next) {
    var url_parts = url.parse(product.link, true);
    var link_params = url_parts.query || {};

    Product.update({link: product.link}, {$set: {
        import_id: product.import_id,
        user: product.user,
        title: product.title,
        link: product.link,
        link_params: link_params,
        image: product.image,
        price: product.price.replace(',', '.'),
        available: product.available
      },
      $setOnInsert: {
        enabled: true,
        visible: true
      }
    }, {upsert: true}).exec(function(err) {
      console.log('err insert', err);
      next();
    });
  }, function() {
    console.log('INSERTED ALL');
    cb(null);
  })
}

var removeFile = function(params, cb) {
  fs.unlink(__dirname + '/../../../' + params.output, function(err) {
    cb(err);
  });
}

var processGoogleAtom03Feed = function(xml, params, cb) {
  var products = [];
  var error = false;
  xml.collect('entry');
  xml.on('endElement: entry', function(item) {
    console.log(item);
    products.push({
      user: params.user_id,
      title: _.get(item, 'title', ''),
      link: _.get(item, 'link.$.href', ''),
      image: _.get(item, 'g:image_link', ''),
      price: _.get(item, 'g:price', ''),
      available: _.get(item, 'g:availability', false) === 'in stock' ? true : false
    });
  });
  xml.on('error', function() {
    error = true;
  });
  xml.on('end', function(err) {
    cb(err, {products: products, error: error});
  });
}

var processGoogleRss1Feed = function(xml, params, cb) {
  var products = [];
  var error = false;
  xml.collect('item');
  xml.on('endElement: item', function(item) {
    console.log(item);
    products.push({
      import_id: params.import_id,
      user: params.user_id,
      title: _.get(item, 'title', ''),
      link: _.get(item, 'link', ''),
      image: _.get(item, 'g:image_link', ''),
      price: _.get(item, 'g:price', ''),
      available: _.get(item, 'g:availability', true) === 'in stock' ? true : false
    });
  });
  xml.on('error', function() {
    error = true;
  });
  xml.on('end', function(err) {
    cb(err, {products: products, error: error});
  });
}

var processNokautFeed = function(xml, params, cb) {
  var products = [];
  var error = false;
  xml.collect('offer');
  xml.on('endElement: offer', function(item) {
    console.log(item);
    products.push({
      import_id: params.import_id,
      user: params.user_id,
      title: _.get(item, 'name', ''),
      link: _.get(item, 'url', ''),
      image: _.get(item, 'image', ''),
      price: _.get(item, 'price', ''),
      available: _.get(item, 'availability', true)
    });
  });
  xml.on('error', function() {
    error = true;
  });
  xml.on('end', function(err) {
    cb(err, {products: products, error: error});
  });
}

var processCeneoFeed = function(xml, params, cb) {
  var products = [];
  var error = false;
  xml.collect('o');
  xml.on('endElement: o', function(item) {
    console.log(item);
    products.push({
      import_id: params.import_id,
      user: params.user_id,
      title: _.get(item, 'name', ''),
      link: _.get(item, '$.url', ''),
      image: _.get(item, 'imgs.main.$.url', _.get(item, 'imgs.i.$.url', '')),
      price: _.get(item, '$.price', ''),
      available: _.get(item, '$.avail', true)
    });
  });
  xml.on('error', function() {
    error = true;
  });
  xml.on('end', function(err) {
    cb(err, {products: products, error: error});
  });
}

var processCsvFeed = function(xml, params, cb) {
  var products = [];

  var parser = csv({ objectMode: true, columns: true, newline: '\r\n', delimiter: ',', quote: '"', empty: '' }, function (err, result) {
    if (err) throw err
    // our csv has been parsed succesfully
    result.forEach(function (item) { 
      products.push({
        import_id: params.import_id,
        user: params.user_id,
        title: _.get(item, 'title', ''),
        link: _.get(item, 'link', ''),
        image: _.get(item, 'image_link', ''),//_.get(item, 'image_link\r', '')).replace("\r", '')
        price: _.get(item, 'price', ''),
        available: _.get(item, 'availability', true)
      });
    })
    cb(err, {products: products, error: err ? true : false});
  })
  fs.createReadStream(xml).pipe(parser)
}

var processors = {
  google_atom_03: processGoogleAtom03Feed,
  google_atom_1: processGoogleAtom03Feed,
  google_rss_1: processGoogleRss1Feed,
  google_rss_2: processGoogleRss1Feed,
  nokaut: processNokautFeed,
  ceneo: processCeneoFeed,
  okazje: processNokautFeed,
  csv: processCsvFeed
}

var deploy = function(params, cb) {
  console.log('TASK IN PROGREES');
  getPreview({app_id: params.app_id}, function(err, html) {
    console.log('err', err);
    console.log('html', html);
    uploadFile(Buffer.from(html), 'apps/' + params.app_id + '.html', function() {
      App.setPublished(params.app_id, cb);
      // console.log('TASK DONE');
      // cb(err);
    });
  });  
}

var refreshVisitorFeed = function(params, cb) {
  console.log('VISITOR FEED IN PROGREES');
  VisitorProduct.find({cookie_id: params.cookie_id, user: params.user_id, enabled: true}).populate({path: 'product', select: 'title image link price views recent_visit_at'}).exec(function(err, products) {
    if(err) {
      return cb();
    }
    var html = {items: []};
    async.forEachSeries(_.orderBy(products, ['views'], ['desc']), function(product, next) {
      html.items.push({
        image: product.product.image, 
        link: product.product.link, 
        title: product.product.title, 
        price: numeral(product.product.price).format('0,0.00'),
        views: product.views,
        recent_visit_at: product.recent_visit_at
      });
      next();
    }, function() {
      console.log('html', html);
      uploadFile(Buffer.from(JSON.stringify(html)), 'history/' + params.user_id + '_' + params.cookie_id + '.json', function() {
        console.log('TASK VISITOR FEED DONE');
        cb(err);
      });
    });
  });
}

queue.process('deploy', function(job, done){
  deploy({app_id: job.data.app_id}, done);
});

queue.process('downloadFeed', function(job, done){
  downloadFeed({user_id: job.data.user_id, url: job.data.url}, done);
});

queue.process('processFeed', function(job, done){
  processFeed({user_id: job.data.user_id, output: job.data.output}, done);
});

queue.process('refreshVisitorFeed', function(job, done){
  refreshVisitorFeed({user_id: job.data.user_id, cookie_id: job.data.cookie_id}, done);
});

exports.show = function(req, res) {
  if(!req.query.app_id) {
    return res.json({success: false, message: 'Missing App Id'});
  }
  getPreview({app_id: req.query.app_id, demo: req.query.demo ? true : false, demo_open: req.query.demo_open ? true : false, language: req.query.language, env: req.query.env}, function(err, html) {
    res.writeHeader(200, {"Content-Type": "text/html"});  
    if(html) {
      res.write(html);  
    }
    res.end();  
  });
};

exports.delivery = function(req, res) {
  console.log('DELIVERY req.query', req.query);
  var site_id = req.query.site_id;
  var referer = req.get('Referrer') || '';
  console.log('referer', referer);

  var is_demo = req.query.demo;

  var its_new_session = false;
  var its_new_user_session = false;
  var visited_url = '';

  var currentDate = new Date();
  var day = currentDate.getDate()
  var month = currentDate.getMonth() + 1
  var year = currentDate.getFullYear()  

  var url_parts = url.parse(referer, true);
  console.log('ref', req.get('Referrer'));

  async.waterfall([
    function(done) {
      User.findById(site_id).lean().exec(function(err, site) {
        if(req.query.app_id) {
          done(null, null);
        } else {
          if(err || !site) {
            done('Missing site', site);
          } else {
            done(err, site);
          }
        }
      });
    },
    function(site, done) {
      if(!req.query.demo) {
        User.setInstalled(site_id, function() {
          done(null, site);
        });
      } else {
        done(null, site);
      }
    },
    function(site, done) {
      if(req.query.site_id && req.query.customer_email) {
        var CustomerService = require('../customer/customer.service');
        CustomerService.post({
          body: {
            cookie_id: req.query.cookie_id,
            user_id: req.query.site_id,
            app_id: req.query.app_id,
            email: req.query.customer_email,
            fullname: req.query.customer_fullname,
            gender: req.query.customer_gender,
            lang: req.query.customer_lang
          }
        }, function() {
          console.log('ADDING NEW CUSTOMER');
          done(null, site);
        });
      } else {
        done(null, site);
      }
    },
    function(site, done) {
      console.log('url_parts.path', url_parts.path);
      console.log('url_parts.pathname', url_parts.pathname);
      if(url_parts && url_parts.pathname === '/') {
        done(null, site, 'hp');
      } else {
        done(null, site, '');
      }
    },
    function(site, link, done) {
      console.log('link0', link);
      if(link || !site) {
        return done(null, site, link, null);
      }
      if(site.url_schema === 'by_param') {
        if(referer.indexOf(site.url_pathname) > -1 && url_parts.query[site.url_param]) {
          var product_query = {site: site_id};
              product_query['link_params.' + site.url_param] = url_parts.query[site.url_param];
          Product.findOne(product_query).lean().exec(function(err, product) {
            if(err || !product) {
              done(null, site, '', product);
            } else {
              done(null, site, 'product', product);
            }
          });        
        } else {
          done(null, site, '', null);
        }
      } else {
        done(null, site, '', null);
      }
    },
    function(site, link, product, done) {
      if(link || !site) {
        return done(null, site, link, null);
      }
      if(site.url_schema === 'by_path' && url_parts && url_parts.path) {
        var search = url_parts.path.replace(url_parts.search, '');
        var product_query = {user: site_id, enabled: true, link: new RegExp(search, 'gi')};
        Product.findOne(product_query).lean().exec(function(err, product) {
          if(err || !product) {
            done(null, site, '', null);
          } else {
            done(null, site, 'product', product);
          }
        });        
      } else {
        done(null, site, '', null);
      }  
    },    
    function(site, link, product, done) {
      if(is_demo) {
        return done(null, site, link, product);
      }
      if(!link) {
        link = 'all';
      }
      visited_url = link + (product ? '_' + product._id : '') + '_';
      console.log('CHECKING SESSION FOR', req.query.cookie_id);
      VisitorTtl.update({cookie_id: req.query.cookie_id}, {$set: {cookie_id: req.query.cookie_id, url: 'session_only'}, $setOnInsert: {created_at: new Date().valueOf()}}, {upsert: true}).exec(function(err, update_result) {
        console.log('SESSION DATA', update_result);
        its_new_user_session = update_result.upserted ? true : false;
        VisitorTtl.update({cookie_id: req.query.cookie_id, url: visited_url}, {$set: {cookie_id: req.query.cookie_id, url: visited_url}, $setOnInsert: {created_at: new Date().valueOf()}}, {upsert: true}).exec(function(err, update_result) {
          console.log('update_err', err);
          console.log('update_result', update_result);
          its_new_session = update_result.upserted ? true : false;
          done(null, site, link, product);
        });
      });
    },
    function(site, link, product, done) {
      // save visitor traffic view
      if(!its_new_session || is_demo) {
        return done(null, site, link, product);
      }
      VisitorTraffic.update({code: req.query.cookie_id + '_' + visited_url + day + month + year}, {$inc: {views: 1}, $setOnInsert: {user: site._id, code: req.query.cookie_id + '_' + visited_url + day + month + year, cookie_id: req.query.cookie_id, url: visited_url, created_at: new Date().valueOf()}}, {upsert: true}).exec(function() {
        done(null, site, link, product);
      });
    },
    function(site, link, product, done) {
      if(is_demo) {
        return done(null, site, link, product);
      }
      // save product traffic view
      if(link !== 'product') {
        return done(null, site, link, product);
      }
      VisitorProduct.update({cookie_id: req.query.cookie_id, product: product._id}, {$inc: {views: 1}, $set: {enabled: true, user: site._id, recent_visit_at: new Date().valueOf()}, $setOnInsert: {cookie_id: req.query.cookie_id, product: product._id, created_at: new Date().valueOf()}}, {upsert: true}).exec(function(err) {
        console.log('PRDUCT TRAFFIC ERR', err);
        // if(product_result.upserted) {
          queue.create('refreshVisitorFeed', {
            cookie_id: req.query.cookie_id,
            user_id: site._id
          }).save( function(){
            done(null, site, link, product);
          });    
        // } else {
          // done(null, site, link, product);
        // }
      });
    },
    function(site, link, product, done) {
      console.log('link', link);
      console.log('product', product);
      if(req.query.app_id) {
        App.find({_id: req.query.app_id}).lean().exec(function(err, apps) {
          if(err || !apps.length) {
            done('Missing apps');
          } else {
            done(err, _.groupBy(apps, function(app) {return app.app_type}), site, link, product);
          }
        });
      } else {
        // list apps
        var founded_apps = [];
        async.parallel([
          function(cb) {
            console.log('FIND BY CUSTOM URL', link);
            // FIND COUPONS
            if(!its_new_session) {
              return cb();
            }
            var query = {user: site._id, enabled: true, activated: true, app_type: 'coupon'};
                query['manifest.where'] = 'custom_url';
            console.log('coupon query', query);
            App.find(query).sort({created_at: -1}).lean().exec(function(err, apps) {
              console.log('custon url apps', apps);
              _.forEach(apps || [], function(app) {
                if(referer.indexOf(app.manifest.where_custom_url) > -1) {
                  founded_apps.push(app);
                }
              });
              cb()
            });
          },     
          function(cb) {
            console.log('FIND COUPONS', link);
            // FIND COUPONS
            if(!its_new_session) {
              return cb();
            }
            var query = {user: site._id, enabled: true, activated: true, app_type: 'coupon'};
            if(link === 'product') {
              query['$or'] = [{products: {$in: [product]}, 'manifest.where': {$in: ['custom']}, 'manifest.where_segment': {$in: ['selected']}}, {'manifest.where': {$in: ['all']}}, {'manifest.where': {$in: ['custom']}, 'manifest.where_segment': {$in: ['all']}}];
              if(!product.available) {
                query['$or'].push({'manifest.where': {$in: ['custom']}, 'manifest.where_segment': {$in: ['no_availability']}});
              }
            } else if(link === 'hp') {
              query['manifest.where'] = {$in: ['hp', 'all']};
            } else if(link === 'all') {
              query['manifest.where'] = 'all';
            }
            console.log('coupon query', query);
            App.find(query).sort({created_at: -1}).lean().exec(function(err, apps) {
              console.log('prod apps', apps);
              _.forEach(apps || [], function(app) {
                founded_apps.push(app);
              });
              cb()
            });
          },          
          function(cb) {
            // FIND SIGNUP
            if(!its_new_session || !its_new_user_session) {
              return cb();
            }
            var query = {user: site._id, enabled: true, activated: true, app_type: 'signup'};
            if(link === 'product') {
              query['manifest.where'] = {$in: ['all']};
              // query.products = {$in: [product]};
            } else if(link === 'hp') {
              query['manifest.where'] = {$in: ['hp', 'all']};
            }
            console.log('signup query', query);
            App.find(query).sort({created_at: -1}).lean().exec(function(err, apps) {
              _.forEach(apps || [], function(app) {
                founded_apps.push(app);
              });
              cb()
            });
          },           
          function(cb) {
            // FIND erER
            App.find({user: site._id, enabled: true, activated: true, app_type: 'reminder'}).lean().exec(function(err, apps) {
              _.forEach(apps || [], function(app) {
                founded_apps.push(app);
              });
              cb()
            });
          }          
        ], function(err) {
          console.log('its_new_session', its_new_session);
          console.log('THE END', founded_apps);
          done(err, _.groupBy(founded_apps, function(app) {return app.app_type}), site, link, product);
        })
      }
    },
    function(apps, site, link, product, done) {
      if(is_demo) {
        return done(null, apps, site, link, product);
      }
      console.log('BEFORE APPS', apps);
      // check if signup app was aready seen and succesfully visitor become customer, if not we display the app again
      async.parallel([
        function(cb) {
          if(apps.signup) {
            Customer.findOne({cookie_ids: {$in: [req.query.cookie_id]}}).lean().exec(function(err, found_customer) {
              console.log('found_customer', found_customer);
              if(found_customer) {
                delete apps.signup;
              }
              cb();
            });
          } else {
            cb();
          }
        },
        function(cb) {
          if(apps.coupon && apps.coupon[0].manifest.who === 'custom') {
            if(apps.coupon[0].manifest && apps.coupon[0].manifest.target) {
              VisitorTraffic.aggregate({$match: {cookie_id: req.query.cookie_id, url: visited_url}}, {$group: {_id: null, "total": {$sum: "$views" }}}).exec(function(err, found_traffic) {
                console.log('found_traffic', found_traffic, apps.coupon[0].manifest.target.visited_times_value);
                if(found_traffic && found_traffic[0].total < apps.coupon[0].manifest.target.visited_times_value) {
                  delete apps.coupon;
                }
                cb();
              });
            } else {
              cb();
            }
          } else {
            cb();
          }
        }
      ], function() {
        if(!its_new_session) {
          delete apps.signup;
          delete apps.coupon;
        }
        done(null, apps, site, link, product);
      })
      // coupon apps are alays displayed but one per session
      // save visitor apps view
    },
    function(apps, site, link, product, done) {
      if(is_demo) {
        return done(null, apps, site, link, product);
      }
      // save app stats
      async.parallel([
        function(cb) {
          console.log('req.query.cookie_id', req.query.cookie_id);
          if(!its_new_session) {
            return cb();
          }
          Customer.update({cookie_ids: {$in: [req.query.cookie_id]}}, {$set: {recent_visit_at: new Date().valueOf()}}).exec(cb);
        }
      ], function() {
        done(null, apps, site, link, product);
      })
    },
    function(apps, site, link, product, done) {
      done(null, {apps: apps, site: site, link: link ? link : 'all', product: product});
    }
  ], function(err, result) {
    res.writeHeader(200, {"Content-Type": "application/javascript"});
    if(result) {
      console.log('can-i-show result', result.apps);
      if(!result.site) {
        result.site = {};
      }
      if(result.apps.coupon && result.apps.coupon.length) {
        res.write('PopUpDelivery.run("show", {site_id: "' + (result.site._id || '') + '", app_type: "coupon", app_id: "' + result.apps.coupon[0]._id + '", width: "' + result.apps.coupon[0].design.width + '", link_id: ""});');
      }
      if(result.apps.signup && result.apps.signup.length) {
        res.write('PopUpDelivery.run("show", {site_id: "' + (result.site._id || '') + '", app_type: "signup", app_id: "' + result.apps.signup[0]._id + '", width: "' + result.apps.signup[0].design.width + '", link_id: ""});');
      }
      if(result.apps.reminder && result.apps.reminder.length) {
        res.write('PopUpDelivery.run("show", {site_id: "' + (result.site._id || '') + '", app_type: "reminder", app_id: "' + result.apps.reminder[0]._id + '", link_id: ""});');
      }
    } else {
      res.write('');
    }
    res.end();  
  });
}

exports.source = function(req, res) {
  if(!req.query.url) {
    return res.json({success: false, message: 'Missing url'});
  }
  request(addhttp(req.query.url), function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.writeHeader(200, {"Content-Type": "text/html"});
      var url_parts = url.parse(addhttp(req.query.url), true);
      var domain_url = url_parts.protocol + '//' + url_parts.host;
      res.write(body.replace('<HEAD>', '<head>').replace('<head>', '<head><base href="' + domain_url + '">'));  
    }
    res.end();  
  });  
}

exports.showLive = function(req, res) {
  if(!req.query.url) {
    return res.json({success: false, message: 'Missing url'});
  }
  getLivePreview({url: addhttp(req.query.url)}, function(err, html) {
    res.writeHeader(200, {"Content-Type": "text/html"});  
    res.write(html);  
    res.end();  
  });
};

exports.deploy = function(req, res) {
  if(!req.query.app_id) {
    return res.json({success: false, message: 'Missing App Id'});
  }
  queue.create('deploy', {
    app_id: req.query.app_id
  }).save( function(err){
    res.json({success: err ? false : true});  
  });
}


exports.resetFeed = function(req, res) {
  console.log('resetted');
  VisitorProduct.update({
    cookie_id: req.query.cookie_id,
    user: req.query.user_id
  }, {$set: {enabled: false}}, {multi: true}).exec(function() {
    queue.create('refreshVisitorFeed', {
      cookie_id: req.query.cookie_id,
      user_id: req.query.user_id
    }).save( function(){
      return res.status(200).json({success: true});
    });    
  });
};

exports.saveInsights = function(req, res) {
  console.log('SAVING INSIGHTS');
  var currentDate = new Date();
  var day = currentDate.getDate()
  var month = currentDate.getMonth() + 1
  var year = currentDate.getFullYear()  
  
  VisitorApp.update({code: req.body.cookie_id + '_' + req.body.app_id + '_' + req.body.action + '_' + day + month + year}, {$inc: {counter: 1}, $setOnInsert: {code: req.body.cookie_id + '_' + req.body.app_id + '_' + req.body.action + '_' + day + month + year, cookie_id: req.body.cookie_id, app: req.body.app_id, action: req.body.action, user: req.body.user_id , created_at: new Date().valueOf()}}, {upsert: true}).exec(function() {
    return res.status(200).json({success: true});
  });
};

/*
  /api/insights/get_user_traffic?user_id=xxx&summary=xxx

  user_id + summary=get_visitors = number of visitors
  user_id + summary=get_visitors_daily = number of visitors per day
  user_id = summary=get_customers_total = number of customers
*/
exports.insightsGetUserTraffic = function(req, res) {
  var match = {};
  var insights = {};

  var user_ids = req.query.user_id || req.authed.id;
  var all_user_ids = [];

  var source = null;

  if(user_ids) {
    user_ids = user_ids.split(',');
    if(user_ids) {
      user_ids.forEach(function(user_id) {
        if(user_id.length === 24) {
          all_user_ids.push(new ObjectID(user_id));
        }
      });
      match.user = {$in: all_user_ids}
    }
    match.created_at = {$gt: new Date(new Date(new Date().getTime() - 1000*60*60*24*30))}
  }

  var id = null;
  var summary = req.query.summary;

  if(summary === 'get_visitors_total') {
    source = VisitorTraffic;
    id = { _id: '$cookie_id' }
  }

  if(summary === 'get_visitors_daily') {
    source = VisitorTraffic;
    id = { month: { $month: "$created_at" }, day: { $dayOfMonth: "$created_at" }, year: { $year: "$created_at" } };
  }

  if(summary === 'get_customers_total') {
    source = Customer;
    id = { _id: '$email' }
    match.enabled = true;
  }

  console.log('summary', summary);
  if(summary === 'get_customers_daily') {
    source = Customer;
    id = { month: { $month: "$created_at" }, day: { $dayOfMonth: "$created_at" }, year: { $year: "$created_at" } };
    match.enabled = true;
  }  

  if(!source) {
    return res.status(200).json({success: false, insights: insights});
  }

  source.aggregate({
    $match: match
  }, {
    $group: {
      _id: id,
      "total": {
        $sum: "$views" 
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
    // console.log('err_insightsGetVisitors', err);
    // console.log('found_insightsGetVisitors', found_traffic);
    
    if(found_traffic) {
      if(summary === 'get_visitors_total') {
        insights = found_traffic.length;
      }
      if(summary === 'get_visitors_daily') {
        insights = found_traffic;
      }
      if(summary === 'get_customers_total') {
        insights = found_traffic.length;
      }
      if(summary === 'get_customers_daily') {
        insights = found_traffic;
      }
    }

    return res.status(200).json({success: true, insights: insights});
  });
};

exports.insightsGetAppTraffic = function(req, res) {
  var match = {};
  var insights = {};

  var user_ids = req.query.user_id || req.authed.id;
  var all_user_ids = [];

  var source = null;

  match.created_at = {$gt: new Date(new Date(new Date().getTime() - 1000*60*60*24*30))}
  match.action = {$in: ['open', 'view', 'click']};

  if(user_ids) {
    user_ids = user_ids.split(',');
    if(user_ids) {
      user_ids.forEach(function(user_id) {
        if(user_id.length === 24) {
          all_user_ids.push(new ObjectID(user_id));
        }
      });
      match.user = {$in: all_user_ids}
    }
  }

  var app_ids = req.query.app_id;
  var all_app_ids = [];

  if(app_ids) {
    app_ids = app_ids.split(',');
    if(app_ids) {
      app_ids.forEach(function(app_id) {
        if(app_id.length === 24) {
          all_app_ids.push(new ObjectID(app_id));
        }
      });
      match.app = {$in: all_app_ids}
    }
  }

  var id = null;
  source = VisitorApp;
  id = { app: "$app", month: { $month: "$created_at" }, day: { $dayOfMonth: "$created_at" }, year: { $year: "$created_at" } };

  if(!source) {
    return res.status(200).json({success: false, insights: insights});
  }

  source.aggregate({
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
    console.log('err_insightsGetVisitors', err);
    
    if(found_traffic) {
      insights = found_traffic;
    }

    return res.status(200).json({success: true, insights: insights});
  });
};

exports.insightsGetProductTraffic = function(req, res) {
  var match = {};
  var insights = {};

  var user_ids = req.query.user_id || req.authed.id;
  var all_user_ids = [];

  var source = null;

  match.created_at = {$gt: new Date(new Date(new Date().getTime() - 1000*60*60*24*30))}

  if(user_ids) {
    user_ids = user_ids.split(',');
    if(user_ids) {
      user_ids.forEach(function(user_id) {
        if(user_id.length === 24) {
          all_user_ids.push(new ObjectID(user_id));
        }
      });
      match.user = {$in: all_user_ids}
    }
  }

  var product_ids = req.query.product_id;
  var all_product_ids = [];

  if(product_ids) {
    product_ids = product_ids.split(',');
    if(product_ids) {
      product_ids.forEach(function(product_id) {
        if(product_id.length === 24) {
          all_product_ids.push(new ObjectID(product_id));
        }
      });
      match.product = {$in: all_product_ids}
    }
  }

  var id = null;
  source = VisitorProduct;
  id = { product: "$product", cookie_id: "$cookie_id" };

  if(!source) {
    return res.status(200).json({success: false, insights: insights});
  }

  source.aggregate({
    $match: match,
  }, {
    $group: {
      _id: id,
      "total": {
        $sum: "$views" 
      },
      "count": {$sum:1}
    } ,
  }, {
    $sort: {
      'total': -1,
    },
  })
  .sort({total: -1})
  .limit(10)
  .exec(function(err, found_traffic) {
    console.log('err_insightsGetVisitors', err);
    console.log('insights res', found_traffic);

    if(found_traffic) {
      var products = [];
      var products_stats = [];
      var products_visitors = [];

      found_traffic.forEach(function(row) {
        if(products.indexOf(row._id.product) < 0) {
          products.push(row._id.product);
        }

        if(!products_stats[row._id.product]) {
          products_stats[row._id.product] = 0;
        }
        products_stats[row._id.product] += row.total;

        if(!products_visitors[row._id.product]) {
          products_visitors[row._id.product] = 0;
        }
        products_visitors[row._id.product] += row.count;
      });

      console.log('products_visitors', products_visitors);

      Product.find({_id: {$in: products}, enabled: true}).exec(function(err, results) {
        results = _.map(results, function(row) {
          row = row.toObject();
          row.views = products_stats[row._id];
          row.customers = products_visitors[row._id];
          return row;
        });

        results = _.orderBy(results, ['views', 'customers'], ['desc', 'desc']);
        // insights = found_traffic;
        return res.status(200).json({success: true, insights: results});
      });
    } else {
      return res.status(200).json({success: true, insights: insights});
    }
  });
};

exports.canishow = function(req, res) {
  var site_id = req.query.site_id;
  var referer = req.get('Referrer') || '';
  if(!referer) {
    res.write('');
    res.end();
    return;
  }

  var is_test = req.query.test || req.query.preview;

  var its_new_session = false;
  var its_new_user_session = false;
  var visited_url = '';

  var currentDate = new Date();
  var day = currentDate.getDate()
  var month = currentDate.getMonth() + 1
  var year = currentDate.getFullYear()  

  var url_parts = url.parse(referer, true);
  console.log('ref', req.get('Referrer'));

  async.waterfall([
    function(done) {
      User.findById(site_id).lean().exec(function(err, site) {
        if(req.query.app_id) {
          done(null, null);
        } else {
          if(err || !site) {
            done('Missing site', site);
          } else {
            done(err, site);
          }
        }
      });
    },
    function(site, done) {
      if(!req.query.test) {
        User.setInstalled(site_id, function() {
          done(null, site);
        });
      } else {
        done(null, site);
      }
    },
    function(site, done) {
      console.log('url_parts.path', url_parts.path);
      console.log('url_parts.pathname', url_parts.pathname);
      if(url_parts && url_parts.pathname === '/') {
        done(null, site, 'hp');
      } else {
        done(null, site, '');
      }
    },
    function(site, link, done) {
      console.log('link0', link);
      if(link || !site) {
        return done(null, site, link, null);
      }
      if(site.url_schema === 'by_param') {
        if(referer.indexOf(site.url_pathname) > -1 && url_parts.query[site.url_param]) {
          var product_query = {site: site_id};
              product_query['link_params.' + site.url_param] = url_parts.query[site.url_param];
          Product.findOne(product_query).lean().exec(function(err, product) {
            if(err || !product) {
              done(null, site, '', product);
            } else {
              done(null, site, 'product', product);
            }
          });        
        } else {
          done(null, site, '', null);
        }
      } else {
        done(null, site, '', null);
      }
    },
    function(site, link, product, done) {
      if(link || !site) {
        return done(null, site, link, null);
      }
      if(site.url_schema === 'by_path') {
        var search = url_parts.path.replace(url_parts.search, '');
        var product_query = {user: site_id, enabled: true, link: new RegExp(search, 'gi')};
        Product.findOne(product_query).lean().exec(function(err, product) {
          if(err || !product) {
            done(null, site, '', null);
          } else {
            done(null, site, 'product', product);
          }
        });        
      } else {
        done(null, site, '', null);
      }  
    },    
    function(site, link, product, done) {
      if(is_test) {
        return done(null, site, link, product);
      }
      if(!link) {
        link = 'all';
      }
      visited_url = link + (product ? '_' + product._id : '') + '_';
      console.log('CHECKING SESSION FOR', req.query.cookie_id);
      VisitorTtl.update({cookie_id: req.query.cookie_id}, {$set: {cookie_id: req.query.cookie_id, url: 'session_only'}, $setOnInsert: {created_at: new Date().valueOf()}}, {upsert: true}).exec(function(err, update_result) {
        console.log('SESSION DATA', update_result);
        its_new_user_session = update_result.upserted ? true : false;
        VisitorTtl.update({cookie_id: req.query.cookie_id, url: visited_url}, {$set: {cookie_id: req.query.cookie_id, url: visited_url}, $setOnInsert: {created_at: new Date().valueOf()}}, {upsert: true}).exec(function(err, update_result) {
          console.log('update_err', err);
          console.log('update_result', update_result);
          its_new_session = update_result.upserted ? true : false;
          done(null, site, link, product);
        });
      });
    },
    function(site, link, product, done) {
      // save visitor traffic view
      if(!its_new_session || is_test) {
        return done(null, site, link, product);
      }
      VisitorTraffic.update({code: req.query.cookie_id + '_' + visited_url + day + month + year}, {$inc: {views: 1}, $setOnInsert: {user: site._id, code: req.query.cookie_id + '_' + visited_url + day + month + year, cookie_id: req.query.cookie_id, url: visited_url, created_at: new Date().valueOf()}}, {upsert: true}).exec(function() {
        done(null, site, link, product);
      });
    },
    function(site, link, product, done) {
      if(is_test) {
        return done(null, site, link, product);
      }
      // save product traffic view
      if(link !== 'product') {
        return done(null, site, link, product);
      }
      VisitorProduct.update({cookie_id: req.query.cookie_id, product: product._id}, {$inc: {views: 1}, $set: {enabled: true, user: site._id, recent_visit_at: new Date().valueOf()}, $setOnInsert: {cookie_id: req.query.cookie_id, product: product._id, created_at: new Date().valueOf()}}, {upsert: true}).exec(function(err) {
        console.log('PRDUCT TRAFFIC ERR', err);
        // if(product_result.upserted) {
          queue.create('refreshVisitorFeed', {
            cookie_id: req.query.cookie_id,
            user_id: site._id
          }).save( function(){
            done(null, site, link, product);
          });    
        // } else {
          // done(null, site, link, product);
        // }
      });
    },
    function(site, link, product, done) {
      console.log('link', link);
      console.log('product', product);
      if(req.query.app_id) {
        App.find({_id: req.query.app_id}).lean().exec(function(err, apps) {
          if(err || !apps.length) {
            done('Missing apps');
          } else {
            done(err, _.groupBy(apps, function(app) {return app.app_type}), site, link, product);
          }
        });
      } else {
        // list apps
        var founded_apps = [];
        async.parallel([
          function(cb) {
            console.log('FIND BY CUSTOM URL', link);
            // FIND COUPONS
            if(!its_new_session) {
              return cb();
            }
            var query = {user: site._id, enabled: true, activated: true, app_type: 'coupon'};
                query['manifest.where'] = 'custom_url';
            console.log('coupon query', query);
            App.find(query).sort({created_at: -1}).lean().exec(function(err, apps) {
              console.log('custon url apps', apps);
              _.forEach(apps || [], function(app) {
                if(referer.indexOf(app.manifest.where_custom_url) > -1) {
                  founded_apps.push(app);
                }
              });
              cb()
            });
          },     
          function(cb) {
            console.log('FIND COUPONS', link);
            // FIND COUPONS
            if(!its_new_session) {
              return cb();
            }
            var query = {user: site._id, enabled: true, activated: true, app_type: 'coupon'};
            if(link === 'product') {
              query['$or'] = [{products: {$in: [product]}, 'manifest.where': {$in: ['custom']}, 'manifest.where_segment': {$in: ['selected']}}, {'manifest.where': {$in: ['all']}}, {'manifest.where': {$in: ['custom']}, 'manifest.where_segment': {$in: ['all']}}];
              if(!product.available) {
                query['$or'].push({'manifest.where': {$in: ['custom']}, 'manifest.where_segment': {$in: ['no_availability']}});
              }
            } else if(link === 'hp') {
              query['manifest8'] = {$in: ['hp', 'all']};
            } else if(link === 'all') {
              query['manifest.where'] = 'all';
            }
            console.log('coupon query', query);
            App.find(query).sort({created_at: -1}).lean().exec(function(err, apps) {
              console.log('prod apps', apps);
              _.forEach(apps || [], function(app) {
                founded_apps.push(app);
              });
              cb()
            });
          },          
          function(cb) {
            // FIND SIGNUP
            if(!its_new_session || !its_new_user_session) {
              return cb();
            }
            var query = {user: site._id, enabled: true, activated: true, app_type: 'signup'};
            if(link === 'product') {
              query['manifest.where'] = {$in: ['all']};
              // query.products = {$in: [product]};
            } else if(link === 'hp') {
              query['manifest.where'] = {$in: ['hp', 'all']};
            }
            console.log('signup query', query);
            App.find(query).sort({created_at: -1}).lean().exec(function(err, apps) {
              _.forEach(apps || [], function(app) {
                founded_apps.push(app);
              });
              cb()
            });
          },           
          function(cb) {
            // FIND REMINDER
            App.find({user: site._id, enabled: true, activated: true, app_type: 'reminder'}).lean().exec(function(err, apps) {
              _.forEach(apps || [], function(app) {
                founded_apps.push(app);
              });
              cb()
            });
          }          
        ], function(err) {
          console.log('its_new_session', its_new_session);
          console.log('THE END', founded_apps);
          done(err, _.groupBy(founded_apps, function(app) {return app.app_type}), site, link, product);
        })
      }
    },
    function(apps, site, link, product, done) {
      if(is_test) {
        return done(null, apps, site, link, product);
      }
      console.log('BEFORE APPS', apps);
      // check if signup app was aready seen and succesfully visitor become customer, if not we display the app again
      async.parallel([
        function(cb) {
          if(apps.signup) {
            Customer.findOne({cookie_ids: {$in: [req.query.cookie_id]}}).lean().exec(function(err, found_customer) {
              console.log('found_customer', found_customer);
              if(found_customer) {
                delete apps.signup;
              }
              cb();
            });
          } else {
            cb();
          }
        },
        function(cb) {
          if(apps.coupon && apps.coupon[0].manifest.who === 'custom') {
            if(apps.coupon[0].manifest && apps.coupon[0].manifest.target) {
              VisitorTraffic.aggregate({$match: {cookie_id: req.query.cookie_id, url: visited_url}}, {$group: {_id: null, "total": {$sum: "$views" }}}).exec(function(err, found_traffic) {
                console.log('found_traffic', found_traffic, apps.coupon[0].manifest.target.visited_times_value);
                if(found_traffic && found_traffic[0].total < apps.coupon[0].manifest.target.visited_times_value) {
                  delete apps.coupon;
                }
                cb();
              });
            } else {
              cb();
            }
          } else {
            cb();
          }
        }
      ], function() {
        if(!its_new_session) {
          delete apps.signup;
          delete apps.coupon;
        }
        done(null, apps, site, link, product);
      })
      // coupon apps are alays displayed but one per session
      // save visitor apps view
    },
    function(apps, site, link, product, done) {
      if(is_test) {
        return done(null, apps, site, link, product);
      }
      // save app stats
      async.parallel([
        function(cb) {
          console.log('req.query.cookie_id', req.query.cookie_id);
          if(!its_new_session) {
            return cb();
          }
          Customer.update({cookie_ids: {$in: [req.query.cookie_id]}}, {$set: {recent_visit_at: new Date().valueOf()}}).exec(cb);
        }
      ], function() {
        done(null, apps, site, link, product);
      })
    },
    function(apps, site, link, product, done) {
      done(null, {apps: apps, site: site, link: link ? link : 'all', product: product});
    }
  ], function(err, result) {
    res.writeHeader(200, {"Content-Type": "application/javascript"});
    if(result) {
      console.log('can-i-show result', result.apps);
      if(!result.site) {
        result.site = {};
      }
      
      // check which plugins are enabled and display
      // if this is product page then check if coupon exists
      // if now check if this is homepage & check if there is active list builder just for homepage || all pages
      // if this is other page check if the list builder if enabled for all pages
      // if reminder is enabled add it to display too
      if(!req.query.app_id) {
        if(result.apps.coupon && result.apps.coupon.length) {
          if(result.apps.coupon[0].manifest.when && result.apps.coupon[0].manifest.when === 'exit') {
            res.write('var isPopupDisplayed = false;');
            res.write('var canvas = document && document.documentElement ? document.documentElement : document.body;');
            res.write('addEvent(canvas, "mousemove", function(e) {tinyLeadGetPosition(e, function() {if(isPopupDisplayed) return;isPopupDisplayed = true;tinyLeadShowPopup("' + (result.site._id || '') + '", "coupon", "' + result.apps.coupon[0]._id + '", "", true);})});');
          } else if(result.apps.coupon[0].manifest.when && result.apps.coupon[0].manifest.when === 'timeout' && result.apps.coupon[0].manifest.target.when_timeout) {
            res.write('setTimeout(function() {tinyLeadShowPopup("' + (result.site._id || '') + '", "coupon", "' + result.apps.coupon[0]._id + '", "", true);}, ' + (parseInt(result.apps.coupon[0].manifest.target.when_timeout) * 1000) + ');');
          } else {
            res.write('tinyLeadShowPopup("' + (result.site._id || '') + '", "coupon", "' + result.apps.coupon[0]._id + '", "", true);');
          }
          // res.write('tinyLeadShowPopup("' + (result.site._id || '') + '", "coupon", "' + result.apps.coupon[0]._id + '", "", true);'); // "which link_id to use in stats hp, other, product_url", true = demo, true means no extra functionality
        } else if(result.apps.signup && result.apps.signup.length) {
          if(result.apps.signup[0].manifest.when && result.apps.signup[0].manifest.when === 'exit') {
            res.write('var isPopupDisplayed = false;');
            res.write('var canvas = document && document.documentElement ? document.documentElement : document.body;');
            res.write('addEvent(canvas, "mousemove", function(e) {tinyLeadGetPosition(e, function() {if(isPopupDisplayed) return;isPopupDisplayed = true;tinyLeadShowPopup("' + (result.site._id || '') + '", "signup", "' + result.apps.signup[0]._id + '", "", true);})});');
          } else if(result.apps.signup[0].manifest.when && result.apps.signup[0].manifest.when === 'timeout' && result.apps.signup[0].manifest.target.when_timeout) {
            res.write('setTimeout(function() {tinyLeadShowPopup("' + (result.site._id || '') + '", "signup", "' + result.apps.signup[0]._id + '", "", true);}, ' + (parseInt(result.apps.signup[0].manifest.target.when_timeout) * 1000) + ');');
          } else {
            res.write('tinyLeadShowPopup("' + (result.site._id || '') + '", "signup", "' + result.apps.signup[0]._id + '", "", true);');
          }
        }
        if(result.apps.reminder && ((req.query.test && result.apps.reminder.length) || (!req.query.test && result.apps.reminder[0].activated))) {
          res.write('tinyLeadShowBadge("' + (result.site._id || '') + '", "reminder", "' + result.apps.reminder[0]._id + '", "", true);');
        }
      } else {
        if(result.apps.coupon && result.apps.coupon.length) {
          res.write('tinyLeadShowPopup("' + (result.site._id || '') + '", "coupon", "' + result.apps.coupon[0]._id + '", "", true);');
        } else if(result.apps.signup && result.apps.signup.length) {
          res.write('tinyLeadShowPopup("' + (result.site._id || '') + '", "signup", "' + result.apps.signup[0]._id + '", "", true);');
        } else if(result.apps.reminder && ((req.query.test && result.apps.reminder.length) || (!req.query.test && result.apps.reminder[0].activated))) {
          res.write('tinyLeadShowBadge("' + (result.site._id || '') + '", "reminder", "' + result.apps.reminder[0]._id + '", "", true);');
        }
      }
    } else {
      res.write('');
    }
    res.end();  
  });
}

exports.signing = function(req, res) {
  var request = req.body;
  var path = 'public/' + uuid() + '.' + request.type.split('/')[1];

  var readType = 'private';

  var expiration = moment().add(24, 'months').toDate(); //15 minutes

  var s3Policy = {
    'expiration': expiration,
    'conditions': [{
            'bucket': BUCKET_NAME
        },
        ['starts-with', '$key', path], 
        {
            'acl': readType
        },
        {
          'success_action_status': '201'
        },
        ['starts-with', '$Content-Type', request.type],
        ['content-length-range', 2048, 10485760], //min and max
    ]
  };

  var stringPolicy = JSON.stringify(s3Policy);
  var base64Policy = new Buffer(stringPolicy, 'utf-8').toString('base64');

  // sign policy
  var signature = crypto.createHmac('sha1', aws_config.secretAccessKey)
      .update(new Buffer(base64Policy, 'utf-8')).digest('base64');

  var credentials = {
      url: s3Url,
      fields: {
          key: path,
          AWSAccessKeyId: aws_config.accessKeyId,
          acl: readType,
          policy: base64Policy,
          signature: signature,
          'Content-Type': request.type,
          success_action_status: 201
      }
  };
  res.jsonp(credentials);
};

exports.demo = function(req, res) {
  res.writeHeader(200, {"Content-Type": "application/javascript"});
  res.write('tinyLeadShowBadge("57dbb8435b8c185e9e5470b4", "reminder", "57dbbba59648396b1172fe90", "", true);');
  res.end();
}

exports.signing_feed = function(req, res) {
  var request = req.body;
  var path = 'feeds/' + uuid() + '.' + request.type.split('/')[1];

  var readType = 'private';

  var expiration = moment().add(24, 'months').toDate(); //15 minutes

  var s3Policy = {
      'expiration': expiration,
      'conditions': [{
              'bucket': BUCKET_NAME
          },
          ['starts-with', '$key', path], 
          {
              'acl': readType
          },
          {
            'success_action_status': '201'
          },
          ['starts-with', '$Content-Type', request.type],
          ['content-length-range', 1, 1000485760], //min and max
      ]
  };

  var stringPolicy = JSON.stringify(s3Policy);
  var base64Policy = new Buffer(stringPolicy, 'utf-8').toString('base64');

  // sign policy
  var signature = crypto.createHmac('sha1', aws_config.secretAccessKey)
      .update(new Buffer(base64Policy, 'utf-8')).digest('base64');

  var credentials = {
      url: s3Url,
      fields: {
          key: path,
          AWSAccessKeyId: aws_config.accessKeyId,
          acl: readType,
          policy: base64Policy,
          signature: signature,
          'Content-Type': request.type,
          success_action_status: 201
      }
  };
  res.jsonp(credentials);
};

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = ((new Date())
      .getTime() + Math.random() * 16) % 16 | 0;
    return (c == "x" ? r : (r & 0x7 | 0x8))
      .toString(16);
  });
}

function getLivePreview(params, cb) {
  var data = {
    url: params.url
  };

  fs.readFile(__dirname + '/../../popups/live/index.html', 'utf-8', function(error, source){
    var template = handlebars.compile(source);
    var html = template(data);
    
    return cb(null, html);
  });
}

function getPreview(params, cb) {
  console.log('getPreview', params);
  handlebars.registerPartial('signupform', fs.readFileSync(__dirname + '/../../popups/partials/signupform.html', 'utf8'));
  handlebars.registerPartial('signuphead', fs.readFileSync(__dirname + '/../../popups/partials/signuphead.html', 'utf8'));
  handlebars.registerPartial('reminderjs', fs.readFileSync(__dirname + '/../../popups/partials/reminder.js', 'utf8'));
  handlebars.registerPartial('remindercss', fs.readFileSync(__dirname + '/../../popups/partials/reminder.css', 'utf8'));
  handlebars.registerPartial('reminderhead', fs.readFileSync(__dirname + '/../../popups/partials/reminderhead.html', 'utf8'));
  handlebars.registerPartial('popupjs', fs.readFileSync(__dirname + '/../../popups/partials/popup.js', 'utf8'));
  function highlight(code, lang) {
    try {
      try {
        return hljs.highlight(lang, code).value;
      } catch (err) {
        if (!/Unknown language/i.test(err.message)) {
          throw err;
        }
        return hljs.highlightAuto(code).value;
      }
    } catch (err) {
      return code;
    }
  }

  handlebars.registerHelper('markdown', markdown({
    highlight: highlight  
  }));

  var data = {};

  App.findById(params.app_id).lean().exec(function(err, app) {
    if (err) {
      return cb(err);
    }
    if (!app) {
      return cb('Not Found');
    }

    data.app = app;
    data.app.design.summary = data.app && data.app.design && data.app.design.summary ? data.app.design.summary.replace(/(?:\r\n|\r|\n)/g, '\r\n\r\n') : '';

    data.demo = params.demo;
    data.demo_open = params.demo_open;
    data.env = params.env;
    data.language = params.language;
    
    if(data.demo) {
      data.ts = new Date().valueOf();
    }

    console.log('MIANAPP', data.app);

    if(process.env.NODE_ENV === 'production') {
      data.i18n = JSON.parse(fs.readFileSync('./i18n/app-locale_' + (data.app.design.language || 'en') + '.json', 'utf8'));
    } else {
      data.i18n = JSON.parse(fs.readFileSync(__dirname + '/../../i18n/app-locale_' + (data.app.design.language || 'en') + '.json', 'utf8'));
    }
    
    console.log('file', __dirname + '/../../popups/templates/' + data.app.design.template + '.html');

    fs.readFile(__dirname + '/../../popups/templates/' + data.app.design.template + '.html', 'utf-8', function(error, source){
      if(error) {
        return cb('Missing template file'); 
      }
      handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

          switch (operator) {
              case '==':
                  return (v1 == v2) ? options.fn(this) : options.inverse(this);
              case '===':
                  return (v1 === v2) ? options.fn(this) : options.inverse(this);
              case '<':
                  return (v1 < v2) ? options.fn(this) : options.inverse(this);
              case '<=':
                  return (v1 <= v2) ? options.fn(this) : options.inverse(this);
              case '>':
                  return (v1 > v2) ? options.fn(this) : options.inverse(this);
              case '>=':
                  return (v1 >= v2) ? options.fn(this) : options.inverse(this);
              case '&&':
                  return (v1 && v2) ? options.fn(this) : options.inverse(this);
              case '||':
                  return (v1 || v2) ? options.fn(this) : options.inverse(this);
              default:
                  return options.inverse(this);
          }
      });

      handlebars.registerHelper('custom_title', function(title){
        var words = title.split(' ');
        for (var i = 0; i < words.length; i++) {
          if (words[i].length > 4) {
            words[i] = words[i][0].toUpperCase() + words[i].substr(1);
          }
        }
        title = words.join(' ');
        return title;
      })

      // console.log('source', source);
      var template = handlebars.compile(source);
      console.log('ALL DATA', data);
      var html = template(data);
      
      return cb(null, html);
    });
  });
}

function uploadFile(fileBuffer, fileName, cb) {
  var metaData = getContentTypeByFile(fileName);

  s3.putObject({
    ACL: 'public-read',
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: metaData
  }, function(err, response) {
    console.log('AWS err', err);
    console.log('AWS response', response);
    cb(err, response);
  });
}

function getContentTypeByFile(fileName) {
  var rc = 'application/octet-stream';
  var fileNameLowerCase = fileName.toLowerCase();

  if (fileNameLowerCase.indexOf('.html') >= 0) rc = 'text/html';
  else if (fileNameLowerCase.indexOf('.css') >= 0) rc = 'text/css';
  else if (fileNameLowerCase.indexOf('.json') >= 0) rc = 'application/json';
  else if (fileNameLowerCase.indexOf('.js') >= 0) rc = 'application/x-javascript';
  else if (fileNameLowerCase.indexOf('.png') >= 0) rc = 'image/png';
  else if (fileNameLowerCase.indexOf('.jpg') >= 0) rc = 'image/jpg';

  return rc;
}  