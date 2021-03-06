var $        = require('gulp-load-plugins')();
var argv     = require('yargs').argv;
var browser  = require('browser-sync');
var gulp     = require('gulp');
var panini   = require('panini');
var rimraf   = require('rimraf');
var sequence = require('run-sequence');
var sherpa   = require('style-sherpa');
var purify   = require('gulp-purifycss');
var path     = require('path');
var flatten  = require('gulp-flatten');
var webserver = require('gulp-webserver');

var SegfaultHandler = require('segfault-handler');
SegfaultHandler.registerHandler("crash.log"); // With no argument, SegfaultHandler will generate a generic log file name

var fingerprint = require('./fingerprint');
var replaceFingerprintedCSS = require('./replace-fingerprinted-css');
//var critical = require('critical').stream;

// Check for --production flag
var isProduction = !!(argv.production);

// Port to use for the development server.
var PORT = 8000;

// Browsers to target when prefixing CSS.
var COMPATIBILITY = ['last 2 versions', 'ie >= 9'];

// File paths to various assets are defined here.
var PATHS = {
  assets: [
    'src/assets/**/*',
    '!src/assets/{img,js,scss,root}/**/*'
  ],
  sass: [
    'bower_components/foundation-sites/scss',
    'bower_components/motion-ui/src/'
  ],
  javascript: [
    'bower_components/jquery/dist/jquery.js',
    'bower_components/what-input/what-input.js',
    'bower_components/foundation-sites/js/foundation.core.js',
    'bower_components/foundation-sites/js/foundation.util.*.js',
    // Paths to individual JS components defined below
    'bower_components/foundation-sites/js/foundation.abide.js',
    'bower_components/foundation-sites/js/foundation.accordion.js',
    'bower_components/foundation-sites/js/foundation.accordionMenu.js',
    'bower_components/foundation-sites/js/foundation.drilldown.js',
    'bower_components/foundation-sites/js/foundation.dropdown.js',
    'bower_components/foundation-sites/js/foundation.dropdownMenu.js',
    'bower_components/foundation-sites/js/foundation.equalizer.js',
    'bower_components/foundation-sites/js/foundation.interchange.js',
    'bower_components/foundation-sites/js/foundation.magellan.js',
    'bower_components/foundation-sites/js/foundation.offcanvas.js',
    'bower_components/foundation-sites/js/foundation.orbit.js',
    'bower_components/foundation-sites/js/foundation.responsiveMenu.js',
    'bower_components/foundation-sites/js/foundation.responsiveToggle.js',
    'bower_components/foundation-sites/js/foundation.reveal.js',
    'bower_components/foundation-sites/js/foundation.slider.js',
    'bower_components/foundation-sites/js/foundation.sticky.js',
    'bower_components/foundation-sites/js/foundation.tabs.js',
    'bower_components/foundation-sites/js/foundation.toggler.js',
    'bower_components/foundation-sites/js/foundation.tooltip.js',
    'src/assets/js/**/!(app).js',
    'src/assets/js/app.js'
  ]
};

// Delete the "dist" folder
// This happens every time a build starts
gulp.task('clean', function(done) {
  rimraf('dist', done);
});

// Browser Sync wrapper task
// allows for proper injection of css files
gulp.task('reload', function(cb) {
  //browser.reload();
  cb();
});

// Copy files out of the assets folder
// This task skips over the "img", "js", and "scss" folders, which are parsed separately
gulp.task('copy', function() {
  return gulp.src(PATHS.assets)
    .pipe(gulp.dest('dist/assets'));
});

// Copy page templates into finished HTML files
gulp.task('pages', function() {
  return gulp.src('src/pages/**/*.{html,hbs,handlebars}')
    .pipe(panini({
      root: 'src/pages/',
      layouts: 'src/layouts/',
      partials: 'src/partials/',
      data: 'src/data/',
      helpers: 'src/helpers/'
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('pages:reset', function(cb) {
  panini.refresh();
  gulp.run('pages', cb);
});

gulp.task('styleguide', function(cb) {
  sherpa('src/styleguide/index.md', {
    output: 'dist/styleguide.html',
    template: 'src/styleguide/template.html'
  }, cb);
});

var uglify = $.if(isProduction, $.uglify().on('error', function (e) { console.log(e); }));
var imagemin = $.if(isProduction, $.imagemin({ progressive: true }));

// Compile Sass into CSS
// In production, the CSS is compressed
gulp.task('sass', ['pages'], function() {
  var uncss = $.if(isProduction, purify(['src/**/*.html'], { info: true }));
  var minifycss = $.if(isProduction, $.minifyCss());

  return gulp.src('src/assets/scss/app.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass({ includePaths: PATHS.sass }).on('error', $.sass.logError))
    .pipe($.autoprefixer({ browsers: COMPATIBILITY }))
    .pipe(uncss)
    .pipe(minifycss)
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(browser.reload({stream: true}));
});

// finger-print compiled CSS files
var replacedFilePaths = {};
gulp.task('css-fingerprint', ['sass'], function() {
  return gulp.src(['dist/assets/css/**/*'])
    .pipe($.if(isProduction, fingerprint(replacedFilePaths)))
    .pipe(gulp.dest('dist/assets/css'));
});
gulp.task('replace-fingerprinted-css', ['css-fingerprint'], function() {
  return gulp.src(['dist/**/*.html'])
    .pipe($.if(isProduction, replaceFingerprintedCSS(replacedFilePaths)))
    .pipe(gulp.dest('dist'));
});

// generate & inline critical-path CSS
/*
gulp.task('critical-css', ['replace-fingerprinted-css'], function() {
  var cssFiles = [];
  Object.keys(replacedFilePaths).forEach(function(key) {
    cssFiles.push('dist/' + replacedFilePaths[key]);
  });

  return gulp.src('dist/*.html')
    .pipe($.if(isProduction, critical({
      base: 'dist/',
      inline: true,
      minify: true,
      css: cssFiles,
      dimensions: [
        { height: 900, width: 320 },
        { height: 900, width: 670 },
        { height: 900, width: 830 },
        { height: 900, width: 1200 },
      ]
    })))
    .pipe(gulp.dest('dist'));
});
*/

gulp.task('place-root-assets', function() {
  return gulp.src(['src/assets/root/*'])
    .pipe(gulp.dest('dist'));
});

// Combine JavaScript into one file
// In production, the file is minified
gulp.task('javascript', function() {
  return gulp.src(PATHS.javascript)
    .pipe($.sourcemaps.init())
    .pipe($.concat('app.js'))
    .pipe(uglify)
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('dist/assets/js'));
});

// Copy images to the "dist" folder
// In production, the images are compressed
gulp.task('images', function() {
  return gulp.src('src/assets/img/**/*')
    .pipe(imagemin)
    .pipe(gulp.dest('dist/assets/img'));
});

require('gulp-grunt')(gulp, { // add all the gruntfile tasks of photoswipe to gulp
  base: path.join(__dirname, 'vendor/photoswipe'),
  prefix: 'photoswipe-'
});
gulp.task('pswp-copy', ['photoswipe-nosite'], function() {
  return gulp.src(['vendor/photoswipe/dist/**/*'])
    .pipe(flatten())
    .pipe(gulp.dest('dist/assets/vendor/photoswipe'));
});
gulp.task('pswp', ['pswp-copy'], function() {
  return gulp.src([
      'dist/assets/vendor/photoswipe/photoswipe.css',
      'dist/assets/vendor/photoswipe/default-skin.css'
    ])
    .pipe($.concat('photoswipe.min.css'))
    .pipe($.if(isProduction, $.minifyCss()))
    .pipe(gulp.dest('dist/assets/vendor/photoswipe'));
});

// Build the "dist" folder by running all of the above tasks
gulp.task('build', function(done) {
  sequence('clean', ['pages', 'sass', 'javascript', 'images', 'pswp', 'replace-fingerprinted-css', 'copy', 'place-root-assets'], 'styleguide', done);
});

// Start a server with LiveReload to preview the site in
gulp.task('server', ['build'], function() {
  //browser.init({ server: 'dist', port: PORT, open: false });
  gulp.src('dist')
    .pipe(webserver({
      host: '0.0.0.0',
      port: PORT,
      livereload: false,
      open: false,
      fallback: 'index.html'
    }));
});

// Build the site, run the server, and watch for file changes
gulp.task('default', ['build', 'server'], function() {
  gulp.watch(PATHS.assets, ['copy', 'reload']);
  gulp.watch(['src/helpers/*.js'], ['pages', 'reload']);
  gulp.watch(['src/data/*'], ['pages:reset', 'reload']);
  gulp.watch(['src/pages/**/*.html'], ['pages:reset', 'reload']);
  gulp.watch(['src/{layouts,partials}/**/*.html'], ['pages:reset', 'reload']);
  gulp.watch(['src/assets/scss/**/*.scss'], ['sass']);
  gulp.watch(['src/assets/js/**/*.js'], ['javascript', 'reload']);
  gulp.watch(['src/assets/img/**/*', '!src/assets/img/**/thumbs/*'], ['images', 'reload']);
  gulp.watch(['src/styleguide/**'], ['styleguide', 'reload']);
});
