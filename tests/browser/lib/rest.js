'use strict';

var assert = require('assert')
  , rest = require('../../../index')
  , tests = require('../../shared/lib/rest')
  , serverUrl = 'http://localhost:3000';

tests['default Rest.baseUrl should be correct'] = function() {
  var restApi = new rest.Rest();
  assert.strictEqual(restApi.baseUrl, 'http://localhost:3000/tests/html/index.html');
};

function requestTest(method, route, expected, complete)
{
  if (typeof method === 'undefined') {
    var method = 'request';
  }

  var restApi = new rest.Rest(serverUrl, {
    filters: {
      param: [rest.RestFilters.PARAM_FILTER_PARAMS],
      url: [function(url, request) {
        console.log(request.method, url); return url;
      }]
    }
  });

  function onResponse(error, data) {
    assert.strictEqual(error, null);
    assert.deepEqual(data, expected);

    complete();
  };

  if (!method) {
    restApi.request('GET', route, onResponse);
  }
  else {
    restApi[method](route, onResponse);
  }
};

tests['Rest.request() should return correct data'] = function(complete)
{
  requestTest(null, '/tests/fixtures/data', { "key": "value" }, complete);
};
tests['Rest.read() should return correct data'] = function(complete)
{
  requestTest('read', '/tests/fixtures/data', { "key": "value" }, complete);
};
tests['Rest.create() should return correct data'] = function(complete)
{
  requestTest('create', '/create', { success: true }, complete);
};
tests['Rest.update() should return correct data'] = function(complete)
{
  requestTest('update', '/update', { success: true }, complete);
};
tests['Rest.remove() should return correct data'] = function(complete)
{
  requestTest('remove', '/remove', { success: true }, complete);
};
module.exports = tests;