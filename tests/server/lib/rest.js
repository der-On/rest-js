'use strict';

var assert = require('assert')
  , rest = require('../../../index')
  , tests = require('../../shared/lib/rest')
  , serverUrl = 'http://localhost:3000'
;

tests['default Rest.baseUrl should be correct'] = function() {
  var restApi = new rest.Rest();
  assert.strictEqual(restApi.baseUrl, 'http://localhost');
};
tests['Rest.request() should return correct data'] = function() {
  var restApi = new rest.Rest('http://localhost:3000');

  restApi.request('GET', '/tests/fixtures/data', function(error, data) {
    assert.strictEqual(error, null);
    assert.deepEqual(data, require('../../fixtures/data.json'));
  });
};
module.exports = tests;