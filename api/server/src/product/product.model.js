'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProductSchema = new Schema({
  import_id: {type: String, trim: true},
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  title: {type: String, trim: true},
  link: {type: String, trim: true},
  link_params: {},
  image: {},
  price: {type: Number, default: 0.00},
  available: {type: Boolean, default: true},
  enabled: {type: Boolean, default: true},
  visible: {type: Boolean, default: true}
}, {toObject: {virtuals: true} ,toJSON: {virtuals: true}});

ProductSchema.statics.enableAllImported = function(import_id, user_id, callback) {
  callback = callback || function() {};
  this.update({user: user_id, import_id: {$ne: import_id}}, {$set: {'enabled': false}}, {multi: true}, callback);
};

ProductSchema.statics.hideAllProducts = function(import_id, user_id, callback) {
  callback = callback || function() {};
  this.update({user: user_id, import_id: {$ne: import_id}}, {$set: {'visible': false}}, {multi: true}, callback);
};

module.exports = mongoose.model('Product', ProductSchema);
