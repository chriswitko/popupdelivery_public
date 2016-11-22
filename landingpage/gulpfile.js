var gulp = require('gulp');
var nunjucksRender = require('gulp-nunjucks-render');
var data = require('gulp-data');
var es = require('event-stream');
var prompt = require('gulp-prompt');
var browserSync = require('browser-sync');
var htmlmin = require('gulp-htmlmin');
var cleanCSS = require('gulp-clean-css');

var sites = ['uno'];
var langs = ['en', 'uk', 'pl'];

var createTask = function(site, lang) {
  return gulp.src(['app/pages/' + site + '/*.+(html|nunjucks)', '!app/pages/' + site + '/vendor', '!app/pages/' + site + '/aseets'])
  .pipe(data(function() {
    return require('./app/pages/' + site + '/_i18n/' + lang + '.json')
  }))
  .pipe(nunjucksRender({
    path: ['app/pages/' + site + '/_templates'],
    data: {
      language: site
    },
    envOptions: {
      autoescape: false,
      watch: false
    }    
  }))
  .pipe(htmlmin({collapseWhitespace: true}))
  .pipe(gulp.dest('dist/' + site + '/' + lang))  
}

var minifyCSS = function(site) {
  return gulp.src('dist/' + site + '/assets/css/app.css')
  .pipe(cleanCSS({compatibility: 'ie8'}))
  .pipe(gulp.dest('dist/' + site + '/assets/css/min/'))  
}

var copyTask = function(site, cb) {
  gulp.src(['app/pages/' + site + '/vendor/**/*']).pipe(gulp.dest('dist/' + site + '/vendor'));
  gulp.src(['app/pages/' + site + '/assets/**/*']).pipe(gulp.dest('dist/' + site + '/assets'));
}

gulp.task('serve', function() {
  return gulp.src('gulpfile.js')
  .pipe(prompt.prompt([
    {
      type: 'input',
      name: 'site',
      message: 'Which site would you like to run?'
    }
  ], function(res){
    browserSync.instance = browserSync.init({
      startPath: '/',
      server: {
        baseDir: ['dist/' + res.site],
        routes: {
          '/bower_components': 'bower_components'
        }
      }
    });
  }))  
});

gulp.task('minify', function () {
  return gulp.src('gulpfile.js')
  .pipe(prompt.prompt([
    {
      type: 'input',
      name: 'site',
      message: 'Which site would you like to run?'
    }
  ], function(res){
    minifyCSS(res.site);
  }))  
});

gulp.task('default', function () {
  return gulp.src('gulpfile.js')
  .pipe(prompt.prompt([
    {
      type: 'input',
      name: 'site',
      message: 'Which site would you like to run?'
    }
  ], function(res){
    copyTask(res.site);
    return es.merge(langs.map(function (lang) {
      return createTask(res.site, lang);
    }));
  }))  
});
