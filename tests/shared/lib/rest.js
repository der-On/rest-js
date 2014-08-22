"use strict";

var assert = require('assert')
  , rest = require('../../../index')
  , tests
  , utils = require('../../../lib/utils')
  , serverUrl = 'http://localhost:3000';

tests = {
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

  'Rest() should add filters when given in options': function()
  {
    function urlFilter() {};
    function paramFilter() {};
    function paramsFilter() {};
    function optionsFilter() {};
    function requestDataFilter() {};
    function responseDataFilter() {};
    function requestHeadersFilter() {};
    function errorFilter() {};

    var opts = {
      filters: {
        url: [urlFilter],
        param: [paramFilter],
        params: [paramsFilter],
        options: [optionsFilter],
        requestData: [requestDataFilter],
        responseData: [responseDataFilter],
        requestHeaders: [requestHeadersFilter],
        error: [errorFilter]
      }
    };
    var restApi = new rest.Rest(null, opts);
    assert.notEqual(restApi.filters.url.indexOf(urlFilter), -1);
    assert.notEqual(restApi.filters.param.indexOf(paramFilter), -1);
    assert.notEqual(restApi.filters.params.indexOf(paramsFilter), -1);
    assert.notEqual(restApi.filters.options.indexOf(optionsFilter), -1);
    assert.notEqual(restApi.filters.requestData.indexOf(requestDataFilter), -1);
    assert.notEqual(restApi.filters.responseData.indexOf(responseDataFilter), -1);
    assert.notEqual(restApi.filters.requestHeaders.indexOf(requestHeadersFilter), -1);
    assert.notEqual(restApi.filters.error.indexOf(errorFilter), -1);
  },

  'Rest.addFilter() should add a filter': function() {
    var restApi = new rest.Rest();
    function filterFunc() {};
    var filterTypes = ['url', 'param', 'params', 'options', 'requestData', 'responseData', 'requestHeaders', 'error'];

    filterTypes.forEach(function(type) {
      restApi.addFilter(type, filterFunc);
      assert.ok(restApi.filters[type].indexOf(filterFunc) !== -1);
    });
  },

  'Rest.addXFilter() should add correct filter': function() {
    var restApi = new rest.Rest();
    function filterFunc() {};
    var filterTypes = ['url', 'param', 'params', 'options', 'requestData', 'responseData', 'requestHeaders', 'error'];

    filterTypes.forEach(function(type) {
      restApi['add' + utils.capitalize(type) + 'Filter'](filterFunc);
      assert.ok(restApi.filters[type].indexOf(filterFunc) !== -1);
    });
  },

  'Rest.executeFilters() should execute all filters': function() {
    var restApi = new rest.Rest();

    // we need to shim these for the filters added by default to the restApi
    var request = new rest.RestRequest();
    var response = new rest.RestResponse(request, 200);

    function filterFunc(type) {
      return function() {
        typesExecuted.push(type);
      };
    };

    var typesExecuted = [];
    var filterTypes = ['url', 'param', 'params', 'options', 'requestData', 'responseData', 'requestHeaders', 'error'];

    filterTypes.forEach(function(type) {
      restApi.addFilter(type, filterFunc(type));
      restApi.addFilter(type, filterFunc(type));
    });

    filterTypes.forEach(function(type) {
      if (type === 'responseData') {
        restApi.executeFilters(type, null, response);
      }
      else {
        restApi.executeFilters(type, null, request);
      }
    });

    // check count of filter executions first
    assert.equal(typesExecuted.length, filterTypes.length * 2);

    // now check the types
    filterTypes.forEach(function(type) {
      for(var i = 0; i < 2; i++) {
        var executedType = typesExecuted.shift();
        assert.equal(executedType, type);
      }
    });
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
  }
};
module.exports = tests;