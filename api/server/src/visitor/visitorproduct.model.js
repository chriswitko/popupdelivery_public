'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var VisitorProductSchema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  product: {type: Schema.Types.ObjectId, ref: 'Product'},
  cookie_id: {type: String, trim: true},
  created_at: {type: Date, default: Date.now, index: {expires : 3456000}},
  recent_visit_at: {type: Date, default: Date.now},
  views: {type: Number, default: 0},
  enabled: {type: Boolean, default: true}
}, {toObject: {virtuals: true}, toJSON: {virtuals: true}});

module.exports = mongoose.model('VisitorProduct', VisitorProductSchema);
