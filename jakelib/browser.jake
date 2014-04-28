var path = require('path');
var fs = require('fs');
var browserify = require('browserify');
var http = require('http');
var ejs = require('ejs');
var send = require('send');

// cleans/removes the tmp directory
task('clean', function(){
  jake.rmRf(path.join(__dirname, 'tmp'));
});

// compiles static files for browser side testing
task('compile', { async: true }, function() {
  var files = new jake.FileList();
  files.include([
    path.join(__dirname, '../tests/**/*.js'),
  ]);
  files = files.toArray();

  jake.mkdirP(path.join(__dirname, '../tmp'));

  // create index.js
  fs.writeFileSync(
    path.join(__dirname, '../tmp', 'index.js'),
    ejs.render(
      fs.readFileSync(path.join(__dirname, '../tests/html/index.js.ejs'), { encoding: 'utf8' }),
      {
        files: files
      }
    ),
    { encoding: 'utf8' }
  );

  var b = browserify(files.concat(path.join(__dirname, '../tmp/index.js')));
  b.bundle()
  .pipe(fs.createWriteStream(path.join(__dirname, '../tmp/bundle.js'), {encoding: 'utf8'}))
  .on('close', function() {
    complete();
  });
});

task('server', function() {
  var app = http.createServer(function(req, res){
    send(req, req.url.split('?', 2)[0], {
      root: path.normalize(path.join(__dirname, '..'))
    }).pipe(res);
  }).listen(3000);
});

testTask('test-browser', ['clean', 'server'], function() {
  this.testName = 'test-browser';
  jake.Task['compile'].on('complete', function() {
    jake.exec('chrome ' + 'http://localhost:3000/tests/html/index.html',
      function() {
        complete();
      });
  });
  jake.Task['compile'].invoke();
});