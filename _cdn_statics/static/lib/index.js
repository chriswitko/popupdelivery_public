'use strict';

var walkSync = function(dir, filelist) {
  var fs = fs || require('fs'),
      files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(dir + '/' + file).isDirectory()) {
			// it's folder
      // filelist = walkSync(dir + '/' + file, filelist);
    }
    else {
      filelist.push(file);
    }
  });
  return filelist;
};

walkSync(__dirname).forEach(function(method) {
	module.exports[method] = require('./' + method);
});
