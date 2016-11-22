'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var VisitorTrafficSchema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  code: {type: String, trim: true},
  cookie_id: {type: String, trim: true},
  url: {type: String, trim: true},
  created_at: {type: Date, default: Date.now, index: {expires : 3456000}},
  views: {type: Number, default: 0},
}, {toObject: {virtuals: true}, toJSON: {virtuals: true}});

module.exports = mongoose.model('VisitorTraffic', VisitorTrafficSchema);
