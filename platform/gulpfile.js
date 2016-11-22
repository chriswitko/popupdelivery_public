'use strict';

var gulp = require('gulp');
var fs = require('fs');
var del = require('del');

/**
 *  This will load all js files in the gulp-tasks directory
 */
fs.readdirSync('gulp-tasks').forEach(function(file) {
  require('./gulp-tasks/' + file);
});

gulp.task('clean', function() {
  return del(['coverage', '.tmp', 'dist', 'verify']);
});

gulp.task('default', gulp.series('clean', gulp.parallel(['client:default'])));
gulp.task('dist', gulp.series('clean', gulp.parallel(['client:dist'])));
gulp.task('verify', gulp.series('clean', gulp.parallel(['client:verify'])));
