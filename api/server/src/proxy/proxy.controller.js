'use strict';
var https = require('https');
var url = require('url');

/**
 * GET /things
 *
 * @description
 * list of things
 *
 */
exports.show = function(req, res) {
  var url_parts = url.parse(req.query.url, true);
    var options = {
        host: url_parts.host,
        path: url_parts.path
    };

    var callback = function(response) {
        if (response.statusCode === 200) {
            res.writeHead(200, {
                'Content-Type': response.headers['content-type']
            });
            response.pipe(res);
        } else {
            res.writeHead(response.statusCode);
            res.end();
        }
    };

    https.request(options, callback).end();
};
