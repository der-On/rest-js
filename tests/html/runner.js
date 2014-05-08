var TestRunner = function()
{
  var self = this;
  this.tests = [];
  this.numTests = 0;
  this.testsRun = 0;

  this.addTest = function(test, callback)
  {
    this.tests.push({test: test, callback: callback});
  };

  this.runTests = function()
  {
    this.numTests = this.tests.length;
    runNextTest();
  };

  function testDone()
  {
    self.testsRun++;
    runNextTest();
  };

  function runNextTest()
  {
    if (self.tests.length > 0) {
      var test = self.tests.shift();

      console.log((self.testsRun + 1) + '/' + self.numTests + ':\t' + test.test);

      // synchronous test
      if (test.callback.length === 0) {
        test.callback();
        testDone();
      }
      // async test
      else {
        test.callback(testDone);
      }
    }
    else {
      done();
    }
  };

  function done()
  {
    console.log('All tests finished.');
    // all tests passed
    // tell the server that we are done
    $.getJSON('/done');

    // and close the window
    // window.close();
  };
};
TestRunner.init = function()
{
  // monkey patch console.log
  var _log = console.log;
  console.log = function() {
    var args = Array.prototype.slice.call(arguments, 0, arguments.length);
    $('body').append('<p>' + args.join(' ') + '</p>');
    _log.apply(console, args);
    $.post('/log', { args: args });
  };

  window.onerror = function(message, url, line) {
    var text = '<strong>' + message + '</strong>';
    text += '<br/>on line ' + line + ' in ' + url;
    $('body').append('<p style="color: red;">' + text + '</p>');

    console.error(message + ' on line ' + line + ' in ' + url);

    // tell the server that we are done
    $.post('/error', { error: message, url: url, line: line });
    $.getJSON('/done');

    // do not rethrow error
    return true;
  };
};
window.TestRunner = TestRunner;