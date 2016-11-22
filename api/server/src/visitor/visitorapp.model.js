'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var VisitorAppSchema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  code: {type: String, trim: true}, //user+cookie+url+app+DDMMYYYY
  app: {type: Schema.Types.ObjectId, ref: 'App'},
  action: {type: String, trim: true}, // view, save, close
  cookie_id: {type: String, trim: true},
  created_at: {type: Date, default: Date.now, index: {expires : 3456000}},
  counter: {type: Number, default: 0},
}, {toObject: {virtuals: true} ,toJSON: {virtuals: true}});

module.exports = mongoose.model('VisitorApp', VisitorAppSchema);
