var path = require('path');
var fs = require('fs');
var browserify = require('browserify');
var http = require('http');
var ejs = require('ejs');
var send = require('send');
var async = require('async');
var staticServer;

// cleans/removes the tmp directory
task('clean', function(){
  jake.rmRf(path.join(__dirname, 'tmp'));
});

// compiles static files for browser side testing
task('compile', { async: true }, function() {
  var files = new jake.FileList();
  files.include([
    path.join(__dirname, 'tests/browser/**/*.js'),
  ]);
  files = files.toArray();

  jake.mkdirP(path.join(__dirname, 'tmp'));

  // create index.js
  fs.writeFileSync(
    path.join(__dirname, 'tmp', 'index.js'),
    ejs.render(
      fs.readFileSync(path.join(__dirname, 'tests/html/index.js.ejs'), { encoding: 'utf8' }),
      {
        files: files
      }
    ),
    { encoding: 'utf8' }
  );

  var b = browserify(files.concat(path.join(__dirname, 'tmp/index.js')));
  b.transform('brfs');
  b.bundle()
    .pipe(fs.createWriteStream(path.join(__dirname, 'tmp/bundle.js'), {encoding: 'utf8'}))
    .on('close', function() {
      complete();
    });
});

task('server', function() {
  staticServer = http.createServer(function(req, res){
    send(req, req.url.split('?', 2)[0], {
      root: __dirname
    }).pipe(res);
  }).listen(3000);
});

task('test-browser', ['clean', 'server'], function() {
  var browsers = ['chrome'];
  if (process.env.browser) {
    browsers = process.env.browser.split(',');
  }

  jake.Task['compile'].on('complete', function() {
    var chain = [];

    browsers.forEach(function(browser) {
      chain.push(function(error, cb) {
        console.log('testing in ' + browser + ' ...');
        jake.exec(browser + ' ' + 'http://localhost:3000/tests/html/index.html', cb);
      });
    });

    async.parallel(chain, function(error) {
      // close server
      staticServer.close(function() {
        complete();
      });
    });
  });

  jake.Task['compile'].invoke();
});

testTask('test', function() {
  this.testFiles.include([
    'tests/server/**/*.js'
  ]);

  if (!process.browser) {
    jake.Task['test-browser'].on('complete', function() {
      console.log('browser tests done');
      complete();
    });
    jake.Task['test-browser'].invoke();
  }

  console.log('testing server ...');
});