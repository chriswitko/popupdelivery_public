'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var VisitorTtlSchema = new Schema({
  cookie_id: {type: String, trim: true},
  url: {type: String, trim: true}, // hp, all, product_id
  created_at : {type : Date, default: Date.now, index: {expires : 1800}}
}, {toObject: {virtuals: true}, toJSON: {virtuals: true}});

module.exports = mongoose.model('VisitorTtl', VisitorTtlSchema);
