'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongooseToCsv = require('mongoose-to-csv');

var CustomerSchema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  email: {type: String, trim: true},
  fullname: {type: String, trim: true},
  gender: {type: String, trim: true},
  cookie_ids: [],
  apps: [{
    _id: false,
    app: {type: Schema.Types.ObjectId, ref: 'App'},
    created_at: {type: Date, default: Date.now}
  }],
  site_ids: [],
  // meta: {}, // lang, country, ip_address, geo
  ip_address: {type: String, trim: true},
  country: {type: String, trim: true},
  city: {type: String, trim: true},
  lang: {type: String, trim: true},
	loc: {
    type: [Number],  // [<longitude>, <latitude>]
    index: '2d'      // create the geospatial index
	},
  enabled: {type: Boolean, default: true},
  synched: {type: Boolean, default: false},
  created_at: {type: Date, default: Date.now},
  recent_visit_at: {type: Date, default: Date.now}
}, {toObject: {virtuals: true} ,toJSON: {virtuals: true}});

CustomerSchema.plugin(mongooseToCsv, {
  headers: 'Firstname Lastname Email Gender',
  constraints: {
    'Email': 'email',
    'Gender': 'gender'
  },
  virtuals: {
    'Firstname': function(doc) {
      if(doc.fullname) {
        return doc.fullname.split(' ')[0];
      }
      return '';
    },
    'Lastname': function(doc) {
      if(doc.fullname) {
        return doc.fullname.split(' ')[1];
      }
      return '';
    }
  }
});

CustomerSchema.statics.setPublished = function(app_id, callback) {
  callback = callback || function() {};
  this.update({_id: app_id}, {$set: {'published': true, 'activated': true}}, callback);
};

CustomerSchema.statics.deactivate = function(app_id, callback) {
  callback = callback || function() {};
  this.update({_id: app_id}, {$set: {'activated': false}}, callback);
};

module.exports = mongoose.model('Customer', CustomerSchema);
