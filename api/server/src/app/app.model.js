'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AppSchema = new Schema({
  is_new: {type: Boolean, default: true},
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  app_type: {type: String, trim: true},
  name: {type: String, trim: true},
  manifest: {},
  design: {},
  products: [{type: Schema.Types.ObjectId, ref: 'Product'}],
  enabled: {type: Boolean, default: true},
  activated: {type: Boolean, default: false},
  published: {type: Boolean, default: false},
  created_at: {type: Date, default: Date.now}
}, {toObject: {virtuals: true} ,toJSON: {virtuals: true}});

AppSchema.statics.setPublished = function(app_id, callback) {
  callback = callback || function() {};
  this.update({_id: app_id}, {$set: {'published': true, 'activated': true}}, callback);
};

AppSchema.statics.deactivate = function(app_id, callback) {
  callback = callback || function() {};
  this.update({_id: app_id}, {$set: {'activated': false}}, callback);
};


module.exports = mongoose.model('App', AppSchema);
