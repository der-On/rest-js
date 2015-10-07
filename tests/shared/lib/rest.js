"use strict";

var assert = require('assert')
  , rest = require('../../../index')
  , tests
  , utils = require('../../../lib/utils')
  , serverUrl = 'http://localhost:3000';

tests = {
  'rest() should create new rest api instance': function () {
    var restApi = rest();
    assert.ok(restApi);
  },

  'Rest() should set correct defaultRequestOptions when no options are given': function() {
    var restApi = new rest.Rest();
    assert.deepEqual(restApi.defaultRequestOptions.params, {});
    assert.equal(restApi.defaultRequestOptions.format, 'json');
    assert.equal(restApi.defaultRequestOptions.dataType, 'json');
    assert.strictEqual(restApi.defaultRequestOptions.crossDomain, false);
  },

  'Rest() should set correct defaultRequestOptions when options are given': function() {
    var opts = {
      defaultParams: {foo: 'bar'},
      defaultFormat: 'xml',
      defaultDataType: 'xml',
      crossDomain: true
    };
    var restApi = new rest.Rest(null, opts);
    assert.deepEqual(restApi.defaultRequestOptions.params, opts.defaultParams);
    assert.equal(restApi.defaultRequestOptions.format, opts.defaultFormat);
    assert.equal(restApi.defaultRequestOptions.dataType, opts.defaultDataType);
    assert.strictEqual(restApi.defaultRequestOptions.crossDomain, opts.crossDomain);
  },

  'Rest.addFilter() should add a middleware': function() {
    var restApi = new rest.Rest();

    function reqFilter(request, next) { next(); }
    function resFilter(request, response, next) { next(); }
    function errorFilter(error, request, response, next) { next(); }

    restApi.use(reqFilter);
    restApi.use(resFilter);
    restApi.use(errorFilter);

    assert.ok(restApi.filters.request.indexOf(reqFilter) !== -1);
    assert.ok(restApi.filters.response.indexOf(resFilter) !== -1);
    assert.ok(restApi.filters.error.indexOf(errorFilter) !== -1);
  },

  'Rest.executeFilters() should execute all middlewares': function(done) {
    var restApi = new rest.Rest();

    // we need to shim these for the filters added by default to the restApi
    var request = new rest.RestRequest();
    var response = new rest.RestResponse(request, 200);
    var numExecuted = 0;

    function reqFilter(request, next) { next(); }
    function resFilter(request, response, next) { next(); }
    function errorFilter(error, request, response, next) { next(); }

    function onFiltersExecuted(err) {
      assert.equal(err, null);

      numExecuted++;

      if (numExecuted === 3) {
        done();
      }
    }

    restApi.use(reqFilter);
    restApi.use(resFilter);
    restApi.use(errorFilter);
    restApi.executeFilters('request', null, request, null, onFiltersExecuted);
    restApi.executeFilters('response', null, request, response, onFiltersExecuted);
    restApi.executeFilters('error', null, request, response, onFiltersExecuted);
  },

  'Rest.read() should cache the results when using the cacheLifetime option': function(complete)
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
  },

  'Rest.read() should not cache the results when using the noCache option': function(complete)
  {
    var restApi = new rest.Rest(serverUrl, { cacheLifetime: 1000 });

    var firstResult = null;

    restApi.read('/time', { noCache: true }, function(error, data) {
      assert.strictEqual(error, null);
      assert.ok(data);
      firstResult = data;

      setTimeout(function() {
        restApi.read('/time', { noCache: true }, function(error, data) {
          assert.notDeepEqual(firstResult, data);

          complete();
        });
      }, 10);
    });
  },

  'Rest.request() should return a promise': function(complete)
  {
    var restApi = new rest.Rest(serverUrl);

    var promise = restApi.request('GET', '/time');
    assert.ok(promise instanceof Promise);
    complete();
  }
};
module.exports = tests;
