'use strict';

var gulp = require('gulp');

var eslint = require('gulp-eslint');
var concat = require('gulp-concat');
var filter = require('gulp-filter');
var conkitty = require('gulp-conkitty');

var del = require('del');
//var fs = require('fs');


var BUILD_DIR = 'conkitty-route-devtool';


gulp.task('clean', function(cb) {
    del(BUILD_DIR, cb);
});


gulp.task('eslint', function() {
    var rules = {
        'quotes': [2, 'single'],
        'no-shadow-restricted-names': 0,
        'no-underscore-dangle': 0,
        'no-use-before-define': [2, 'nofunc']
    };

    gulp.src(['gulpfile.js'])
        .pipe(eslint({rules: rules, env: {node: true}}))
        .pipe(eslint.format());

    gulp.src(['src/**/*.js'])
        .pipe(eslint({rules: rules, env: {browser: true}}))
        .pipe(eslint.format());
});


gulp.task('panel', function() {
    var cssFilter = filter('**/*.css');
    var jsFilter = filter('**/*.js');

    return gulp.src(['src/**/*.ctpl'])
        .pipe(conkitty({
            common: '$C_common.js',
            templates: '$C_templates.js',
            deps: true
        }))
        .pipe(jsFilter)
        .pipe(concat('conkitty-panel.js'))
        .pipe(jsFilter.restore())
        .pipe(cssFilter)
        .pipe(concat('conkitty-panel.css'))
        .pipe(cssFilter.restore())
        .pipe(gulp.dest(BUILD_DIR));
});


gulp.task('static', function() {
    return gulp.src([
            'src/manifest.json',
            'LICENSE',
            'src/conkitty-route.html',
            'src/conkitty-route.js',
            'src/conkitty-panel.html'])
        .pipe(gulp.dest(BUILD_DIR));
});


gulp.task('watch', ['default'], function() {
    gulp.watch('src/**/*', ['default']);
});


gulp.task('default', ['eslint', 'panel', 'static']);
