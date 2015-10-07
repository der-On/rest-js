'use strict';

var assert = require('assert')
  , rest = require('../../../index')
  , tests = require('../../shared/lib/rest')
  , serverUrl = 'http://localhost:3000';

tests['default Rest.baseUrl should be correct'] = function() {
  var restApi = new rest.Rest();
  assert.strictEqual(restApi.baseUrl, 'http://localhost');
};
function requestTest(method, route, expected, complete) {

  if (typeof method === 'undefined') {
    var method = 'request';
  }

  var restApi = new rest.Rest(serverUrl);

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
  requestTest(null, '/tests/fixtures/data', require('../../fixtures/data.json'), complete);
};
tests['Rest.read() should return correct data'] = function(complete)
{
  requestTest('read', '/tests/fixtures/data', require('../../fixtures/data.json'), complete);
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
tests['Rest.create() should send correct data'] = function(complete)
{
  var restApi = new rest.Rest(serverUrl);
  var data = { foo: 'bar', baz: 'zoobie' };
  restApi.create('/ping-pong', { data: data }, function(error, _data) {
    assert.strictEqual(error, null);
    assert.deepEqual(_data, data);

    complete();
  });
};
tests['Rest.update() should send correct data'] = function(complete)
{
  var restApi = new rest.Rest(serverUrl);
  var data = { foo: 'bar', baz: 'zoobie' };
  restApi.update('/ping-pong', { data: data }, function(error, _data) {
    assert.strictEqual(error, null);
    assert.deepEqual(_data, data);

    complete();
  });
};
tests['Rest.read() should cache the results when using the cacheLifetime option'] = function(complete)
{
  var restApi = new rest.Rest(serverUrl, { cacheLifetime: 1000 });

  var firstResult = null;

  restApi.read('/time', function(error, data) {
    assert.strictEqual(error, null);
    assert.ok(data);
    firstResult = data;

    setTimeout(function() {
      restApi.read('/time', function(error, data) {
        assert.deepEqual(firstResult, data);

        setTimeout(function() {
          restApi.read('/time', function(error, data) {
            assert.notDeepEqual(firstResult, data);
            complete();
          });
        }, 1500);
      });
    }, 10);
  });
};
module.exports = tests;
