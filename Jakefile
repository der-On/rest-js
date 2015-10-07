var path = require('path');
var fs = require('fs');
var restify = require('restify');
var ejs = require('ejs');
var send = require('send');
var async = require('async');
var numBrowsers = 0;
var numBrowsersDone = 0;
var serverDone = false;
var server;

function browserIsDone()
{
  numBrowsersDone++;

  if (numBrowsersDone == numBrowsers && serverDone) {
    console.log('all browser tests done');
    process.exit(0);
  }
}

// cleans/removes the tmp directory
task('clean', function(){
  jake.rmRf(path.join(__dirname, 'tmp'));
});

// compiles static files for browser side testing
task('compile', ['clean'], { async: true }, function() {
  var browserify = require('browserify');

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
  console.log('starting server on port 3000 ...');

  server = restify.createServer();

  server.use(function(req, res, next) {
    console.log(req.method + ' > ' + req.url);

    return next();
  });
  server.use(restify.acceptParser(server.acceptable));
  server.use(restify.queryParser());
  server.use(restify.bodyParser());
  
  server.get('/done', function(req, res, next) {
    console.log('a browser finished testing');
    res.send('');
    browserIsDone();
    return next();
  });
  server.post('/log', function(req, res, next) {
    console.log.apply(console, ['Browser:'].concat(req.params.args));
    res.send('');
    return next();
  });
  server.post('/error', function(req, res, next) {
    console.error('Browser:', req.params.error + ' on line ' + req.params.line + ' in ' + req.params.url);
    res.send('');
    return next();
  });

  server.post('/create.json', function(req, res, next) {
    res.send({ success: true });
    return next();
  });
  server.put('/update.json', function(req, res, next) {
    res.send({ success: true });
    return next();
  });
  server.post('/update.json', function(req, res, next) {
    res.send({ success: true });
    return next();
  });
  server.post('/remove.json', function(req, res, next) {
    res.send({ success: true });
    return next();
  });
  server.del('/remove.json', function(req, res, next) {
    res.send({ success: true });
    return next();
  });
  server.get('/time.json', function(req, res, next) {
    res.send({ time: (new Date()).getTime() });
    return next();
  });

  function pingPong(req, res, next) {
    res.send(req.body);

    return next();
  }
  server.post('/ping-pong.json', pingPong);
  server.put('/ping-pong.json', pingPong);

  // static files
  server.get(/^\/(.*)/, function(req, res, next) {
    var route = req.url.split('?')[0];
    send(req, route, {
      root: __dirname
    }).pipe(res);

    return next();
  });

  server.listen(3000);
});

task('test-browser', {async: true}, function() {
  var browsers = ['chrome'];
  if (process.env.browser) {
    // skip entire browser testing if browser=none
    if (process.env.browser === 'none') {
      complete();
      return;
    }

    browsers = process.env.browser.split(',');
  }
  numBrowsers = browsers.length;

  jake.Task['compile'].on('complete', function() {
    var chain = [];

    browsers.forEach(function(browser) {
      chain.push(function(error, cb) {
        console.log('testing in ' + browser + ' ...');
        jake.exec(browser + ' ' + 'http://localhost:3000/tests/html/index.html', cb);
      });
    });

    async.parallel(chain, function(error) {
      complete();
    });
  });

  jake.Task['compile'].invoke();
});

testTask('test', {async: true}, ['server'], function() {
  this.testFiles.include([
    'tests/server/**/*.js'
  ]);

  if (!process.browser) {
    jake.Task['test-browser'].on('complete', function() {
      complete();
    });
    jake.Task['test-browser'].invoke();
  }

  console.log('testing server ...');
});

jake.Task['test'].on('complete', function() {
  serverDone = true;

  if (numBrowsersDone == numBrowsers) {
    process.exit(0);
  }
});
