'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var md5 = require('md5');
var moment = require('moment')

var validateEmail = function(email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email)
};

var hashPassword = function(v) {
  return v.toLowerCase() + 'xxx';
};

var free14days = function() {
  var now = new Date();
  var time = now.getTime();
  time += 3600 * 1000 * 24 * 14;
  var new_time = now.setTime(time);
  return new_time.valueOf();
};

var UserSchema = new Schema({
  first_name: {type: String, trim: true},
  last_name: {type: String, trim: true},
  email: {
    type: String, 
    trim: true, 
    unique: true, 
    required: 'Email address is required',
    validate: [validateEmail, 'Please fill a valid email address']
  },
  feed: {
    upload_type: {type: String, trim: true},
    url: {type: String, trim: true},
    last_uploaded_at: {type: Date},
    imported: Boolean,
    status: String,
    total_products: {type: Number, default: 0}, 
    total_products_unavailable: {type: Number, default: 0} 
  },
  url_schema: {type: String, default: 'by_path'}, // by_param + url_param
  url_param: {type: String, trim: true, default: ''},
  url_pathname: {type: String, trim: true, default: ''},
  password: {type: String, trim: true, set: hashPassword},
  website: {type: String, trim: true},
  company: {type: String, trim: true},
  language: {type: String, trim: true, default: 'en_US'},
  address_1: {type: String, trim: true},
  address_2: {type: String, trim: true},
  city: {type: String, trim: true},
  country: {type: String, trim: true, default: 'US'},
  state: {type: String, trim: true},
  postal_code: {type: String, trim: true},
  vat_id: {type: String, trim: true},
  vat_rate: {type: Number, default: 20},
  vat_verified: {type: Boolean, default: false},
  plan: {type: String, trim: true, default: 'free14days'},
  stripe_token: {type: String, trim: true, default: ''},
  stripe_cust_id: {type: String, trim: true, default: ''},
  stripe_subs_id: {type: String, trim: true, default: ''},
  currency: {type: String, trim: true, default: 'USD'},
  valid_to: {type: Date, default: free14days}, 
  paid: Boolean,
  installed: Boolean,
  activated: Boolean,
  admin: Boolean,
  integrations: {}
}, {toObject: {virtuals: true} ,toJSON: {virtuals: true}});

UserSchema.virtual('name').get(function () {
  return this.first_name + ' ' + this.last_name;
});

UserSchema.statics.days_left = function(user) {
  var startDate = moment(new Date());
  var endDate = moment(user.valid_to);
  var daysDiff = endDate.diff(startDate, 'days', false);
  return {days_left: daysDiff};
};

UserSchema.statics.hashPassword = function (password) {
  return md5(password);
};

UserSchema.statics.activate14days = function () {
  return free14days();
};

UserSchema.statics.setIntegrationStatus = function(user_id, integration_id, status, callback) {
  callback = callback || function() {};
  var integration = {};
      integration['integrations.' + integration_id + '.status'] = status;
  this.update({_id: user_id}, {$set: integration}, callback);
};


UserSchema.statics.setFeedStatus = function(user_id, status, callback) {
  callback = callback || function() {};
  this.update({_id: user_id}, {$set: {'feed.status': status}}, callback);
};

UserSchema.statics.setTotalProducts = function(user_id, total_products, callback) {
  callback = callback || function() {};
  this.update({_id: user_id}, {$set: {'feed.total_products': total_products, 'feed.last_uploaded_at': new Date().valueOf()}}, callback);
};

UserSchema.statics.setTotalProductsUnavailable = function(user_id, total_products_unavailable, callback) {
  callback = callback || function() {};
  this.update({_id: user_id}, {$set: {'feed.total_products_unavailable': total_products_unavailable}}, callback);
};

UserSchema.statics.setInstalled = function(user_id, callback) {
  callback = callback || function() {};
  this.update({_id: user_id}, {$set: {'installed': true}}, callback);
};

UserSchema.statics.setPlan = function(user_id, plan, stripe_token, stripe_cust_id, stripe_subs_id, callback) {
  callback = callback || function() {};
  this.update({_id: user_id}, {$set: {'plan': plan, stripe_token: stripe_token, stripe_cust_id: stripe_cust_id, stripe_subs_id: stripe_subs_id, paid: true}}, callback);
};

UserSchema.statics.cancelPlan = function(user_id, callback) {
  callback = callback || function() {};
  this.update({_id: user_id}, {$set: {stripe_token: '', stripe_cust_id: '', stripe_subs_id: '', paid: false}}, callback);
};

UserSchema.statics.changePlan = function(user_id, plan, callback) {
  callback = callback || function() {};
  this.update({_id: user_id}, {$set: {'plan': plan, paid: true}}, callback);
};

UserSchema.statics.verifyVat = function(user_id, data, callback) {
  callback = callback || function() {};
  this.update({_id: user_id}, {$set: {'vat_rate': data.vat_rate, vat_verified: data.customer_valid_vat_number || false}}, callback);
};

module.exports = mongoose.model('User', UserSchema);
