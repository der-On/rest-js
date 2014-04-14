var path = require('path');
var fs = require('fs');
var browserify = require('browserify');

// cleans/removes the tmp directory
task('clean', function(){
  jake.rmRf(path.join(__dirname, 'tmp'));
});

// compiles static files for browser side testing
task('compile', function() {
  var files = new jake.FileList();
  files.include([path.join(__dirname, './tests/**/*.js')]);

  jake.mkdirP(path.join(__dirname, 'tmp'));
  var b = browserify(files.toArray());
  b.bundle().pipe(fs.createWriteStream('./tmp/bundle.js', {encoding: 'utf8'}));
});

task('server', function(next) {

});

testTask('test-server', function() {
  this.testFiles.include([
    'tests/**/*.js'
  ]);
  this.testName = 'test-server';
});

testTask('test-browser', ['clean', 'compile', 'server'], function() {
  this.testName = 'test-browser';
});